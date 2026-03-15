Masterstrategy.md

> **Process:** Before adding features, UI, AI prompts, or analytics, align with this doc. Cursor uses `.cursor/rules/masterstrategy.mdc` so agents read this strategy first.

STATIQ: AI-Powered Sports Analytics Master Strategy
This document serves as the strategic foundation for the STATIQ MVP. it bridges the gap between complex sports data and human-centric insights using established product and design frameworks.
1. Detailed User Journeys (End-to-End)
These journeys highlight the specific "Friction Points" where users usually give up and how STATIQ creates a "Value Moment."
A. The Tactical Enthusiast: Marcus
The Scenario: It’s halftime during a high-stakes match. A rival fan on social media claims Marcus’s favorite midfielder is "ghosting" (doing nothing) because they have zero goals or assists.
The Friction Point: Marcus wants to defend the player but opening traditional data sites on his phone is a nightmare. He has to zoom in on tiny tables, find "Progressive Passes," and try to remember how that compares to the league average. He spends 5 minutes digging, loses the momentum of the conversation, and feels unheard.
The STATIQ Experience: Marcus opens STATIQ and types the player's name. The AI Storyteller immediately displays a bold header: "Dominating the middle: This player is currently leading the match in 'Line-Breaking Passes' and 'Ball Recoveries'."
The Impact: Marcus clicks the "Debate Card" button, which generates a branded graphic with a lightning-strike background showing these stats. He posts it to the thread instantly. He feels like a pro analyst and wins the argument.
B. The High-Stakes Fantasy Manager: Sarah
The Scenario: Friday night, 15 minutes before the "Transfer Deadline." Sarah needs to replace an injured striker. She’s narrowed it down to two players with similar recent scores.
The Friction Point: She looks at her fantasy app, but it only shows "Points." She has no idea if Player A is just getting lucky or if Player B is due for a massive game. She feels the stress of making a "blind guess" that could ruin her weekend rank.
The STATIQ Experience: She uses the 1v1 Comparison Tool. STATIQ pulls data from the backend APIs. The Sustainability Meter shows Player A is "Overperforming" (lucky), while Player B has a massive "Expected Goals" (xG) tally but hasn't scored yet.
The Impact: The AI tells her: "Player B is mathematically due for a goal based on his high-quality chances." Sarah makes the transfer with total confidence.
C. The Amateur Coach: David
The Scenario: David’s local youth team is facing a rival powerhouse tomorrow. He knows their winger is fast, but he doesn't know how to stop him.
The Friction Point: David looks for professional scouting reports, but they are paywalled. He tries to find match footage on YouTube, but it’s just a 2-minute highlight reel. He feels he’s letting his kids down by not having a tactical plan.
The STATIQ Experience: He searches the opponent on STATIQ. The AI analyzes the player's heat maps and action zones, generating a "Behavioral Scout Report."
The Impact: The report reads: "This player always cuts to his right after three touches. Force him to the sideline early." David prints this "Cheat Sheet" for his defenders. They shut the star player down.
D. The Viral Content Creator: Leo
The Scenario: A 19-year-old debutant scores a 30-yard screamer in a major match. Leo’s phone is buzzing; he needs to drop a "Who is he?" video ASAP.
The Friction Point: Leo has to hunt for the kid’s club history, market value jumps, and tactical style. If he takes 2 hours, he misses the "Viral Window."
The STATIQ Experience: Leo uses the Narrative Generator. He types the name and clicks "TikTok Script Mode."
The Impact: STATIQ gives him: 1. The Shock Stat. 2. The Tactical Secret. 3. The Comparison. Leo records the video in 10 minutes. He is the first to post high-quality analysis.
E. The World Cup Casual: Elena
The Scenario: Elena is at a watch party. The game is 0-0 at the 70th minute. Her friends are yelling about "Low Blocks" and "Transition Play."
The Friction Point: Elena feels like she’s watching a movie in a foreign language. She gets bored and starts scrolling through social media, feeling totally disconnected.
The STATIQ Experience: She opens STATIQ. The Match Story doesn't show numbers; it shows a "Drama Update" in plain English.
The Impact: The AI says: "It looks slow, but Guinea is actually 'suffocating' the favorite. They are waiting for one tired mistake to win." Suddenly, the 0-0 has a plot. Elena puts her phone down and watches with excitement.
2. HEART Framework (MVP Metrics)
Focused on validating the AI-powered insight value proposition.
Category
Goal
MVP Metric
Happiness
Users feel like "Experts"
AI Insight Rating: Simple 👍/👎 on AI summaries.
Engagement
Users explore the soccer "Story"
Comparison Ratio: % of users using 1v1 Compare per session.
Adoption
Quick value for new users
Time to First Insight: Seconds from search to AI summary.
Retention
Habitual use
Match-Day Return Rate: Return % during live game windows.
Task Success
Speed and accuracy
Search Completion Rate: % of searches leading to a profile.

3. Laws of UI/UX Application
Miller’s Law: Group stats into 5-7 clear categories (Attacking, Defending, Sustainability). Hide deep jargon behind a "View More" toggle.
Jakob’s Law: Use a familiar sports layout (Search center-top, Player header top-left) similar to ESPN or Transfermarkt.
Tesler’s Law: Move the "math complexity" to the AI backend. The user only handles the "simplicity" of the narrative.
Doherty Threshold: Use "Skeleton Loaders" (shimmering boxes) while AI generates content to ensure the app feels instant.
Aesthetic-Usability Effect: Use the Azure/Lightning "Static Shock" theme to make the app look "Premium," which increases user trust in the data.
4. Data-to-Viz Implementation Rules
Evolution (Line Charts): Used for Market Value and Form Trends. Emphasizes the trend over time.
Ranking (Sorted Horizontal Bars): Used for leaderboards. Always sorted descending so the top performer is immediately visible.
Correlation (Scatter Plots): Used to show relationships, such as "Work Rate (Distance) vs. Output (Goals)."
Distribution (Boxplots): Used in the Coaching view to show Consistency. Small boxes = Reliable; Large boxes = Wild Card.
Composition (Treemaps): Used for Pitch Involvement. More effective than Pie Charts for showing field "ownership."