# STATIQ Backend — Run Locally & Deploy

## Backend Phase 1: APIs & env (do this first)

**You must do these in your own accounts (Supabase, RapidAPI, OpenAI). The repo cannot access them.**

1. **Supabase — apply schema (one-time)**  
   In [Supabase](https://supabase.com) → your project → **SQL Editor**, run the contents of **`supabase/schema.sql`** in this repo (creates `players`, `player_stats`, `insight_reports`). Then in Project Settings → API copy **Project URL** and **anon public** key into `.env` as `SUPABASE_URL` and `SUPABASE_ANON_KEY`.

2. **RapidAPI** — Subscribe to [API-Football](https://rapidapi.com/apifootball/api/apifootball3), copy key to `.env` as `RAPIDAPI_KEY`.

3. **OpenAI** — Create an [API key](https://platform.openai.com/api-keys), add to `.env` as `OPENAI_API_KEY`.

4. **Local test** — From project root: `npm run server`, then `curl http://localhost:3000/api/health` → expect `{"ok":true}`. With all keys set, try search: `curl "http://localhost:3000/api/players/search?q=mbappe"`.

---

## Run locally

From the project root:

```bash
npm run server
```

The API listens on **http://localhost:3000** (or `PORT` if set). Endpoints:

- `GET /api/health` — health check
- `GET /api/players/search?q=...` — search; returns `{ candidates: [...] }` (stable ID; pick one then `GET /api/players/:id`)
- `GET /api/players/by-rapid-id/:rapidId` — lookup by RapidAPI player id
- `GET /api/players/:id` — player profile (player + stats + insight)
- `GET /api/players/rapid/:rapidId/stats?season=...` — cached player stats by RapidAPI id
- `GET /api/compare?p1=uuid&p2=uuid` — comparison with deltas + AI narrative
- `PATCH /api/players/:id` — update e.g. `understat_id` (body: `{ "understat_id": "..." }`)
- `GET /api/fixtures/live` — live fixtures (cached ~45s)
- `GET /api/fixtures/today?date=YYYY-MM-DD` — fixtures for a day (cached)
- `GET /api/teams/:teamId` — team by RapidAPI team id (cached)
- `GET /api/standings?league=...&season=...` — league standings (cached)

## Required environment variables

Set these in `.env` (local) or in Vercel Project Settings (deploy):

| Variable | Purpose |
|----------|---------|
| `SUPABASE_URL` | Supabase project URL |
| `SUPABASE_ANON_KEY` | Supabase anonymous key |
| `OPENAI_API_KEY` | OpenAI API key (for AI insights and comparison narrative) |
| `RAPIDAPI_KEY` | RapidAPI key (for API-Football player search/ingest) |

If `SUPABASE_URL` or `SUPABASE_ANON_KEY` are missing, the API returns **503** with a clear error. Same for AI routes when `OPENAI_API_KEY` is missing.

## When to deploy to Vercel

**Deploy only when all APIs are ready.** Use this checklist before connecting the repo to Vercel:

- [ ] **Supabase** — Project created, schema applied (`players`, `player_stats`, `insight_reports`). You have `SUPABASE_URL` and `SUPABASE_ANON_KEY` from project settings.
- [ ] **RapidAPI** — Subscribed to API-Football (or equivalent). You have `RAPIDAPI_KEY` and search/ingest works (e.g. locally with `npm run server` + search).
- [ ] **OpenAI** — API key created. You have `OPENAI_API_KEY` and AI insight/generation works locally.
- [ ] **Local test** — `npm run server` runs without env errors; at least `GET /api/health` returns `{"ok":true}` and, if keys are set, search returns a unified profile.

Once all are ready, add the same env vars in Vercel and deploy.

## Deploy to Vercel

1. Go to [Vercel](https://vercel.com), sign in, and **Import** your GitHub repo.
2. Use the same branch you push to (e.g. `main` or `phase-3`).
3. In **Project Settings → Environment Variables**, add all variables above (`SUPABASE_URL`, `SUPABASE_ANON_KEY`, `OPENAI_API_KEY`, `RAPIDAPI_KEY`).
4. Deploy. The backend is served as a serverless function; `vercel.json` rewrites requests to `/api/index.js`.

After deploy, your API is available at `https://<your-project>.vercel.app/api/...`.

### Search returns no players on Vercel?

1. **Environment variables** — In Vercel → your project → **Settings → Environment Variables**, add (same as `.env`):
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`
   - `RAPIDAPI_KEY`
   - `OPENAI_API_KEY`
   Redeploy after adding or changing variables (Deployments → … → Redeploy).

2. **Try by surname** — The API often matches by surname. Try **"Ronaldo"** (Cristiano), **"Mbappe"**, **"Salah"**, **"Messi"**. The backend also tries a fallback for "cristiano" → "Ronaldo" etc.

3. **Check API** — `GET https://YOUR_APP.vercel.app/api/health` should return `{"ok":true}`. Then try `GET https://YOUR_APP.vercel.app/api/players/search?q=Ronaldo`; if you get 503, env vars are missing or invalid.

4. **League fallback** — If the profiles search returns nothing (e.g. full names or names the API doesn’t match), the backend tries the API with league + season across major leagues (Premier League, La Liga, Serie A, Bundesliga, Ligue 1), using the search term (and for multi-word queries, surname then first name). This improves results for any player in those leagues, not just specific names.

## Backend Phase 2: Deploy readiness

When you deploy (see “Deploy to Vercel” above), run the smoke test:

```bash
DEPLOY_URL=https://YOUR_APP.vercel.app node tests/smoke-deploy.js
```

Expect: health 200 and `{ ok: true }`; search 200 (with profile) or 503 (if env vars not set on Vercel).

## Phase 4: Deploy & verify (smoke test)

After your first deploy, you can also run these manually against your `.vercel.app` URL (replace `YOUR_APP`):

```bash
# 1. Health
curl -s https://YOUR_APP.vercel.app/api/health
# Expect: {"ok":true}

# 2. Search (requires env vars; may return 503 if keys missing)
curl -s "https://YOUR_APP.vercel.app/api/players/search?q=mbappe"
# Expect: JSON with player, stats, insight (or 503 with error message)

# 3. Optional: compare (needs two player UUIDs from your DB)
# curl -s "https://YOUR_APP.vercel.app/api/compare?p1=UUID1&p2=UUID2"
```

**Definition of Done (build guide):** Mark backend DoD when: DB is on Supabase, backend is live at a `.vercel.app` URL, `/api/players/search` returns a unified profile, AI insights are stored/retrieved, and compare returns deltas + narrative.

## API & data sources

See [docs/SOURCES.md](SOURCES.md) for API references and latest docs links.

---

## Live Data + Stable ID Plan (RapidAPI)

This is the minimal plan to guarantee near‑real‑time data and consistent player/team identity.

### 1) Stable ID mapping (must‑have)

**Goal:** remove name‑only lookups and ensure deterministic identity.

**Add endpoints**

- `GET /api/players/by-rapid-id/:rapidId` — exact lookup by `rapid_api_id`.
- `GET /api/players/search?q=...` — return **all** candidates (not just first) with `rapid_api_id`, team, league, position.

**DB fields (players)**

- `rapid_api_id` (already used)
- `photo_url` (already used)
- optional: `team_rapid_id`, `league_rapid_id` for clean joins

**Logic change**

- Do not rely on `.ilike('name', ...)` as the primary lookup.
- Use `rapid_api_id` once known.
- If multiple matches, return list and let frontend choose.

### 2) Live data ingestion (near‑real‑time)

**Goal:** keep stats and fixtures fresh.

**Add backend endpoints (RapidAPI pass‑through, cached)**

- `GET /api/fixtures/live`
- `GET /api/fixtures/today`
- `GET /api/teams/:teamId`
- `GET /api/standings?league=...&season=...`
- `GET /api/players/:rapidId/stats?season=...`

**Refresh strategy**

- On‑demand + short cache TTL (recommended first)
- Optional cron refresh every 5–15 minutes for live fixtures and tracked players

### 3) Caching / rate‑limit protection

**Goal:** avoid RapidAPI throttling while keeping data fresh.

Suggested cache keys:

- `fixtures:live`
- `fixtures:today`
- `player:stats:${rapidId}:${season}`

Suggested TTLs:

- Live fixtures: 30–60 seconds
- Player stats: 5–10 minutes
- Standings: 1–6 hours

### 4) Response shape for frontend (images + freshness)

Include these fields in player/team responses where possible:

```json
{
  "player": {
    "id": "uuid",
    "rapid_api_id": 276,
    "name": "Kylian Mbappe",
    "team_name": "Real Madrid",
    "photo_url": "https://media.api-sports.io/football/players/276.png"
  },
  "team": {
    "rapid_api_id": 541,
    "name": "Real Madrid",
    "logo_url": "https://media.api-sports.io/football/teams/541.png"
  },
  "league": {
    "rapid_api_id": 140,
    "name": "La Liga",
    "logo_url": "https://media.api-sports.io/football/leagues/140.png"
  },
  "last_updated": "2026-03-11T18:12:00Z"
}
```

### 5) Minimal tasks checklist

1. ✅ Add `/api/players/by-rapid-id/:rapidId` endpoint.
2. ✅ Update search to return multiple candidates (`GET /api/players/search?q=...` → `{ candidates: [...] }`).
3. ✅ Add `GET /api/fixtures/live` and `GET /api/fixtures/today` (cached).
4. ✅ Add `GET /api/players/rapid/:rapidId/stats?season=...` (cached).
5. ✅ Add cache layer (`server/cache.js`) + TTL strategy (`server/rapidApiService.js`).

**Also implemented:** `GET /api/teams/:teamId`, `GET /api/standings?league=...&season=...`.
