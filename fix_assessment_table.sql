-- Fix anxiety_assessments table structure and RLS policies
-- Run this in your Supabase SQL Editor

-- First, let's check the current table structure
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'anxiety_assessments' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Drop existing table and recreate it properly
DROP TABLE IF EXISTS anxiety_assessments CASCADE;

-- Create anxiety_assessments table with correct structure
CREATE TABLE anxiety_assessments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    profile_id BIGINT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    total_score INTEGER NOT NULL,
    percentage INTEGER NOT NULL,
    anxiety_level TEXT NOT NULL,
    answers INTEGER[] NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Add indexes for better query performance
CREATE INDEX idx_anxiety_assessments_profile_id ON anxiety_assessments(profile_id);
CREATE INDEX idx_anxiety_assessments_created_at ON anxiety_assessments(created_at);

-- Enable Row Level Security
ALTER TABLE anxiety_assessments ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own assessments" ON anxiety_assessments;
DROP POLICY IF EXISTS "Users can insert their own assessments" ON anxiety_assessments;
DROP POLICY IF EXISTS "Users can update their own assessments" ON anxiety_assessments;
DROP POLICY IF EXISTS "Users can delete their own assessments" ON anxiety_assessments;
DROP POLICY IF EXISTS "Admins can view all assessments" ON anxiety_assessments;
DROP POLICY IF EXISTS "Admins can manage all assessments" ON anxiety_assessments;

-- Create simplified RLS policies
-- Policy to allow users to view their own assessments
CREATE POLICY "Users can view their own assessments"
    ON anxiety_assessments
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = anxiety_assessments.profile_id
            AND profiles.user_id = auth.uid()
        )
    );

-- Policy to allow users to insert their own assessments
CREATE POLICY "Users can insert their own assessments"
    ON anxiety_assessments
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = anxiety_assessments.profile_id
            AND profiles.user_id = auth.uid()
        )
    );

-- Policy to allow users to update their own assessments
CREATE POLICY "Users can update their own assessments"
    ON anxiety_assessments
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = anxiety_assessments.profile_id
            AND profiles.user_id = auth.uid()
        )
    );

-- Policy to allow users to delete their own assessments
CREATE POLICY "Users can delete their own assessments"
    ON anxiety_assessments
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = anxiety_assessments.profile_id
            AND profiles.user_id = auth.uid()
        )
    );

-- Policy to allow admins to view all assessments
CREATE POLICY "Admins can view all assessments"
    ON anxiety_assessments
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.user_id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

-- Policy to allow admins to manage all assessments
CREATE POLICY "Admins can manage all assessments"
    ON anxiety_assessments
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.user_id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

-- Create function to handle updated_at
CREATE OR REPLACE FUNCTION handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc'::text, NOW());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for updated_at
DROP TRIGGER IF EXISTS handle_anxiety_assessments_updated_at ON anxiety_assessments;
CREATE TRIGGER handle_anxiety_assessments_updated_at
    BEFORE UPDATE ON anxiety_assessments
    FOR EACH ROW
    EXECUTE FUNCTION handle_updated_at();

-- Grant necessary permissions
GRANT ALL ON anxiety_assessments TO authenticated;
GRANT ALL ON anxiety_assessments TO service_role;

-- Create a function to get the latest assessment for a user
CREATE OR REPLACE FUNCTION get_latest_assessment(user_id UUID)
RETURNS TABLE (
    id UUID,
    profile_id BIGINT,
    total_score INTEGER,
    percentage INTEGER,
    anxiety_level TEXT,
    answers INTEGER[],
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        a.*
    FROM anxiety_assessments a
    JOIN profiles p ON p.id = a.profile_id
    WHERE p.user_id = get_latest_assessment.user_id
    ORDER BY a.created_at DESC
    LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION get_latest_assessment TO authenticated;
GRANT EXECUTE ON FUNCTION get_latest_assessment TO service_role;

-- Verify the table structure
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'anxiety_assessments' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Test the policies by checking if they exist
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'anxiety_assessments'; 