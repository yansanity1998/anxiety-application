-- Create Guidance User in Authentication System
-- This script creates the guidance user in auth.users (same as admin)
-- Run this in your Supabase SQL Editor

-- Step 1: Create the guidance user in auth.users
-- This creates the actual user account in the authentication system
DO $$
DECLARE
    guidance_user_id UUID;
    instance_id UUID;
BEGIN
    -- Get the instance ID
    SELECT id INTO instance_id FROM auth.instances LIMIT 1;
    
    -- Check if guidance user already exists
    IF NOT EXISTS (
        SELECT 1 FROM auth.users WHERE email = 'guidance@gmail.com'
    ) THEN
        -- Generate a new UUID for the guidance user
        guidance_user_id := gen_random_uuid();
        
        -- Insert guidance user into auth.users
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
        
    ELSE
        RAISE NOTICE 'ℹ️  Guidance user already exists in auth.users';
    END IF;
END $$;

-- Step 2: Verify the guidance user was created
SELECT 
    'Guidance User in auth.users:' as check_type,
    id,
    email,
    role,
    created_at,
    last_sign_in_at,
    raw_user_meta_data
FROM auth.users 
WHERE email = 'guidance@gmail.com';

-- Step 3: Check if the trigger created the profile automatically
-- The handle_new_user function should have created a profile entry
SELECT 
    'Profile created by trigger:' as check_type,
    user_id,
    email, 
    full_name, 
    role, 
    created_at 
FROM profiles 
WHERE email = 'guidance@gmail.com';

-- Step 4: Summary
SELECT 
    CASE 
        WHEN EXISTS (SELECT 1 FROM auth.users WHERE email = 'guidance@gmail.com') 
        THEN '✅ Guidance user created in auth.users'
        ELSE '❌ Guidance user NOT created in auth.users'
    END as auth_status,
    
    CASE 
        WHEN EXISTS (SELECT 1 FROM profiles WHERE email = 'guidance@gmail.com') 
        THEN '✅ Profile created by trigger'
        ELSE '❌ Profile NOT created by trigger'
    END as profile_status;

-- Step 5: Instructions for first login
SELECT 
    '📋 Next Steps:' as instruction,
    '1. The guidance user is now created in the authentication system' as step1,
    '2. You can login with guidance@gmail.com / guidance123' as step2,
    '3. The system will automatically redirect to /guidance' as step3,
    '4. The guidance dashboard will have full admin privileges' as step4; 