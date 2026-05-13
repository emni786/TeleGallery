"""Backend config — stateless. No credentials live here.

Per the TeleGallery spec, all user credentials (Telegram bot token, channel id,
api id/hash, Supabase URL + anon key) are passed in on every HTTP request via
headers. The backend stores nothing.
"""

import os

PORT = int(os.environ.get("PORT", "8000"))
HOST = os.environ.get("HOST", "0.0.0.0")

MAX_UPLOAD_MB = int(os.environ.get("MAX_UPLOAD_MB", "2048"))
MAX_UPLOAD_BYTES = MAX_UPLOAD_MB * 1024 * 1024

BOT_API_LIMIT_BYTES = 50 * 1024 * 1024

TMP_DIR = os.environ.get("TMP_DIR", "/tmp/telegallery")
os.makedirs(TMP_DIR, exist_ok=True)
