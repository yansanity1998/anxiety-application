-- Create Guidance User via Supabase Auth API
-- This is the PROPER way to create users in Supabase
-- Manual insertion into auth.users often doesn't work for authentication

-- Step 1: Check current status
SELECT '🔍 Current guidance user status:' as status;

-- Check if guidance user exists in auth.users
SELECT 
    'Guidance user in auth.users:' as check_type,
    id,
    email,
    role,
    encrypted_password IS NOT NULL as has_password,
    email_confirmed_at IS NOT NULL as email_confirmed
FROM auth.users 
WHERE email = 'guidance@gmail.com';

-- Check if guidance profile exists
SELECT 
    'Guidance profile:' as check_type,
    id,
    user_id,
    email,
    role
FROM profiles 
WHERE email = 'guidance@gmail.com';

-- Step 2: IMPORTANT - The proper way to create users
SELECT 
    '🚨 IMPORTANT INFORMATION:' as warning,
    'Manual insertion into auth.users often fails for authentication' as reason1,
    'Supabase requires proper user creation via Auth API' as reason2,
    'The database approach may not work for login' as reason3;

-- Step 3: Clean up any existing broken guidance user
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

-- Step 4: Instructions for proper user creation
SELECT 
    '📋 PROPER WAY TO CREATE GUIDANCE USER:' as instruction,
    '1. Go to Supabase Dashboard → Authentication → Users' as step1,
    '2. Click "Add User"' as step2,
    '3. Enter: guidance@gmail.com' as step3,
    '4. Enter password: guidance123' as step4,
    '5. Check "Auto-confirm email"' as step5,
    '6. Click "Create User"' as step6;

-- Step 5: Alternative - Use Supabase CLI or API
SELECT 
    '🔧 ALTERNATIVE METHODS:' as method,
    'Option 1: Supabase Dashboard (Recommended)' as option1,
    'Option 2: Supabase CLI command' as option2,
    'Option 3: REST API call' as option3;

-- Step 6: Supabase CLI command (if you have CLI installed)
SELECT 
    '💻 Supabase CLI Command:' as cli_info,
    'supabase auth admin create-user' as command,
    '--email guidance@gmail.com' as param1,
    '--password guidance123' as param2,
    '--email-confirm' as param3;

-- Step 7: REST API approach
SELECT 
    '🌐 REST API Call:' as api_info,
    'POST /auth/v1/admin/users' as endpoint,
    'Headers: Authorization: Bearer YOUR_SERVICE_ROLE_KEY' as header,
    'Body: {"email":"guidance@gmail.com","password":"guidance123","email_confirm":true}' as body;

-- Step 8: After creating user via proper method
SELECT 
    '✅ AFTER CREATING USER VIA AUTH:' as next_step,
    '1. The user will appear in auth.users automatically' as step1,
    '2. Run the profile creation script below' as step2,
    '3. Test login with guidance@gmail.com / guidance123' as step3;

-- Step 9: Profile creation script (run this AFTER creating user via Auth)
SELECT 
    '📝 PROFILE CREATION SCRIPT:' as script_info,
    'Run this AFTER creating the user via Supabase Auth:' as instruction;

-- This script will create the profile once the user exists in auth.users
DO $$
DECLARE
    guidance_user_id UUID;
    profile_exists BOOLEAN;
BEGIN
    -- Check if guidance user exists (created via Auth)
    SELECT id INTO guidance_user_id FROM auth.users WHERE email = 'guidance@gmail.com';
    
    IF guidance_user_id IS NULL THEN
        RAISE NOTICE '❌ Guidance user not found. Create user via Supabase Auth first.';
        RETURN;
    END IF;
    
    -- Check if profile exists
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

-- Step 10: Final verification
SELECT 
    '🔍 FINAL VERIFICATION:' as verification;

-- Check if guidance user exists
SELECT 
    'Guidance User Status:' as check_type,
    CASE 
        WHEN EXISTS (SELECT 1 FROM auth.users WHERE email = 'guidance@gmail.com') 
        THEN '✅ EXISTS in auth.users'
        ELSE '❌ MISSING - Create via Supabase Auth first'
    END as auth_status;

-- Check if guidance profile exists
SELECT 
    'Guidance Profile Status:' as check_type,
    CASE 
        WHEN EXISTS (SELECT 1 FROM profiles WHERE email = 'guidance@gmail.com') 
        THEN '✅ EXISTS in profiles'
        ELSE '❌ MISSING - Run profile creation script'
    END as profile_status;

-- Final instructions
SELECT 
    '🎯 SUMMARY:' as summary,
    '1. Create guidance user via Supabase Dashboard → Authentication → Users' as step1,
    '2. Run this script to create the profile' as step2,
    '3. Test login with guidance@gmail.com / guidance123' as step3,
    '4. Manual database insertion often fails for authentication' as note; 