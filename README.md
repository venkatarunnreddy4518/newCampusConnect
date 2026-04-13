# CampusConnect

CampusConnect now runs on a local SQL-backed backend.

## Stack

- Frontend: React + Vite
- Backend: Node.js HTTP server
- Database: SQLite via `node:sqlite`
- File storage: local `uploads/` directory

## Getting Started

```bash
npm install
npm run dev
```

This starts:

- Vite on `http://localhost:8080`
- The backend/API on `http://localhost:3001`

Optional (Python/Flask example API):

```bash
cd backend_flask
python -m venv .venv
.venv\\Scripts\\Activate.ps1
pip install -r requirements.txt
python run.py
```

Then visit `http://127.0.0.1:5000/health`.

## Production Build

```bash
npm run build
npm run start
```

The backend will serve the built frontend from `dist/`.

## Local Data

- Database file: `.local/campusconnect.sqlite`
- SQL schema/init file: `database/init.sql`
- Uploaded files: `uploads/`

The first account you create is automatically granted the `admin` role so you can access the dashboard immediately.

## What Changed

- Supabase auth was replaced with local email/password auth and cookie sessions.
- Supabase tables were recreated in SQLite.
- Supabase storage buckets were replaced with local upload folders.
- Supabase realtime subscriptions were replaced with lightweight polling in the client.

## Notes

- OAuth is not configured in this local SQL version.
- Seed event and club data is created automatically when the database is empty.
