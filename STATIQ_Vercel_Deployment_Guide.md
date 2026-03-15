# STATIQ – Vercel Deployment & Environment Variables Guide

Use this guide when deploying STATIQ to Vercel so everything stays in sync. You can copy this into a new Google Doc: **File → New → Document**, then paste the sections below.

---

## 1. Required (app won’t start without these)

| Variable | Description |
|----------|-------------|
| **SUPABASE_URL** | Your Supabase project URL (e.g. `https://xxxx.supabase.co`) |
| **SUPABASE_ANON_KEY** | Supabase anon/public key (or use **SUPABASE_SERVICE_ROLE_KEY** if you need service-role access) |

The server validates these on cold start; if they’re missing you get a 503 and the error message from env validation.

---

## 2. Required for AI (insights + compare narrative)

| Variable | Description |
|----------|-------------|
| **OPENAI_API_KEY** | OpenAI API key **or** |
| **GROQ_API_KEY** | Groq API key (code uses Groq if set, else OpenAI) |

At least one of these must be set or AI insight and compare narrative won’t work.

---

## 3. Optional but recommended for full behavior

| Variable | Description |
|----------|-------------|
| **API_SPORTS_KEY** | api-sports.io key – used for search when DB has no match, player photos, profile data |
| **API_SPORTS_URL** | Optional; default `https://v3.football.api-sports.io` |
| **BSD_API_TOKEN** | BSD Sports API token – sync, 8,900+ players |
| **BSD_API_URL** | Optional; default `https://sports.bzzoiro.com/api` |
| **FOOTBALL_DATA_API_KEY** | Football-Data.org key – fixtures (e.g. Premier League, World Cup) |
| **RAPIDAPI_KEY** | RapidAPI key – used for fixtures / World Cup if that path is used |
| **RAPIDAPI_HOST** | Optional; default `api-football-v1.p.rapidapi.com` |
| **UNDERSTAT_API_BASE** | Optional; base URL for an Understat proxy (xG/xA) |
| **WORLD_CUP_LEAGUE_ID** | Optional; default `1` |
| **WORLD_CUP_SEASON** | Optional; default `2026` |

---

## 4. Frontend (Vite) – optional

| Variable | Description |
|----------|-------------|
| **VITE_API_BASE** | Leave **empty** on Vercel so the app uses same-origin; vercel.json rewrites /api/* to the serverless function. Only set if you host the API on a different domain. |

---

## 5. Steps on Vercel

1. **Project** – Import the repo and connect it to Vercel (same repo you use locally).
2. **Build & output** – Build Command: **npm run build** (already in vercel.json). Output Directory: **dist** (already in vercel.json). No need to change these unless you use a different build.
3. **Environment variables** – In **Project Settings → Environment Variables**, add every variable from sections 1–3 (and 4 if you use a custom API base). Apply to **Production** (and Preview if you want preview deploys to use the same backend). Do **not** commit .env or real keys to the repo.
4. **Vercel rewrites** – vercel.json already has `/api/(.*)` → `/api/index` (serverless API) and `/(.*)` → `/index.html` (SPA). No extra config needed unless you add new routes.
5. **After first deploy** – Open the deployed URL and test: Home, Search, a player profile, Compare, Watch tab. If search returns no players, add or check **API_SPORTS_KEY** (and optionally run seed/sync if you use BSD). If insights don’t generate, add **OPENAI_API_KEY** or **GROQ_API_KEY**.
6. **Optional: seed demo stats** – If your DB has players but no stats, call **POST https://<your-vercel-url>/api/seed-demo-stats** once (e.g. with curl or Postman) so key players have stats and insights look right.

---

## 6. Quick reference – minimum for “everything synced”

- **SUPABASE_URL**
- **SUPABASE_ANON_KEY** (or **SUPABASE_SERVICE_ROLE_KEY**)
- **OPENAI_API_KEY** or **GROQ_API_KEY**
- **API_SPORTS_KEY** (recommended for search + photos)
- **FOOTBALL_DATA_API_KEY** (if you use fixtures)
- **BSD_API_TOKEN** (if you use sync / BSD players)

Leave **VITE_API_BASE** unset on Vercel so the frontend and API stay in sync via the same origin and rewrites. No code changes are required for this.

---

*STATIQ – AI-Powered Sports Analytics*
