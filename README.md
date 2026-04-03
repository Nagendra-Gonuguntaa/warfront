# ⚔️ WARFRONT — Live Conflict Intelligence Dashboard

> **Real-time war intelligence. AI-powered analysis. Zero cost.**

🌐 **Live Site:** [nagendra-gonuguntaa.github.io/warfront](https://nagendra-gonuguntaa.github.io/warfront)  
🔧 **Backend API:** [war-front.onrender.com](https://war-front.onrender.com/api/health)  
📦 **Total Cost:** $0.00/month

---

## 🧭 What Is WARFRONT?

WARFRONT is a real-time conflict intelligence dashboard that aggregates live war news, combat footage, AI-generated situation reports, global terrorism data, live flight tracking over conflict zones, and war-sensitive market data — all in one place.

Built as a full-stack solo project in under a week, it demonstrates cloud-native architecture, LLM integration, real-time data pipelines, and zero-cost deployment at scale.

---

## ✨ Features

| Feature | Description |
|---|---|
| 📰 **Live News Feed** | 20+ articles refreshed every 5 minutes from NewsAPI + Reddit |
| 📺 **Combat Video Wall** | Live posts from r/CombatFootage with thumbnails and upvotes |
| 🗺️ **Global Conflict Map** | Interactive Leaflet.js map with GDELT event markers |
| 🤖 **AI Briefing Bot** | Chat with an AI analyst powered by Groq (llama-3.3-70b) |
| 📋 **AI Daily Sitrep** | Auto-generated hourly situation report from live headlines |
| ✅ **AI Fact Checker** | Cross-references claims against live news sources |
| 📅 **Event Timeline** | Chronological conflict timeline built from live articles |
| 💹 **War Economy** | Live defense stocks, commodities, and war currencies via Yahoo Finance |
| 🌍 **GTI Rankings** | Global Terrorism Index 2024 — top 25 countries with map overlay |
| ✈️ **Live Flight Tracker** | Real aircraft over Ukraine, Middle East, Sudan & Sahel via OpenSky |

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────┐
│            FRONTEND (GitHub Pages)               │
│         Single HTML file — index.html            │
│   Leaflet.js · Vanilla JS · IBM Plex Mono UI     │
└──────────────────┬──────────────────────────────┘
                   │ HTTPS API calls
┌──────────────────▼──────────────────────────────┐
│           BACKEND (Render Free Tier)             │
│              Node.js + Express                   │
│         In-memory cache · CORS open              │
└───┬──────────┬──────────┬──────────┬────────────┘
    │          │          │          │
┌───▼───┐ ┌───▼───┐ ┌────▼────┐ ┌───▼──────────┐
│ News  │ │Reddit │ │  Groq   │ │ Yahoo Finance│
│  API  │ │  API  │ │  LLM    │ │ OpenSky Net  │
└───────┘ └───────┘ └─────────┘ └──────────────┘
```

---

## 🛠️ Tech Stack

### Frontend
- **Pure HTML/CSS/JavaScript** — no frameworks, no build tools
- **Leaflet.js** — interactive conflict and GTI maps
- **IBM Plex Mono + Bebas Neue** — military terminal aesthetic
- **CSS Variables** — full dark theme with accent system

### Backend
- **Node.js + Express** — REST API server
- **node-cron** — auto-refreshes Reddit + News cache every 10 minutes
- **axios** — HTTP client for all external APIs
- **cors** — open CORS for GitHub Pages → Render cross-origin

### AI / LLM
- **Groq API** (llama-3.3-70b-versatile) — free tier
  - AI Daily Sitrep — hourly situation report from live headlines
  - AI Briefing Bot — multi-turn conflict analyst chat
  - AI Fact Checker — claim verification against live news
  - War Economy Brief — market impact analysis from conflict news

### Data Sources

| Source | Data | Cost |
|---|---|---|
| [NewsAPI](https://newsapi.org) | 20 live conflict articles | Free (100 req/day) |
| [Reddit JSON API](https://reddit.com) | r/CombatFootage, r/ukraine, r/worldnews | Free |
| [GDELT Project](https://gdeltproject.org) | Global conflict event coordinates | Free, no key |
| [OpenSky Network](https://opensky-network.org) | Live flight positions | Free, no key |
| [Yahoo Finance API](https://finance.yahoo.com) | Defense stocks, commodities, currencies | Free, no key |
| [Institute for Economics & Peace](https://visionofhumanity.org) | GTI 2024 rankings | Public data |

### Hosting
- **GitHub Pages** — frontend (free, CDN-backed)
- **Render Free Tier** — backend (free, spins down after 15min inactivity)

---

## 📁 Project Structure

```
warfront/
├── index.html                    ← Full frontend (single file)
├── README.md
├── .gitignore
└── warfront-backend/
    ├── server.js                 ← Express app entry point
    ├── package.json
    ├── .env                      ← API keys (never committed)
    ├── routes/
    │   ├── news.js               ← GET /api/news
    │   ├── reddit.js             ← GET /api/videos, /api/videos/news
    │   ├── ai.js                 ← GET /api/ai/summary, POST /api/ai/chat, /api/ai/factcheck
    │   ├── map.js                ← GET /api/map (GDELT + fallback zones)
    │   ├── economy.js            ← GET /api/economy, /api/economy/ai-brief
    │   ├── gti.js                ← GET /api/gti
    │   └── flights.js            ← GET /api/flights (OpenSky Network)
    ├── services/
    │   ├── newsService.js        ← NewsAPI + Reddit news fetching
    │   └── redditService.js      ← Reddit video + news fetching
    └── utils/
        └── cache.js              ← In-memory TTL cache
```

---

## 🔌 API Endpoints

```
GET  /api/health              → Server status + cache stats
GET  /api/news                → Combined NewsAPI + Reddit news feed
GET  /api/videos              → r/CombatFootage video posts
GET  /api/videos/news         → r/geopolitics + r/ukraine + r/worldnews
GET  /api/map                 → GDELT conflict events (18 static fallback zones)
GET  /api/ai/summary          → AI-generated hourly sitrep (cached 1hr)
POST /api/ai/chat             → { message, history[] } → { reply }
POST /api/ai/factcheck        → { claim } → { verdict, confidence, reasoning }
GET  /api/economy             → Live defense stocks + commodities + currencies
GET  /api/economy/ai-brief    → AI market impact analysis (cached 1hr)
GET  /api/gti                 → GTI 2024 rankings + map coordinates
GET  /api/flights             → Live flights over conflict zones (cached 60s)
```

---

## ⚙️ Environment Variables

Create a `.env` file in `warfront-backend/`:

```env
NEWS_API_KEY=your_newsapi_key
GROQ_API_KEY=your_groq_key
FRONTEND_URL=https://your-username.github.io/warfront
PORT=3001
```

**Get your free keys:**
- NewsAPI → [newsapi.org/register](https://newsapi.org/register) (free, 100 req/day)
- Groq → [console.groq.com](https://console.groq.com) (free, no card)

---

## 🚀 Running Locally

```bash
# Clone the repo
git clone https://github.com/Nagendra-Gonuguntaa/warfront.git
cd warfront

# Install backend dependencies
cd warfront-backend
npm install

# Add your API keys
cp .env.example .env
# Edit .env with your keys

# Start the backend
node server.js

# Open index.html in your browser
# Or serve it locally:
cd ..
python3 -m http.server 8080
# Visit http://localhost:8080
```

---

## 📊 War Economy — Tracked Assets

### 🛡️ Defense Stocks
`LMT` Lockheed Martin · `RTX` Raytheon · `NOC` Northrop Grumman · `GD` General Dynamics · `BA` Boeing Defense

### 🛢️ Commodities
`BZ=F` Brent Crude · `NG=F` Natural Gas · `GC=F` Gold · `ZW=F` Wheat · `CL=F` WTI Crude

### 💱 War Currencies
`USD/RUB` Russian Ruble · `USD/UAH` Ukrainian Hryvnia · `USD/ILS` Israeli Shekel · `USD/CHF` Swiss Franc

---

## ✈️ Live Flight Zones

Flights are tracked in real-time over four active conflict regions:

| Zone | Coverage |
|---|---|
| 🇺🇦 Ukraine | 44°N–53°N, 22°E–41°E |
| 🌍 Middle East | 12°N–38°N, 28°E–62°E |
| 🇸🇩 Sudan | 8°N–23°N, 21°E–39°E |
| 🌍 Sahel | 10°N–25°N, 8°W–16°E |

---

## 🌍 Global Terrorism Index

WARFRONT embeds the full **GTI 2024** dataset from the Institute for Economics & Peace, covering the top 25 most terrorism-affected countries with:
- Terrorism impact scores (0–10)
- Year-over-year trend (improving / worsening)
- Terrorism-related deaths
- Interactive map with color-coded severity markers

---

## ⚠️ Disclaimers

- Flight and market data is for **informational purposes only**
- Market data is **not financial advice**
- News is aggregated from third-party sources — WARFRONT does not endorse any content
- Render free tier sleeps after 15 minutes of inactivity — first load may take 30–60 seconds

---

## 👤 Author

**Durga Nagendra Prasad Gonugunta**  
MSc Artificial Intelligence — National College of Ireland  
[LinkedIn](https://linkedin.com/in/nagendra-gonugunta) · [GitHub](https://github.com/Nagendra-Gonuguntaa)

---

## 📄 License

MIT License — free to use, fork, and build on.

---

*Built with curiosity, caffeine, and zero budget. Information is the first step toward understanding. Understanding is the first step toward peace.*
