-- Create user_sessions table for anonymous tracking
CREATE TABLE public.user_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  anonymous_user_id TEXT NOT NULL,
  session_id TEXT NOT NULL UNIQUE,
  session_start TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  session_end TIMESTAMPTZ,
  country_code VARCHAR(2),
  country_name VARCHAR(100),
  ip_address INET,
  user_agent TEXT,
  last_activity TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create chat_messages table for logging conversations
CREATE TABLE public.chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  anonymous_user_id TEXT NOT NULL,
  session_id TEXT NOT NULL,
  role VARCHAR(10) NOT NULL,
  content TEXT NOT NULL,
  has_image BOOLEAN DEFAULT FALSE,
  mode VARCHAR(20),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create daily_analytics table for aggregated stats
CREATE TABLE public.daily_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL UNIQUE,
  total_unique_users INTEGER DEFAULT 0,
  total_messages INTEGER DEFAULT 0,
  total_sessions INTEGER DEFAULT 0,
  countries JSONB DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_sessions_user ON public.user_sessions(anonymous_user_id);
CREATE INDEX idx_sessions_active ON public.user_sessions(last_activity DESC);
CREATE INDEX idx_sessions_session_id ON public.user_sessions(session_id);
CREATE INDEX idx_messages_user ON public.chat_messages(anonymous_user_id);
CREATE INDEX idx_messages_session ON public.chat_messages(session_id);
CREATE INDEX idx_messages_created ON public.chat_messages(created_at DESC);

-- Enable Row Level Security
ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_analytics ENABLE ROW LEVEL SECURITY;

-- Allow public insert and update for sessions
CREATE POLICY "Allow public session insert"
  ON public.user_sessions
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow public session update"
  ON public.user_sessions
  FOR UPDATE
  USING (true);

-- Allow public message insert
CREATE POLICY "Allow public message insert"
  ON public.chat_messages
  FOR INSERT
  WITH CHECK (true);

-- No SELECT policies - only owner can read via Edge Function