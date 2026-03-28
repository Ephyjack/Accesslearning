-- Community Schema v2 – Run in Supabase SQL Editor
-- Adds description, passcode fields to communities

ALTER TABLE public.communities ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE public.communities ADD COLUMN IF NOT EXISTS passcode TEXT;
ALTER TABLE public.communities ADD COLUMN IF NOT EXISTS member_count INT DEFAULT 0;

-- Add user_name and user_lang fields to messages for community chat display
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS user_name TEXT;
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS user_lang TEXT DEFAULT 'en';
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS user_role TEXT DEFAULT 'student';
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS avatar_color TEXT;

-- Rooms table: ensure community_id column exists
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_schema='public'
                 AND table_name='rooms'
                 AND column_name='community_id') THEN
    ALTER TABLE public.rooms ADD COLUMN community_id UUID REFERENCES public.communities(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Rooms table: ensure is_private column exists
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_schema='public'
                 AND table_name='rooms'
                 AND column_name='is_private') THEN
    ALTER TABLE public.rooms ADD COLUMN is_private BOOLEAN DEFAULT false;
  END IF;
END $$;

-- Enable realtime on rooms and messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.rooms;
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;

-- Disable RLS for rapid prototyping
ALTER TABLE public.rooms DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages DISABLE ROW LEVEL SECURITY;
