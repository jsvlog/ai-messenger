-- ============================================================
-- AI Messenger SaaS — Supabase Migration
-- Multi-tenant Facebook Messenger AI for Rentals & Catering
-- ============================================================

-- 1. Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector WITH SCHEMA extensions;

-- 2. PROFILES TABLE (extends auth.users)
CREATE TABLE public.profiles (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email       TEXT,
  full_name   TEXT,
  avatar_url  TEXT,
  tenant_slug TEXT UNIQUE,                    -- unique subdomain/slug per tenant
  plan        TEXT DEFAULT 'free',            -- 'free' | 'starter' | 'pro'
  created_at  TIMESTAMPTZ DEFAULT now(),
  updated_at  TIMESTAMPTZ DEFAULT now()
);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url, tenant_slug)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'avatar_url',
    LOWER(REGEXP_REPLACE(COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)), '[^a-zA-Z0-9]', '-', 'g'))
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 3. CONNECTED PAGES (Facebook pages linked by each tenant)
CREATE TABLE public.connected_pages (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  page_id         TEXT NOT NULL,              -- Facebook Page ID
  page_name       TEXT NOT NULL,              -- Facebook Page Name
  page_access_token TEXT NOT NULL,            -- Long-lived page access token
  page_category   TEXT,                       -- e.g. 'Rentals', 'Catering'
  instagram_business_id TEXT,                 -- Linked IG business account (if any)
  is_active       BOOLEAN DEFAULT true,
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, page_id)
);

-- 4. PAGE SETTINGS (AI toggle, scheduling, cooldown)
CREATE TABLE public.page_settings (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  page_id         UUID NOT NULL REFERENCES public.connected_pages(id) ON DELETE CASCADE,
  ai_enabled      BOOLEAN DEFAULT true,       -- ON/OFF toggle
  ai_paused_until TIMESTAMPTZ,                -- Cooldown period (admin handover)
  schedule_active BOOLEAN DEFAULT false,      -- Scheduling enabled?
  schedule_start  TIME,                       -- e.g. '08:00'
  schedule_end    TIME,                       -- e.g. '18:00'
  schedule_days   INTEGER[] DEFAULT '{1,2,3,4,5,6,7}', -- 1=Mon..7=Sun
  auto_reply_off_hours TEXT,                  -- message sent outside hours
  response_delay_sec INTEGER DEFAULT 2,       -- simulate human typing delay
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);

-- 5. KNOWLEDGE BASES (markdown content per page)
CREATE TABLE public.knowledge_bases (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  page_id         UUID NOT NULL REFERENCES public.connected_pages(id) ON DELETE CASCADE,
  title           TEXT NOT NULL,
  content_md      TEXT NOT NULL,              -- raw markdown
  content_type    TEXT DEFAULT 'general',     -- 'pricing' | 'faq' | 'menu' | 'availability'
  is_active       BOOLEAN DEFAULT true,
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);

-- 6. KNOWLEDGE CHUNKS (pgvector embeddings for semantic search)
CREATE TABLE public.knowledge_chunks (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  knowledge_id    UUID NOT NULL REFERENCES public.knowledge_bases(id) ON DELETE CASCADE,
  page_id         UUID NOT NULL REFERENCES public.connected_pages(id) ON DELETE CASCADE,
  chunk_index     INTEGER NOT NULL,
  content         TEXT NOT NULL,
  embedding       extensions.vector(1536),    -- OpenAI ada-002 / gemini embedding dim
  token_count     INTEGER,
  created_at      TIMESTAMPTZ DEFAULT now()
);

-- HNSW index for fast ANN search
CREATE INDEX IF NOT EXISTS knowledge_chunks_embedding_idx
  ON public.knowledge_chunks
  USING hnsw (embedding extensions.vector_cosine_ops);

-- 7. MESSAGE LOGS (incoming + outgoing)
CREATE TABLE public.message_logs (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  page_id         UUID NOT NULL REFERENCES public.connected_pages(id) ON DELETE CASCADE,
  sender_psid     TEXT NOT NULL,              -- Facebook PSID (sender)
  recipient_id    TEXT NOT NULL,              -- Page ID (recipient)
  direction       TEXT NOT NULL CHECK (direction IN ('incoming', 'outgoing')),
  message_text    TEXT,
  attachments     JSONB DEFAULT '[]',
  meta_mid        TEXT,                       -- Meta message ID
  ai_processed    BOOLEAN DEFAULT false,
  ai_response     TEXT,                       -- what the AI replied (for outgoing)
  ai_confidence   REAL,                       -- vector similarity score used
  ai_sources      JSONB DEFAULT '[]',         -- which knowledge chunks informed reply
  ai_latency_ms   INTEGER,                    -- OpenRouter round-trip time
  is_from_admin   BOOLEAN DEFAULT false,      -- was sender the page admin?
  created_at      TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_message_logs_page_sender ON public.message_logs(page_id, sender_psid, created_at DESC);

-- 8. SUBSCRIPTIONS (Lemon Squeezy plan purchases)
CREATE TABLE public.subscriptions (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  lemon_squeezy_id  TEXT UNIQUE,              -- LS subscription/order ID
  variant_id        TEXT,                     -- LS variant ID
  plan              TEXT NOT NULL,            -- '2week' | '4week' | '12week'
  status            TEXT DEFAULT 'active',    -- 'active' | 'expired' | 'cancelled'
  started_at        TIMESTAMPTZ DEFAULT now(),
  expires_at        TIMESTAMPTZ NOT NULL,
  created_at        TIMESTAMPTZ DEFAULT now(),
  updated_at        TIMESTAMPTZ DEFAULT now()
);

-- 9. CONVERSATION CONTEXT (short-term memory per conversation)
CREATE TABLE public.conversation_context (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  page_id         UUID NOT NULL REFERENCES public.connected_pages(id) ON DELETE CASCADE,
  sender_psid     TEXT NOT NULL,
  context_json    JSONB DEFAULT '{"history": [], "lead_info": {}}',
  last_active     TIMESTAMPTZ DEFAULT now(),
  created_at      TIMESTAMPTZ DEFAULT now(),
  UNIQUE(page_id, sender_psid)
);

-- ============================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.connected_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.page_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.knowledge_bases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.knowledge_chunks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.message_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_context ENABLE ROW LEVEL SECURITY;

-- Profiles: users can read/write only their own
CREATE POLICY "Users own profiles"
  ON public.profiles FOR ALL
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Connected pages: users own their page connections
CREATE POLICY "Users own connected pages"
  ON public.connected_pages FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Page settings: users manage settings for their own pages
CREATE POLICY "Users own page settings"
  ON public.page_settings FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.connected_pages cp
      WHERE cp.id = page_settings.page_id AND cp.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.connected_pages cp
      WHERE cp.id = page_settings.page_id AND cp.user_id = auth.uid()
    )
  );

-- Knowledge bases: users own their KBs
CREATE POLICY "Users own knowledge bases"
  ON public.knowledge_bases FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.connected_pages cp
      WHERE cp.id = knowledge_bases.page_id AND cp.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.connected_pages cp
      WHERE cp.id = knowledge_bases.page_id AND cp.user_id = auth.uid()
    )
  );

-- Knowledge chunks: users own their chunks
CREATE POLICY "Users own knowledge chunks"
  ON public.knowledge_chunks FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.connected_pages cp
      WHERE cp.id = knowledge_chunks.page_id AND cp.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.connected_pages cp
      WHERE cp.id = knowledge_chunks.page_id AND cp.user_id = auth.uid()
    )
  );

-- Message logs: users see messages for their pages
CREATE POLICY "Users own message logs"
  ON public.message_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.connected_pages cp
      WHERE cp.id = message_logs.page_id AND cp.user_id = auth.uid()
    )
  );

-- Message logs: webhook service can INSERT (uses service_role key)
CREATE POLICY "Service can insert message logs"
  ON public.message_logs FOR INSERT
  WITH CHECK (true);  -- secured by API route auth

-- Subscriptions: users view their own
CREATE POLICY "Users own subscriptions"
  ON public.subscriptions FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Conversation context: webhook service manages
CREATE POLICY "Service manages conversation context"
  ON public.conversation_context FOR ALL
  USING (true)   -- secured by API route auth
  WITH CHECK (true);

-- ============================================================
-- FUNCTIONS
-- ============================================================

-- Match knowledge chunks by vector similarity
CREATE OR REPLACE FUNCTION match_knowledge_chunks(
  query_embedding extensions.vector(1536),
  p_page_id UUID,
  match_threshold REAL DEFAULT 0.7,
  match_count INT DEFAULT 5
)
RETURNS TABLE (
  id UUID,
  knowledge_id UUID,
  content TEXT,
  similarity REAL
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    kc.id,
    kc.knowledge_id,
    kc.content,
    1 - (kc.embedding <=> query_embedding) AS similarity
  FROM public.knowledge_chunks kc
  WHERE kc.page_id = p_page_id
    AND 1 - (kc.embedding <=> query_embedding) > match_threshold
  ORDER BY kc.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- Check if AI should respond (respects toggle, cooldown, and schedule)
CREATE OR REPLACE FUNCTION should_ai_respond(p_page_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
DECLARE
  v_enabled      BOOLEAN;
  v_paused_until TIMESTAMPTZ;
  v_schedule     BOOLEAN;
  v_start        TIME;
  v_end          TIME;
  v_days         INTEGER[];
BEGIN
  SELECT
    ps.ai_enabled,
    ps.ai_paused_until,
    ps.schedule_active,
    ps.schedule_start,
    ps.schedule_end,
    ps.schedule_days
  INTO v_enabled, v_paused_until, v_schedule, v_start, v_end, v_days
  FROM public.page_settings ps
  WHERE ps.page_id = p_page_id;

  -- No settings yet = allow
  IF v_enabled IS NULL THEN
    RETURN true;
  END IF;

  -- Global OFF switch
  IF NOT v_enabled THEN
    RETURN false;
  END IF;

  -- Cooldown period (admin interjection)
  IF v_paused_until IS NOT NULL AND v_paused_until > now() THEN
    RETURN false;
  END IF;

  -- Schedule check
  IF v_schedule THEN
    IF NOT (EXTRACT(DOW FROM now())::INT + 1 = ANY(v_days)) THEN
      RETURN false;
    END IF;
    IF v_start IS NOT NULL AND v_end IS NOT NULL THEN
      IF LOCALTIME < v_start OR LOCALTIME > v_end THEN
        RETURN false;
      END IF;
    END IF;
  END IF;

  RETURN true;
END;
$$;

-- Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers
CREATE TRIGGER trg_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_connected_pages_updated_at
  BEFORE UPDATE ON public.connected_pages
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_page_settings_updated_at
  BEFORE UPDATE ON public.page_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_knowledge_bases_updated_at
  BEFORE UPDATE ON public.knowledge_bases
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_subscriptions_updated_at
  BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- POST-MIGRATION FIXES (run if tables already exist)
-- ============================================================

-- Required for upsert operations
ALTER TABLE public.knowledge_bases ADD CONSTRAINT IF NOT EXISTS knowledge_bases_page_id_title_unique UNIQUE (page_id, title);
ALTER TABLE public.page_settings ADD CONSTRAINT IF NOT EXISTS page_settings_page_id_unique UNIQUE (page_id);

-- Updated should_ai_respond with Philippine timezone support
CREATE OR REPLACE FUNCTION should_ai_respond(p_page_id UUID)
RETURNS BOOLEAN LANGUAGE plpgsql AS $$
DECLARE
  v_enabled BOOLEAN; v_paused_until TIMESTAMPTZ; v_schedule BOOLEAN;
  v_start TIME; v_end TIME; v_days INTEGER[]; v_now_ph TIME;
BEGIN
  SELECT ps.ai_enabled, ps.ai_paused_until, ps.schedule_active,
    ps.schedule_start, ps.schedule_end, ps.schedule_days
  INTO v_enabled, v_paused_until, v_schedule, v_start, v_end, v_days
  FROM public.page_settings ps WHERE ps.page_id = p_page_id;
  IF v_enabled IS NULL THEN RETURN true; END IF;
  IF NOT v_enabled THEN RETURN false; END IF;
  IF v_paused_until IS NOT NULL AND v_paused_until > now() THEN RETURN false; END IF;
  IF v_schedule THEN
    v_now_ph := (now() AT TIME ZONE 'Asia/Manila')::time;
    IF NOT (EXTRACT(DOW FROM now() AT TIME ZONE 'Asia/Manila')::INT + 1 = ANY(v_days)) THEN RETURN false; END IF;
    IF v_start IS NOT NULL AND v_end IS NOT NULL THEN
      IF v_now_ph < v_start OR v_now_ph > v_end THEN RETURN false; END IF;
    END IF;
  END IF;
  RETURN true;
END;
$$;
