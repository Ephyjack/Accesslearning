-- Corrected Migration for Class Resources (Materials)
-- 1. Create a public Storage Bucket for the uploaded files
INSERT INTO storage.buckets (id, name, public) 
VALUES ('materials', 'materials', true)
ON CONFLICT (id) DO NOTHING;

-- Allow public read access to the materials bucket
CREATE POLICY "Public Access" ON storage.objects FOR SELECT USING (bucket_id = 'materials');
CREATE POLICY "Auth Insert" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'materials' AND auth.uid() IS NOT NULL);
CREATE POLICY "Auth Delete" ON storage.objects FOR DELETE USING (bucket_id = 'materials' AND auth.uid() IS NOT NULL);

-- 2. Add file_type to existing class_resources table (so we know if it's a link, pdf, or video)
ALTER TABLE IF EXISTS public.class_resources
ADD COLUMN IF NOT EXISTS file_type TEXT DEFAULT 'link';

-- 3. Create the saved_resources table for students
CREATE TABLE IF NOT EXISTS public.saved_resources (
    id UUID DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
    student_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    resource_id UUID REFERENCES public.class_resources(id) ON DELETE CASCADE NOT NULL,
    saved_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(student_id, resource_id)
);

-- Enable RLS logic for saved resources
ALTER TABLE public.saved_resources ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Students can view their own saved resources" 
ON public.saved_resources FOR SELECT USING (auth.uid() = student_id);

CREATE POLICY "Students can save resources" 
ON public.saved_resources FOR INSERT WITH CHECK (auth.uid() = student_id);

CREATE POLICY "Students can unsave resources" 
ON public.saved_resources FOR DELETE USING (auth.uid() = student_id);
