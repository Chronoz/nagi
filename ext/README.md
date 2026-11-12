# nagi-search

Smart search for the Nagi theme: [EmbeddingGemma 2](https://huggingface.co/google/embeddinggemma-2) (Apache 2.0) plus copyparty’s own filename index. One Python file, stdlib only, in copyparty’s hook style. It lives next to your copyparty install, **not** inside `site-packages`, so a copyparty upgrade will not wipe it.

Users pick the engine in **Nagi → Settings → Search engine**:

- **Smart** — meaning and words, with EmbeddingGemma 2. Looks inside text, markdown, code, PDFs and Office files. Filenames always count.
- **Default** — copyparty’s `/?srch` filename index. If Smart is down, the drawer falls back here on its own.

## What it does

- Watches your volume (a short poll of size and mtime). Skips Dropbox / iCloud **dataless** (online-only) files and never hashes contents.
- Chunks extracted text, embeds it with `llama serve --embeddings` on **127.0.0.1**, CPU only, and stores **256-d** Matryoshka vectors plus FTS5 in one SQLite file **outside** the volume.
- Ranks like DigUp: cosine plus keyword, with a higher keyword weight for invoice-like queries. A short snippet is returned with each hit.
- Search goes through copyparty (`GET /.nagi/sem?q=…`) with the user’s cookie. The `--on404` adapter forwards the *server-known* username and readable volumes. Guests never see a private volume such as `/terry`.
- The embedding helper starts on demand and unloads after ten idle minutes. It does not use the GPU, so it stays out of the way of other local models.

## Install (next to copyparty)

```sh
# file lives here, beside the venv and conf — not in site-packages
cp nagi-search.py /path/to/copyparty-dropbox/ext/
python3 /path/to/copyparty-dropbox/ext/nagi-search.py download   # ~310 MB Q8 GGUF, once
python3 /path/to/copyparty-dropbox/ext/nagi-search.py serve
```

Add to `copyparty.conf` (documented flags only). Keep the database **outside** any cloud-synced folder, and disable hashing so online-only files are never downloaded:

```yaml
[global]
  e2d
  e2ds
  no-hash: .*
  hist:   /path/to/copyparty-dropbox/hist
  dbpath: /path/to/copyparty-dropbox/hist
  re-maxage: 300

[/.nagi]
  /path/to/nagi/theme
  accs:
    r: *
  flags:
    d2d
    on404: /path/to/copyparty-dropbox/ext/nagi-search.py
```

`d2d` on the theme volume skips indexing the CSS/JS. `on404` is the same file: when copyparty would 404 on `/.nagi/sem`, `main()` proxies the query to the sidecar.

LaunchAgent (macOS), same pattern as copyparty’s:

```sh
# see ext/com.tri.nagi-search.plist.example
launchctl bootstrap gui/$(id -u) ~/Library/LaunchAgents/com.tri.nagi-search.plist
```

Smoke test (no passwords printed):

```sh
python3 nagi-search.py smoke
```

## Commands

| command | does |
|---|---|
| `serve` | sidecar on `127.0.0.1:3978` (index loop + search API) |
| `download` | fetch `ggml-org/embeddinggemma-2-GGUF` Q8 text weights |
| `index` | one walk and embed, then exit |
| `smoke` | health, a warm query, and a guest `/terry` leak check |
| `status` | index counts and helper state |

Environment (all optional): `NAGI_SEARCH_ROOT`, `NAGI_SEARCH_VOLS` (`/:/path,/terry:/path/terry`), `NAGI_SEARCH_DIR`, `NAGI_SEARCH_MODEL`, `NAGI_SEARCH_LLAMA`, `NAGI_SEARCH_PORT`, `NAGI_LLAMA_PORT`.

Needs a `llama` binary with `serve --embeddings` (the [Llama app](https://llama.app) CLI at `~/.local/bin/llama` is fine) and, for PDFs, `pdftotext` or macOS `mdls` / `textutil` when they are already there.

## Limits

- Images and video are searchable by **name** only (no captions) in this version.
- The first Smart query may take a few seconds while the helper loads; after that it stays warm for ten minutes.
- Default filename search needs the `e2d` + `no-hash` flags above; without them Nagi’s Default engine will say search is not available.
