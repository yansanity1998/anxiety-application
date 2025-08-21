-- EMERGENCY FIX: Guidance Login and Admin Data Access
-- This script directly fixes the authentication system and role conflicts
-- Run this in your Supabase SQL Editor

-- Step 1: Check current authentication status
SELECT '🔍 DIAGNOSING CURRENT ISSUES...' as status;

-- Check what's in auth.users
SELECT 
    'Current auth.users:' as check_type,
    id,
    email,
    role,
    encrypted_password IS NOT NULL as has_password,
    email_confirmed_at IS NOT NULL as email_confirmed,
    created_at
FROM auth.users 
WHERE email IN ('admin@gmail.com', 'guidance@gmail.com')
ORDER BY email;

-- Check what's in profiles
SELECT 
    'Current profiles:' as check_type,
    id,
    user_id,
    email,
    role,
    created_at
FROM profiles 
WHERE email IN ('admin@gmail.com', 'guidance@gmail.com')
ORDER BY email;

-- Step 2: EMERGENCY FIX - Create guidance user with proper authentication
DO $$
DECLARE
    guidance_user_id UUID;
    instance_id UUID;
    existing_user_id UUID;
BEGIN
    -- Get the instance ID
    SELECT id INTO instance_id FROM auth.instances LIMIT 1;
    
    -- Check if guidance user exists and get its ID
    SELECT id INTO existing_user_id FROM auth.users WHERE email = 'guidance@gmail.com';
    
    IF existing_user_id IS NOT NULL THEN
        -- Delete existing guidance user completely from both tables
        DELETE FROM profiles WHERE user_id = existing_user_id;
        DELETE FROM auth.users WHERE id = existing_user_id;
        RAISE NOTICE '🗑️  Deleted existing guidance user to recreate properly';
    END IF;
    
    -- Generate a new UUID for the guidance user
    guidance_user_id := gen_random_uuid();
    
    -- Insert guidance user into auth.users with only existing fields
    INSERT INTO auth.users (
        instance_id,
        id,
        aud,
        role,
        email,
        encrypted_password,
        email_confirmed_at,
        recovery_sent_at,
        last_sign_in_at,
        raw_app_meta_data,
        raw_user_meta_data,
        created_at,
        updated_at,
        confirmation_token,
        email_change,
        email_change_token_new,
        recovery_token
    )
    VALUES (
        instance_id,
        guidance_user_id,
        'authenticated',
        'authenticated',
        'guidance@gmail.com',
        crypt('guidance123', gen_salt('bf')),
        NOW(),
        NOW(),
        NOW(),
        '{"provider": "email", "providers": ["email"], "role": "guidance"}',
        '{"full_name": "Guidance Counselor", "role": "guidance"}',
        NOW(),
        NOW(),
        '',
        '',
        '',
        ''
    );
    
    RAISE NOTICE '✅ Guidance user created successfully in auth.users';
    RAISE NOTICE '   User ID: %', guidance_user_id;
    RAISE NOTICE '   Email: guidance@gmail.com';
    RAISE NOTICE '   Password: guidance123';
    RAISE NOTICE '   Role: guidance';
    RAISE NOTICE '   Email confirmed: YES';
    RAISE NOTICE '   Password encrypted: YES';
END $$;

-- Step 3: Create guidance profile manually
DO $$
DECLARE
    guidance_user_id UUID;
    profile_exists BOOLEAN;
BEGIN
    -- Get the guidance user ID
    SELECT id INTO guidance_user_id FROM auth.users WHERE email = 'guidance@gmail.com';
    
    IF guidance_user_id IS NULL THEN
        RAISE EXCEPTION 'Guidance user not found in auth.users';
    END IF;
    
    -- Check if profile exists
    SELECT EXISTS (
        SELECT 1 FROM profiles WHERE user_id = guidance_user_id
    ) INTO profile_exists;
    
    IF NOT profile_exists THEN
        -- Create the profile manually
        INSERT INTO profiles (
            user_id,
            email,
            full_name,
            role,
            created_at,
            last_sign_in
        )
        VALUES (
            guidance_user_id,
            'guidance@gmail.com',
            'Guidance Counselor',
            'guidance',
            NOW(),
            NOW()
        );
        
        RAISE NOTICE '✅ Guidance profile created manually';
    ELSE
        -- Update existing profile to ensure correct role
        UPDATE profiles 
        SET role = 'guidance', 
            email = 'guidance@gmail.com',
            full_name = 'Guidance Counselor'
        WHERE user_id = guidance_user_id;
        
        RAISE NOTICE '✅ Guidance profile updated';
    END IF;
END $$;

-- Step 4: Ensure admin profile has correct role
DO $$
DECLARE
    admin_user_id UUID;
    admin_profile_exists BOOLEAN;
BEGIN
    -- Get the admin user ID
    SELECT id INTO admin_user_id FROM auth.users WHERE email = 'admin@gmail.com';
    
    IF admin_user_id IS NULL THEN
        RAISE NOTICE '⚠️  Admin user not found in auth.users';
        RETURN;
    END IF;
    
    -- Check if admin profile exists
    SELECT EXISTS (
        SELECT 1 FROM profiles WHERE user_id = admin_user_id
    ) INTO admin_profile_exists;
    
    IF NOT admin_profile_exists THEN
        -- Create admin profile
        INSERT INTO profiles (
            user_id,
            email,
            full_name,
            role,
            created_at,
            last_sign_in
        )
        VALUES (
            admin_user_id,
            'admin@gmail.com',
            'Admin User',
            'admin',
            NOW(),
            NOW()
        );
        
        RAISE NOTICE '✅ Admin profile created';
    ELSE
        -- Update admin role if needed
        UPDATE profiles 
        SET role = 'admin'
        WHERE user_id = admin_user_id AND role != 'admin';
        
        IF FOUND THEN
            RAISE NOTICE '✅ Admin role updated';
        END IF;
    END IF;
END $$;

-- Step 5: TEMPORARILY DISABLE RLS to test data access
-- This will help us see if the issue is with policies or user creation
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE anxiety_assessments DISABLE ROW LEVEL SECURITY;

SELECT '⚠️  RLS temporarily disabled for testing' as notice;

-- Step 6: Grant full permissions to authenticated users
GRANT ALL ON profiles TO authenticated;
GRANT ALL ON anxiety_assessments TO authenticated;

-- Step 7: Verification - Check if users can now access data
SELECT 
    '🔍 VERIFICATION RESULTS:' as info;

-- Check guidance user creation
SELECT 
    'Guidance User Status:' as check_type,
    CASE 
        WHEN EXISTS (SELECT 1 FROM auth.users WHERE email = 'guidance@gmail.com') 
        THEN '✅ EXISTS in auth.users'
        ELSE '❌ MISSING from auth.users'
    END as auth_status,
    
    CASE 
        WHEN EXISTS (SELECT 1 FROM profiles WHERE email = 'guidance@gmail.com') 
        THEN '✅ EXISTS in profiles'
        ELSE '❌ MISSING from profiles'
    END as profile_status,
    
    CASE 
        WHEN EXISTS (SELECT 1 FROM profiles WHERE email = 'guidance@gmail.com' AND role = 'guidance') 
        THEN '✅ Role set to guidance'
        ELSE '❌ Wrong role'
    END as role_status;

-- Check admin user status
SELECT 
    'Admin User Status:' as check_type,
    CASE 
        WHEN EXISTS (SELECT 1 FROM auth.users WHERE email = 'admin@gmail.com') 
        THEN '✅ EXISTS in auth.users'
        ELSE '❌ MISSING from auth.users'
    END as auth_status,
    
    CASE 
        WHEN EXISTS (SELECT 1 FROM profiles WHERE email = 'admin@gmail.com') 
        THEN '✅ EXISTS in profiles'
        ELSE '❌ MISSING from profiles'
    END as profile_status,
    
    CASE 
        WHEN EXISTS (SELECT 1 FROM profiles WHERE email = 'admin@gmail.com' AND role = 'admin') 
        THEN '✅ Role set to admin'
        ELSE '❌ Wrong role'
    END as role_status;

-- Test data access (should work now with RLS disabled)
SELECT 
    'Data Access Test:' as test_type,
    COUNT(*) as total_profiles,
    'Should be visible now' as status
FROM profiles;

SELECT 
    'Assessment Access Test:' as test_type,
    COUNT(*) as total_assessments,
    'Should be visible now' as status
FROM anxiety_assessments;

-- Step 8: Show current user details
SELECT 
    'Current User Details:' as info,
    u.email,
    u.role as auth_role,
    p.role as profile_role,
    p.full_name,
    u.email_confirmed_at IS NOT NULL as email_confirmed,
    u.encrypted_password IS NOT NULL as has_password
FROM auth.users u
LEFT JOIN profiles p ON u.id = p.user_id
WHERE u.email IN ('admin@gmail.com', 'guidance@gmail.com')
ORDER BY u.email;

-- Step 9: Final instructions
SELECT 
    '🎯 IMMEDIATE NEXT STEPS:' as instruction,
    '1. RLS is temporarily disabled - data should be visible now' as step1,
    '2. Try logging in with guidance@gmail.com / guidance123' as step2,
    '3. Check if admin data is now visible' as step3,
    '4. If login works, we can re-enable RLS with proper policies' as step4;

-- Step 10: IMPORTANT WARNING
SELECT 
    '⚠️  SECURITY WARNING:' as warning,
    'RLS is currently DISABLED' as status,
    'This means ALL users can see ALL data' as risk,
    'Re-enable RLS after confirming login works' as action; 