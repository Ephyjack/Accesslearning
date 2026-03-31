-- ============================================================
-- AccessLearn Platform Evolution — Profile Schema Migration
-- Run this in your Supabase SQL Editor
-- ============================================================

-- 1. Educator type — what kind of knowledge-sharer are you?
--    Values: 'academic' | 'skills_tutor' | 'professional_trainer'
--            'peer_educator' | 'mentor_coach' | 'content_creator'
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS educator_type TEXT;

-- 2. Learner level — what stage of education are you at?
--    Values: 'high_school' | 'undergraduate' | 'postgraduate'
--            'masters' | 'doctorate' | 'professional' | 'self_learner'
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS learner_level TEXT;

-- 3. Dual-role flags
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_also_learner BOOLEAN DEFAULT FALSE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_also_educator BOOLEAN DEFAULT FALSE;

-- 4. Headline — personal one-liner shown on public profile
--    e.g. "Python Dev & Tutor | MSc Student"
--    e.g. "Forex Trader & Mentor | Community Builder"
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS headline TEXT;

-- 5. Field / niche category
--    Values: 'tech_development' | 'finance_trading' | 'design_creative'
--            'business_marketing' | 'sciences_health' | 'languages_arts'
--            'academic_research' | 'personal_development'
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS field_category TEXT;

-- ── Indexes for discovery filtering ──────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_profiles_educator_type ON profiles(educator_type);
CREATE INDEX IF NOT EXISTS idx_profiles_learner_level ON profiles(learner_level);
CREATE INDEX IF NOT EXISTS idx_profiles_field_category ON profiles(field_category);
CREATE INDEX IF NOT EXISTS idx_profiles_is_also_learner ON profiles(is_also_learner);

-- ── Verify ───────────────────────────────────────────────────────────────────
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'profiles'
  AND column_name IN (
    'educator_type','learner_level','is_also_learner',
    'is_also_educator','headline','field_category'
  )
ORDER BY column_name;
