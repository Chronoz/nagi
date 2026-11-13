# Nagi 凪

**a calm zen-garden theme for [copyparty](https://github.com/9001/copyparty)**

your folders turn into pebbles, free space is a little koi pond, and the root gets raked sand. made it for my home server and now i just sit there watching the fish lol 🐟

![Nagi: the pebble garden with the koi pond, desktop and iPhone](docs/screenshots/hero.webp)

Nagi is a skin for copyparty, a portable file server in one Python file. It only adds CSS and JS, so copyparty still does all the real work (uploads, accounts, search, shares). You can flip back to the classic copyparty UI from Settings at any time.

- 🌐 **try it without a server:** open [`demo/index.html`](demo/index.html) in a browser (fictional files, same app code)

## Features

- **Pebble garden**: every file and folder is a stone sized by how much space it takes. Folders are dark stones, files are light, empty ones are rings
- **Koi pond = free space**: the disk's free space is a pond with koi swimming in it. It drops to 30 fps when you're idle and pauses when it's off screen
- **Raked sand at the root**: the biggest stone at the top level gets sand rings around it
- **Checklist + list view**: grouped by type (folders, video, audio, images, docs, code, archives), with folder icons. Press `G` to switch between garden and list
- **Instant Back**: moving between folders does not reload the page. Recent folders (the garden as you left it, and where you had scrolled) are restored at once; the listing is rechecked quietly and only redrawn if it changed. If a sheet, the image viewer or the mobile drawer is open, Back closes that first. Signing out clears this memory. Private folders are never shown to a signed-out visitor from it.
- **A quieter garden**: a phone shows at most six stones, a wider screen twenty. The largest items are kept (same size-weighting as before, folders first on a tie). When there are more, a quiet pebble of raked sand with a “+N” sits among the other stones in the bottom-right corner of the garden (where a thumb reaches), third-largest, with the same gutter and curved neighbours as any other cell. It opens the existing drawer (the file list is already there) and leaves the garden as it is. When a folder’s visible items are nearly the same size (a roll of similar photos), the garden uses a stable, path-seeded composition instead of an even grid — one large stone, one medium-large, +N third, then smaller ones, placed irregularly. Real byte sizes still appear on the labels. Folders whose sizes already differ are left as they are.
- **Players**: a music player with a queue (artist/title come from tags), plus video, image lightbox and text/markdown viewers. The image viewer shows a light preview only (`?th=wf3`, never the original) and a quiet Download for the full file. On a phone, swipe left or right to move between photos (the current selection, if any; otherwise every image in the folder); on a desktop the arrow keys do the same. The next and previous previews sit in a quiet filmstrip beside the current one, already decoded, so they are on screen as you drag. After a swipe snaps (or a desktop arrow steps), the already-painted frame is kept in place; only the photo that left the screen is replaced, with no fade. Neighbouring light previews (±2 to ±3, the swipe direction first) are preloaded and decoded when the viewer opens and after every step, and a tiny garden thumb stands in blurred if the preview is still arriving; a blank is never shown; a small cache keeps them in memory, and hovering or touching a photo warms it before the viewer opens. The original is never fetched. Opening Nagi from the iPhone home screen shows a sand launch image (a quiet pebble with faint rake rings) instead of a white flash; the same mark is painted with the first HTML bytes on the file-browser (garden) page and fades once the app is up. The sign-in page, help, the markdown editor, and other copyparty pages never show it. iOS only picks up those launch images if the media queries match the device exactly, and only when you add (or re-add) the site to the home screen. Each viewer has a small download button next to the title. If you can write, you can Edit and Save `.md` and `.txt` notes right in the reader. Version history goes to the volume hist folder (`--md-hist v`), not next to the file
- **Folder notes**: a folder with a `README.md` shows a short, sanitized note at the top of the listing; tap Show more to expand. Online-only (dataless) files are skipped and never opened
- **Undo upload**: signed-in users with write access get a quiet “Undo upload” item under More. It lists your own recent uploads, including unfinished ones, and asks before deleting (Enter confirms, Esc cancels). Guests do not see it
- **Duplicates**: signed-in users get a quiet “Duplicates” item under More. It lists groups of files with the same contents (size and path), read-only — remove an extra copy yourself from the usual menu. Guests do not see it. The server needs a content-hash index (`-e2dsa`, and no `--no-hash`). Nagi never enables `--dedup`, which would replace copies with links.
- **iPhone Files**: Settings has one line on connecting the Files app (⋯ → Connect to Server) with this site’s address; WebDAV is already on
- **Upload**: drag and drop anywhere or use the upload sheet. A quiet "3 files uploaded" note shows instead of a big toast. Uses copyparty's up2k, so uploads resume and dedup
- **Safe bulk actions**: "Download all" asks first. Delete, rename, move, new folder and share links work the copyparty way
- **Paper and dusk themes** (light / dark) and a calmer copyparty login page
- **iPhone / PWA**: add it to your home screen and it opens like an app. Bottom tab bar with big tap targets, account menu in More, safe-area aware, no pull-to-refresh, no pinch or double-tap zoom, no zoom on inputs
- **Accessible**: keyboard shortcuts, focus traps in dialogs, `prefers-reduced-motion` respected
- **Smart search**: in Settings, pick **Smart (EmbeddingGemma 2)** or copyparty’s **Default** filename index. The search drawer looks the same either way. If the Smart sidecar is down, it falls back to Default on its own. The extension is one Python file; see [`ext/`](ext/README.md)
- **Hidden files**: logged-in users with permission can turn on **Show hidden files** in Settings (dotfiles and folders starting with a period). Guests never see the setting, and the server will not list those names to them. They are not indexed.

| | |
|---|---|
| ![paper](docs/screenshots/desktop-paper.webp) | ![dusk](docs/screenshots/desktop-dark.webp) |
| ![folder](docs/screenshots/desktop-folder.webp) | ![list view](docs/screenshots/desktop-list.webp) |
| ![music player](docs/screenshots/desktop-music.webp) | ![video](docs/screenshots/desktop-video.webp) |

<p align="center">
<img src="docs/screenshots/mobile-paper.webp" width="24%" alt="iPhone, paper"> <img src="docs/screenshots/mobile-dark.webp" width="24%" alt="iPhone, dusk"> <img src="docs/screenshots/mobile-more.webp" width="24%" alt="iPhone, More menu"> <img src="docs/screenshots/mobile-login.webp" width="24%" alt="iPhone, sign in">
</p>

### Keyboard shortcuts

| key | does |
|---|---|
| `/` | search |
| `G` | garden ↔ list view |
| `Backspace` or `Alt+↑` | up one folder |
| `Shift+U` | upload |
| `Shift+N` | new folder |
| `Shift+S` | download (the selection, the whole folder, or the open video/image) |
| `Shift+P` | play all / play the selection |
| `Space` | play / pause music |
| `←` `→` | previous / next image in the lightbox |
| `Ctrl/⌘+A` | select everything here |
| `Esc` | close / clear the selection |
| `Enter` / `Esc` | confirm / cancel in dialogs |

## Install

You need Python 3 and copyparty (tested with copyparty 1.20.x).

```sh
pip install copyparty            # or: pipx install copyparty
git clone https://github.com/Chronoz/nagi
```

The theme is just the [`theme/`](theme) folder. Mount it read-only at `/.nagi` and point copyparty's theme flags at it:

```sh
copyparty -p 3979 -i 127.0.0.1 \
  -a alice:CHANGE-ME --usernames \
  -v /path/to/your/files:/:r:rwmda,alice \
  -v ./nagi/theme:/.nagi:r \
  --themes 12 --theme 11 --u2j 4 --md-hist v --rw-edit md,txt \
  --css-browser '/.nagi/nagi-boot.css?nagi=4aa84c116d&cache=31536000' \
  --js-browser  '/.nagi/nagi-late.js?nagi=4b7d437385&cache=31536000' \
  --js-other    '/.nagi/nagi-pages.js?nagi=221bdcb2f2&cache=31536000' \
  --html-head-s '…see examples/run-local.sh…' \
  --favico "凪 17282B EEE5D1" --no-robots
```

Then open <http://127.0.0.1:3979/>.

The `--html-head-s` value is too long to paste here (it carries the sand splash, the iOS launch images, the first-paint CSS, and deferred `nagi.js`). Copy the full flag from [`examples/run-local.sh`](examples/run-local.sh) or [`examples/copyparty.conf`](examples/copyparty.conf) — `src/build.py` writes it on every rebuild. `--css-browser` points at a tiny `nagi-boot.css` stub; the real `nagi.css` is loaded from the head, non-blocking, so first paint is not held up.

The Nagi build writes a gzip -9 (or zopfli, if you have it) `.gz` sibling next to every `js`, `css`, `svg`, `json` and manifest file in `theme/` (not the launch PNGs). Copyparty 1.20.26 only looks for those siblings under its own `/.cpr/` UI, so a small, idempotent patch — [`bin/copyparty-1.20.26-nagi-gz.patch`](bin/copyparty-1.20.26-nagi-gz.patch), applied by [`bin/apply-copyparty-patch.sh`](bin/apply-copyparty-patch.sh) — teaches `tx_file` to serve them for `/.nagi/` as well, with `Content-Encoding: gzip` and `Vary: Accept-Encoding`, when the client accepts gzip and the `.gz` is at least as new as the source. Range requests get the plain file. Nothing is compressed on the fly. The apply script checks the copyparty version and the expected hunk and refuses if upstream has changed; hook it into your start wrapper so it is re-applied after a copyparty update, and if it fails, start unpatched (the theme still works). Set `--http-vary 'Origin, PW, Cookie, Accept-Encoding'` (already in the examples) so caches do not mix gzip and plain responses. Brotli support was removed from copyparty in 2024. The koi pond script (`nagi-koi.js`) is loaded after the garden has painted, not on the first-paint path.

What each flag does:

| flag | why |
|---|---|
| `-v ./nagi/theme:/.nagi:r` | serves the theme files at `/.nagi/`, read-only for everyone |
| `--css-browser`, `--js-browser` | load Nagi into copyparty's file browser. Quote the URLs: an unquoted `&` is a bash background job. The `?nagi=HASH&cache=31536000` query lets the browser cache the file for a year; `src/build.py` updates the hash when you rebuild |
| `--js-other` + `--html-head-s` | load the calm login/control-panel pages, the sand splash, iOS launch images, the PWA manifest and the iPhone home-screen icon on every other page. Copy the full `--html-head-s` from the examples; a short hand-written head will miss the splash |
| `--u2j 4` | four parallel up2k upload chunks (good over Tailscale / a phone). Server default is 2 |
| `--themes 12 --theme 11` | gives Nagi its own copyparty theme slot so copyparty's own colours don't leak in |
| `--usernames` | log in with username + password (instead of password only) |
| `-v …:/:r:rwmda,alice` | guests can browse & download, `alice` can upload, move, delete and admin |

### Shortcut: the run script

```sh
NAGI_USER=alice NAGI_PASS='a-long-password' ./examples/run-local.sh /path/to/your/files
```

[`examples/run-local.sh`](examples/run-local.sh) does all of the above. It reads the account from env vars (nothing gets saved), binds to `127.0.0.1`, and takes `PORT=…` and `BIND=…` if you want something else.

### Config-file form

Prefer a config file? See [`examples/copyparty.conf`](examples/copyparty.conf), then run `copyparty -c copyparty.conf`. The Nagi part looks like this:

```yaml
[global]
  themes: 12
  theme: 11
  u2j: 4
  md-hist: v
  rw-edit: md,txt
  css-browser: /.nagi/nagi-boot.css?nagi=4aa84c116d&cache=31536000
  js-browser: /.nagi/nagi-late.js?nagi=4b7d437385&cache=31536000
  js-other: /.nagi/nagi-pages.js?nagi=221bdcb2f2&cache=31536000
  html-head-s: <link rel="stylesheet" href="/.nagi/nagi-pages.css?nagi=5c996510eb&cache=31536000"> …

[/.nagi]
  /path/to/nagi/theme
  accs:
    r: *
```

## Remote access

Works great over [Tailscale](https://tailscale.com): just bind copyparty to `127.0.0.1` plus your tailnet IP (`-i 127.0.0.1,100.x.y.z`) instead of `0.0.0.0`, and open it from your phone anywhere. `--u2j 4` (already in the examples) runs four parallel up2k chunks, which is a good default for an iPhone over Tailscale. Leave turbo mode off; hashing already runs in a web worker on Safari.

## iPhone: add to home screen

1. Open your Nagi URL in **Safari**.
2. Tap **Share** → **Add to Home Screen** → **Add**.
3. Open it from the home screen. It runs full screen with no address bar, and you stay signed in.

If you already had Nagi on the home screen, **remove it and add it again** after this update — iOS only reads the launch images at add-time, and the media queries on those images have to match the phone exactly (they already do for current iPhones, including the iPhone X at 375×812 @3x). A new launch image is otherwise ignored, and you would still see a white flash.

On mobile, Search / Upload / Settings / More live in the bottom bar. **More → Sign in** takes you to the sign-in page and brings you back to the same folder afterwards. Android/Chrome: menu → *Install app*.


## Smart search

Nagi can use two engines; you pick one in **Settings → Search engine**:

- **Smart (EmbeddingGemma 2)** — meaning and keywords, including text inside documents. Needs the [`ext/nagi-search.py`](ext/nagi-search.py) sidecar (one stdlib Python file, next to your copyparty install, never inside `site-packages`).
- **Default** — copyparty’s own `/?srch` filename index. Enable it with `e2d` + `e2ds` and `no-hash: .*`, and keep `--hist` / `--dbpath` outside any cloud-synced folder so online-only files are never downloaded.

If Smart is unavailable, the drawer falls back to Default and shows a short note. Search always goes through copyparty with the user’s cookie; guests only see volumes they can read.

Install and flags: [`ext/README.md`](ext/README.md). The `--on404` volflag uses a colon: `on404: /path/to/ext/nagi-search.py`. Bind the sidecar to `127.0.0.1` only.

## Tips

- `-e2dsa` builds copyparty's file index (search, dedup, faster listings). Skip it on huge or cloud-synced folders (Dropbox, iCloud…), because it reads every file once.
- `-e2ts` reads media tags so the music player shows artist & title.
- Keep the theme mount read-only (`:r`). The theme folder is served to everyone, so don't put secrets or scripts in it.
- **Thumbnails:** copyparty already knows how (`?th=w` / `?th=j` for list thumbs, `?th=wf3` / `?th=jf3` for the image viewer — uncropped, 3× `--th-size`, 960×768 with the default). Keep `--hist` outside any cloud-synced folder. Do not use `--th-pregen` on a Dropbox volume — that would walk every file and could hydrate online-only placeholders. For ffmpeg builds without libwebp, set `th-ff-jpg`. Pillow in the same venv as copyparty makes still-image thumbs faster; ffmpeg covers video. A small hook (`ext/nagi-thumbs.py`) skips dataless / online-only files so they are never opened just to make a thumb. Guests only get thumbs for files they can read; dotfiles stay hidden (and `nodotsrch` keeps them out of search).
- After a theme update, just reload the page (the `?nagi=` hash is a new URL, so the old cache is skipped). If you added it to the iPhone home screen, swipe the app away and open it again.
- Classic copyparty UI: **Settings → Classic copyparty**. Switch back from the 凪 button.

## Build from source

The `theme/` files are built from `src/`:

```sh
python3 src/build.py      # → theme/nagi*.{css,js} and demo/
```

No npm, no bundler. `src/vendor/` has the generated icon sheet (Lucide), the font faces and the shared page styles.

## Credits & thanks 🙏

- **[copyparty](https://github.com/9001/copyparty)** by **ed (9001)**: the file server that does all the heavy lifting. Nagi is just a coat of paint on top. Go star it.
- **Kanso** by **Botiverse** ([kanso.botiverse.build](https://kanso.botiverse.build/), [@botiverse](https://x.com/botiverse)): the zen-garden disk-space app whose pebble map inspired the whole look. Thank you!!
- **Mia-lab** (**Mia**, [@MiaAI_lab](https://x.com/MiaAI_lab), [github.com/MiaAI-Lab](https://github.com/MiaAI-Lab)): the koi pond is adapted from her "Koi Pond, Noon" study in [MiaAI-Lab/Claude-Fable-5.2-HTML-Files](https://github.com/MiaAI-Lab/Claude-Fable-5.2-HTML-Files) ([live](https://miaai-lab.github.io/Claude-Fable-5.2-HTML-Files/009-koi-pond-noon.html)). Used with thanks. That code came with no licence, so its author keeps all rights to those portions (see the note below and the header of [`src/koi.js`](src/koi.js)).
- Icons: [Lucide](https://lucide.dev) (ISC). Fonts: [Inter](https://github.com/rsms/inter), [Newsreader](https://github.com/productiontype/Newsreader), [IBM Plex Mono](https://github.com/IBM/plex) (SIL OFL 1.1).

Full list in [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).

## License

[MIT](LICENSE) for Nagi's own code.

**Note on the koi pond:** `src/koi.js` (and the koi part of the built `theme/nagi.js`) is adapted from Mia-lab's koi pond, linked above. The original was published without a licence notice, so the MIT licence does **not** cover those adapted portions, and their original author keeps all rights to them. copyparty isn't included here, only linked. Fonts and icons keep their own licences.
