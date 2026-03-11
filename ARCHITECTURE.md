# STATIQ — Architecture

STATIQ uses a **Serverless-Hybrid Architecture**.

| Layer | Technology |
|-------|------------|
| **Framework** | Node.js with Express (deployed on Vercel as a Serverless Function) |
| **Database** | Supabase (PostgreSQL) for persistence and search |
| **Source Control** | GitHub (syncing to the repo) |
| **AI** | OpenAI GPT-4o-mini for narrative generation |
| **Hosting** | Vercel (auto-deploys on every git push) |
