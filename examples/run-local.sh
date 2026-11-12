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
  -v "$ROOT:/:r:rwmda,$NAGI_USER" \
  -v "$HERE/theme:/.nagi:r" \
  --shr /shr -e2dsa -e2ts --u2j 4 \
  --themes 12 --theme 11 \
  --css-browser '/.nagi/nagi.css?nagi=5c15f771b5&cache=31536000' --js-browser '/.nagi/nagi.js?nagi=ed23f390b2&cache=31536000' \
  --js-other '/.nagi/nagi-pages.js?nagi=e8ea5630fb&cache=31536000' \
  --html-head-s '<link rel="stylesheet" href="/.nagi/nagi-pages.css?nagi=0c6fcba267&cache=31536000"><link rel="manifest" href="/.nagi/manifest.json?nagi=b8ef2fba1e&cache=31536000"><link rel="apple-touch-icon" href="/.nagi/icon-180.png?nagi=88d99dbc9b&cache=31536000"><meta name="apple-mobile-web-app-capable" content="yes"><meta name="mobile-web-app-capable" content="yes"><meta name="apple-mobile-web-app-title" content="Nagi"><meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">' \
  --favico "凪 17282B EEE5D1" --no-robots --name nagi
