"""TeleGallery backend — stateless Flask API.

Every request is expected to carry the user's credentials in headers:
    X-Bot-Token       Telegram bot token
    X-Channel-Id      Telegram channel id (e.g. -100123...)
    X-Api-Id          Telegram API id (optional; needed for >50 MB files)
    X-Api-Hash        Telegram API hash (optional; needed for >50 MB files)
    X-Supabase-Url    User's Supabase project URL
    X-Supabase-Key    User's Supabase anon key

The backend stores nothing — no DB, no .env credentials, no per-user state.
"""

from __future__ import annotations

import logging
import os
import tempfile
import traceback
from functools import wraps
from typing import Optional

from flask import Flask, Response, jsonify, request, stream_with_context
from flask_cors import CORS
from supabase import Client, create_client

import config
import telegram_uploader as tg

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
log = logging.getLogger("telegallery")

app = Flask(__name__)
app.config["MAX_CONTENT_LENGTH"] = config.MAX_UPLOAD_BYTES
CORS(
    app,
    resources={r"/api/*": {"origins": "*"}},
    expose_headers=["Content-Length", "Content-Range", "Content-Type"],
    allow_headers=[
        "Content-Type",
        "X-Bot-Token",
        "X-Channel-Id",
        "X-Api-Id",
        "X-Api-Hash",
        "X-Supabase-Url",
        "X-Supabase-Key",
    ],
)


# ---------------------------------------------------------------------------
# Per-request credential helpers
# ---------------------------------------------------------------------------


def _tg_creds() -> tg.TgCreds:
    return tg.TgCreds(
        bot_token=request.headers.get("X-Bot-Token", "").strip(),
        channel_id=request.headers.get("X-Channel-Id", "").strip(),
        api_id=request.headers.get("X-Api-Id", "").strip(),
        api_hash=request.headers.get("X-Api-Hash", "").strip(),
    )


def _supabase_client() -> Optional[Client]:
    url = request.headers.get("X-Supabase-Url", "").strip()
    key = request.headers.get("X-Supabase-Key", "").strip()
    if not url or not key:
        return None
    return create_client(url, key)


def require_supabase(view):
    @wraps(view)
    def wrapper(*args, **kwargs):
        sb = _supabase_client()
        if sb is None:
            return jsonify({"error": "missing supabase credentials"}), 400
        return view(sb, *args, **kwargs)

    return wrapper


def require_tg(view):
    @wraps(view)
    def wrapper(*args, **kwargs):
        creds = _tg_creds()
        if not creds.bot_token or not creds.channel_id:
            return jsonify({"error": "missing telegram credentials"}), 400
        return view(creds, *args, **kwargs)

    return wrapper


# ---------------------------------------------------------------------------
# Health + setup
# ---------------------------------------------------------------------------


@app.get("/")
def root():
    return jsonify({"service": "telegallery", "status": "ok"})


@app.get("/api/health")
def health():
    return jsonify({"ok": True})


@app.post("/api/setup/test")
def setup_test():
    """Validate every credential the user typed in onboarding."""
    creds = _tg_creds()
    result = {
        "telegram": {"ok": False, "detail": ""},
        "channel": {"ok": False, "detail": ""},
        "supabase": {"ok": False, "detail": ""},
        "pyrogram": {"ok": False, "detail": "skipped"},
    }

    if creds.bot_token:
        try:
            me = tg.bot_get_me(creds)
            result["telegram"] = {
                "ok": True,
                "detail": f"@{me.get('username','bot')}",
            }
        except Exception as exc:
            result["telegram"]["detail"] = str(exc)

    if creds.bot_token and creds.channel_id:
        try:
            chat = tg.bot_get_chat(creds)
            result["channel"] = {
                "ok": True,
                "detail": chat.get("title") or str(chat.get("id")),
            }
        except Exception as exc:
            result["channel"]["detail"] = str(exc)

    sb = None
    sb_url = request.headers.get("X-Supabase-Url", "").strip()
    sb_key = request.headers.get("X-Supabase-Key", "").strip()
    if not sb_url or not sb_key:
        result["supabase"]["detail"] = "missing url or anon key"
    else:
        try:
            sb = create_client(sb_url, sb_key)
        except Exception as exc:
            result["supabase"]["detail"] = f"client init failed: {exc}"

    if sb is not None:
        try:
            sb.table("photos").select("id").limit(1).execute()
            result["supabase"] = {"ok": True, "detail": "tables reachable"}
        except Exception as exc:
            result["supabase"]["detail"] = str(exc)

    if creds.api_id and creds.api_hash:
        result["pyrogram"] = {"ok": True, "detail": "api credentials present"}

    all_ok = (
        result["telegram"]["ok"]
        and result["channel"]["ok"]
        and result["supabase"]["ok"]
    )
    return jsonify({"ok": all_ok, "checks": result})


# ---------------------------------------------------------------------------
# Upload
# ---------------------------------------------------------------------------


@app.post("/api/upload")
@require_tg
@require_supabase
def upload(sb: Client, creds: tg.TgCreds):
    if "file" not in request.files:
        return jsonify({"error": "no file in request"}), 400

    f = request.files["file"]
    if not f.filename:
        return jsonify({"error": "file has no name"}), 400

    album = request.form.get("album") or "All Photos"
    title = request.form.get("title") or ""
    mime_type = f.mimetype or tg.guess_mime(f.filename)

    tmp = tempfile.NamedTemporaryFile(
        delete=False, dir=config.TMP_DIR, suffix=f"_{os.path.basename(f.filename)}"
    )
    try:
        f.save(tmp.name)
        tmp.close()
        size = os.path.getsize(tmp.name)

        if tg.should_use_pyrogram(size):
            uploaded = tg.upload_via_pyrogram(creds, tmp.name, f.filename, mime_type)
        else:
            uploaded = tg.upload_via_bot_api(creds, tmp.name, f.filename, mime_type)

        row = {
            "file_id": uploaded.file_id,
            "file_type": uploaded.file_type,
            "file_name": uploaded.file_name,
            "file_size": uploaded.file_size or size,
            "mime_type": uploaded.mime_type,
            "title": title,
            "album": album,
            "thumbnail_id": uploaded.thumbnail_id,
            "width": uploaded.width,
            "height": uploaded.height,
            "duration": uploaded.duration,
        }
        ins = sb.table("photos").insert(row).execute()
        return jsonify({"ok": True, "photo": (ins.data or [row])[0]})
    except Exception as exc:
        log.exception("upload failed")
        return jsonify({"ok": False, "error": str(exc)}), 500
    finally:
        try:
            os.remove(tmp.name)
        except OSError:
            pass


# ---------------------------------------------------------------------------
# Photo metadata endpoints
# ---------------------------------------------------------------------------


def _photos_query(sb: Client):
    return sb.table("photos").select("*")


@app.get("/api/photos")
@require_supabase
def list_photos(sb: Client):
    album = request.args.get("album")
    favorites = request.args.get("favorites") == "1"
    trash = request.args.get("trash") == "1"
    limit = min(int(request.args.get("limit", "200")), 500)
    offset = int(request.args.get("offset", "0"))

    q = _photos_query(sb)
    q = q.eq("is_deleted", trash)
    if favorites:
        q = q.eq("is_favorite", True)
    if album and album != "All Photos":
        q = q.eq("album", album)
    q = q.order("uploaded_at", desc=True).range(offset, offset + limit - 1)

    res = q.execute()
    return jsonify({"photos": res.data or []})


@app.get("/api/photos/search")
@require_supabase
def search_photos(sb: Client):
    query = (request.args.get("q") or "").strip()
    if not query:
        return jsonify({"photos": []})
    res = (
        sb.table("photos")
        .select("*")
        .eq("is_deleted", False)
        .or_(
            f"title.ilike.%{query}%,"
            f"album.ilike.%{query}%,"
            f"file_name.ilike.%{query}%"
        )
        .order("uploaded_at", desc=True)
        .limit(200)
        .execute()
    )
    return jsonify({"photos": res.data or []})


@app.put("/api/photos/<int:photo_id>/favorite")
@require_supabase
def toggle_favorite(sb: Client, photo_id: int):
    body = request.get_json(silent=True) or {}
    is_fav = bool(body.get("is_favorite", True))
    res = (
        sb.table("photos")
        .update({"is_favorite": is_fav})
        .eq("id", photo_id)
        .execute()
    )
    return jsonify({"photo": (res.data or [None])[0]})


@app.put("/api/photos/<int:photo_id>/album")
@require_supabase
def change_album(sb: Client, photo_id: int):
    body = request.get_json(silent=True) or {}
    album = (body.get("album") or "All Photos").strip() or "All Photos"
    res = sb.table("photos").update({"album": album}).eq("id", photo_id).execute()
    return jsonify({"photo": (res.data or [None])[0]})


@app.delete("/api/photos/<int:photo_id>")
@require_supabase
def soft_delete(sb: Client, photo_id: int):
    res = (
        sb.table("photos").update({"is_deleted": True}).eq("id", photo_id).execute()
    )
    return jsonify({"photo": (res.data or [None])[0]})


@app.delete("/api/photos/<int:photo_id>/permanent")
@require_supabase
def hard_delete(sb: Client, photo_id: int):
    sb.table("photos").delete().eq("id", photo_id).execute()
    return jsonify({"ok": True})


@app.post("/api/photos/<int:photo_id>/restore")
@require_supabase
def restore(sb: Client, photo_id: int):
    res = (
        sb.table("photos")
        .update({"is_deleted": False})
        .eq("id", photo_id)
        .execute()
    )
    return jsonify({"photo": (res.data or [None])[0]})


# ---------------------------------------------------------------------------
# Albums
# ---------------------------------------------------------------------------


@app.get("/api/albums")
@require_supabase
def list_albums(sb: Client):
    res = sb.table("albums").select("*").order("name").execute()
    counts_res = (
        sb.table("photos")
        .select("album", count="exact")
        .eq("is_deleted", False)
        .execute()
    )
    counts: dict[str, int] = {}
    for row in counts_res.data or []:
        counts[row["album"]] = counts.get(row["album"], 0) + 1
    albums = []
    for a in res.data or []:
        albums.append({**a, "count": counts.get(a["name"], 0)})
    return jsonify({"albums": albums})


@app.post("/api/albums")
@require_supabase
def create_album(sb: Client):
    body = request.get_json(silent=True) or {}
    name = (body.get("name") or "").strip()
    if not name:
        return jsonify({"error": "album name required"}), 400
    try:
        res = sb.table("albums").insert({"name": name}).execute()
        return jsonify({"album": (res.data or [None])[0]})
    except Exception as exc:
        return jsonify({"error": str(exc)}), 400


# ---------------------------------------------------------------------------
# Telegram file streaming
# ---------------------------------------------------------------------------


@app.get("/api/file/<file_id>")
@require_tg
def stream_file(creds: tg.TgCreds, file_id: str):
    try:
        gen = tg.stream_file(creds, file_id)
        if gen is None:
            return jsonify({"error": "file not found or too large for bot api"}), 404
        return Response(
            stream_with_context(gen),
            mimetype="application/octet-stream",
            headers={"Cache-Control": "public, max-age=3600"},
        )
    except Exception as exc:
        log.exception("stream failed")
        return jsonify({"error": str(exc)}), 500


@app.get("/api/thumbnail/<file_id>")
@require_tg
def stream_thumbnail(creds: tg.TgCreds, file_id: str):
    gen = tg.bot_stream_file(creds, file_id)
    if gen is None:
        return jsonify({"error": "thumbnail unavailable"}), 404
    return Response(
        stream_with_context(gen),
        mimetype="image/jpeg",
        headers={"Cache-Control": "public, max-age=86400"},
    )


# ---------------------------------------------------------------------------
# Error handlers
# ---------------------------------------------------------------------------


@app.errorhandler(413)
def too_large(_):
    return (
        jsonify(
            {
                "error": "file too large",
                "max_mb": config.MAX_UPLOAD_MB,
            }
        ),
        413,
    )


@app.errorhandler(Exception)
def unhandled(exc):
    log.error("unhandled: %s\n%s", exc, traceback.format_exc())
    return jsonify({"error": str(exc)}), 500


if __name__ == "__main__":
    app.run(host=config.HOST, port=config.PORT, debug=False, threaded=True)
