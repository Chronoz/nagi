#!/usr/bin/env python3
# coding: utf-8
"""nagi-search — smart (EmbeddingGemma 2) + default filename search for Nagi.

One file, stdlib only, copyparty-style. Lives next to the install, never
inside site-packages, so a copyparty upgrade will not wipe it.

  python3 nagi-search.py serve      # sidecar on 127.0.0.1:3978 (LaunchAgent)
  python3 nagi-search.py download   # fetch the official Q8 GGUF (Apache-2.0)
  python3 nagi-search.py index      # walk + embed once, then exit
  python3 nagi-search.py smoke      # health, a warm query, permission check

copyparty.conf (documented flags only — do not hash Dropbox files):

  [global]
    e2d
    e2ds
    no-hash: .*
    hist:   /Users/YOU/dev/copyparty-dropbox/hist
    dbpath: /Users/YOU/dev/copyparty-dropbox/hist
    re-maxage: 300

  [/.nagi]
    flags:
      d2d
      on404: /Users/YOU/dev/copyparty-dropbox/ext/nagi-search.py

Nagi calls GET /.nagi/sem?q=… (same origin, user cookie). This file's
main(cli, vn, rem) is the --on404 handler: it forwards the query to the
sidecar with the *server-known* username and readable volumes. Guests
never see a volume they cannot read (e.g. /terry).

Smart index: filenames + text from txt/md/code/pdf/docx/rtf. Images and
video are name-only (no captions). Dataless / online-only files are
skipped. Dotfiles and dotfolders are never indexed. Vectors are 256-d Matryoshka, L2-normalised, in one SQLite
file with FTS5, kept outside Dropbox. Ranking is DigUp-style: cosine
plus keyword, with a higher keyword weight for identifier-like queries.

The embedding helper is llama-server (--embeddings) on 127.0.0.1:3977,
CPU only so it does not touch the GPU next to other local models. It
is started on demand and stopped after 10 idle minutes.

Env (all optional):
  NAGI_SEARCH_ROOT   folder to walk          (default: ~/Documents/Dropbox)
  NAGI_SEARCH_VOLS   vpath:realpath,…        (default: /:ROOT,/terry:ROOT/terry)
  NAGI_SEARCH_DIR    index + logs directory  (default: <this>/../semantic)
  NAGI_SEARCH_MODEL  path to the Q8 GGUF
  NAGI_SEARCH_LLAMA  path to the llama binary
  NAGI_SEARCH_PORT   sidecar port            (default: 3978)
  NAGI_LLAMA_PORT    llama-server port       (default: 3977)
"""
from __future__ import print_function

import array, json, math, os, re, sqlite3, stat, struct, subprocess, sys, threading, time, urllib.error, urllib.parse, urllib.request, zipfile
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from xml.etree import ElementTree as ET

HERE = os.path.dirname(os.path.abspath(__file__))
DIR = os.path.abspath(os.environ.get("NAGI_SEARCH_DIR") or os.path.join(HERE, "..", "semantic"))
MODEL = os.environ.get("NAGI_SEARCH_MODEL") or os.path.join(HERE, "models", "embeddinggemma-2-Q8_0.gguf")
LLAMA = os.environ.get("NAGI_SEARCH_LLAMA") or (
    os.path.expanduser("~/.local/bin/llama")
    if os.path.exists(os.path.expanduser("~/.local/bin/llama"))
    else "llama"
)
ROOT = os.path.abspath(os.path.expanduser(os.environ.get("NAGI_SEARCH_ROOT") or "~/Documents/Dropbox"))
PORT = int(os.environ.get("NAGI_SEARCH_PORT") or 3978)
LLAMA_PORT = int(os.environ.get("NAGI_LLAMA_PORT") or 3977)
GGUF_URL = "https://huggingface.co/ggml-org/embeddinggemma-2-GGUF/resolve/main/embeddinggemma-2-Q8_0.gguf"
GGUF_SIZE = 309855456
DIM = 256
CHUNK = 1800
OVERLAP = 200
MAX_READ = 8 * 1024 * 1024
IDLE_SEC = 600
POLL_SEC = 8
UF_DATALESS, SF_DATALESS = 0x00040000, 0x40000000
SKIP_DIR = {".hist", ".dropbox", ".dropbox.cache", ".git", ".Trash", ".DS_Store", "__MACOSX", "semantic", "ext"}
TEXT_EXT = {
    ".txt", ".md", ".markdown", ".rst", ".csv", ".tsv", ".json", ".xml", ".html", ".htm",
    ".py", ".js", ".ts", ".tsx", ".jsx", ".css", ".sh", ".bash", ".zsh", ".c", ".h", ".cpp",
    ".hpp", ".java", ".go", ".rs", ".rb", ".php", ".swift", ".kt", ".yml", ".yaml", ".toml",
    ".ini", ".cfg", ".conf", ".log", ".tex", ".sql", ".r", ".lua", ".pl", ".ps1", ".vue",
}
DOC_EXT = {".docx", ".odt", ".rtf", ".doc"}
PDF_EXT = {".pdf"}
Q_DOC = "title: %s | text: %s"
Q_QRY = "task: search result | query: %s"

_llama = {"proc": None, "last": 0, "lock": threading.Lock()}
_cache = {}
_cache_lock = threading.Lock()
_log_lk = threading.Lock()
STOP = threading.Event()


def log(msg):
    with _log_lk:
        ts = time.strftime("%Y-%m-%d %H:%M:%S")
        line = "%s %s\n" % (ts, msg)
        sys.stderr.write(line)
        sys.stderr.flush()
        try:
            os.makedirs(DIR, exist_ok=True)
            with open(os.path.join(DIR, "nagi-search.log"), "a") as f:
                f.write(line)
        except OSError:
            pass


def vols_from_env():
    raw = os.environ.get("NAGI_SEARCH_VOLS")
    if raw:
        out = []
        for part in raw.split(","):
            if ":" not in part:
                continue
            vp, rp = part.split(":", 1)
            out.append((vp if vp.startswith("/") else "/" + vp, os.path.abspath(os.path.expanduser(rp))))
        return out
    out = [("/", ROOT)]
    terry = os.path.join(ROOT, "terry")
    if os.path.isdir(terry):
        out.append(("/terry", terry))
    return out


def is_dataless(st):
    flags = getattr(st, "st_flags", 0)
    if flags & (UF_DATALESS | SF_DATALESS):
        return True
    if st.st_size > 0 and getattr(st, "st_blocks", 1) == 0 and not stat.S_ISLNK(st.st_mode):
        return True
    return False


def skip_name(name):
    # never index dotfiles / dotfolders (or AppleDouble / Icon\r)
    if not name or name.startswith(".") or name.startswith("._") or name == "Icon\r":
        return True
    if name in SKIP_DIR:
        return True
    return False


# ---------------------------------------------------------------------------
# extraction
# ---------------------------------------------------------------------------
def read_text_file(path):
    with open(path, "rb") as f:
        data = f.read(MAX_READ)
    if b"\x00" in data[:4096]:
        return ""
    for enc in ("utf-8", "utf-8-sig", "latin-1"):
        try:
            return data.decode(enc)
        except UnicodeDecodeError:
            continue
    return data.decode("utf-8", "replace")


def strip_xml(s):
    s = re.sub(r"(?is)<script[^>]*>.*?</script>", " ", s)
    s = re.sub(r"(?is)<style[^>]*>.*?</style>", " ", s)
    s = re.sub(r"(?s)<[^>]+>", " ", s)
    return re.sub(r"\s+", " ", s).strip()


def docx_text(path):
    try:
        with zipfile.ZipFile(path) as z:
            names = [n for n in ("word/document.xml", "content.xml") if n in z.namelist()]
            if not names:
                names = [n for n in z.namelist() if n.endswith(".xml") and "content" in n or n.endswith("document.xml")]
            parts = []
            for n in names[:4]:
                xml = z.read(n)
                # keep paragraph breaks
                xml = xml.replace(b"<w:p", b"\n<w:p").replace(b"<text:p", b"\n<text:p")
                parts.append(strip_xml(xml.decode("utf-8", "replace")))
            return "\n".join(parts)
    except (zipfile.BadZipFile, OSError, KeyError):
        return ""


def run_cmd(args, timeout=30):
    try:
        p = subprocess.run(args, capture_output=True, timeout=timeout)
        return p.stdout
    except (OSError, subprocess.TimeoutExpired):
        return b""


def pdf_text(path):
    # pdftotext (poppler) if present
    for args in (
        ["pdftotext", "-q", "-enc", "UTF-8", path, "-"],
        ["pdftotext", "-enc", "UTF-8", path, "-"],
    ):
        out = run_cmd(args, 45)
        if out.strip():
            return out.decode("utf-8", "replace")
    # Spotlight cache, no file hydration beyond what mdls already has
    out = run_cmd(["mdls", "-name", "kMDItemTextContent", "-raw", path], 15)
    t = out.decode("utf-8", "replace").strip()
    if t and t != "(null)":
        return t
    return pdf_stdlib(path)


def pdf_stdlib(path):
    """Best-effort text from FlateDecode streams + literal (... ) Tj strings."""
    try:
        data = open(path, "rb").read(MAX_READ * 4)
    except OSError:
        return ""
    chunks = []
    for m in re.finditer(rb"stream\r?\n(.*?)endstream", data, re.S):
        raw = m.group(1)
        try:
            raw = __import__("zlib").decompress(raw)
        except Exception:
            pass
        try:
            s = raw.decode("latin-1", "replace")
        except Exception:
            continue
        parts = re.findall(r"\((?:\\.|[^\\)]){2,}\)(?:\s*Tj|\s*'|\s*TJ)", s)
        if parts:
            def unesc(x):
                x = x[1 : x.rfind(")")]
                x = x.replace(r"\n", "\n").replace(r"\r", "").replace(r"\t", " ").replace(r"\(", "(").replace(r"\)", ")")
                return x
            chunks.append(" ".join(unesc(p) for p in parts))
    text = "\n".join(chunks)
    return re.sub(r"[^\S\n]+", " ", text).strip()


def extract(path):
    ext = os.path.splitext(path)[1].lower()
    try:
        if ext in TEXT_EXT:
            t = read_text_file(path)
            if ext in {".html", ".htm", ".xml"}:
                t = strip_xml(t)
            return t
        if ext == ".docx" or ext == ".odt":
            return docx_text(path)
        if ext in {".rtf", ".doc"}:
            out = run_cmd(["textutil", "-convert", "txt", "-stdout", path], 30)
            return out.decode("utf-8", "replace") if out else ""
        if ext in PDF_EXT:
            return pdf_text(path)
    except OSError as ex:
        log("extract %s: %s" % (path, ex))
        return ""
    return ""


def chunks_of(text, n=CHUNK, ov=OVERLAP):
    text = re.sub(r"\s+", " ", (text or "").strip())
    if not text:
        return []
    if len(text) <= n:
        return [text]
    out, i = [], 0
    while i < len(text):
        out.append(text[i : i + n])
        if i + n >= len(text):
            break
        i += n - ov
    return out[:200]


# ---------------------------------------------------------------------------
# sqlite
# ---------------------------------------------------------------------------
def db_path():
    os.makedirs(DIR, exist_ok=True)
    return os.path.join(DIR, "index.sqlite")


def connect(rw=True):
    p = db_path()
    c = sqlite3.connect(p, timeout=10, isolation_level=None)
    c.execute("pragma journal_mode=WAL")
    c.execute("pragma synchronous=NORMAL")
    c.execute("pragma foreign_keys=ON")
    if rw:
        init(c)
    return c


def init(c):
    c.executescript(
        """
        create table if not exists meta(k text primary key, v text);
        create table if not exists files(
            id integer primary key,
            path text unique not null,
            vol text not null,
            vpath text not null,
            size integer, mtime real,
            state text, detail text);
        create table if not exists chunks(
            id integer primary key,
            file integer references files(id) on delete cascade,
            n integer,
            text text,
            vec blob);
        create index if not exists chunks_file on chunks(file);
        """
    )
    # FTS: created separately so a rerun is a no-op
    row = c.execute("select 1 from sqlite_master where name='fts'").fetchone()
    if not row:
        c.execute("create virtual table fts using fts5(name, body, file unindexed, tokenize='unicode61 remove_diacritics 2')")
    c.execute("insert or ignore into meta(k,v) values('dim',?)", (str(DIM),))
    c.execute("insert or ignore into meta(k,v) values('model',?)", ("google/embeddinggemma-2 Q8_0 matryoshka-%d" % DIM,))


def pack(vec):
    return struct.pack("<%df" % len(vec), *vec) if vec is not None else None


def unpack(blob):
    if not blob:
        return None
    n = len(blob) // 4
    return list(struct.unpack("<%df" % n, blob))


def l2(vec):
    s = math.sqrt(sum(x * x for x in vec)) or 1.0
    return [x / s for x in vec]


def truncate(vec, dim=DIM):
    if not vec:
        return None
    return l2(list(vec[:dim]))


# ---------------------------------------------------------------------------
# llama-server (CPU, localhost, lazy, idle-unload)
# ---------------------------------------------------------------------------
def llama_url():
    return "http://127.0.0.1:%d" % LLAMA_PORT


def llama_alive():
    try:
        urllib.request.urlopen(llama_url() + "/health", timeout=1)
        return True
    except Exception:
        try:
            urllib.request.urlopen(llama_url() + "/v1/models", timeout=1)
            return True
        except Exception:
            return False


def start_llama():
    with _llama["lock"]:
        if llama_alive():
            _llama["last"] = time.time()
            return True
        if not os.path.isfile(MODEL) or os.path.getsize(MODEL) < 1000:
            log("no model at %s — run: nagi-search.py download" % MODEL)
            return False
        cmd = [
            LLAMA, "serve",
            "-m", MODEL,
            "--embeddings",
            "--pooling", "mean",
            "--embd-normalize", "2",
            "--host", "127.0.0.1",
            "--port", str(LLAMA_PORT),
            "--ctx-size", "2048",
            "--batch-size", "2048",
            "--ubatch-size", "2048",
            "--device", "none",
            "--alias", "embeddinggemma2",
        ]
        log("starting llama-server (CPU) on 127.0.0.1:%d" % LLAMA_PORT)
        errp = open(os.path.join(DIR, "llama.log"), "ab")
        try:
            proc = subprocess.Popen(cmd, stdout=errp, stderr=subprocess.STDOUT)
        except OSError as ex:
            log("llama spawn failed: %s" % ex)
            return False
        _llama["proc"] = proc
        for i in range(60):
            if proc.poll() is not None:
                # maybe --no-warmup unknown; retry without
                if i < 2 and b"no-warmup" in open(os.path.join(DIR, "llama.log"), "rb").read()[-2000:]:
                    cmd = [x for x in cmd if x != "--no-warmup"]
                    proc = subprocess.Popen(cmd, stdout=errp, stderr=subprocess.STDOUT)
                    _llama["proc"] = proc
                    continue
                log("llama-server exited early (code %s)" % proc.poll())
                return False
            if llama_alive():
                _llama["last"] = time.time()
                log("llama-server ready in %.1fs" % (i * 0.4))
                return True
            time.sleep(0.4)
        log("llama-server did not become ready")
        return False


def stop_llama():
    with _llama["lock"]:
        p = _llama["proc"]
        _llama["proc"] = None
        if p and p.poll() is None:
            p.terminate()
            try:
                p.wait(timeout=5)
            except subprocess.TimeoutExpired:
                p.kill()
            log("llama-server stopped")


def idle_watch():
    while not STOP.is_set():
        STOP.wait(30)
        last = _llama["last"]
        if last and _llama["proc"] and time.time() - last > IDLE_SEC:
            log("idle %.0fs — unloading llama-server" % (time.time() - last))
            stop_llama()


def embed_one(text):
    if not text or not text.strip():
        return None
    if not start_llama():
        return None
    body = json.dumps({"input": text, "model": "embeddinggemma2"}).encode()
    req = urllib.request.Request(
        llama_url() + "/v1/embeddings",
        data=body,
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    try:
        with urllib.request.urlopen(req, timeout=60) as r:
            j = json.loads(r.read().decode())
        vec = (j.get("data") or [{}])[0].get("embedding")
        if not vec:
            # older /embedding shape
            vec = j.get("embedding")
            if vec and isinstance(vec[0], list):
                vec = vec[0]
        _llama["last"] = time.time()
        return truncate(vec)
    except Exception as ex:
        # fallback endpoint
        try:
            req = urllib.request.Request(
                llama_url() + "/embedding",
                data=json.dumps({"content": text}).encode(),
                headers={"Content-Type": "application/json"},
                method="POST",
            )
            with urllib.request.urlopen(req, timeout=60) as r:
                j = json.loads(r.read().decode())
            vec = j.get("embedding")
            if vec and isinstance(vec[0], list):
                vec = vec[0]
            _llama["last"] = time.time()
            return truncate(vec)
        except Exception as ex2:
            log("embed failed: %s / %s" % (ex, ex2))
            return None


def embed_many(texts):
    out = []
    for t in texts:
        out.append(embed_one(t))
        # gentle throttle so we stay a background guest
        time.sleep(0.02)
    return out


# ---------------------------------------------------------------------------
# indexing
# ---------------------------------------------------------------------------
def vpath_of(vol, root, path):
    rel = os.path.relpath(path, root)
    if rel in (".", ""):
        return vol if vol != "/" else "/"
    rel = rel.replace(os.sep, "/")
    if vol == "/":
        return "/" + rel
    return vol.rstrip("/") + "/" + rel


def child_roots(volumes, vol):
    mine = dict(volumes)[vol]
    out = []
    for v, r in volumes:
        if v != vol and r != mine and (r.startswith(mine.rstrip("/") + os.sep)):
            out.append(os.path.abspath(r))
    return out


def _listdir(path, sec=8):
    # Dropbox / TCC can stall opendir; don't block the whole pass.
    box, ev = [], threading.Event()
    def run():
        try:
            box.append(os.listdir(path))
        except Exception as ex:
            box.append(ex)
        finally:
            ev.set()
    threading.Thread(target=run, name="ls", daemon=True).start()
    if not ev.wait(sec):
        log("listdir timeout %ss %s" % (sec, path))
        return None
    if box and isinstance(box[0], Exception):
        log("listdir %s: %s" % (path, box[0]))
        return []
    return box[0] if box else []


def walk_vol(vol, root, exclude):
    # prune child volumes *before* descending (os.walk would opendir them first)
    exclude = {os.path.abspath(x) for x in exclude}
    log("walk %s -> %s" % (vol, root))
    stack = [os.path.abspath(root)]
    seen = set()
    while stack:
        dirpath = stack.pop()
        if dirpath in seen:
            continue
        seen.add(dirpath)
        if dirpath in exclude or any(dirpath.startswith(e + os.sep) for e in exclude):
            continue
        names = _listdir(dirpath)
        if names is None:
            continue
        for fn in names:
            if skip_name(fn):
                continue
            p = os.path.join(dirpath, fn)
            try:
                st = os.lstat(p)
            except OSError:
                continue
            if stat.S_ISLNK(st.st_mode):
                continue
            if stat.S_ISDIR(st.st_mode):
                ap = os.path.abspath(p)
                if ap not in exclude:
                    stack.append(ap)
            elif stat.S_ISREG(st.st_mode):
                yield p


def index_file(c, vol, root, path):
    try:
        st = os.lstat(path)
    except OSError as ex:
        return "err", str(ex)
    if stat.S_ISLNK(st.st_mode) or not stat.S_ISREG(st.st_mode):
        return "skip", "not-file"
    if is_dataless(st):
        return "skip", "dataless"
    vp = vpath_of(vol, root, path)
    row = c.execute("select id,size,mtime,state from files where path=?", (path,)).fetchone()
    if row and row[1] == st.st_size and abs((row[2] or 0) - st.st_mtime) < 0.01 and row[3] == "done":
        return "ok", "unchanged"
    fid = row[0] if row else None
    if fid:
        c.execute("delete from chunks where file=?", (fid,))
        c.execute("delete from fts where file=?", (str(fid),))
        c.execute(
            "update files set vol=?,vpath=?,size=?,mtime=?,state=?,detail=? where id=?",
            (vol, vp, st.st_size, st.st_mtime, "pending", "", fid),
        )
    else:
        c.execute(
            "insert into files(path,vol,vpath,size,mtime,state,detail) values(?,?,?,?,?,?,?)",
            (path, vol, vp, st.st_size, st.st_mtime, "pending", ""),
        )
        fid = c.execute("select last_insert_rowid()").fetchone()[0]

    name = os.path.basename(path)
    parent = os.path.basename(os.path.dirname(path))
    body = extract(path) if st.st_size <= 80 * 1024 * 1024 else ""
    parts = chunks_of(body)
    # always a name "chunk" so a file with no text is still semantically searchable
    name_txt = (name + (" " + parent if parent else "")).strip()
    texts = [Q_DOC % (name, name_txt)] + [Q_DOC % (name, p) for p in parts]
    raws = [name_txt] + parts
    vecs = embed_many(texts)
    for i, (raw, vec) in enumerate(zip(raws, vecs)):
        c.execute("insert into chunks(file,n,text,vec) values(?,?,?,?)", (fid, i, raw, pack(vec) if vec else None))
    # FTS: name + all body
    c.execute("insert into fts(name,body,file) values(?,?,?)", (name, (name_txt + "\n" + (body or ""))[:20000], str(fid)))
    nvec = sum(1 for v in vecs if v)
    c.execute("update files set state=?,detail=? where id=?", ("done", "%d vec" % nvec, fid))
    return "done", "%d chunks %d vec" % (len(raws), nvec)


def forget_missing(c, live):
    rows = c.execute("select id,path from files").fetchall()
    n = 0
    for fid, path in rows:
        if path not in live:
            c.execute("delete from chunks where file=?", (fid,))
            c.execute("delete from fts where file=?", (str(fid),))
            c.execute("delete from files where id=?", (fid,))
            n += 1
    return n


def index_once():
    volumes = vols_from_env()
    log("index pass start vols=%s" % (volumes,))
    c = connect(True)
    t0 = time.time()
    live = set()
    stats = {"done": 0, "ok": 0, "skip": 0, "err": 0}
    for vol, root in volumes:
        if not os.path.isdir(root):
            log("missing volume %s -> %s" % (vol, root))
            continue
        excl = child_roots(volumes, vol)
        for path in walk_vol(vol, root, excl):
            live.add(path)
            try:
                st, detail = index_file(c, vol, root, path)
            except Exception as ex:
                st, detail = "err", str(ex)
                log("index %s: %s" % (path, ex))
            stats[st] = stats.get(st, 0) + 1
            if st == "done":
                log("indexed %s (%s)" % (path, detail))
            time.sleep(0.03)
    gone = forget_missing(c, live)
    dt = time.time() - t0
    c.execute("insert or replace into meta(k,v) values('last_index',?)", ("%.2f" % dt,))
    c.execute("insert or replace into meta(k,v) values('last_index_at',?)", (str(int(time.time())),))
    c.close()
    log("index pass %.2fs %s gone=%d" % (dt, stats, gone))
    return dt, stats


def poll_loop():
    # first pass right away, then every POLL_SEC; cheap mtime/size compare
    while not STOP.is_set():
        try:
            index_once()
        except Exception as ex:
            log("index loop: %s" % ex)
        STOP.wait(POLL_SEC)


# ---------------------------------------------------------------------------
# search
# ---------------------------------------------------------------------------
def tokens(q):
    return [t for t in re.split(r"[^\w]+", q.lower(), flags=re.U) if t]


def is_ident(q):
    return bool(re.search(r"\d{4,}", q) or re.search(r"[A-Za-z]+[-_]?\d+", q) or re.search(r"\b[A-Z]{2,}\d+", q))


def kw_score(q, name, body):
    ts = tokens(q)
    if not ts:
        return 0.0
    hay = ((name or "") + " " + (body or "")).lower()
    hit = sum(1 for t in ts if t in hay)
    s = hit / float(len(ts))
    # exact filename / whole-query phrase
    if q.lower() in hay:
        s = max(s, 0.9)
    if q.lower() in (name or "").lower():
        s = max(s, 1.0)
    return s


def blend(cos, kw, ident):
    c = max(0.0, cos)
    if ident:
        return 0.40 * c + 0.60 * kw
    return 0.75 * c + 0.25 * kw


def snippet(text, q, n=140):
    text = re.sub(r"\s+", " ", (text or "")).strip()
    if not text:
        return ""
    ql = q.lower()
    i = text.lower().find(ql) if ql else -1
    if i < 0:
        for t in tokens(q):
            i = text.lower().find(t)
            if i >= 0:
                break
    if i < 0:
        return text[:n]
    a = max(0, i - 30)
    return ("…" if a else "") + text[a : a + n] + ("…" if a + n < len(text) else "")


def allowed_vol(vol, rvol):
    rset = set((v or "").rstrip("/") or "/" for v in rvol)
    v = (vol or "").rstrip("/") or "/"
    return v in rset


def search(q, rvol, limit=40):
    q = (q or "").strip()
    if len(q) < 2:
        return {"hits": [], "ms": 0, "engine": "smart"}
    key = (q, tuple(sorted(rvol)))
    with _cache_lock:
        hit = _cache.get(key)
        if hit and time.time() - hit[0] < 30:
            return hit[1]
    t0 = time.time()
    c = connect(False)
    qvec = embed_one(Q_QRY % q)
    ident = is_ident(q)
    # FTS candidates (prefix match on last token if nothing exact)
    fts_ids = {}
    try:
        fts_q = " ".join('"%s"' % t.replace('"', "") for t in tokens(q)) or q.replace('"', "")
        for fid, name, body in c.execute(
            "select file, name, body from fts where fts match ? limit 200", (fts_q,)
        ):
            fts_ids[int(fid)] = (name, body)
    except sqlite3.OperationalError:
        pass
    # if FTS missed, LIKE fallback
    if not fts_ids:
        like = "%" + q.replace("%", "") + "%"
        for fid, name, body in c.execute(
            "select file, name, body from fts where name like ? or body like ? limit 200", (like, like)
        ):
            fts_ids[int(fid)] = (name, body)

    scored = {}  # fid -> (score, snip, vpath, size, mtime, name, vol)
    rows = c.execute(
        "select c.file,c.text,c.vec,f.vol,f.vpath,f.size,f.mtime,f.path from chunks c join files f on f.id=c.file where f.state='done'"
    ).fetchall()
    for fid, text, blob, vol, vp, sz, mt, path in rows:
        if not allowed_vol(vol, rvol):
            continue
        if any((p or "").startswith(".") for p in (vp or "").split("/")):
            continue
        name = os.path.basename(path)
        body = fts_ids.get(fid, (name, text))[1]
        kw = kw_score(q, name, (text or "") + " " + (body or ""))
        cos = 0.0
        vec = unpack(blob) if blob else None
        if qvec is not None and vec is not None and len(vec) == len(qvec):
            cos = sum(a * b for a, b in zip(qvec, vec))
        if qvec is None and kw <= 0:
            continue
        if kw <= 0 and cos < 0.25:
            continue
        sc = blend(cos, kw, ident) if qvec is not None else kw
        prev = scored.get(fid)
        if prev is None or sc > prev[0]:
            scored[fid] = (sc, snippet(text or body, q), vp, sz, mt, name, vol, cos, kw)
    # FTS-only files with no surviving chunk
    for fid, (name, body) in fts_ids.items():
        if fid in scored:
            continue
        row = c.execute("select vol,vpath,size,mtime,path from files where id=?", (fid,)).fetchone()
        if not row or not allowed_vol(row[0], rvol):
            continue
        if any((p or "").startswith(".") for p in (row[1] or "").split("/")):
            continue
        kw = kw_score(q, name, body)
        if kw <= 0:
            continue
        scored[fid] = (kw * (0.6 if ident else 0.4), snippet(body, q), row[1], row[2], row[3], os.path.basename(row[4]), row[0], 0.0, kw)
    c.close()
    ranked = sorted(scored.values(), key=lambda x: -x[0])[:limit]
    hits = []
    for sc, snip, vp, sz, mt, name, vol, cos, kw in ranked:
        hits.append({
            "name": name,
            "path": vp,
            "dir": vp[: vp.rfind("/") + 1] or "/",
            "size": sz or 0,
            "ts": int(mt or 0),
            "snip": snip,
            "score": round(sc, 4),
            "cos": round(cos, 4),
            "kw": round(kw, 4),
            "isDir": False,
            "tags": {},
        })
    ms = int((time.time() - t0) * 1000)
    out = {"hits": hits, "ms": ms, "engine": "smart", "embedded": qvec is not None, "n": len(hits)}
    with _cache_lock:
        _cache[key] = (time.time(), out)
        if len(_cache) > 64:
            oldest = sorted(_cache, key=lambda k: _cache[k][0])[:16]
            for k in oldest:
                _cache.pop(k, None)
    return out


def status():
    info = {"ok": True, "sidecar": True, "model": os.path.isfile(MODEL), "llama": llama_alive(), "dim": DIM}
    try:
        c = connect(False)
        info["files"] = c.execute("select count(*) from files").fetchone()[0]
        info["chunks"] = c.execute("select count(*) from chunks").fetchone()[0]
        info["vecs"] = c.execute("select count(*) from chunks where vec is not null").fetchone()[0]
        info["last_index"] = (c.execute("select v from meta where k='last_index'").fetchone() or [None])[0]
        c.close()
    except sqlite3.Error as ex:
        info["db"] = str(ex)
    return info


# ---------------------------------------------------------------------------
# HTTP sidecar (127.0.0.1 only) + copyparty --on404 adapter
# ---------------------------------------------------------------------------
def rvol_of(headers, qs):
    # trusted headers from the on404 adapter only (localhost)
    raw = headers.get("X-Nagi-Rvol") or qs.get("rvol", [""])[0]
    try:
        v = json.loads(raw) if raw and raw[:1] in "[{" else [x for x in raw.split(",") if x]
    except Exception:
        v = []
    return [((x if str(x).startswith("/") else "/" + str(x)) if str(x) not in ("", "/") else "/") for x in v] or ["/"]


class Handler(BaseHTTPRequestHandler):
    def log_message(self, fmt, *args):
        log("http " + (fmt % args))

    def _json(self, obj, status=200):
        body = json.dumps(obj, ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(body)

    def do_GET(self):
        u = urllib.parse.urlparse(self.path)
        qs = urllib.parse.parse_qs(u.query)
        if u.path in ("/health", "/status", "/sem") and not qs.get("q"):
            return self._json(status())
        if u.path in ("/search", "/sem") or qs.get("q"):
            q = (qs.get("q") or [""])[0]
            rvol = rvol_of(self.headers, qs)
            return self._json(search(q, rvol))
        self._json({"error": "not found"}, 404)

    def do_POST(self):
        n = int(self.headers.get("Content-Length") or 0)
        raw = self.rfile.read(n) if n else b"{}"
        try:
            j = json.loads(raw.decode() or "{}")
        except Exception:
            return self._json({"error": "bad json"}, 400)
        q = j.get("q") or ""
        rvol = j.get("rvol") or rvol_of(self.headers, {})
        self._json(search(q, rvol))


def serve():
    os.makedirs(DIR, exist_ok=True)
    log("nagi-search sidecar 127.0.0.1:%d  root=%s  model=%s" % (PORT, ROOT, MODEL))
    threading.Thread(target=idle_watch, name="llama-idle", daemon=True).start()
    threading.Thread(target=poll_loop, name="index", daemon=True).start()
    httpd = ThreadingHTTPServer(("127.0.0.1", PORT), Handler)
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        STOP.set()
        stop_llama()
        httpd.server_close()
        log("sidecar stopped")


# --on404 entry: copyparty does `mod.main(cli, vn, rem)`
def main(cli, vn, rem):
    rem = (rem or "").strip("/")
    if rem != "sem":
        return ""
    try:
        q = ""
        if hasattr(cli, "uparam"):
            q = cli.uparam.get("q") or cli.uparam.get("sem") or ""
        uname = getattr(cli, "uname", "*") or "*"
        rvol = list(getattr(cli, "rvol", None) or ["/"])
        rvol = [("/" + v if v and not str(v).startswith("/") else (v or "/")) for v in rvol]
        # if the client just wants a ping, don't wait on a down sidecar too long
        ping = (hasattr(cli, "uparam") and ("ping" in cli.uparam or cli.uparam.get("status") == "1")) or q == ""
        url = "http://127.0.0.1:%d/%s" % (PORT, "status" if ping and not q else ("search?q=" + urllib.parse.quote(q)))
        req = urllib.request.Request(
            url,
            headers={
                "X-Nagi-User": str(uname),
                "X-Nagi-Rvol": json.dumps(rvol, ensure_ascii=False),
            },
        )
        try:
            with urllib.request.urlopen(req, timeout=2 if ping and not q else 12) as r:
                body = r.read()
                status = 200
        except urllib.error.HTTPError as ex:
            body = ex.read() or json.dumps({"error": "http %s" % ex.code}).encode()
            status = ex.code
        except Exception as ex:
            body = json.dumps({"ok": False, "sidecar": False, "error": str(ex), "hits": [], "engine": "smart"}).encode()
            status = 503
        try:
            cli.reply(body, status=status, mime="application/json")
        except TypeError:
            try:
                cli.reply(body, mime="application/json")
            except TypeError:
                cli.reply(body)
        return "true"
    except Exception as ex:
        log("on404: %s" % ex)
        return ""


# ---------------------------------------------------------------------------
# cli
# ---------------------------------------------------------------------------
def cmd_download():
    dest = MODEL
    os.makedirs(os.path.dirname(dest), exist_ok=True)
    if os.path.isfile(dest) and os.path.getsize(dest) == GGUF_SIZE:
        print("already have %s (%d bytes)" % (dest, GGUF_SIZE))
        return 0
    part = dest + ".part"
    print("downloading %s -> %s" % (GGUF_URL, dest))
    # resume with curl if present, else urllib
    curl = _which("curl")
    if curl:
        rc = subprocess.call([curl, "-L", "--retry", "5", "-C", "-", "-A", "nagi-search/0.1", "-o", part, GGUF_URL])
        if rc != 0:
            return rc
    else:
        urllib.request.urlretrieve(GGUF_URL, part)
    sz = os.path.getsize(part)
    if sz != GGUF_SIZE:
        print("size %d != expected %d — leaving %s" % (sz, GGUF_SIZE, part), file=sys.stderr)
        return 1
    os.replace(part, dest)
    print("ok %s (%d bytes)" % (dest, sz))
    return 0


def _which(name):
    for d in os.environ.get("PATH", "").split(os.pathsep):
        p = os.path.join(d, name)
        if os.path.isfile(p) and os.access(p, os.X_OK):
            return p
    return None


def cmd_smoke():
    st = {}
    try:
        with urllib.request.urlopen("http://127.0.0.1:%d/status" % PORT, timeout=3) as r:
            st = json.loads(r.read().decode())
        print("status", json.dumps(st))
    except Exception as ex:
        print("sidecar down:", ex)
        return 1
    # warm query (may start llama)
    t0 = time.time()
    try:
        q = urllib.parse.urlencode({"q": "invoice"})
        req = urllib.request.Request(
            "http://127.0.0.1:%d/search?%s" % (PORT, q),
            headers={"X-Nagi-Rvol": json.dumps(["/"])},
        )
        with urllib.request.urlopen(req, timeout=30) as r:
            guest = json.loads(r.read().decode())
    except Exception as ex:
        print("guest search failed:", ex)
        return 1
    gpaths = [h.get("path", "") for h in guest.get("hits") or []]
    leak = [p for p in gpaths if p.rstrip("/") == "/terry" or p.startswith("/terry/")]
    print("guest query %.0fms hits=%d leak=%d embedded=%s" % (
        (time.time() - t0) * 1000, len(gpaths), len(leak), guest.get("embedded")))
    if leak:
        print("PERMISSION FAIL: guest saw /terry:", leak)
        return 2
    # second query = warm cache / warm model
    t1 = time.time()
    req = urllib.request.Request(
        "http://127.0.0.1:%d/search?q=notes" % PORT,
        headers={"X-Nagi-Rvol": json.dumps(["/", "/terry"])},
    )
    with urllib.request.urlopen(req, timeout=30) as r:
        full = json.loads(r.read().decode())
    print("terry-scope query %.0fms hits=%d ms_reported=%s" % (
        (time.time() - t1) * 1000, len(full.get("hits") or []), full.get("ms")))
    print("ok")
    return 0


def usage():
    print(__doc__)
    return 0


if __name__ == "__main__":
    cmd = (sys.argv[1] if len(sys.argv) > 1 else "help").lower()
    if cmd in ("serve", "run", "sidecar"):
        serve()
    elif cmd == "download":
        sys.exit(cmd_download())
    elif cmd == "index":
        dt, st = index_once()
        print("indexed in %.2fs %s" % (dt, st))
    elif cmd in ("smoke", "test"):
        sys.exit(cmd_smoke())
    elif cmd in ("status", "health"):
        print(json.dumps(status(), indent=2))
    elif cmd in ("stop-llama",):
        stop_llama()
    else:
        usage()
