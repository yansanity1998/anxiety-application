-- Fix assessment saving issue
-- Run this in your Supabase SQL Editor

-- 1. First, let's check the current table structure
SELECT 'Current anxiety_assessments structure' as info, 
       column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'anxiety_assessments' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 2. Check the profiles table structure
SELECT 'Current profiles structure' as info, 
       column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'profiles' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 3. Check if there are any existing assessments
SELECT 'Existing assessments count' as info, COUNT(*) as count 
FROM anxiety_assessments;

-- 4. Check the foreign key relationship
SELECT 'Foreign key info' as info,
       tc.constraint_name,
       tc.table_name,
       kcu.column_name,
       ccu.table_name AS foreign_table_name,
       ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY' 
AND tc.table_name = 'anxiety_assessments';

-- 5. Drop and recreate the anxiety_assessments table with correct structure
DROP TABLE IF EXISTS anxiety_assessments CASCADE;

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

-- 6. Create indexes
CREATE INDEX idx_anxiety_assessments_profile_id ON anxiety_assessments(profile_id);
CREATE INDEX idx_anxiety_assessments_created_at ON anxiety_assessments(created_at);

-- 7. Enable RLS
ALTER TABLE anxiety_assessments ENABLE ROW LEVEL SECURITY;

-- 8. Drop existing policies
DROP POLICY IF EXISTS "Users can view their own assessments" ON anxiety_assessments;
DROP POLICY IF EXISTS "Users can insert their own assessments" ON anxiety_assessments;
DROP POLICY IF EXISTS "Users can update their own assessments" ON anxiety_assessments;
DROP POLICY IF EXISTS "Users can delete their own assessments" ON anxiety_assessments;
DROP POLICY IF EXISTS "Admins can view all assessments" ON anxiety_assessments;
DROP POLICY IF EXISTS "Admins can manage all assessments" ON anxiety_assessments;
DROP POLICY IF EXISTS "Admins can delete all assessments" ON anxiety_assessments;

-- 9. Create new RLS policies (non-recursive)
-- Allow users to view their own assessments
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

-- Allow users to insert their own assessments
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

-- Allow users to update their own assessments
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

-- Allow users to delete their own assessments
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

-- Allow admins to view all assessments
CREATE POLICY "Admins can view all assessments"
    ON anxiety_assessments
    FOR SELECT
    USING (
        auth.jwt() ->> 'email' = 'admin@gmail.com'
    );

-- Allow admins to manage all assessments
CREATE POLICY "Admins can manage all assessments"
    ON anxiety_assessments
    FOR ALL
    USING (
        auth.jwt() ->> 'email' = 'admin@gmail.com'
    );

-- 10. Create function to handle updated_at
CREATE OR REPLACE FUNCTION handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc'::text, NOW());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 11. Create trigger for updated_at
CREATE TRIGGER handle_anxiety_assessments_updated_at
    BEFORE UPDATE ON anxiety_assessments
    FOR EACH ROW
    EXECUTE FUNCTION handle_updated_at();

-- 12. Grant permissions
GRANT ALL ON anxiety_assessments TO authenticated;
GRANT ALL ON anxiety_assessments TO service_role;

-- 13. Test the structure
SELECT 'Final table structure' as info, 
       column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'anxiety_assessments' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 14. Show policies
SELECT 'RLS Policies' as info, 
       policyname, cmd, qual
FROM pg_policies 
WHERE tablename = 'anxiety_assessments'
ORDER BY policyname; 