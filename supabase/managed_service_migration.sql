-- ============================================================
-- Managed Service — Payment tracking table
-- ============================================================
-- Run this in Supabase SQL Editor once to add manual payment tracking.

CREATE TABLE IF NOT EXISTS public.payment_logs (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  amount          DECIMAL NOT NULL,
  plan            TEXT NOT NULL,              -- 'starter' | 'pro' | 'custom'
  plan_duration_days INTEGER DEFAULT 28,
  payment_date    TIMESTAMPTZ DEFAULT now(),
  payment_method  TEXT DEFAULT 'manual',      -- 'gcash' | 'bank_transfer' | 'cash' | 'maya'
  notes           TEXT,
  created_at      TIMESTAMPTZ DEFAULT now()
);

-- RLS: admin can manage all, users can view their own
ALTER TABLE public.payment_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin manages payment logs"
  ON public.payment_logs FOR ALL
  USING (true)
  WITH CHECK (true);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_payment_logs_user
  ON public.payment_logs(user_id, payment_date DESC);

-- Add unique constraint on subscriptions.user_id for admin upsert
ALTER TABLE public.subscriptions ADD CONSTRAINT IF NOT EXISTS subscriptions_user_id_unique UNIQUE (user_id);
