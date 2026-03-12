# STATIQ — Data Sources & API References

This document lists the APIs and data sources used by the backend, with official links so you can verify **accurate, latest** endpoints and data.

---

## 1. API-Football (RapidAPI)

| Item | Value |
|------|--------|
| **Purpose** | Player identity, base profile, team, position |
| **Base URL** | `https://api-football-v1.p.rapidapi.com/v3` |
| **Host header** | `api-football-v1.p.rapidapi.com` |
| **Key** | `X-RapidAPI-Key` (env: `RAPIDAPI_KEY`) |
| **Endpoint used** | `GET /players/profiles?search={name}` (min 3 chars) |
| **Official docs** | [API-Football v3](https://www.api-football.com/documentation_v3) · [RapidAPI Playground](https://rapidapi.com/apifootball/api/apifootball3) |

**Check for updates:** API-Football may add new endpoints; confirm [documentation_v3](https://www.api-football.com/documentation_v3) and RapidAPI subscription for rate limits and changes.

---

## 2. Understat

| Item | Value |
|------|--------|
| **Purpose** | xG, xA, goals, assists, minutes (advanced metrics) |
| **Source** | No official API; we parse player page data |
| **URL pattern** | `https://understat.com/player/{understat_id}` |
| **Data** | Embedded in page (e.g. `playersData` JSON); seasons, xG, xA, goals, assists, time |

**Check for updates:** Understat can change page structure; if parsing fails, inspect [understat.com](https://understat.com) and update the regex in `server/understatService.js` (`playersData` or equivalent).

---

## 3. OpenAI

| Item | Value |
|------|--------|
| **Purpose** | Plain-language insight summary and comparison narrative |
| **Model** | `gpt-4o-mini` |
| **Key** | Env: `OPENAI_API_KEY` |
| **Docs** | [OpenAI API](https://platform.openai.com/docs) · [Models](https://platform.openai.com/docs/models) |

**Check for updates:** New models and deprecations are announced in [OpenAI docs](https://platform.openai.com/docs); switch model in `server/aiService.js` if needed.

---

## 4. Supabase (PostgreSQL)

| Item | Value |
|------|--------|
| **Purpose** | Persistence, search, RLS |
| **Env** | `SUPABASE_URL`, `SUPABASE_ANON_KEY` |
| **Docs** | [Supabase Docs](https://supabase.com/docs) |

---

## Branching

Each phase is developed on its own branch:

- `phase-1` — Staleness refresh, local server, build guide
- `phase-2` — Robustness, env validation, timeouts
- `phase-3` — Deployment readiness, docs
- `phase-4` — Deploy and verify (operational)

Merge to `main` (or your default) after each phase when tests pass and you’ve committed and pushed.
