#!/usr/bin/env python3
"""Idempotent Nagi gzip-sibling patch for copyparty 1.20.26.

Usage: apply-copyparty-patch.sh [copyparty-executable-or-httpcli.py]

Checks the copyparty version and the expected hunk, applies
copyparty-1.20.26-nagi-gz.patch, and refuses cleanly if upstream changed.
Already-applied is a success. A non-zero exit leaves the file untouched;
the start wrapper must then launch unpatched, never take the server down.
"""
from __future__ import print_function

import importlib.metadata
import os
import shutil
import sys
import tempfile
from pathlib import Path

TARGET_VER = "1.20.26"
MARKER = "nagi-gz:"
HERE = Path(__file__).resolve().parent
PATCH = HERE / "copyparty-1.20.26-nagi-gz.patch"

ANCHOR = (
    "            if not self.vpath.startswith(\".cpr/\"):\n"
    "                break\n"
    "\n"
    "        if not editions:\n"
    "            return self.tx_404()\n"
)

REPLACEMENT = (
    "            # nagi-gz: also look for a precompressed sibling under /.nagi/\n"
    "            if not self.vpath.startswith(\".cpr/\") and not self.vpath.startswith(\".nagi/\"):\n"
    "                break\n"
    "\n"
    "        if not editions:\n"
    "            return self.tx_404()\n"
    "\n"
    "        # nagi-gz: serve the .gz sibling only when it is at least as new as\n"
    "        # the source, the client accepts gzip, and this is not a Range\n"
    "        # request. Never compress or decompress on the fly. Always Vary.\n"
    "        if self.vpath.startswith(\".nagi/\"):\n"
    "            _nagi_ae = self.headers.get(\"accept-encoding\", \"\").lower()\n"
    "            _nagi_vary = self.out_headers.get(\"Vary\", \"\")\n"
    "            if \"Accept-Encoding\" not in _nagi_vary:\n"
    "                self.out_headers[\"Vary\"] = (\n"
    "                    (_nagi_vary + \", Accept-Encoding\") if _nagi_vary else \"Accept-Encoding\"\n"
    "                )\n"
    "            if \".gz\" in editions:\n"
    "                _drop = False\n"
    "                if \"gzip\" not in _nagi_ae:\n"
    "                    _drop = True\n"
    "                elif self.headers.get(\"range\"):\n"
    "                    _drop = True\n"
    "                elif \"plain\" in editions:\n"
    "                    try:\n"
    "                        if bos.stat(editions[\".gz\"][0]).st_mtime < bos.stat(\n"
    "                            editions[\"plain\"][0]\n"
    "                        ).st_mtime:\n"
    "                            _drop = True\n"
    "                    except Exception:\n"
    "                        _drop = True\n"
    "                if _drop:\n"
    "                    del editions[\".gz\"]\n"
)


def log(msg):
    print("nagi-gz patch: " + msg, file=sys.stderr)


def die(msg, code=1):
    log(msg)
    sys.exit(code)


def already_applied(text):
    return MARKER in text and 'startswith(".nagi/")' in text


def try_import(py_exe):
    """Return (version, httpcli_path) by running py_exe, or None."""
    import subprocess
    if not py_exe:
        return None
    py = Path(py_exe)
    # allow 'python3' on PATH
    cmd = [str(py_exe)]
    try:
        r = subprocess.run(
            cmd + [
                "-c",
                "import importlib.metadata, copyparty, os\n"
                "print(importlib.metadata.version('copyparty'))\n"
                "print(os.path.join(os.path.dirname(copyparty.__file__), 'httpcli.py'))\n",
            ],
            capture_output=True,
            text=True,
            timeout=20,
        )
    except (OSError, subprocess.TimeoutExpired):
        return None
    if r.returncode != 0:
        return None
    lines = [ln.strip() for ln in r.stdout.splitlines() if ln.strip()]
    if len(lines) < 2:
        return None
    ver, path = lines[0], lines[1]
    if not Path(path).is_file():
        return None
    return ver, Path(path), Path(py_exe) if Path(py_exe).exists() else py_exe


def nearby_pythons(hint: Path):
    cands = []
    if hint.is_file() and hint.name == "httpcli.py":
        # .../site-packages/copyparty/httpcli.py → venv/bin/python
        for up in [4, 5, 6]:
            bin_dir = hint
            for _ in range(up):
                bin_dir = bin_dir.parent
            for name in ("python3", "python"):
                cands.append(bin_dir / "bin" / name)
    elif hint.is_file() and os.access(hint, os.X_OK):
        d = hint.resolve().parent
        cands.extend([d / "python3", d / "python", hint])
        # shebang
        try:
            first = hint.read_text(errors="replace").splitlines()[0]
        except Exception:
            first = ""
        if first.startswith("#!") and "/env " not in first:
            cands.insert(0, Path(first[2:].split()[0]))
    cands.extend([Path(x) for x in ("python3", "python") if shutil.which(x)])
    seen = set()
    for c in cands:
        key = str(c)
        if key in seen:
            continue
        seen.add(key)
        yield c


def resolve(hint):
    if hint:
        hint_p = Path(hint).expanduser()
        # If they passed httpcli.py directly, still need a python for the version.
        for cand in nearby_pythons(hint_p):
            got = try_import(cand)
            if got:
                ver, path, py = got
                if hint_p.is_file() and hint_p.name == "httpcli.py":
                    path = hint_p.resolve()
                return ver, path, py
    # PATH copyparty
    cp = shutil.which("copyparty")
    if cp:
        for cand in nearby_pythons(Path(cp)):
            got = try_import(cand)
            if got:
                return got
    for name in ("python3", "python"):
        w = shutil.which(name)
        if w:
            got = try_import(w)
            if got:
                return got
    return None


def apply(httpcli: Path):
    text = httpcli.read_text(encoding="utf-8")
    if already_applied(text):
        log("already applied")
        return 0
    if ANCHOR not in text:
        if 'if not self.vpath.startswith(".cpr/"):' not in text:
            die("refusing: expected hunk not found (upstream changed); left unpatched", 3)
        die("refusing: expected unpatched hunk not found exactly (upstream changed); left unpatched", 3)
    if text.count(ANCHOR) != 1:
        die("refusing: expected hunk is not unique; left unpatched", 3)
    updated = text.replace(ANCHOR, REPLACEMENT, 1)
    if updated == text or not already_applied(updated):
        die("refusing: replace did not produce the patched form; left unpatched", 3)
    fd, tmp = tempfile.mkstemp(prefix="httpcli-nagi-", suffix=".py", dir=str(httpcli.parent))
    try:
        os.write(fd, updated.encode("utf-8"))
        os.close(fd)
        fd = -1
        os.chmod(tmp, httpcli.stat().st_mode)
        os.replace(tmp, httpcli)
        tmp = None
    finally:
        if fd >= 0:
            try:
                os.close(fd)
            except Exception:
                pass
        if tmp:
            try:
                os.unlink(tmp)
            except Exception:
                pass
    for pyc in httpcli.parent.glob("__pycache__/httpcli.*"):
        try:
            pyc.unlink()
        except Exception:
            pass
    log("applied to %s" % httpcli)
    return 0


def main(argv):
    if not PATCH.is_file():
        die("patch file missing: %s" % PATCH)
    hint = argv[1] if len(argv) > 1 else ""
    got = resolve(hint)
    if not got:
        die("could not locate copyparty / httpcli.py")
    ver, httpcli, py = got
    log("httpcli=%s python=%s version=%s" % (httpcli, py, ver))
    if ver != TARGET_VER:
        die("refusing: copyparty %s (want %s); left unpatched" % (ver, TARGET_VER), 2)
    text = httpcli.read_text(encoding="utf-8")
    if already_applied(text):
        log("already applied")
        return 0
    return apply(httpcli)


if __name__ == "__main__":
    sys.exit(main(sys.argv) or 0)
