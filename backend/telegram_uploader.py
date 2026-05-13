"""Telegram upload / download helpers.

Two paths:
  * Bot API (sync, via `requests`) — files up to ~50 MB.
  * Pyrogram (async) — files up to 2 GB. Started per-request, stopped after use.

Both paths are stateless; credentials are passed in by the caller.
"""

from __future__ import annotations

import asyncio
import logging
import mimetypes
import os
import tempfile
from dataclasses import dataclass
from typing import Generator, Optional

import requests

from config import BOT_API_LIMIT_BYTES, TMP_DIR

log = logging.getLogger(__name__)

BOT_API_BASE = "https://api.telegram.org"


@dataclass
class TgCreds:
    bot_token: str
    channel_id: str
    api_id: str = ""
    api_hash: str = ""

    @property
    def chat_id(self) -> int:
        return int(self.channel_id)


@dataclass
class UploadedFile:
    file_id: str
    file_unique_id: str
    file_type: str
    file_name: str
    file_size: int
    mime_type: str
    width: int = 0
    height: int = 0
    duration: int = 0
    thumbnail_id: str = ""


# ---------------------------------------------------------------------------
# Bot API path
# ---------------------------------------------------------------------------


def _bot_api(creds: TgCreds, method: str) -> str:
    return f"{BOT_API_BASE}/bot{creds.bot_token}/{method}"


def bot_get_me(creds: TgCreds) -> dict:
    r = requests.get(_bot_api(creds, "getMe"), timeout=15)
    r.raise_for_status()
    data = r.json()
    if not data.get("ok"):
        raise RuntimeError(data.get("description", "getMe failed"))
    return data["result"]


def bot_get_chat(creds: TgCreds) -> dict:
    r = requests.get(
        _bot_api(creds, "getChat"),
        params={"chat_id": creds.chat_id},
        timeout=15,
    )
    r.raise_for_status()
    data = r.json()
    if not data.get("ok"):
        raise RuntimeError(data.get("description", "getChat failed"))
    return data["result"]


def upload_via_bot_api(
    creds: TgCreds,
    file_path: str,
    file_name: str,
    mime_type: str,
) -> UploadedFile:
    """Upload using sendDocument / sendPhoto / sendVideo via Bot API."""
    is_photo = mime_type.startswith("image/") and not mime_type.endswith("gif")
    is_video = mime_type.startswith("video/")

    if is_photo:
        method, field = "sendPhoto", "photo"
    elif is_video:
        method, field = "sendVideo", "video"
    else:
        method, field = "sendDocument", "document"

    with open(file_path, "rb") as f:
        files = {field: (file_name, f, mime_type)}
        data = {"chat_id": creds.chat_id, "disable_notification": "true"}
        r = requests.post(
            _bot_api(creds, method),
            data=data,
            files=files,
            timeout=600,
        )
    r.raise_for_status()
    payload = r.json()
    if not payload.get("ok"):
        raise RuntimeError(payload.get("description", "upload failed"))
    return _parse_message_media(payload["result"], file_name, mime_type)


def _parse_message_media(
    msg: dict, file_name: str, mime_type: str
) -> UploadedFile:
    if "photo" in msg:
        photo = msg["photo"][-1]
        return UploadedFile(
            file_id=photo["file_id"],
            file_unique_id=photo["file_unique_id"],
            file_type="photo",
            file_name=file_name,
            file_size=photo.get("file_size", 0),
            mime_type=mime_type or "image/jpeg",
            width=photo.get("width", 0),
            height=photo.get("height", 0),
        )
    if "video" in msg:
        v = msg["video"]
        thumb = (v.get("thumbnail") or v.get("thumb") or {}).get("file_id", "")
        return UploadedFile(
            file_id=v["file_id"],
            file_unique_id=v["file_unique_id"],
            file_type="video",
            file_name=file_name,
            file_size=v.get("file_size", 0),
            mime_type=v.get("mime_type", mime_type or "video/mp4"),
            width=v.get("width", 0),
            height=v.get("height", 0),
            duration=v.get("duration", 0),
            thumbnail_id=thumb,
        )
    if "document" in msg:
        d = msg["document"]
        thumb = (d.get("thumbnail") or d.get("thumb") or {}).get("file_id", "")
        ftype = "video" if (d.get("mime_type") or "").startswith("video/") else "photo"
        return UploadedFile(
            file_id=d["file_id"],
            file_unique_id=d["file_unique_id"],
            file_type=ftype,
            file_name=d.get("file_name", file_name),
            file_size=d.get("file_size", 0),
            mime_type=d.get("mime_type", mime_type),
            thumbnail_id=thumb,
        )
    raise RuntimeError("Telegram message contained no media")


def bot_get_file_path(creds: TgCreds, file_id: str) -> Optional[str]:
    r = requests.get(
        _bot_api(creds, "getFile"),
        params={"file_id": file_id},
        timeout=15,
    )
    if r.status_code != 200:
        return None
    data = r.json()
    if not data.get("ok"):
        return None
    return data["result"].get("file_path")


def bot_stream_file(
    creds: TgCreds, file_id: str
) -> Optional[Generator[bytes, None, None]]:
    """Stream a Telegram file via Bot API (works for files <= 20 MB)."""
    fp = bot_get_file_path(creds, file_id)
    if not fp:
        return None
    url = f"{BOT_API_BASE}/file/bot{creds.bot_token}/{fp}"
    r = requests.get(url, stream=True, timeout=600)
    if r.status_code != 200:
        return None

    def gen() -> Generator[bytes, None, None]:
        try:
            for chunk in r.iter_content(chunk_size=64 * 1024):
                if chunk:
                    yield chunk
        finally:
            r.close()

    return gen()


# ---------------------------------------------------------------------------
# Pyrogram path (large files / >20 MB streaming)
# ---------------------------------------------------------------------------


async def _pyro_upload(
    creds: TgCreds, file_path: str, file_name: str, mime_type: str
) -> UploadedFile:
    from pyrogram import Client

    session_dir = tempfile.mkdtemp(prefix="pyro_", dir=TMP_DIR)
    client = Client(
        name="telegallery_uploader",
        api_id=int(creds.api_id),
        api_hash=creds.api_hash,
        bot_token=creds.bot_token,
        workdir=session_dir,
        in_memory=True,
    )

    is_video = mime_type.startswith("video/")
    is_photo = mime_type.startswith("image/") and not mime_type.endswith("gif")

    async with client:
        if is_video:
            msg = await client.send_video(
                chat_id=creds.chat_id,
                video=file_path,
                file_name=file_name,
                disable_notification=True,
            )
        elif is_photo:
            msg = await client.send_photo(
                chat_id=creds.chat_id,
                photo=file_path,
                disable_notification=True,
            )
        else:
            msg = await client.send_document(
                chat_id=creds.chat_id,
                document=file_path,
                file_name=file_name,
                disable_notification=True,
            )

    return _parse_pyrogram_message(msg, file_name, mime_type)


def _parse_pyrogram_message(msg, file_name: str, mime_type: str) -> UploadedFile:
    if getattr(msg, "video", None):
        v = msg.video
        thumb = ""
        if v.thumbs:
            thumb = v.thumbs[-1].file_id
        return UploadedFile(
            file_id=v.file_id,
            file_unique_id=v.file_unique_id,
            file_type="video",
            file_name=file_name,
            file_size=v.file_size or 0,
            mime_type=v.mime_type or mime_type or "video/mp4",
            width=v.width or 0,
            height=v.height or 0,
            duration=v.duration or 0,
            thumbnail_id=thumb,
        )
    if getattr(msg, "photo", None):
        p = msg.photo
        return UploadedFile(
            file_id=p.file_id,
            file_unique_id=p.file_unique_id,
            file_type="photo",
            file_name=file_name,
            file_size=p.file_size or 0,
            mime_type=mime_type or "image/jpeg",
            width=p.width or 0,
            height=p.height or 0,
        )
    if getattr(msg, "document", None):
        d = msg.document
        thumb = ""
        if d.thumbs:
            thumb = d.thumbs[-1].file_id
        ftype = "video" if (d.mime_type or "").startswith("video/") else "photo"
        return UploadedFile(
            file_id=d.file_id,
            file_unique_id=d.file_unique_id,
            file_type=ftype,
            file_name=d.file_name or file_name,
            file_size=d.file_size or 0,
            mime_type=d.mime_type or mime_type,
            thumbnail_id=thumb,
        )
    raise RuntimeError("Pyrogram message contained no media")


def upload_via_pyrogram(
    creds: TgCreds, file_path: str, file_name: str, mime_type: str
) -> UploadedFile:
    if not creds.api_id or not creds.api_hash:
        raise RuntimeError("api_id/api_hash required for large-file upload")
    return asyncio.run(_pyro_upload(creds, file_path, file_name, mime_type))


async def _pyro_stream(
    creds: TgCreds, file_id: str
) -> Generator[bytes, None, None]:
    from pyrogram import Client

    session_dir = tempfile.mkdtemp(prefix="pyrod_", dir=TMP_DIR)
    client = Client(
        name="telegallery_downloader",
        api_id=int(creds.api_id),
        api_hash=creds.api_hash,
        bot_token=creds.bot_token,
        workdir=session_dir,
        in_memory=True,
    )

    out_path = os.path.join(session_dir, "out.bin")
    async with client:
        await client.download_media(file_id, file_name=out_path)

    def gen() -> Generator[bytes, None, None]:
        try:
            with open(out_path, "rb") as f:
                while True:
                    chunk = f.read(64 * 1024)
                    if not chunk:
                        break
                    yield chunk
        finally:
            try:
                os.remove(out_path)
            except OSError:
                pass

    return gen()


def stream_file(
    creds: TgCreds, file_id: str
) -> Optional[Generator[bytes, None, None]]:
    """Try Bot API first, fall back to Pyrogram for larger files."""
    gen = bot_stream_file(creds, file_id)
    if gen is not None:
        return gen
    if not creds.api_id or not creds.api_hash:
        return None
    return asyncio.run(_pyro_stream(creds, file_id))


# ---------------------------------------------------------------------------
# Utilities
# ---------------------------------------------------------------------------


def guess_mime(file_name: str, fallback: str = "application/octet-stream") -> str:
    mt, _ = mimetypes.guess_type(file_name)
    return mt or fallback


def should_use_pyrogram(file_size: int) -> bool:
    return file_size > BOT_API_LIMIT_BYTES
