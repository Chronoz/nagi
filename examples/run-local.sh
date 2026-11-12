#!/usr/bin/env bash
# Run copyparty with the Nagi theme, bound to localhost only.
#
#   NAGI_USER=alice NAGI_PASS='a-long-password' ./examples/run-local.sh /path/to/files
#
# env: NAGI_USER / NAGI_PASS  account that can upload & delete (required)
#      PORT                   default 3979
#      BIND                   default 127.0.0.1  (e.g. BIND=127.0.0.1,100.x.y.z for tailscale)
#      COPYPARTY              copyparty command, default "copyparty" (pip install copyparty)
set -euo pipefail
HERE="$(cd "$(dirname "$0")/.." && pwd)"
ROOT="${1:?usage: run-local.sh /path/to/files}"
: "${NAGI_USER:?set NAGI_USER}" "${NAGI_PASS:?set NAGI_PASS}"
CP="${COPYPARTY:-copyparty}"
exec $CP -i "${BIND:-127.0.0.1}" -p "${PORT:-3979}" \
  -a "$NAGI_USER:$NAGI_PASS" --usernames \
  -v "$ROOT:/:r:rwmda.,$NAGI_USER" \
  -v "$HERE/theme:/.nagi:r" \
  --shr /shr -e2dsa -e2ts --u2j 4 \
  --themes 12 --theme 11 \
  --css-browser '/.nagi/nagi.css?nagi=ad3358511e&cache=31536000' --js-browser '/.nagi/nagi-late.js?nagi=e218759e4f&cache=31536000' \
  --js-other '/.nagi/nagi-pages.js?nagi=94536693d1&cache=31536000' \
  --html-head-s '<link rel="stylesheet" href="/.nagi/nagi-pages.css?nagi=35e1f3e388&cache=31536000"><link rel="manifest" href="/.nagi/manifest.json?nagi=b8ef2fba1e&cache=31536000"><link rel="apple-touch-icon" href="/.nagi/icon-180.png?nagi=88d99dbc9b&cache=31536000"><meta name="apple-mobile-web-app-capable" content="yes"><meta name="mobile-web-app-capable" content="yes"><meta name="apple-mobile-web-app-title" content="Nagi"><meta name="apple-mobile-web-app-status-bar-style" content="black-translucent"><script nonce="{{ js_nonce }}" src="/.nagi/nagi-early.js?nagi=8d2ff78d8d&cache=31536000"></script><script nonce="{{ js_nonce }}" src="/.nagi/nagi.js?nagi=80648369ea&cache=31536000"></script>' \
  --favico "凪 17282B EEE5D1" --no-robots --name nagi
