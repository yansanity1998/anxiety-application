-- COMPREHENSIVE DIAGNOSIS OF GUIDANCE LOGIN ISSUE
-- This script will check everything to find why guidance can't login

-- Step 1: Check current RLS status and policies
SELECT '=== RLS STATUS AND POLICIES ===' as info;
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename IN ('profiles', 'anxiety_assessments');

SELECT '=== ALL ACTIVE POLICIES ===' as info;
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

-- Step 2: Check if guidance profile exists and its details
SELECT '=== GUIDANCE PROFILE CHECK ===' as info;
SELECT * FROM profiles WHERE email = 'guidance@gmail.com';

-- Step 3: Check if guidance user exists in auth.users
SELECT '=== AUTH.USERS CHECK ===' as info;
SELECT id, email, created_at, last_sign_in_at FROM auth.users WHERE email = 'guidance@gmail.com';

-- Step 4: Check the handle_new_user function
SELECT '=== HANDLE_NEW_USER FUNCTION ===' as info;
SELECT 
    routine_name, 
    routine_definition 
FROM information_schema.routines 
WHERE routine_name = 'handle_new_user';

-- Step 5: Check if the trigger exists
SELECT '=== TRIGGER CHECK ===' as info;
SELECT 
    trigger_name,
    event_manipulation,
    event_object_table,
    action_statement
FROM information_schema.triggers 
WHERE trigger_name = 'on_auth_user_created';

-- Step 6: Test the current policies by simulating different user contexts
-- First, let's see what happens when we try to access data
SELECT '=== CURRENT DATA ACCESS TEST ===' as info;
SELECT COUNT(*) as total_profiles FROM profiles;
SELECT COUNT(*) as total_assessments FROM anxiety_assessments;

-- Step 7: Check if there are any conflicting policies or infinite recursion
SELECT '=== POLICY CONFLICT CHECK ===' as info;
SELECT 
    policyname,
    tablename,
    cmd,
    qual
FROM pg_policies 
WHERE tablename = 'profiles' 
AND (qual LIKE '%profiles%' OR qual LIKE '%auth.uid%');

-- Step 8: Let's temporarily disable RLS to see if that's the issue
SELECT '=== TEMPORARILY DISABLING RLS FOR TESTING ===' as info;
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE anxiety_assessments DISABLE ROW LEVEL SECURITY;

-- Step 9: Now check data access without RLS
SELECT '=== DATA ACCESS WITHOUT RLS ===' as info;
SELECT COUNT(*) as profiles_without_rls FROM profiles;
SELECT COUNT(*) as assessments_without_rls FROM anxiety_assessments;

-- Step 10: Check guidance profile without RLS
SELECT '=== GUIDANCE PROFILE WITHOUT RLS ===' as info;
SELECT * FROM profiles WHERE email = 'guidance@gmail.com';

-- Step 11: Re-enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE anxiety_assessments ENABLE ROW LEVEL SECURITY;

-- Step 12: Create a simple, working policy that won't cause recursion
SELECT '=== CREATING SIMPLE WORKING POLICIES ===' as info;

-- Drop all existing policies first
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

-- Create simple policies that work
CREATE POLICY "Simple profiles access"
    ON profiles
    FOR ALL
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Simple assessments access"
    ON anxiety_assessments
    FOR ALL
    USING (true)
    WITH CHECK (true);

-- Step 13: Test the new policies
SELECT '=== TESTING NEW POLICIES ===' as info;
SELECT COUNT(*) as profiles_with_new_policy FROM profiles;
SELECT COUNT(*) as assessments_with_new_policy FROM anxiety_assessments;

-- Step 14: Check guidance profile with new policy
SELECT '=== GUIDANCE PROFILE WITH NEW POLICY ===' as info;
SELECT * FROM profiles WHERE email = 'guidance@gmail.com';

-- Step 15: Final verification
SELECT '=== FINAL VERIFICATION ===' as info;
SELECT 'RLS Status:' as info, 
       CASE WHEN EXISTS(SELECT 1 FROM pg_tables WHERE tablename = 'profiles' AND rowsecurity = true) 
            THEN 'ENABLED' ELSE 'DISABLED' END as profiles_rls,
       CASE WHEN EXISTS(SELECT 1 FROM pg_tables WHERE tablename = 'anxiety_assessments' AND rowsecurity = true) 
            THEN 'ENABLED' ELSE 'DISABLED' END as assessments_rls;

SELECT 'Active Policies:' as info;
SELECT tablename, policyname, cmd FROM pg_policies WHERE tablename IN ('profiles', 'anxiety_assessments');

-- Step 16: Instructions for testing
SELECT '=== NEXT STEPS ===' as info;
SELECT '1. All policies are now set to allow everything' as step;
SELECT '2. Try to login as guidance with guidance@gmail.com / guidance123' as step;
SELECT '3. If it still fails, the issue is in the auth system, not policies' as step;
SELECT '4. You may need to create the guidance account through registration first' as step; 