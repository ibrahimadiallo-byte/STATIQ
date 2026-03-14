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

-- Optional: link to Transfermarkt for market value / brand equity
-- ALTER TABLE players ADD COLUMN IF NOT EXISTS transfermarkt_id TEXT;

-- Market value & brand equity (Supabase/Transfermarkt dataset)
CREATE TABLE IF NOT EXISTS player_market_value (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  source TEXT NOT NULL DEFAULT 'transfermarkt',
  value_eur NUMERIC(12,0),
  value_history JSONB,
  brand_equity JSONB,
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(player_id, source)
);
CREATE INDEX IF NOT EXISTS idx_player_market_value_player_id ON player_market_value(player_id);

-- Nielsen Fan Insights: social engagement spikes + regional fan demographics (Digital Impact / Hype)
CREATE TABLE IF NOT EXISTS nielsen_fan_insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  engagement_spikes JSONB DEFAULT '[]',
  regional_demographics JSONB DEFAULT '[]',
  hype_score NUMERIC(5,2),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(player_id)
);
CREATE INDEX IF NOT EXISTS idx_nielsen_fan_insights_player_id ON nielsen_fan_insights(player_id);
