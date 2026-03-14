# PRD MVP checklist — is the app fully functional?

Use this before Demo Day to confirm the app meets the PRD (§5 MVP scope, §8 Demo Day metrics).

## 1. Automated test

From project root (with `.env` containing at least `SUPABASE_URL`, `SUPABASE_ANON_KEY`):

```bash
npm run test:prd
```

**Pass means:** Backend is live, search returns valid structure, profile/compare endpoints and World Cup routes behave correctly. If RapidAPI key is valid and has quota, profile and compare tests run with real data; otherwise they are skipped and the test still passes.

## 2. PRD §5 — MVP scope (manual in browser)

| Requirement | How to check |
|-------------|----------------|
| **Player search** by name | Open app → Search tab → type e.g. "Mbappe" or "Ronaldo". You should see a list of candidates (or a clear message if API/key is limited). |
| **Player profile** — aggregated key stats, one clean view | From search, click a player. Profile should show: name, team, position, key stats (goals, assists, minutes, xG, xA), season, optional "Other sources" if `external_stats` exist, and **AI insight report** (plain language). |
| **AI insight report** | On the same profile page, section "Insight report" must show an AI-generated summary (or "No AI insight generated yet" if generation failed). |
| **Player vs player comparison** with AI context | Compare tab → select two players (search for each). After both are chosen, view should show side-by-side stats and an **AI-generated narrative** comparing them. |
| **World Cup 2026** (Schedule) | Schedule tab (bottom nav) → should show "FIFA World Cup 2026" with tabs: Fixtures, Standings, Teams. Data loads from API or shows an error if the plan doesn’t include World Cup. |

## 3. PRD §8 — Demo Day metrics

- **Product is live, functional, demoed end-to-end without critical failures**  
  Run `npm run test:prd` and the manual checks above. Fix any 502s (e.g. run `npm run dev:all` so both API and frontend are up).

- **Audience can articulate the problem**  
  Presentation clarity, not a code check.

- **At least one real user tests and confirms insight reports are useful**  
  Process: get someone outside the team to try search → profile → compare and give feedback.

## 4. Quick local run

```bash
npm run dev:all
```

Then open the URL shown (e.g. `http://localhost:5173`). Ensure:

- No 502 on search (API server must be running).
- Profile and Compare load when you select players.
- Schedule shows World Cup section (or a clear error).

## 5. If something fails

- **502 on /api/players/search** → API not running. Use `npm run dev:all` or run `npm run server` in a separate terminal.
- **Empty search / "endpoint disabled"** → RapidAPI subscription doesn’t include Players (or World Cup). Use a key/plan that includes the required endpoints, or accept empty/error state for demo.
- **No AI insight on profile** → Check `OPENAI_API_KEY` in `.env`; insight is generated on first profile load when possible.
- **World Cup "Failed to load"** → Same RapidAPI key/plan; World Cup endpoints may be disabled on free tier.
