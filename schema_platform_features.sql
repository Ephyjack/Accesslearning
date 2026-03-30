-- 1. Add gamification fields to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS points INT DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS current_streak INT DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS last_active_date DATE;

-- 2. Create the Resource Library table
CREATE TABLE IF NOT EXISTS public.class_resources (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  url TEXT,
  resource_type TEXT CHECK (resource_type IN ('link', 'pdf', 'document', 'video', 'other')) DEFAULT 'link',
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Note: In a production environment, ensure RLS is correctly configured.
-- For rapid prototyping, we can leave RLS disabled or open.
ALTER PUBLICATION supabase_realtime ADD TABLE public.class_resources;

ALTER TABLE public.class_resources DISABLE ROW LEVEL SECURITY;
