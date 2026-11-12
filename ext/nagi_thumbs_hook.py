# Imported from a .pth at copyparty startup. Wraps ThumbCli.get so dataless
# (online-only) files are never opened just to make a thumbnail.
import os, runpy
_p = os.path.join(os.path.dirname(os.path.abspath(__file__)), "nagi-thumbs.py")
runpy.run_path(_p, run_name="nagi_thumbs")["install"]()
