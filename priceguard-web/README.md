# PriceGuard (Web Version)

The same automated e-commerce price tracker as the CLI project, wrapped in a
real web app: a **FastAPI backend** (reusing the exact same `Product` /
`Scraper` / `DataManager` / `AlertManager` classes) and a **React (Vite +
Tailwind) frontend** dashboard.

```
priceguard-web/
├── backend/          FastAPI REST API — the "brain" (same core logic as the CLI bot)
└── frontend/          React dashboard — the "face" (talks to the backend over HTTP)
```

You run **both** at the same time, in two separate terminals.

---

## 1. Run the backend

```bash
cd backend
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt

cp .env.example .env
# edit .env with your real Gmail app password (see the CLI project's README
# for how to generate one) — this is what lets the API send price-drop emails

uvicorn app.main:app --reload --port 8000
```

Leave this running. API docs (auto-generated, interactive) are at
**http://localhost:8000/docs** — useful for testing endpoints directly.

## 2. Run the frontend (in a second terminal)

```bash
cd frontend
npm install
npm run dev
```

Open **http://localhost:5173** — that's the dashboard.

---

## What you get

| Page | What it does |
|---|---|
| **Dashboard** | Live stat cards, price-history chart, website distribution, recent alerts — all pulled from the real API |
| **Products** | Add/search/delete tracked products, manually trigger a price check on one item, see live status badges |
| **Analytics** | Aggregate stats (avg/lowest/highest price, average drop %), top discounts, site distribution |
| **Alerts** | Full history of every alert attempt (sent or failed) |
| **Settings** | Start/stop the background monitoring bot, change the check interval, all without touching the terminal |

The **monitoring bot** (the old CLI's `while True: ... time.sleep()` loop) now
runs as a background thread inside the FastAPI process, controllable from the
Settings page — start it, stop it, force an immediate check, or change how
often it runs, all from the browser.

---

## How the two halves talk to each other

The frontend never touches Python or CSV files directly — it only calls the
backend's REST API (see `frontend/src/api/client.js` for the full list of
endpoints, or the interactive docs at `/docs`). This is a real client/server
split: you could swap the React frontend for a mobile app, or swap the
FastAPI backend for a different language, without touching the other side.

```
Browser (React)  --HTTP-->  FastAPI (Python)  --file I/O-->  CSV files on disk
                                    |
                                    +--> Scraper (requests + BeautifulSoup)
                                    +--> AlertManager (SMTP email + matplotlib graph)
```

---

## Notes

- **CORS**: the backend's `.env` has `CORS_ORIGINS` set to allow the Vite dev
  server (`localhost:5173`) by default. If you deploy the frontend elsewhere,
  add its URL there too.
- **Data storage**: still plain CSV files (`backend/data/products.csv`,
  `backend/data/alerts.csv`, `backend/data/history/`), same as the CLI
  version — no database needed for a project this size.
- **Secrets**: exactly like the CLI version, nothing is hardcoded. Email
  credentials live in `backend/.env`, which is git-ignored.
- All the scraper reliability fixes (retries, `lxml` parsing, shortened-link
  detection, network-vs-parsing error messages) from the CLI project are
  already included here — the backend's `app/core/` is a direct copy of the
  CLI project's `src/`.
