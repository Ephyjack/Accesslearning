-- Community Additions Schema

-- 1. Communities Table
CREATE TABLE IF NOT EXISTS public.communities (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  avatar TEXT,
  color TEXT,
  type TEXT CHECK (type IN ('public', 'private', 'school')) DEFAULT 'public',
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Community Members
CREATE TABLE IF NOT EXISTS public.community_members (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  community_id UUID REFERENCES public.communities(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  role TEXT CHECK (role IN ('admin', 'teacher', 'student')) DEFAULT 'student',
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(community_id, user_id)
);

-- 3. Channels Table (Text channels inside communities)
CREATE TABLE IF NOT EXISTS public.channels (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  community_id UUID REFERENCES public.communities(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  type TEXT DEFAULT 'text',
  is_locked BOOLEAN DEFAULT false,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Alter Classes (Video Rooms) to belong to a community
-- Add community_id to classes if it does not exist
DO $$ 
BEGIN 
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_schema='public' 
                 AND table_name='classes' 
                 AND column_name='community_id') THEN
    ALTER TABLE public.classes ADD COLUMN community_id UUID REFERENCES public.communities(id) ON DELETE CASCADE;
  END IF;
END $$;

-- 5. Alter Messages to optionally link to a community channel 
-- (messages presently has room_id which is TEXT. We can reuse it for channel_id)

-- Enable Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.communities;
ALTER PUBLICATION supabase_realtime ADD TABLE public.community_members;
ALTER PUBLICATION supabase_realtime ADD TABLE public.channels;

-- Disable RLS for rapid prototyping (can enable later for production)
ALTER TABLE public.communities DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_members DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.channels DISABLE ROW LEVEL SECURITY;
