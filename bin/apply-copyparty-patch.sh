#!/usr/bin/env bash
# Idempotent Nagi gzip-sibling patch for copyparty 1.20.26.
# See apply_copyparty_patch.py for the checks and the apply itself.
# Failure must be treated as "run unpatched" — never take the server down.
set -euo pipefail
HERE="$(cd "$(dirname "$0")" && pwd)"
exec python3 "$HERE/apply_copyparty_patch.py" "$@"
