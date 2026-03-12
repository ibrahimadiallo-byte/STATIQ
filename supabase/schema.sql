-- Core Players Table
CREATE TABLE players (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  rapid_api_id INTEGER UNIQUE,
  understat_id TEXT UNIQUE,
  team_name TEXT,
  position TEXT,
  photo_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Performance Metrics
CREATE TABLE player_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id UUID REFERENCES players(id) ON DELETE CASCADE,
  season TEXT,
  goals INTEGER DEFAULT 0,
  assists INTEGER DEFAULT 0,
  xg NUMERIC(5,2),
  xa NUMERIC(5,2),
  minutes_played INTEGER,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- External / multi-source stats payloads (PRD: aggregate from multiple data sources)
CREATE TABLE external_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id UUID REFERENCES players(id) ON DELETE CASCADE,
  source TEXT NOT NULL,         -- e.g. 'understat', 'fbref', 'transfermarkt'
  season TEXT,
  payload JSONB NOT NULL,       -- raw stats blob from the source
  created_at TIMESTAMPTZ DEFAULT now()
);

-- AI Narrative Storage
CREATE TABLE insight_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id UUID REFERENCES players(id) ON DELETE CASCADE,
  summary_text TEXT,
  generated_at TIMESTAMPTZ DEFAULT now()
);
