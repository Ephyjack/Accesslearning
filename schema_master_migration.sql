-- ============================================================
-- ACCESSLEARN — MASTER COMMUNITY MIGRATION v2
-- Paste entire file into Supabase SQL Editor → Run
-- Safe to re-run (uses IF NOT EXISTS everywhere)
-- ============================================================

-- ────────────────────────────────────────────────────────────
-- 1. COMMUNITIES — create if not exists, then add columns
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.communities (
  id          UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name        TEXT NOT NULL,
  avatar      TEXT,
  color       TEXT,
  type        TEXT CHECK (type IN ('public','private','school')) DEFAULT 'public',
  created_by  UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.communities ADD COLUMN IF NOT EXISTS description  TEXT;
ALTER TABLE public.communities ADD COLUMN IF NOT EXISTS passcode     TEXT;
ALTER TABLE public.communities ADD COLUMN IF NOT EXISTS member_count INT DEFAULT 0;
ALTER TABLE public.communities ADD COLUMN IF NOT EXISTS banner_url   TEXT;
ALTER TABLE public.communities ADD COLUMN IF NOT EXISTS rules        TEXT;
ALTER TABLE public.communities ADD COLUMN IF NOT EXISTS tags         TEXT[];

-- ────────────────────────────────────────────────────────────
-- 2. COMMUNITY MEMBERS — create if not exists, then add columns
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.community_members (
  id           UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  community_id UUID REFERENCES public.communities(id) ON DELETE CASCADE NOT NULL,
  user_id      UUID REFERENCES public.profiles(id)   ON DELETE CASCADE NOT NULL,
  role         TEXT CHECK (role IN ('admin','teacher','student')) DEFAULT 'student',
  joined_at    TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(community_id, user_id)
);

ALTER TABLE public.community_members ADD COLUMN IF NOT EXISTS is_muted    BOOLEAN DEFAULT FALSE;
ALTER TABLE public.community_members ADD COLUMN IF NOT EXISTS muted_until TIMESTAMPTZ;
ALTER TABLE public.community_members ADD COLUMN IF NOT EXISTS nickname    TEXT;

-- ────────────────────────────────────────────────────────────
-- 3. ROOMS (video classrooms) — create if not exists
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.rooms (
  id           UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name         TEXT NOT NULL,
  code         TEXT UNIQUE,
  teacher_id   UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  language     TEXT DEFAULT 'English',
  status       TEXT DEFAULT 'offline',
  participants INT DEFAULT 0,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.rooms ADD COLUMN IF NOT EXISTS community_id UUID REFERENCES public.communities(id) ON DELETE CASCADE;
ALTER TABLE public.rooms ADD COLUMN IF NOT EXISTS is_private   BOOLEAN DEFAULT FALSE;

-- ────────────────────────────────────────────────────────────
-- 4. CHANNELS — create if not exists, then add columns
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.channels (
  id           UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  community_id UUID REFERENCES public.communities(id) ON DELETE CASCADE NOT NULL,
  name         TEXT NOT NULL,
  is_locked    BOOLEAN DEFAULT FALSE,
  created_by   UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.channels ADD COLUMN IF NOT EXISTS channel_type TEXT DEFAULT 'text'
  CHECK (channel_type IN ('text','announcement','qna','voice'));
ALTER TABLE public.channels ADD COLUMN IF NOT EXISTS topic       TEXT;
ALTER TABLE public.channels ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE public.channels ADD COLUMN IF NOT EXISTS position    INT DEFAULT 0;

-- ────────────────────────────────────────────────────────────
-- 5. CHANNEL CATEGORIES — create if not exists
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.channel_categories (
  id           UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  community_id UUID REFERENCES public.communities(id) ON DELETE CASCADE NOT NULL,
  name         TEXT NOT NULL,
  position     INT DEFAULT 0,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.channels ADD COLUMN IF NOT EXISTS category_id UUID
  REFERENCES public.channel_categories(id) ON DELETE SET NULL;

-- ────────────────────────────────────────────────────────────
-- 6. MESSAGES — create if not exists, then add columns
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.messages (
  id         UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  room_id    TEXT NOT NULL,
  user_id    UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  text       TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS user_name         TEXT;
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS user_lang         TEXT DEFAULT 'en';
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS user_role         TEXT DEFAULT 'student';
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS avatar_color      TEXT;
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS reply_to_user     TEXT;
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS reply_to_text     TEXT;
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS attachment_url    TEXT;
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS attachment_name   TEXT;
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS attachment_type   TEXT;
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS is_question       BOOLEAN DEFAULT FALSE;
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS is_resolved       BOOLEAN DEFAULT FALSE;
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS upvotes           INT DEFAULT 0;

-- Add self-referencing thread column separately (needs table to exist first)
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS parent_message_id UUID;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'messages_parent_message_id_fkey'
    AND table_name = 'messages'
    AND table_schema = 'public'
  ) THEN
    ALTER TABLE public.messages
      ADD CONSTRAINT messages_parent_message_id_fkey
      FOREIGN KEY (parent_message_id) REFERENCES public.messages(id) ON DELETE CASCADE;
  END IF;
END $$;

-- ────────────────────────────────────────────────────────────
-- 7. MESSAGE REACTIONS — create if not exists
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.message_reactions (
  id         UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  message_id UUID REFERENCES public.messages(id) ON DELETE CASCADE NOT NULL,
  user_id    UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  emoji      TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(message_id, user_id, emoji)
);

-- ────────────────────────────────────────────────────────────
-- 8. PINNED MESSAGES — create if not exists
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.pinned_messages (
  id         UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  channel_id TEXT NOT NULL,
  message_id UUID NOT NULL,
  pinned_by  UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  pinned_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(channel_id, message_id)
);

-- ────────────────────────────────────────────────────────────
-- 9. MESSAGE ATTACHMENTS — create if not exists
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.message_attachments (
  id              UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  message_id      UUID REFERENCES public.messages(id) ON DELETE CASCADE NOT NULL,
  file_name       TEXT NOT NULL,
  file_url        TEXT NOT NULL,
  file_type       TEXT DEFAULT 'file',
  file_size_bytes BIGINT,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ────────────────────────────────────────────────────────────
-- 10. ENABLE REALTIME
-- (ignore duplicate errors — safe to re-run)
-- ────────────────────────────────────────────────────────────
DO $$
DECLARE
  t TEXT;
  tables TEXT[] := ARRAY[
    'communities','community_members','channels','rooms','messages',
    'message_reactions','pinned_messages','channel_categories','message_attachments'
  ];
BEGIN
  FOREACH t IN ARRAY tables LOOP
    BEGIN
      EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE public.%I', t);
    EXCEPTION WHEN OTHERS THEN
      NULL; -- already added, skip
    END;
  END LOOP;
END $$;

-- ────────────────────────────────────────────────────────────
-- 11. DISABLE ROW LEVEL SECURITY (for rapid prototyping)
-- ────────────────────────────────────────────────────────────
ALTER TABLE public.communities         DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_members   DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.channels            DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.rooms               DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages            DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.message_reactions   DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.pinned_messages     DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.channel_categories  DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.message_attachments DISABLE ROW LEVEL SECURITY;

-- ────────────────────────────────────────────────────────────
-- 12. STORAGE BUCKET for file/image uploads
-- ────────────────────────────────────────────────────────────
INSERT INTO storage.buckets (id, name, public)
VALUES ('community-files', 'community-files', true)
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- DONE. All tables, columns, and realtime subscriptions
-- are now in place for the Community Page to work correctly.
-- ============================================================

-- ────────────────────────────────────────────────────────────
-- 13. PROFILES TABLE — add new columns for enriched onboarding
-- ────────────────────────────────────────────────────────────
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS bio             TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS subjects        TEXT[];
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS teaching_style  TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS learning_goal   TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_public       BOOLEAN DEFAULT TRUE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS rating          NUMERIC(3,2) DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS review_count    INT DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS updated_at      TIMESTAMPTZ DEFAULT NOW();

-- ────────────────────────────────────────────────────────────
-- 14. AVATARS STORAGE BUCKET
-- Used by the new OnboardingFlow (Supabase Storage, not base64)
-- ────────────────────────────────────────────────────────────
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- ────────────────────────────────────────────────────────────
-- 15. TEACHER DISCOVERY TABLE
-- Allows students to send "Request to Learn" to unknown teachers
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.teacher_requests (
  id           UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  student_id   UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  teacher_id   UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  message      TEXT,
  subjects     TEXT[],
  status       TEXT CHECK (status IN ('pending','accepted','declined')) DEFAULT 'pending',
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(student_id, teacher_id)
);

-- ────────────────────────────────────────────────────────────
-- 16. REAL-TIME NOTIFICATIONS
-- In-app notifications to make the platform feel truly alive
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.notifications (
  id          UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id     UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL, -- person receiving it
  actor_id    UUID REFERENCES public.profiles(id) ON DELETE SET NULL, -- person who triggered it
  type        TEXT NOT NULL, -- e.g., 'request_received', 'request_accepted', 'new_message'
  message     TEXT NOT NULL,
  link        TEXT, -- Optional app route to open when clicked
  is_read     BOOLEAN DEFAULT FALSE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Enable realtime for notifications and teacher_requests
DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
  EXCEPTION WHEN OTHERS THEN NULL;
  END;
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.teacher_requests;
  EXCEPTION WHEN OTHERS THEN NULL;
  END;
END $$;

ALTER TABLE public.notifications DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.teacher_requests DISABLE ROW LEVEL SECURITY;


ALTER TABLE public.teacher_requests DISABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.teacher_requests;
  EXCEPTION WHEN OTHERS THEN NULL;
  END;
END $$;

-- ============================================================
-- ALL DONE — schema is fully up to date.
-- ============================================================
