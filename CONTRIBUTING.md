# Contributing to STATIQ

## Before you open a PR

1. **Read [`Masterstrategy.md`](./Masterstrategy.md)** — product and UX decisions should match personas (Marcus, Sarah, David, Leo, Elena), HEART metrics, UI laws (Miller, Jakob, Tesler, Doherty), and [data-to-viz rules](./Masterstrategy.md#4-data-to-viz-implementation-rules) before merging.

2. **Run checks locally**
   - `npm run build` — frontend must build
   - `npm run test:prd` — PRD/MVP checks (if your change touches covered flows)
   - For full stack: `npm run server` + `npm run dev` and smoke-test affected screens

---

## PR checklist (copy into your PR description)

Use this for **any** user-facing, AI, or analytics change:

- [ ] **Masterstrategy** — Skimmed `Masterstrategy.md`; change fits at least one persona journey and doesn’t contradict HEART goals.
- [ ] **UX** — Familiar patterns where possible; grouped stats / skeletons / “View more” where relevant; complexity stays in backend/AI when applicable.
- [ ] **Viz** — New charts only match types in Masterstrategy (line, horizontal bars, scatter, box, treemap) unless explicitly agreed.
- [ ] **Build** — `npm run build` passes.
- [ ] **Schema** — If DB changed, `supabase/schema.sql` (or migrations) updated and noted in PR.

Optional for larger features:

- [ ] **Metrics** — HEART impact called out (e.g. Compare usage, insight thumbs, search → profile).

---

## Repo conventions

- Cursor agents follow `.cursor/rules/masterstrategy.mdc` (always align with Masterstrategy).
- Backend-only or API-only work: see `.cursor/rules/backend-only.mdc` if applicable.

Questions about scope vs strategy? Open a short note in the PR before expanding beyond MVP.
