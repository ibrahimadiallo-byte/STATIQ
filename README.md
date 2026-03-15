STATIQ
Product Requirements Document
Capstone Project — Cycle 4  |  Demo Day: March 18, 2026

**Contributing:** [CONTRIBUTING.md](./CONTRIBUTING.md) (PR checklist + [Masterstrategy.md](./Masterstrategy.md) alignment).

---

1. Industry & Context
The sports industry is one of the most data-rich industries on the planet. Every match, every player, every season generates thousands of data points — goals, assists, passing accuracy, defensive actions, injury history, form ratings, you name it. And with the FIFA World Cup kicking off in June 2026, global interest in futbol is about to hit an all-time high. Billions of fans will be tuning in, looking up players, debating performances, and trying to understand what the numbers actually mean.

The problem is that all of this data lives in completely different places. You go to one site for basic stats, another for advanced metrics, another for transfer history, and another to actually read someone's opinion on what those stats mean. There is no single place where a fan, a fantasy sports player, or an amateur coach can go and just get the full picture on a player — instantly, clearly, and in plain language.

That gap is exactly what this product is built to fill.


2. Problem Statement
Right now, getting real insight into a futbol player's performance is way harder than it should be. The data exists — there is actually more of it than ever — but it is scattered across a dozen different platforms that don't talk to each other. A fan trying to answer a simple question like 'Is Mbappe actually performing well this season?' has to piece together stats from ESPN, Sofascore, FBref, Transfermarkt, and maybe a few Twitter threads just to form an opinion.

And even after doing all that work, you are still just looking at raw numbers. You still have to figure out what they mean yourself. That is not insight — that is homework.

The core problems are:
Sports data is fragmented across too many platforms with no unified view
Existing tools show raw stats but don't interpret them or explain what they mean
There is no AI-powered layer that turns numbers into plain language insights
Casual fans and amateur coaches are underserved — current tools are built for analysts, not everyday users
With the World Cup coming in June 2026, there is no go-to tool for fans who want to quickly get up to speed on players and teams


3. Proposed Solution
STATIQ is an AI-powered sports analytics platform that aggregates player data from multiple sources and translates it into clear, digestible insights — in plain language, not just numbers.

Instead of spending 30 minutes across 8 different tabs, a user can come to STATIQ, search any player, and immediately get a complete picture: their key stats pulled together in one place, an AI-generated insight report explaining what those numbers actually mean, and the ability to compare two players side by side with context — not just raw data.

Think of it this way: every other tool tells you that a player scored 12 goals. STATIQ tells you what that means — how it compares to their historical performance, whether they are in form or declining, and how they stack up against similar players in the league. That is the difference between data and intelligence.

The timing is also deliberate. With the World Cup starting in June 2026, STATIQ gives fans a tool to actually understand the players they are watching — not just see their names on a screen.


4. Target User
STATIQ is built for people who care deeply about futbol but don't have the time or technical background to dig through raw data on their own. Specifically:

Die-hard futbol fans who want to go deeper than just watching the match
Fantasy sports players who need quick, reliable player performance data to make decisions
Amateur coaches and scouts at smaller clubs who lack access to professional scouting tools
Futbol content creators who need fast, credible research for their content
World Cup viewers in 2026 who want to quickly get up to speed on players and national teams

What all of these users share is the same frustration — they know the data exists, they just can't get to it in a way that actually helps them understand the game better. STATIQ is built for them.


5. MVP Scope
In Scope — What We Are Building in 2 Weeks
Player search — search any professional football/soccer player by name
Player profile page — aggregated key stats pulled from multiple data sources in one clean view
AI insight report — an AI-generated plain language summary of the player's current form and performance
Player vs player comparison — side by side comparison of two players with AI-generated context
Focus sport: Football/Soccer — starting with one sport to go deep rather than wide

Out of Scope — V2 and Beyond
Multiple sports support (basketball, American football, etc.)
Live real-time match data and scores
Match outcome predictions
Fantasy sports league integration
User accounts, saved searches, and personalized dashboards
Mobile app (iOS/Android)
Injury history tracking and return timelines
Transfer rumor and market value aggregation
Team-level analytics (focused on players for MVP)


6. Datasets & Data Sources
One of the strongest advantages of building in the sports industry is the availability of clean, well-structured public data. The following sources will be used to power STATIQ:

Data Source
What It Provides
Access Method
FBref (Sports Reference)
Deep advanced stats: progressive passes, xG, defensive actions, per-90 metrics
Free public data / scraping
Transfermarkt
Market values, transfer history, contract info, career timeline
Free public data / scraping
Understat
Expected goals (xG), shot maps, team and player xG trends
Free API / public data
RapidAPI Sports Endpoints
Live and historical match data, player stats, league standings
REST API (free tier available)
Kaggle Football Datasets
Historical player and match data for model training and benchmarking
Free download (CSV/JSON)
StatsBomb Open Data
High-detail event-level match data for specific competitions
Free open-source GitHub repo
FIFA World Cup 2026 Data
National team rosters, group stage fixtures, player profiles
Official sources + APIs as available


Having multiple data sources is intentional — it allows us to cross-reference stats and give users a more complete picture than any single source can provide. The AI layer will synthesize these inputs into the plain language insights that sit at the core of the product.


7. Competitive Landscape
There are several tools in this space but none of them are doing what STATIQ does. Here is how they stack up:

Platform
What They Do Well
Where They Fall Short
Sofascore
Clean UI, live scores, basic player ratings
No AI insights, no data aggregation, no plain language interpretation
FBref
Deep advanced statistics for serious analysts
Extremely complex, not built for casual fans, no AI layer
ESPN
News, scores, mainstream coverage
Surface-level stats only, no depth, no personalization
FotMob
Match tracking, lineups, live updates
No player analytics depth, no comparison tools, no AI
Transfermarkt
Transfer values and career history
No performance analytics, very narrow focus
FIFA Official App
Official tournament data and news
Minimal stats, no insights, not built for analysis


The common thread across all competitors is this: they show you data, but they don't tell you what it means. STATIQ is the only tool that combines aggregated multi-source data with an AI interpretation layer that speaks to everyday fans — not just data scientists. That is our core differentiator and the reason this product has a real place in the market.


8. Success Metrics
For the MVP, success is defined by whether the product works, tells a clear story, and solves the problem it set out to solve. Here is how we will measure that:

Demo Day Metrics
The product is live, functional, and demoed end-to-end without critical failures
Audience and mentors can clearly articulate the problem being solved after the presentation
At least one real user (outside the team) tests the product before Demo Day and confirms the insight reports are useful and understandable

Product Metrics (Post-MVP)
Average time on player profile page — are users actually reading the AI insights?
Player comparison usage rate — are users engaging with the comparison feature?
Return visit rate — do users come back, especially around match days?
Search completion rate — are users finding the players they look for successfully?

World Cup Validation
If the product is live by June 2026, World Cup search volume and user engagement will serve as a real-world stress test and validation of the core use case


STATIQ — Capstone PRD  |  Cycle 4  |  March 2026

---

## Backend

To run the API locally or deploy: see **[docs/BACKEND.md](docs/BACKEND.md)** for `npm run server`, required env vars, and Vercel deploy steps.

