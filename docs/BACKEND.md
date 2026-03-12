# STATIQ Backend — Run Locally & Deploy

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

## Deploy to Vercel

1. Go to [Vercel](https://vercel.com), sign in, and **Import** your GitHub repo.
2. Use the same branch you push to (e.g. `main` or `phase-3`).
3. In **Project Settings → Environment Variables**, add all variables above (`SUPABASE_URL`, `SUPABASE_ANON_KEY`, `OPENAI_API_KEY`, `RAPIDAPI_KEY`).
4. Deploy. The backend is served as a serverless function; `vercel.json` rewrites requests to `/api/index.js`.

After deploy, your API is available at `https://<your-project>.vercel.app/api/...`.

## API & data sources

See [docs/SOURCES.md](SOURCES.md) for API references and latest docs links.
