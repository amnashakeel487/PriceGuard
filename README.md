# 🛡️ PriceGuard — Automated E-Commerce Price Tracker & Alert System

<div align="center">

![Python](https://img.shields.io/badge/Python-3.13-3776AB?style=for-the-badge&logo=python&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-0.111-009688?style=for-the-badge&logo=fastapi&logoColor=white)
![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-v4-38BDF8?style=for-the-badge&logo=tailwindcss&logoColor=white)
![Deployed on Railway](https://img.shields.io/badge/Backend-Railway-0B0D0E?style=for-the-badge&logo=railway&logoColor=white)
![Deployed on Vercel](https://img.shields.io/badge/Frontend-Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white)

**PriceGuard watches e-commerce products 24/7 and emails you the instant the price drops below your target — so you never overpay again.**

[Live Demo](https://price-guard-drab.vercel.app) · [Backend API Docs](https://priceguard-production-2f0b.up.railway.app/docs)

</div>

---

## 📸 Overview

PriceGuard is a full-stack, production-deployed web application that automates the tedious task of manually checking product prices. Users register, add any product URL with a target price, and PriceGuard's background monitoring engine handles everything else — scraping prices on a schedule, detecting drops, and sending personalised email alerts.

---

<img width="1917" height="972" alt="image" src="https://github.com/user-attachments/assets/ecf40036-3ac9-4380-82b3-d693d9c37ba1" />
<img width="1918" height="947" alt="image" src="https://github.com/user-attachments/assets/83faa046-3b07-45ec-889a-35493c23834e" />
<img width="1918" height="967" alt="image" src="https://github.com/user-attachments/assets/bc632571-493c-4b90-bac7-d7708790db01" />

# Email sent successfully

<img width="261" height="538" alt="image" src="https://github.com/user-attachments/assets/beadb06f-2d80-44fc-a0eb-31339a61313d" />



## ✨ Features

| Feature | Description |
|---|---|
| 🔐 **Auth with Email Verification** | Register → receive OTP via email → verify → login with HTTP-only session cookies |
| 🕷️ **Automated Price Scraping** | BeautifulSoup scrapes product prices from Amazon and other e-commerce sites |
| ⏰ **Background Monitoring Bot** | A Python threading loop checks all tracked products on a configurable schedule |
| 📧 **Personalised Email Alerts** | Price-drop alerts sent directly to the user's registered email via Brevo API |
| 📊 **Analytics Dashboard** | Price history charts, website distribution, top discounts, money saved stats |
| 🔔 **Notification System** | Bell icon with unread count, per-alert mark-as-read, session-aware new alerts |
| 🌗 **Dark / Light Theme** | Persistent theme preference with full design-system token support |
| 👤 **Per-user Data Isolation** | Each user only sees their own products, alerts, and statistics |
| 🔑 **Password Management** | Secure password change from the Settings page |

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────┐
│                   React 19 Frontend                  │
│          (Vercel — price-guard-drab.vercel.app)      │
│                                                      │
│  Landing → Register → Verify → Login → Dashboard    │
│  Products │ Analytics │ Alerts │ Settings            │
└──────────────────────┬──────────────────────────────┘
                       │  HTTPS + SameSite=None cookies
                       │  (cross-origin authenticated)
┌──────────────────────▼──────────────────────────────┐
│              Python / FastAPI Backend                │
│        (Railway — .up.railway.app)                  │
│                                                      │
│  /api/auth    → Registration, OTP, Login, Session   │
│  /api/products→ Add, list, delete, check now        │
│  /api/monitor → Start/stop/configure the bot        │
│  /api/alerts  → Alert log, mark read, unread count  │
│  /api/stats   → Per-user dashboard statistics       │
└──────────────────────┬──────────────────────────────┘
                       │
        ┌──────────────┴──────────────┐
        │                             │
┌───────▼────────┐          ┌────────▼────────┐
│  File Storage  │          │  Brevo API      │
│  users.json    │          │  (Email alerts) │
│  products.csv  │          └─────────────────┘
│  alerts.csv    │
│  history/*.csv │
└────────────────┘
```

---

## 🐍 Python Backend — Deep Dive

The backend is built entirely in **Python 3.13** using modern async-ready patterns. It powers all business logic, data persistence, web scraping, and email delivery.

### Core Python Modules

```
priceguard-web/backend/
├── app/
│   ├── main.py                  # FastAPI app, CORS middleware, router registration
│   ├── deps.py                  # Singleton service instances (dependency injection)
│   ├── monitor.py               # Background threading loop — the "bot"
│   ├── alert_log.py             # CSV-based alert event persistence
│   ├── schemas.py               # Pydantic v2 request/response models
│   │
│   ├── core/
│   │   ├── user_manager.py      # Auth logic: registration, OTP, login, password hashing
│   │   ├── data_manager.py      # CSV I/O for products and price history
│   │   ├── product.py           # Product dataclass with serialisation
│   │   ├── scraper.py           # BeautifulSoup HTML scraper
│   │   ├── alert_manager.py     # Brevo API email sender + Matplotlib graph generator
│   │   └── exceptions.py        # Custom exception hierarchy
│   │
│   └── routers/
│       ├── auth.py              # POST /register, /verify, /login, /logout, /me
│       ├── products.py          # CRUD + per-user scoping
│       ├── monitor.py           # Bot start/stop/interval/check-now
│       ├── alerts.py            # Alert log with read/unread management
│       └── stats.py             # Aggregated per-user statistics
│
├── requirements.txt
├── railway.toml                 # Railway deployment config
└── nixpacks.toml                # Nix build config for Railway
```

### Key Python Design Patterns

**1. Service Layer with Singleton Instances**
```python
# deps.py — created once at startup, shared across all requests
data_manager  = DataManager(products_file="data/products.csv")
scraper       = Scraper()
alert_manager = AlertManager()
alert_log     = AlertLogManager(path="data/alerts.csv")
monitor_service = MonitorService(data_manager, scraper, alert_manager, alert_log)
user_manager  = UserManager(users_file="data/users.json")
```

**2. Background Monitoring Thread**
```python
# monitor.py — runs independently of the HTTP server
class MonitorService:
    def start(self):
        self._thread = threading.Thread(target=self._loop, daemon=True)
        self._thread.start()

    def _loop(self):
        while not self._stop_event.is_set():
            self.check_all_once()          # scrape + alert
            time.sleep(self.interval_seconds)
```

**3. Secure Password Hashing**
```python
# user_manager.py — SHA-256 with per-user salt
@staticmethod
def _hash_password(salt: str, password: str) -> str:
    return hashlib.sha256((salt + password).encode()).hexdigest()
```

**4. Cross-Origin Cookie Authentication**
```python
# auth.py — SameSite=None required for Vercel ↔ Railway
response.set_cookie(
    key="pg_user", value=email,
    httponly=True, secure=True, samesite="none",
    max_age=60 * 60 * 24 * 30
)
```

**5. Email via Brevo REST API (no SMTP)**
```python
# alert_manager.py — HTTPS API call, works on all hosting platforms
req = urllib.request.Request(
    "https://api.brevo.com/v3/smtp/email",
    data=json.dumps(payload).encode(),
    headers={"api-key": self.brevo_api_key, "content-type": "application/json"},
    method="POST",
)
```

---

## ⚛️ React Frontend

Built with **React 19** and **Vite**, using a design system of CSS custom properties that supports full dark/light mode theming.

```
priceguard-web/frontend/src/
├── api/client.js          # Centralised fetch wrapper with credentials: "include"
├── context/AuthContext.jsx# Global auth state — user, login, logout
├── pages/
│   ├── LandingPage.jsx    # Marketing page with animated product card
│   ├── LoginPage.jsx      # Auth flow
│   ├── RegisterPage.jsx
│   ├── VerifyPage.jsx     # OTP verification
│   ├── Dashboard.jsx      # Stats + charts overview
│   ├── Products.jsx       # Product table with pagination
│   ├── Analytics.jsx      # Deep-dive charts
│   ├── Alerts.jsx         # Timeline alert log
│   └── Settings.jsx       # Bot control, profile, email, appearance
└── components/
    ├── Sidebar.jsx
    ├── Topbar.jsx         # Bell dropdown with mark-as-read
    ├── GlassCard.jsx
    ├── AuthLayout.jsx
    └── AddProductModal.jsx
```

---

## 🛠️ Full Tech Stack

### Backend
| Technology | Version | Purpose |
|---|---|---|
| **Python** | 3.13 | Core language |
| **FastAPI** | 0.111 | REST API framework |
| **Uvicorn** | 0.29 | ASGI server |
| **Pydantic v2** | 2.7 | Request/response validation |
| **BeautifulSoup4** | 4.12 | HTML scraping |
| **Matplotlib** | 3.8 | Price history graphs in alert emails |
| **python-dotenv** | 1.0 | Environment variable management |
| **Brevo API** | v3 | Transactional email delivery |

### Frontend
| Technology | Version | Purpose |
|---|---|---|
| **React** | 19 | UI framework |
| **Vite** | 8 | Build tool & dev server |
| **Tailwind CSS** | v4 | Utility-first styling |
| **Framer Motion** | 12 | Animations & transitions |
| **Recharts** | 3 | Data visualisation |
| **React Router** | v7 | Client-side routing |
| **Lucide React** | 1.27 | Icon system |

### Infrastructure
| Service | Purpose |
|---|---|
| **Railway** | Python backend hosting (always-on) |
| **Vercel** | React frontend hosting (CDN) |
| **Brevo** | Transactional email API |
| **GitHub** | Source control & CI/CD trigger |

---

## 🚀 Running Locally

### Prerequisites
- Python 3.11+
- Node.js 18+

### Backend
```bash
cd priceguard-web/backend
python -m venv venv
venv\Scripts\activate          # Windows
pip install -r requirements.txt
cp .env.example .env           # fill in EMAIL_SENDER, BREVO_API_KEY
uvicorn app.main:app --reload --port 8000
```

API docs available at: `http://localhost:8000/docs`

### Frontend
```bash
cd priceguard-web/frontend
npm install
npm run dev
```

App available at: `http://localhost:5173`

### Environment Variables

| Variable | Description |
|---|---|
| `EMAIL_SENDER` | Verified sender email in Brevo |
| `BREVO_API_KEY` | Brevo API key (`xkeysib-...`) |
| `CORS_ORIGINS` | Comma-separated allowed frontend origins |
| `CHECK_INTERVAL_SECONDS` | How often the bot checks prices (default: 3600) |

---

## 📡 API Reference

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/auth/register` | Register with email + password |
| `POST` | `/api/auth/verify` | Verify OTP, sets session cookie |
| `POST` | `/api/auth/login` | Login, sets session cookie |
| `GET` | `/api/auth/me` | Get current session user |
| `POST` | `/api/auth/logout` | Clear session cookie |
| `GET` | `/api/products` | List user's tracked products |
| `POST` | `/api/products` | Add a new product to track |
| `DELETE` | `/api/products` | Remove a tracked product |
| `POST` | `/api/products/check` | Force-check a product's price now |
| `GET` | `/api/monitor/status` | Get bot status and last cycle log |
| `POST` | `/api/monitor/start` | Start the background monitoring bot |
| `POST` | `/api/monitor/stop` | Stop the monitoring bot |
| `GET` | `/api/alerts` | List user's alert events |
| `GET` | `/api/alerts/unread-count` | Count of unread alerts |
| `PATCH` | `/api/alerts/{id}/read` | Mark one alert as read |
| `GET` | `/api/stats` | Dashboard statistics |
| `GET` | `/api/health` | Health check |

---

## 👩‍💻 Author

**Amna Shakeel**
🐍 Python Developer · 🌐 Full Stack Web Developer · 🤖 Automation Engineer

[![GitHub](https://img.shields.io/badge/GitHub-amnashakeel487-181717?style=flat&logo=github)](https://github.com/amnashakeel487)
[![Email](https://img.shields.io/badge/Email-amnashakeel606@gmail.com-D14836?style=flat&logo=gmail&logoColor=white)](mailto:amnashakeel606@gmail.com)

---

## 📄 License

This project is for educational purposes.
