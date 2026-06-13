-- ============================================================
-- Internal Team Chat — Run this in your Supabase SQL Editor
-- ============================================================

-- 1. Conversations (direct message or group)
CREATE TABLE IF NOT EXISTS public.chat_conversations (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id  UUID NOT NULL,
  name        TEXT,                          -- NULL for DMs, required for groups
  type        TEXT NOT NULL DEFAULT 'direct'
              CHECK (type IN ('direct', 'group')),
  description TEXT,
  created_by  UUID NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Members of each conversation
CREATE TABLE IF NOT EXISTS public.chat_members (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES public.chat_conversations(id) ON DELETE CASCADE,
  user_id         UUID NOT NULL,             -- references auth.users.id
  last_read_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  joined_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(conversation_id, user_id)
);

-- 3. Messages
CREATE TABLE IF NOT EXISTS public.chat_messages (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES public.chat_conversations(id) ON DELETE CASCADE,
  sender_id       UUID NOT NULL,             -- references auth.users.id
  content         TEXT NOT NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  is_deleted      BOOLEAN NOT NULL DEFAULT FALSE,
  attachment_url  TEXT
);

-- Performance indexes
CREATE INDEX IF NOT EXISTS chat_members_user_id_idx          ON public.chat_members(user_id);
CREATE INDEX IF NOT EXISTS chat_members_conversation_id_idx  ON public.chat_members(conversation_id);
CREATE INDEX IF NOT EXISTS chat_messages_conversation_id_idx ON public.chat_messages(conversation_id);
CREATE INDEX IF NOT EXISTS chat_messages_created_at_idx      ON public.chat_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS chat_conversations_company_idx    ON public.chat_conversations(company_id);

-- Trigger: bump conversation.updated_at when a new message is sent
CREATE OR REPLACE FUNCTION public.update_conversation_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.chat_conversations
  SET updated_at = NOW()
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_new_message_update_conversation ON public.chat_messages;
CREATE TRIGGER on_new_message_update_conversation
  AFTER INSERT ON public.chat_messages
  FOR EACH ROW EXECUTE FUNCTION public.update_conversation_updated_at();

-- Enable RLS
ALTER TABLE public.chat_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_members       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages      ENABLE ROW LEVEL SECURITY;

-- ── RLS: chat_conversations ──────────────────────────────────
DROP POLICY IF EXISTS "chat_conv_select" ON public.chat_conversations;
CREATE POLICY "chat_conv_select" ON public.chat_conversations
  FOR SELECT USING (
    id IN (
      SELECT conversation_id FROM public.chat_members
      WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "chat_conv_insert" ON public.chat_conversations;
CREATE POLICY "chat_conv_insert" ON public.chat_conversations
  FOR INSERT WITH CHECK (created_by = auth.uid());

DROP POLICY IF EXISTS "chat_conv_update" ON public.chat_conversations;
CREATE POLICY "chat_conv_update" ON public.chat_conversations
  FOR UPDATE USING (created_by = auth.uid());

-- ── RLS: chat_members ────────────────────────────────────────
DROP POLICY IF EXISTS "chat_members_select" ON public.chat_members;
CREATE POLICY "chat_members_select" ON public.chat_members
  FOR SELECT USING (
    conversation_id IN (
      SELECT conversation_id FROM public.chat_members m2
      WHERE m2.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "chat_members_insert" ON public.chat_members;
CREATE POLICY "chat_members_insert" ON public.chat_members
  FOR INSERT WITH CHECK (true);  -- controlled by app logic

DROP POLICY IF EXISTS "chat_members_update" ON public.chat_members;
CREATE POLICY "chat_members_update" ON public.chat_members
  FOR UPDATE USING (user_id = auth.uid());

-- ── RLS: chat_messages ───────────────────────────────────────
DROP POLICY IF EXISTS "chat_messages_select" ON public.chat_messages;
CREATE POLICY "chat_messages_select" ON public.chat_messages
  FOR SELECT USING (
    conversation_id IN (
      SELECT conversation_id FROM public.chat_members
      WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "chat_messages_insert" ON public.chat_messages;
CREATE POLICY "chat_messages_insert" ON public.chat_messages
  FOR INSERT WITH CHECK (
    sender_id = auth.uid() AND
    conversation_id IN (
      SELECT conversation_id FROM public.chat_members
      WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "chat_messages_update" ON public.chat_messages;
CREATE POLICY "chat_messages_update" ON public.chat_messages
  FOR UPDATE USING (sender_id = auth.uid());

-- Enable Realtime publication for live updates
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_conversations;
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_members;
