#!/usr/bin/env python3
# coding: utf-8
"""Skip thumbnail generation for Dropbox / iCloud dataless (online-only) files.

Same detection as ext/nagi-search.py: UF_DATALESS / SF_DATALESS, or a non-empty
file with st_blocks == 0. Copyparty's ThumbCli.get otherwise opens the file
(a 4-byte read), which on macOS hydrates the whole cloud placeholder.

This file lives next to the install, never inside site-packages. Load it at
process start (a .pth in the venv, or PYTHONPATH + sitecustomize) so it wraps
ThumbCli.get before the first ?th= request. Returning None makes copyparty
serve a small icon (tx_ico), not the original file.

  from nagi_thumbs import install  # if this file is named nagi_thumbs.py
  install()

Or run as a helper:  python3 nagi-thumbs.py install-pth /path/to/venv
"""
from __future__ import print_function

import os, stat, sys

UF_DATALESS, SF_DATALESS = 0x00040000, 0x40000000


def is_dataless(st):
    flags = getattr(st, "st_flags", 0)
    if flags & (UF_DATALESS | SF_DATALESS):
        return True
    if st.st_size > 0 and getattr(st, "st_blocks", 1) == 0 and not stat.S_ISLNK(st.st_mode):
        return True
    return False


def _abspath(dbv, rem):
    root = getattr(dbv, "realpath", None) or getattr(dbv, "realpath", "")
    return os.path.join(root, rem)


def install(log=None):
    try:
        from copyparty.th_cli import ThumbCli
    except ImportError:
        return False
    if getattr(ThumbCli.get, "_nagi_dataless", False):
        return True
    orig = ThumbCli.get

    def get(self, dbv, rem, mtime, fmt):
        ap = os.path.join(getattr(dbv, "realpath", ""), rem or "")
        try:
            st = os.lstat(ap)
        except OSError:
            st = None
        if st is not None and is_dataless(st):
            msg = "skip dataless (online-only) thumbnail for %r" % (rem,)
            try:
                self.log(msg)
            except Exception:
                if log:
                    log(msg)
            return None
        return orig(self, dbv, rem, mtime, fmt)

    get._nagi_dataless = True
    ThumbCli.get = get
    return True


def install_pth(site_packages, ext_dir=None):
    """Drop a .pth into a venv so the wrap is applied on every start."""
    ext_dir = os.path.abspath(ext_dir or os.path.dirname(os.path.abspath(__file__)))
    # A tiny sibling import name: this file may be nagi-thumbs.py (hyphen).
    hook = os.path.join(ext_dir, "nagi_thumbs_hook.py")
    if not os.path.isfile(hook):
        with open(hook, "w") as f:
            f.write(
                "import os, sys\n"
                "d = os.path.dirname(os.path.abspath(__file__))\n"
                "p = os.path.join(d, 'nagi-thumbs.py')\n"
                "import runpy\n"
                "mod = runpy.run_path(p, run_name='nagi_thumbs')\n"
                "mod['install']()\n"
            )
    pth = os.path.join(site_packages, "nagi-thumbs.pth")
    # .pth "import" lines only work with a module name, so we put ext_dir on
    # sys.path and import the hook (underscore name).
    with open(pth, "w") as f:
        f.write("%s\nimport nagi_thumbs_hook\n" % ext_dir)
    return pth


if __name__ == "__main__":
    args = sys.argv[1:]
    if args[:1] == ["install-pth"] and len(args) >= 2:
        # args[1] is the venv root or its site-packages
        target = os.path.abspath(args[1])
        if os.path.isdir(os.path.join(target, "lib")):
            # find site-packages
            sp = None
            for root, dirs, files in os.walk(os.path.join(target, "lib")):
                if os.path.basename(root) == "site-packages":
                    sp = root
                    break
            if not sp:
                sys.exit("no site-packages under %s" % target)
            target = sp
        print(install_pth(target))
    elif args[:1] == ["self-test"]:
        class St(object):
            pass
        a = St(); a.st_flags = UF_DATALESS; a.st_size = 10; a.st_blocks = 8; a.st_mode = stat.S_IFREG
        b = St(); b.st_flags = 0; b.st_size = 100; b.st_blocks = 0; b.st_mode = stat.S_IFREG
        c = St(); c.st_flags = 0; c.st_size = 100; c.st_blocks = 8; c.st_mode = stat.S_IFREG
        assert is_dataless(a) and is_dataless(b) and not is_dataless(c)
        print("self-test ok")
    else:
        print(__doc__)
