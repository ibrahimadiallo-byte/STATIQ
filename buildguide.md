buildguide.md
🛠️ STATIQ Backend: Engineering & Implementation Guide
This document serves as the technical master plan for the STATIQ backend. It outlines the architecture, database schema, and step-by-step implementation phases required to deliver the MVP by **March 18, 2026** (Demo Day), per the [PRD](prd.md).

**MVP scope (from PRD):** Player search → player profile (aggregated key stats in one view) → AI-generated plain language insight report → player vs player comparison with AI-generated context. Focus sport: Football/Soccer.

---

🏗️ 1. Architecture Overview
STATIQ utilizes a Serverless-Hybrid Architecture:
Framework: Node.js with Express (Deployed on Vercel as a Serverless Function).
Database: Supabase (PostgreSQL) for persistence and search.
Source Control: GitHub Desktop (Syncing to a Private Repo).
AI: OpenAI GPT-4o-mini for narrative generation.
Hosting: Vercel (Auto-deploys on every git push).

**Data sources (per PRD §6):** The PRD calls for aggregating from multiple sources (FBref, Transfermarkt, Understat, RapidAPI, Kaggle, StatsBomb, FIFA World Cup data). For the MVP build we implement **RapidAPI (API-Football)** for player identity and base stats, and **Understat** for xG/xA and advanced metrics. The schema and ingestion pattern support adding more sources (e.g. FBref, Transfermarkt) in a later phase.

---

🗄️ 2. Database Schema (The MVP Contract)
Run this SQL in your Supabase SQL Editor.
-- Core Players Table
create table players (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  rapid_api_id integer unique,   -- Link to API-Football
  understat_id text unique,      -- Link to Understat
  team_name text,
  position text,
  photo_url text,
  created_at timestamptz default now()
);

-- Performance Metrics
create table player_stats (
  id uuid primary key default gen_random_uuid(),
  player_id uuid references players(id) on delete cascade,
  season text,
  goals integer default 0,
  assists integer default 0,
  xg numeric(5,2),
  xa numeric(5,2),
  minutes_played integer,
  updated_at timestamptz default now()
);

-- AI Narrative Storage
create table insight_reports (
  id uuid primary key default gen_random_uuid(),
  player_id uuid references players(id) on delete cascade,
  summary_text text,
  generated_at timestamptz default now()
);


🚀 3. Implementation Phases
Sprint 1: Environment & Project Setup
Focus: Getting the code ready for Vercel and GitHub Desktop.
Local Init:
Open Cursor Terminal (Ctrl + ~) and run:
npm init -y
npm install express @supabase/supabase-js dotenv axios cors openai


Vercel Configuration:
Create a vercel.json in the root to ensure Express works as a serverless function:
```json
{
  "version": 2,
  "rewrites": [{ "source": "/(.*)", "destination": "/api/index.js" }]
}
```
The serverless entrypoint is `api/index.js`, which exports the Express app from `server/app.js`.


Environment Setup: Create `.env` locally. Important: Add `.env` to your `.gitignore` file before committing in GitHub Desktop.

**Branches:** Use a separate branch per phase (`phase-1`, `phase-2`, etc.); merge to main after tests pass. See `docs/SOURCES.md` for API/source references and latest docs links.
Sprint 2: The Ingestion Services
Focus: Fetching data from RapidAPI and Understat (per PRD: aggregated key stats from multiple data sources).
Player Search & Ingest:
File: server/playerService.js (or server/services/playerService.js)
Using @supabase/supabase-js and axios: implement `searchOrIngestPlayer`. Check Supabase first; if missing, fetch from RapidAPI `/players` (API-Football), save to DB, return the data.
Advanced Stats (Understat):
File: server/understatService.js (or server/services/understatService.js)
Update the `player_stats` table with xG and xA (and related metrics) from Understat. Map via `players.understat_id` to our `player_id` so the same player is linked across sources.
Sprint 3: AI Insights & Comparison
Focus: Interpretation and side-by-side logic (per PRD: plain language insights and comparison with AI-generated context).
AI Scout:
File: server/services/aiService.js (or equivalent)
Create a service using OpenAI that takes a player's JSON stats and generates a 2-sentence scouting summary (plain language, current form and performance). Cache it in `insight_reports`.
Comparison (per PRD: "side by side comparison with AI-generated context"):
Endpoint: GET /api/compare?p1=uuid&p2=uuid
Fetch stats for two player IDs, return a comparison object with calculated differences (deltas) **and** an AI-generated short narrative that explains what the comparison means in plain language (e.g. who is ahead in form, key differences). Not just raw deltas — include context for everyday fans.
Sprint 4: Deployment & Documentation
Focus: Going live on Vercel.
GitHub Desktop Sync:
Stage all changes, commit as "Initial Backend Setup," and push to your GitHub repo.
Vercel Connect:
Go to Vercel.com, import your GitHub repo.
Crucial: Add all your .env variables into the Vercel Project Settings (Environment Variables) so the live app can access Supabase and OpenAI.
⚠️ 4. Key Risks & Mitigations
| Risk | Mitigation Strategy |
|------|---------------------|
| Vercel Timeouts | Keep AI prompts short so the serverless function doesn't time out (default 10s). |
| API Rate Limits | Implement a "Check DB First" logic to avoid unnecessary RapidAPI calls. |
| Identity Matching | Use the rapid_api_id (and understat_id) for lookup so the same player is linked across sources. |
| Data Staleness | Add an updated_at check; if data is > 24h old, refresh from source. |

✅ 5. Definition of Done
*Technical (backend):*
- [ ] Database tables are active on Supabase.
- [ ] Backend is deployed and accessible via a .vercel.app URL.
- [ ] /api/players/search (or equivalent) returns a **unified profile** with aggregated base and advanced stats (per PRD: one clean view from multiple data sources).
- [ ] AI insights (plain language summary) are generated, stored in `insight_reports`, and retrievable.
- [ ] Comparison endpoint returns deltas **and** AI-generated context (per PRD: comparison with context, not just raw data).

*Product (per PRD §8 Demo Day metrics):*
- [ ] Product is live, functional, and demoed end-to-end without critical failures.
- [ ] At least one real user (outside the team) tests the product and confirms insight reports are useful and understandable.
