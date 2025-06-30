-- Fix anxiety_assessments table structure to match new profiles table
-- Run this in your Supabase SQL Editor

-- Drop existing anxiety_assessments table
DROP TABLE IF EXISTS anxiety_assessments CASCADE;

-- Recreate anxiety_assessments table with correct structure
CREATE TABLE public.anxiety_assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  total_score INTEGER NOT NULL,
  percentage INTEGER NOT NULL,
  anxiety_level TEXT NOT NULL,
  answers INTEGER[] NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_anxiety_assessments_profile_id ON public.anxiety_assessments(profile_id);
CREATE INDEX idx_anxiety_assessments_created_at ON public.anxiety_assessments(created_at);

-- Enable Row Level Security
ALTER TABLE public.anxiety_assessments ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own assessments" ON public.anxiety_assessments;
DROP POLICY IF EXISTS "Users can insert own assessments" ON public.anxiety_assessments;
DROP POLICY IF EXISTS "Users can update own assessments" ON public.anxiety_assessments;
DROP POLICY IF EXISTS "Admins can view all assessments" ON public.anxiety_assessments;

-- Create RLS policies for anxiety_assessments
-- Allow users to view their own assessments
CREATE POLICY "Users can view own assessments" 
ON public.anxiety_assessments FOR SELECT
USING (profile_id = auth.uid());

-- Allow users to insert their own assessments
CREATE POLICY "Users can insert own assessments" 
ON public.anxiety_assessments FOR INSERT
WITH CHECK (profile_id = auth.uid());

-- Allow users to update their own assessments
CREATE POLICY "Users can update own assessments" 
ON public.anxiety_assessments FOR UPDATE
USING (profile_id = auth.uid());

-- Allow admins to view all assessments
CREATE POLICY "Admins can view all assessments" 
ON public.anxiety_assessments FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- Grant permissions
GRANT ALL ON public.anxiety_assessments TO authenticated;
GRANT ALL ON public.anxiety_assessments TO service_role;
GRANT ALL ON public.anxiety_assessments TO anon;

-- Verify the structure
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'anxiety_assessments' 
AND table_schema = 'public'
ORDER BY ordinal_position; 