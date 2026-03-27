# TeleGallery Backend

Stateless Flask API — all credentials come from request headers.

## Deploy on Render

1. Push this `backend/` folder to a GitHub repo
2. Go to [render.com](https://render.com) → New → Web Service
3. Connect your repo, set root directory to `backend`
4. Render will auto-detect `render.yaml`
5. Click **Deploy** → copy the URL (e.g. `https://telegallery-backend.onrender.com`)
6. Paste that URL in TeleGallery frontend → Onboarding → Backend URL

## Local Development

```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
python app.py
```

Server runs at `http://localhost:5000`
