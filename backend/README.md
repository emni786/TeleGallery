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
python app.py
```

The server listens on `http://localhost:8000`.

## Deploy to Railway

1. Push the repo to GitHub.
2. Create a new Railway project from your repo.
3. Set the root directory to `backend/`.
4. Railway will pick up `Procfile` and `requirements.txt` automatically.
5. No env vars need to be set — the backend is stateless.

The public URL Railway gives you is what you'll paste into the **Backend URL**
field on the TeleGallery onboarding screen.
