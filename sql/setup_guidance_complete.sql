-- Complete Guidance System Setup
-- This script sets up the guidance role system (guidance user created separately in auth.users)
-- Run this in your Supabase SQL Editor

-- Step 1: Ensure the profiles table has the necessary structure
-- Add role column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' AND column_name = 'role'
    ) THEN
        ALTER TABLE profiles ADD COLUMN role TEXT DEFAULT 'user';
    END IF;
END $$;

-- Step 2: Update the handle_new_user function to support guidance role
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    is_admin BOOLEAN;
    is_guidance BOOLEAN;
BEGIN
    -- Check if the user is admin or guidance
    is_admin := NEW.email = 'admin@gmail.com';
    is_guidance := NEW.email = 'guidance@gmail.com';
    
    INSERT INTO public.profiles (
        user_id, 
        email, 
        full_name,
        age,
        gender,
        school,
        course,
        year_level,
        role,
        created_at,
        last_sign_in
    )
    VALUES (
        NEW.id, 
        NEW.email, 
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', 'User'),
        (NEW.raw_user_meta_data->>'age')::INTEGER,
        NEW.raw_user_meta_data->>'gender',
        NEW.raw_user_meta_data->>'school',
        NEW.raw_user_meta_data->>'course',
        (NEW.raw_user_meta_data->>'year_level')::INTEGER,
        CASE 
            WHEN is_admin THEN 'admin'
            WHEN is_guidance THEN 'guidance'
            ELSE 'user' 
        END,
        NOW(),
        NOW()
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 3: Create comprehensive RLS policies for guidance users
-- Policy to allow guidance users to view all profiles
DROP POLICY IF EXISTS "Guidance can view all profiles" ON profiles;
CREATE POLICY "Guidance can view all profiles"
    ON profiles
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE user_id = auth.uid()
            AND role = 'guidance'
        )
    );

-- Policy to allow guidance users to update profiles
DROP POLICY IF EXISTS "Guidance can update profiles" ON profiles;
CREATE POLICY "Guidance can update profiles"
    ON profiles
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE user_id = auth.uid()
            AND role = 'guidance'
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE user_id = auth.uid()
            AND role = 'guidance'
        )
    );

-- Policy to allow guidance users to insert profiles
DROP POLICY IF EXISTS "Guidance can insert profiles" ON profiles;
CREATE POLICY "Guidance can insert profiles"
    ON profiles
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE user_id = auth.uid()
            AND role = 'guidance'
        )
    );

-- Policy to allow guidance users to delete profiles
DROP POLICY IF EXISTS "Guidance can delete profiles" ON profiles;
CREATE POLICY "Guidance can delete profiles"
    ON profiles
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE user_id = auth.uid()
            AND role = 'guidance'
        )
    );

-- Policy to allow guidance users to view anxiety assessments
DROP POLICY IF EXISTS "Guidance can view anxiety assessments" ON anxiety_assessments;
CREATE POLICY "Guidance can view anxiety assessments"
    ON anxiety_assessments
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE user_id = auth.uid()
            AND role = 'guidance'
        )
    );

-- Policy to allow guidance users to insert anxiety assessments
DROP POLICY IF EXISTS "Guidance can insert anxiety assessments" ON anxiety_assessments;
CREATE POLICY "Guidance can insert anxiety assessments"
    ON anxiety_assessments
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE user_id = auth.uid()
            AND role = 'guidance'
        )
    );

-- Policy to allow guidance users to update anxiety assessments
DROP POLICY IF EXISTS "Guidance can update anxiety assessments" ON anxiety_assessments;
CREATE POLICY "Guidance can update anxiety assessments"
    ON anxiety_assessments
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE user_id = auth.uid()
            AND role = 'guidance'
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE user_id = auth.uid()
            AND role = 'guidance'
        )
    );

-- Policy to allow guidance users to delete anxiety assessments
DROP POLICY IF EXISTS "Guidance can delete anxiety assessments" ON anxiety_assessments;
CREATE POLICY "Guidance can delete anxiety assessments"
    ON anxiety_assessments
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE user_id = auth.uid()
            AND role = 'guidance'
        )
    );

-- Step 4: Ensure the trigger is properly set up
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION handle_new_user();

-- Step 5: Grant necessary permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON anxiety_assessments TO authenticated;

-- Step 6: Verify setup
SELECT 'Guidance system setup completed successfully!' as status;

-- Check if function was updated
SELECT 
    'handle_new_user function:' as check_type,
    routine_name, 
    routine_definition 
FROM information_schema.routines 
WHERE routine_name = 'handle_new_user';

-- Check if policies exist
SELECT 
    'RLS Policies:' as check_type,
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE policyname LIKE '%guidance%';

-- Step 7: Important Note
SELECT 
    '📋 IMPORTANT:' as note,
    'The guidance user must be created separately in auth.users' as step1,
    'Run sql/create_guidance_auth_user.sql to create the guidance user' as step2,
    'This will create the user account in the authentication system' as step3,
    'The trigger will automatically create the profile entry' as step4; 