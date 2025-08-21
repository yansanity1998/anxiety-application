-- Simple Guidance User Fix
-- This script directly creates the guidance user in the simplest way possible
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

-- Step 2: Delete existing guidance user if it exists (to recreate cleanly)
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

-- Step 3: Create guidance user using Supabase's built-in function
-- This is the most reliable way to create a user
SELECT 
    'Creating guidance user using Supabase function...' as status;

-- Use the auth.users table directly with minimal required fields
INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    created_at,
    updated_at,
    raw_app_meta_data,
    raw_user_meta_data
)
SELECT 
    (SELECT id FROM auth.instances LIMIT 1),
    gen_random_uuid(),
    'authenticated',
    'authenticated',
    'guidance@gmail.com',
    crypt('guidance123', gen_salt('bf')),
    NOW(),
    NOW(),
    NOW(),
    '{"provider": "email", "providers": ["email"]}',
    '{"full_name": "Guidance Counselor"}'
WHERE NOT EXISTS (
    SELECT 1 FROM auth.users WHERE email = 'guidance@gmail.com'
);

-- Step 4: Create the guidance profile
DO $$
DECLARE
    guidance_user_id UUID;
    profile_exists BOOLEAN;
BEGIN
    -- Get the guidance user ID
    SELECT id INTO guidance_user_id FROM auth.users WHERE email = 'guidance@gmail.com';
    
    IF guidance_user_id IS NULL THEN
        RAISE EXCEPTION 'Failed to create guidance user in auth.users';
    END IF;
    
    -- Check if profile already exists
    SELECT EXISTS (
        SELECT 1 FROM profiles WHERE user_id = guidance_user_id
    ) INTO profile_exists;
    
    IF NOT profile_exists THEN
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
    ELSE
        -- Update existing profile
        UPDATE profiles 
        SET email = 'guidance@gmail.com',
            full_name = 'Guidance Counselor',
            role = 'guidance',
            last_sign_in = NOW()
        WHERE user_id = guidance_user_id;
        
        RAISE NOTICE '✅ Guidance profile updated successfully';
    END IF;
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
    u.email_confirmed_at IS NOT NULL as email_confirmed
FROM auth.users u
LEFT JOIN profiles p ON u.id = p.user_id
WHERE u.email = 'guidance@gmail.com';

-- Step 6: Test login credentials
SELECT 
    '🧪 LOGIN TEST:' as test_type,
    'Email: guidance@gmail.com' as email,
    'Password: guidance123' as password,
    'Try logging in now with these credentials' as instruction;

-- Step 7: Final status
SELECT 
    '🎯 NEXT STEPS:' as instruction,
    '1. Try logging in with guidance@gmail.com / guidance123' as step1,
    '2. If it works, the guidance account is fixed' as step2,
    '3. If it still fails, check the verification results above' as step3,
    '4. All admin data should remain visible' as step4; 