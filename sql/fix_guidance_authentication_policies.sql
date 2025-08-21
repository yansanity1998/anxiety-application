-- FIX GUIDANCE AUTHENTICATION POLICIES
-- This script will fix the policies that are preventing guidance from logging in

-- Step 1: Check current guidance profile and auth status
SELECT '=== CURRENT GUIDANCE STATUS ===' as info;
SELECT * FROM profiles WHERE email = 'guidance@gmail.com';

SELECT '=== AUTH USERS CHECK ===' as info;
SELECT id, email, created_at, last_sign_in_at FROM auth.users WHERE email = 'guidance@gmail.com';

-- Step 2: Check current RLS status
SELECT '=== CURRENT RLS STATUS ===' as info;
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename IN ('profiles', 'anxiety_assessments');

-- Step 3: Check all current policies
SELECT '=== ALL CURRENT POLICIES ===' as info;
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
WHERE tablename IN ('profiles', 'anxiety_assessments')
ORDER BY tablename, policyname;

-- Step 4: The issue is likely that guidance can't access their own profile due to policy restrictions
-- Let's create a comprehensive policy system that works for all user types

-- First, drop all existing policies to start fresh
SELECT '=== DROPPING ALL EXISTING POLICIES ===' as info;
DO $$
DECLARE
    policy_record RECORD;
BEGIN
    FOR policy_record IN 
        SELECT policyname, tablename 
        FROM pg_policies 
        WHERE tablename IN ('profiles', 'anxiety_assessments')
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I', 
                      policy_record.policyname, 
                      policy_record.tablename);
    END LOOP;
END $$;

-- Step 5: Create comprehensive policies that work for all user types
SELECT '=== CREATING COMPREHENSIVE POLICIES ===' as info;

-- Policy 1: Users can always access their own profile
CREATE POLICY "Users own profile access"
    ON profiles
    FOR ALL
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- Policy 2: Admins can access everything
CREATE POLICY "Admin full access"
    ON profiles
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE user_id = auth.uid() 
            AND role = 'admin'
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE user_id = auth.uid() 
            AND role = 'admin'
        )
    );

-- Policy 3: Guidance can view all profiles (for counseling)
CREATE POLICY "Guidance view all profiles"
    ON profiles
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE user_id = auth.uid() 
            AND role = 'guidance'
        )
    );

-- Policy 4: Guidance can update profiles (for counseling)
CREATE POLICY "Guidance update profiles"
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

-- Policy 5: Guidance can insert profiles (for new students)
CREATE POLICY "Guidance insert profiles"
    ON profiles
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE user_id = auth.uid() 
            AND role = 'guidance'
        )
    );

-- Step 6: Create assessment policies
-- Policy 6: Users can access their own assessments
CREATE POLICY "Users own assessments"
    ON anxiety_assessments
    FOR ALL
    USING (
        profile_id IN (
            SELECT profile_id FROM profiles WHERE user_id = auth.uid()
        )
    )
    WITH CHECK (
        profile_id IN (
            SELECT profile_id FROM profiles WHERE user_id = auth.uid()
        )
    );

-- Policy 7: Admins can access all assessments
CREATE POLICY "Admin all assessments"
    ON anxiety_assessments
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE user_id = auth.uid() 
            AND role = 'admin'
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE user_id = auth.uid() 
            AND role = 'admin'
        )
    );

-- Policy 8: Guidance can view all assessments (for counseling)
CREATE POLICY "Guidance view assessments"
    ON anxiety_assessments
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE user_id = auth.uid() 
            AND role = 'guidance'
        )
    );

-- Step 7: Grant all necessary permissions
GRANT ALL ON profiles TO authenticated;
GRANT ALL ON anxiety_assessments TO authenticated;
GRANT USAGE ON SEQUENCE profiles_id_seq TO authenticated;

-- Step 8: Test the new policies
SELECT '=== TESTING NEW POLICIES ===' as info;
SELECT COUNT(*) as profiles_accessible FROM profiles;
SELECT COUNT(*) as assessments_accessible FROM anxiety_assessments;

-- Step 9: Check guidance profile with new policies
SELECT '=== GUIDANCE PROFILE WITH NEW POLICIES ===' as info;
SELECT * FROM profiles WHERE email = 'guidance@gmail.com';

-- Step 10: Verify all policies are active
SELECT '=== ACTIVE POLICIES VERIFICATION ===' as info;
SELECT 
    tablename,
    policyname,
    cmd,
    permissive
FROM pg_policies 
WHERE tablename IN ('profiles', 'anxiety_assessments')
ORDER BY tablename, policyname;

-- Step 11: Final status and instructions
SELECT '=== FINAL STATUS ===' as info;
SELECT 'Policies have been updated to allow guidance authentication.' as status;
SELECT 'Guidance should now be able to login and access their profile.' as next_step;
SELECT 'If login still fails, the issue is in the auth system, not policies.' as note; 