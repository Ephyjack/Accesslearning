-- ============================================================
-- Community Page V3 Schema Upgrades
-- Run in Supabase SQL Editor (each block is safe to re-run)
-- ============================================================

-- 1. Add channel_type column to channels table
--    Types: 'text' | 'announcement' | 'qna' | 'voice'
ALTER TABLE public.channels ADD COLUMN IF NOT EXISTS channel_type TEXT
  CHECK (channel_type IN ('text', 'announcement', 'qna', 'voice'))
  DEFAULT 'text';

-- 2. Add topic/description to channels
ALTER TABLE public.channels ADD COLUMN IF NOT EXISTS topic TEXT;
ALTER TABLE public.channels ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE public.channels ADD COLUMN IF NOT EXISTS position INT DEFAULT 0;

-- 3. Add categories table for organising channels in groups
CREATE TABLE IF NOT EXISTS public.channel_categories (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  community_id UUID REFERENCES public.communities(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  position INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.channels ADD COLUMN IF NOT EXISTS category_id UUID
  REFERENCES public.channel_categories(id) ON DELETE SET NULL;

-- 4. Thread / reply support on messages
--    A reply is itself a message with a parent_message_id
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS parent_message_id UUID
  REFERENCES public.messages(id) ON DELETE CASCADE;
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS reply_to_user TEXT;
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS reply_to_text TEXT;

-- 5. Pinned messages (per channel)
CREATE TABLE IF NOT EXISTS public.pinned_messages (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  channel_id UUID NOT NULL,
  message_id UUID NOT NULL,
  pinned_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  pinned_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(channel_id, message_id)
);

-- 6. Message reactions (emoji reactions)
CREATE TABLE IF NOT EXISTS public.message_reactions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  message_id UUID REFERENCES public.messages(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  emoji TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(message_id, user_id, emoji)
);

-- 7. File / media attachments on messages
CREATE TABLE IF NOT EXISTS public.message_attachments (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  message_id UUID REFERENCES public.messages(id) ON DELETE CASCADE NOT NULL,
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_type TEXT DEFAULT 'file',   -- 'image' | 'pdf' | 'file'
  file_size_bytes BIGINT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Add storage_path reference to messages for direct image previews
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS attachment_url TEXT;
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS attachment_name TEXT;
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS attachment_type TEXT;

-- 9. QnA: mark a message as 'resolved' (question answered)
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS is_question BOOLEAN DEFAULT FALSE;
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS is_resolved BOOLEAN DEFAULT FALSE;
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS upvotes INT DEFAULT 0;

-- 10. Add role moderation fields to community_members
ALTER TABLE public.community_members ADD COLUMN IF NOT EXISTS is_muted BOOLEAN DEFAULT FALSE;
ALTER TABLE public.community_members ADD COLUMN IF NOT EXISTS muted_until TIMESTAMPTZ;
ALTER TABLE public.community_members ADD COLUMN IF NOT EXISTS nickname TEXT;

-- 11. Community settings / metadata fields
ALTER TABLE public.communities ADD COLUMN IF NOT EXISTS banner_url TEXT;
ALTER TABLE public.communities ADD COLUMN IF NOT EXISTS rules TEXT;
ALTER TABLE public.communities ADD COLUMN IF NOT EXISTS tags TEXT[];

-- 12. Enable realtime on new tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.message_reactions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.message_attachments;
ALTER PUBLICATION supabase_realtime ADD TABLE public.pinned_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.channel_categories;

-- 13. Disable RLS for rapid prototyping
ALTER TABLE public.message_reactions DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.message_attachments DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.pinned_messages DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.channel_categories DISABLE ROW LEVEL SECURITY;

-- ============================================================
-- STORAGE BUCKET (run separately if not already done)
-- ============================================================
-- In Supabase dashboard: Storage → New Bucket → Name: "community-files"
-- Make it PUBLIC so images/files can be previewed by URL.
-- Or use the SQL below:
-- INSERT INTO storage.buckets (id, name, public)
-- VALUES ('community-files', 'community-files', true)
-- ON CONFLICT (id) DO NOTHING;
