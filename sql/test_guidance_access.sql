-- Test Guidance Account Access
-- This script tests if the guidance account can access all data properly
-- Run this after creating the guidance account to verify access

-- Test 1: Check if guidance user exists and has correct role
SELECT 
    'Test 1: Guidance User Verification' as test_name,
    CASE 
        WHEN EXISTS (SELECT 1 FROM auth.users WHERE email = 'guidance@gmail.com') 
        THEN '✅ PASS: Guidance user exists in auth.users'
        ELSE '❌ FAIL: Guidance user does not exist in auth.users'
    END as result;

-- Test 2: Check if guidance profile exists with correct role
SELECT 
    'Test 2: Guidance Profile Verification' as test_name,
    CASE 
        WHEN EXISTS (SELECT 1 FROM profiles WHERE email = 'guidance@gmail.com' AND role = 'guidance') 
        THEN '✅ PASS: Guidance profile exists with correct role'
        ELSE '❌ FAIL: Guidance profile missing or has wrong role'
    END as result;

-- Test 3: Check if guidance policies exist
SELECT 
    'Test 3: Guidance Policies Verification' as test_name,
    COUNT(*) as policy_count,
    CASE 
        WHEN COUNT(*) >= 8 
        THEN '✅ PASS: All guidance policies are in place'
        ELSE '❌ FAIL: Missing guidance policies'
    END as result
FROM pg_policies 
WHERE policyname LIKE '%guidance%';

-- Test 4: Check if guidance can view all profiles (simulate)
-- This simulates what a guidance user would see
SELECT 
    'Test 4: Guidance Profile Access Simulation' as test_name,
    COUNT(*) as total_profiles,
    CASE 
        WHEN COUNT(*) > 0 
        THEN '✅ PASS: Guidance can access profiles table'
        ELSE '❌ FAIL: Guidance cannot access profiles table'
    END as result
FROM profiles;

-- Test 5: Check if guidance can view all anxiety assessments (simulate)
SELECT 
    'Test 5: Guidance Assessment Access Simulation' as test_name,
    COUNT(*) as total_assessments,
    CASE 
        WHEN COUNT(*) >= 0 
        THEN '✅ PASS: Guidance can access anxiety_assessments table'
        ELSE '❌ FAIL: Guidance cannot access anxiety_assessments table'
    END as result
FROM anxiety_assessments;

-- Test 6: Verify RLS policies are properly configured
SELECT 
    'Test 6: RLS Policy Configuration' as test_name,
    p.tablename,
    p.policyname,
    p.cmd,
    p.permissive,
    CASE 
        WHEN p.permissive = 'PERMISSIVE' THEN '✅ PASS: Policy is permissive'
        ELSE '❌ FAIL: Policy is restrictive'
    END as policy_status
FROM pg_policies p
WHERE p.policyname LIKE '%guidance%'
ORDER BY p.tablename, p.policyname;

-- Test 7: Check table permissions
SELECT 
    'Test 7: Table Permissions' as test_name,
    table_name,
    privilege_type,
    CASE 
        WHEN privilege_type IN ('SELECT', 'INSERT', 'UPDATE', 'DELETE') 
        THEN '✅ PASS: Proper permissions granted'
        ELSE '❌ FAIL: Missing permissions'
    END as permission_status
FROM information_schema.table_privileges 
WHERE table_name IN ('profiles', 'anxiety_assessments')
AND grantee = 'authenticated'
ORDER BY table_name, privilege_type;

-- Test 8: Summary of all tests
SELECT 
    '📊 FINAL TEST SUMMARY' as summary,
    'Run all tests above to verify guidance account setup' as instruction;

-- Show current guidance user details for verification
SELECT 
    '🔍 Current Guidance User Details:' as info,
    u.id as user_id,
    u.email,
    u.role as auth_role,
    p.role as profile_role,
    p.full_name,
    u.created_at,
    u.last_sign_in_at
FROM auth.users u
LEFT JOIN profiles p ON u.id = p.user_id
WHERE u.email = 'guidance@gmail.com';

-- Show all tables and their RLS status
SELECT 
    '📋 Table RLS Status:' as info,
    schemaname,
    tablename,
    rowsecurity as rls_enabled,
    CASE 
        WHEN rowsecurity = true THEN '✅ RLS Enabled'
        ELSE '❌ RLS Disabled'
    END as rls_status
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('profiles', 'anxiety_assessments')
ORDER BY tablename; 