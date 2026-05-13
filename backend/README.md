# TeleGallery Backend

Stateless Flask + Pyrogram API that brokers uploads/downloads between the
TeleGallery frontend, the user's Telegram channel, and the user's Supabase
database.

> The backend stores **nothing** — every request carries the user's credentials
> in headers. Cache the frontend on as many devices as you like; they will all
> talk to the same backend without ever leaking another user's data.

## Endpoints

| Method | Path                              | Purpose                                |
|--------|-----------------------------------|----------------------------------------|
| GET    | `/api/health`                     | Liveness check                         |
| POST   | `/api/setup/test`                 | Validate all credentials at once       |
| POST   | `/api/upload`                     | Upload photo / video (≤ 2 GB)          |
| GET    | `/api/photos`                     | List photos (filters: album/favorites/trash) |
| GET    | `/api/photos/search?q=...`        | Search by title / album / filename     |
| PUT    | `/api/photos/<id>/favorite`       | Toggle favorite                        |
| PUT    | `/api/photos/<id>/album`          | Move to album                          |
| DELETE | `/api/photos/<id>`                | Soft delete (move to Trash)            |
| DELETE | `/api/photos/<id>/permanent`      | Hard delete from Supabase              |
| POST   | `/api/photos/<id>/restore`        | Restore from Trash                     |
| GET    | `/api/albums`                     | List albums with counts                |
| POST   | `/api/albums`                     | Create album                           |
| GET    | `/api/file/<file_id>`             | Stream a Telegram file                 |
| GET    | `/api/thumbnail/<file_id>`        | Stream a thumbnail                     |

## Required headers

Every `/api/*` request (except `/api/health`) needs the user's credentials:

```
X-Bot-Token:    <telegram bot token>
X-Channel-Id:   <-100... channel id>
X-Api-Id:       <my.telegram.org api id>     (optional, needed for >50 MB files)
X-Api-Hash:     <my.telegram.org api hash>   (optional, needed for >50 MB files)
X-Supabase-Url: https://xxxx.supabase.co
X-Supabase-Key: <supabase anon key>
```

## Local dev

```bash
cd backend
python -m venv .venv
source .venv/bin/activate           # Windows: .venv\Scripts\activate
pip install -r requirements.txt
uvicorn app:app --host 0.0.0.0 --port 8765 --reload
```

The server listens on `http://localhost:8765`.

> The REST API lives in `flask_api.py` (a Flask app). `app.py` wraps that
> Flask app in a FastAPI shell via `a2wsgi.WSGIMiddleware` so the project
> exposes a single ASGI `app:app` symbol that gunicorn / uvicorn / Fly.io
> can all import.

## Deploy

### Fly.io (recommended)

Already configured via `fly.toml` + `Dockerfile`:

```bash
cd backend
flyctl launch --no-deploy   # first time only; pick app name + region
flyctl deploy
```

Fly will give you a URL like `https://telegallery-backend.fly.dev` — paste
that into the **Backend URL** field on the TeleGallery onboarding screen.

### Railway

1. Push the repo to GitHub.
2. Create a new Railway project from your repo.
3. Set the root directory to `backend/`.
4. Railway will pick up the `Dockerfile` automatically; no env vars needed.

### Any Docker host

`Dockerfile` builds a standalone image that listens on `$PORT` (default
`8080`). Run anywhere that can host a container.
