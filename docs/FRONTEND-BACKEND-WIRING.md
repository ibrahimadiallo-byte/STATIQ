# Frontend ↔ Backend wiring

## How it’s connected

| Layer | What it does |
|-------|----------------|
| **Frontend** | Calls `searchPlayers()`, `getPlayerProfile()`, `getCompare()` from `src/app/lib/api.ts`. All requests go to relative paths: `/api/players/search`, `/api/players/:id`, `/api/compare`. |
| **API client** | `src/app/lib/api.ts` uses `fetch(API_BASE + url)`. Default `API_BASE` is `""`, so URLs are same-origin. |
| **Dev (Vite)** | `vite.config.ts` proxies `/api` → `http://localhost:3000`. So the app on e.g. 5178 talks to the backend on 3000. |
| **Production (Vercel)** | One deployment: static files from `dist`, `/api/*` handled by the serverless function. Same origin, no proxy needed. |

## Running locally

1. **Backend:** `npm run server` → API on **http://localhost:3000**
2. **Frontend:** `npm run dev` → app on **http://localhost:5173** (or next free port)
3. Use the URL Vite prints; it will proxy `/api` to the backend.

Both must be running for search, profile, and compare to work.

## Optional: different API host

To point the frontend at another backend (e.g. a deployed API):

1. In project root create or edit `.env` and add:
   ```bash
   VITE_API_BASE=https://your-backend.vercel.app
   ```
2. Restart the dev server (`npm run dev`). Frontend will call `https://your-backend.vercel.app/api/...` instead of relative `/api/...`.

Leave `VITE_API_BASE` unset when using the same-origin setup (local proxy or single Vercel deploy).

## Endpoints the frontend uses

- `GET /api/players/search?q=...` — search (autocomplete)
- `GET /api/players/:id` — player profile
- `GET /api/compare?p1=uuid&p2=uuid` — compare two players
