# STATIQ — Architecture

STATIQ uses a **Serverless-Hybrid Architecture**.

| Layer | Technology |
|-------|------------|
| **Framework** | Node.js with Express (deployed on Vercel as a Serverless Function) |
| **Database** | Supabase (PostgreSQL) for persistence and search |
| **Source Control** | GitHub (syncing to the repo) |
| **AI** | OpenAI GPT-4o-mini for narrative generation |
| **Hosting** | Vercel (auto-deploys on every git push) |

**MVP data sources (per PRD):** RapidAPI (API-Football) for player identity and base stats; Understat for xG/xA and advanced metrics. Additional sources (e.g. FBref, Transfermarkt) can be added in a later phase.
