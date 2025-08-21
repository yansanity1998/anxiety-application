-- Create Guidance User the Supabase Way
-- This script uses proper Supabase functions to create the guidance user
-- Run this in your Supabase SQL Editor

-- Step 1: Check current status
SELECT '🔍 Checking current guidance user status...' as status;

-- Check if guidance user exists in auth.users
SELECT 
    'Current guidance user in auth.users:' as check_type,
    id,
    email,
    role,
    encrypted_password IS NOT NULL as has_password,
    email_confirmed_at IS NOT NULL as email_confirmed
FROM auth.users 
WHERE email = 'guidance@gmail.com';

-- Check if guidance profile exists
SELECT 
    'Current guidance profile:' as check_type,
    id,
    user_id,
    email,
    role
FROM profiles 
WHERE email = 'guidance@gmail.com';

-- Step 2: Clean up any existing guidance user completely
DO $$
DECLARE
    existing_user_id UUID;
    existing_profile_id BIGINT;
BEGIN
    -- Get existing guidance user ID
    SELECT id INTO existing_user_id FROM auth.users WHERE email = 'guidance@gmail.com';
    
    IF existing_user_id IS NOT NULL THEN
        -- Get existing profile ID
        SELECT id INTO existing_profile_id FROM profiles WHERE user_id = existing_user_id;
        
        -- Delete from profiles first (due to foreign key)
        IF existing_profile_id IS NOT NULL THEN
            DELETE FROM profiles WHERE id = existing_profile_id;
            RAISE NOTICE '🗑️  Deleted existing guidance profile';
        END IF;
        
        -- Delete from auth.users
        DELETE FROM auth.users WHERE id = existing_user_id;
        RAISE NOTICE '🗑️  Deleted existing guidance user';
    ELSE
        RAISE NOTICE 'ℹ️  No existing guidance user found';
    END IF;
END $$;

-- Step 3: Create guidance user using proper Supabase approach
-- We'll use the auth.users table but with the correct structure

DO $$
DECLARE
    guidance_user_id UUID;
    instance_id UUID;
BEGIN
    -- Get the instance ID
    SELECT id INTO instance_id FROM auth.instances LIMIT 1;
    
    -- Generate a new UUID for the guidance user
    guidance_user_id := gen_random_uuid();
    
    -- Insert guidance user into auth.users with proper structure
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
        '{"provider": "email", "providers": ["email"]}',
        '{"full_name": "Guidance Counselor"}',
        NOW(),
        NOW(),
        '',
        '',
        '',
        ''
    );
    
    RAISE NOTICE '✅ Guidance user created in auth.users with ID: %', guidance_user_id;
END $$;

-- Step 4: Create the guidance profile
DO $$
DECLARE
    guidance_user_id UUID;
BEGIN
    -- Get the guidance user ID
    SELECT id INTO guidance_user_id FROM auth.users WHERE email = 'guidance@gmail.com';
    
    IF guidance_user_id IS NULL THEN
        RAISE EXCEPTION 'Failed to create guidance user in auth.users';
    END IF;
    
    -- Create the profile
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
    
    RAISE NOTICE '✅ Guidance profile created successfully';
END $$;

-- Step 5: Verify the creation
SELECT 
    '🔍 VERIFICATION RESULTS:' as info;

-- Check guidance user in auth.users
SELECT 
    'Guidance User in auth.users:' as check_type,
    CASE 
        WHEN EXISTS (SELECT 1 FROM auth.users WHERE email = 'guidance@gmail.com') 
        THEN '✅ EXISTS'
        ELSE '❌ MISSING'
    END as status,
    
    CASE 
        WHEN EXISTS (SELECT 1 FROM auth.users WHERE email = 'guidance@gmail.com' AND encrypted_password IS NOT NULL) 
        THEN '✅ Has password'
        ELSE '❌ No password'
    END as password_status,
    
    CASE 
        WHEN EXISTS (SELECT 1 FROM auth.users WHERE email = 'guidance@gmail.com' AND email_confirmed_at IS NOT NULL) 
        THEN '✅ Email confirmed'
        ELSE '❌ Email not confirmed'
    END as email_status;

-- Check guidance profile
SELECT 
    'Guidance Profile:' as check_type,
    CASE 
        WHEN EXISTS (SELECT 1 FROM profiles WHERE email = 'guidance@gmail.com') 
        THEN '✅ EXISTS'
        ELSE '❌ MISSING'
    END as status,
    
    CASE 
        WHEN EXISTS (SELECT 1 FROM profiles WHERE email = 'guidance@gmail.com' AND role = 'guidance') 
        THEN '✅ Role correct'
        ELSE '❌ Wrong role'
    END as role_status;

-- Show the actual user details
SELECT 
    'Guidance User Details:' as info,
    u.id as user_id,
    u.email,
    u.role as auth_role,
    p.role as profile_role,
    p.full_name,
    u.created_at,
    u.email_confirmed_at IS NOT NULL as email_confirmed,
    u.encrypted_password IS NOT NULL as has_password
FROM auth.users u
LEFT JOIN profiles p ON u.id = p.user_id
WHERE u.email = 'guidance@gmail.com';

-- Step 6: Test the password hash
-- This will help verify the password was encrypted correctly
SELECT 
    'Password Verification:' as check_type,
    CASE 
        WHEN crypt('guidance123', encrypted_password) = encrypted_password 
        THEN '✅ Password hash is correct'
        ELSE '❌ Password hash mismatch'
    END as password_verification
FROM auth.users 
WHERE email = 'guidance@gmail.com';

-- Step 7: Test login credentials
SELECT 
    '🧪 LOGIN TEST:' as test_type,
    'Email: guidance@gmail.com' as email,
    'Password: guidance123' as password,
    'Try logging in now with these credentials' as instruction;

-- Step 8: Alternative approach - Check if we need to use Supabase Auth API
SELECT 
    '💡 TROUBLESHOOTING:' as info,
    'If login still fails, the issue might be:' as note1,
    '1. Password encryption method not compatible' as note2,
    '2. Need to use Supabase Auth API instead' as note3,
    '3. Authentication policies blocking the user' as note4;

-- Step 9: Final status
SELECT 
    '🎯 NEXT STEPS:' as instruction,
    '1. Try logging in with guidance@gmail.com / guidance123' as step1,
    '2. Check the verification results above' as step2,
    '3. If it still fails, we may need to use Supabase Auth API' as step3,
    '4. All admin data should remain visible' as step4; 