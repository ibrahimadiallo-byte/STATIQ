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
- `GET /api/players/search?q=...` — search or ingest player, returns unified profile
- `GET /api/players/:id` — player profile (player + stats + insight)
- `GET /api/compare?p1=uuid&p2=uuid` — comparison with deltas + AI narrative
- `PATCH /api/players/:id` — update e.g. `understat_id` (body: `{ "understat_id": "..." }`)

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
