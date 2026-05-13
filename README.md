# TeleGallery

> Your personal Google-Photos-style cloud, powered by your own Telegram channel.
> Unlimited storage, original quality, multi-device sync, web + Android APK,
> all credentials live in the app's UI — never in `.env` files.

This repo holds the full MVP described in the **TeleGallery v4.0** spec:

```
backend/    Stateless Flask + Pyrogram API (deployable to Railway)
frontend/   React + Vite SPA (Google Photos UI, deployable to Vercel)
            + Capacitor config for Android APK
```

## Architecture in 30 seconds

```
                       ┌──────────────┐
                       │  Browser /   │   (credentials in localStorage,
                       │  Capacitor   │    AES-256 backup in Supabase)
                       └──────┬───────┘
                              │ HTTPS + X-* headers
                              ▼
                       ┌──────────────┐
                       │  Flask /     │   (stateless — no DB, no env secrets)
                       │  Pyrogram    │
                       └──┬───────┬───┘
                          │       │
              ┌───────────▼─┐   ┌─▼───────────────┐
              │ Telegram    │   │ Supabase        │
              │ Channel     │   │ (photos+albums+ │
              │ (files)     │   │  credentials)   │
              └─────────────┘   └─────────────────┘
```

Every user runs against **their own** Telegram bot + channel + Supabase project.
The backend deployment is shared, but stores no per-user data — every request
carries the user's credentials in headers (`X-Bot-Token`, `X-Channel-Id`,
`X-Supabase-Url`, …). A new device only needs the user's Supabase URL + anon
key to restore everything else from the encrypted `credentials` table.

## Quick start (dev)

### 1. Backend

```bash
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
python app.py
# -> http://localhost:8000
```

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
# -> http://localhost:5173 (Onboarding wizard appears on first launch)
```

### 3. Supabase

In the Onboarding wizard, Step 2 ships the full SQL blueprint. Paste it into
**Supabase → SQL Editor → New Query → RUN**.

### 4. Telegram

In Step 3 the wizard walks you through creating a bot via `@BotFather`, a
private channel, and an API ID/Hash from <https://my.telegram.org>.

### 5. Enter credentials

Step 4 of the wizard validates everything via `POST /api/setup/test` and saves
encrypted backups to Supabase.

## Deploy

| Surface       | Where      | Notes                                              |
|---------------|------------|----------------------------------------------------|
| **Backend**   | Railway    | Root dir `backend/`. Procfile + requirements.txt detected automatically. No env vars needed. |
| **Frontend**  | Vercel     | Root dir `frontend/`. Framework: Vite. Build: `npm run build`. Output: `dist`. |
| **Android**   | Capacitor  | `cd frontend && npm run cap:android` opens Android Studio. Build APK from there. |

## Spec compliance

The repo follows the [TeleGallery v4.0 spec](https://github.com/emni786/telegallery)
section-by-section:

- **§1 Multi-User Design** — backend is stateless; credentials live per-user in
  `localStorage` + encrypted Supabase `credentials` table.
- **§2 System Architecture** — 4 layers (Storage / DB / Backend / Frontend).
- **§3 Onboarding Flow** — 4-step wizard in <ref_file file="frontend/src/pages/Onboarding.jsx" />.
- **§4 Settings Page** — see <ref_file file="frontend/src/pages/Settings.jsx" />.
- **§5–6 Schema / SQL Blueprint** — verbatim in <ref_file file="frontend/src/lib/sql.js" />.
- **§7 Google Photos UI** — color tokens, masonry grid, hover state in
  <ref_file file="frontend/src/index.css" />.
- **§9 Backend Endpoints** — full set in <ref_file file="backend/app.py" />.
- **§10 Upload Flow** — Bot API ≤ 50 MB / Pyrogram > 50 MB switching in
  <ref_file file="backend/telegram_uploader.py" />.
- **§11 Capacitor APK** — config in <ref_file file="frontend/capacitor.config.json" />,
  native bridge bootstrap in <ref_file file="frontend/src/App.jsx" />.

## License

MIT
