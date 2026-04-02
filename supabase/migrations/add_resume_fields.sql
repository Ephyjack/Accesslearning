-- Migration: Add Resume/Portfolio fields to profiles table

ALTER TABLE IF EXISTS public.profiles
ADD COLUMN IF NOT EXISTS avatar_url TEXT,
ADD COLUMN IF NOT EXISTS bio_headline TEXT,
ADD COLUMN IF NOT EXISTS social_links JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS certifications JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS external_platforms JSONB DEFAULT '[]'::jsonb;

-- Ensure RLS policies allow reading and writing these generic fields
-- (These will automatically be inherited if policies on `profiles` use auth.uid() = id for updates)
