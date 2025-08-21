-- Complete Guidance Account Setup
-- This script creates a guidance account (guidance@gmail.com / guidance123) and sets up all policies
-- Run this in your Supabase SQL Editor to create the guidance account with full access

-- Step 1: Create the guidance user in auth.users
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

-- Step 2: Ensure the profiles table has the necessary structure
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' AND column_name = 'role'
    ) THEN
        ALTER TABLE profiles ADD COLUMN role TEXT DEFAULT 'user';
    END IF;
END $$;

-- Step 3: Update the handle_new_user function to support guidance role
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

-- Step 4: Create comprehensive RLS policies for guidance users
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

-- Step 5: Create comprehensive RLS policies for anxiety_assessments table
-- Policy to allow guidance users to view all anxiety assessments
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

-- Step 6: Ensure the trigger is properly set up
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION handle_new_user();

-- Step 7: Grant necessary permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON anxiety_assessments TO authenticated;

-- Step 8: Verify the guidance user was created and profile exists
-- Check if the trigger created the profile automatically
DO $$
DECLARE
    profile_exists BOOLEAN;
BEGIN
    -- Check if profile exists
    SELECT EXISTS (
        SELECT 1 FROM profiles WHERE email = 'guidance@gmail.com'
    ) INTO profile_exists;
    
    IF NOT profile_exists THEN
        -- Manually create the profile if it doesn't exist
        INSERT INTO profiles (
            user_id,
            email,
            full_name,
            role,
            created_at,
            last_sign_in
        )
        SELECT 
            id,
            email,
            COALESCE(raw_user_meta_data->>'full_name', 'Guidance Counselor'),
            'guidance',
            NOW(),
            NOW()
        FROM auth.users
        WHERE email = 'guidance@gmail.com';
        
        RAISE NOTICE '✅ Profile created manually for guidance user';
    ELSE
        RAISE NOTICE 'ℹ️  Profile already exists for guidance user';
    END IF;
END $$;

-- Step 9: Summary and verification
SELECT 
    '📋 GUIDANCE ACCOUNT SETUP COMPLETED' as status,
    'Email: guidance@gmail.com' as email,
    'Password: guidance123' as password,
    'Role: guidance' as role,
    'Access: Full access to all data' as access_level;

-- Verify the setup
SELECT 
    CASE 
        WHEN EXISTS (SELECT 1 FROM auth.users WHERE email = 'guidance@gmail.com') 
        THEN '✅ Guidance user created in auth.users'
        ELSE '❌ Guidance user NOT created in auth.users'
    END as auth_status,
    
    CASE 
        WHEN EXISTS (SELECT 1 FROM profiles WHERE email = 'guidance@gmail.com') 
        THEN '✅ Profile created for guidance user'
        ELSE '❌ Profile NOT created for guidance user'
    END as profile_status,
    
    CASE 
        WHEN EXISTS (SELECT 1 FROM profiles WHERE email = 'guidance@gmail.com' AND role = 'guidance') 
        THEN '✅ Guidance role assigned correctly'
        ELSE '❌ Guidance role NOT assigned correctly'
    END as role_status;

-- Show the created guidance user details
SELECT 
    'Guidance User Details:' as info,
    u.id as user_id,
    u.email,
    u.role as auth_role,
    p.role as profile_role,
    p.full_name,
    u.created_at
FROM auth.users u
LEFT JOIN profiles p ON u.id = p.user_id
WHERE u.email = 'guidance@gmail.com';

-- Show all guidance-related policies
SELECT 
    'Guidance Policies:' as info,
    schemaname,
    tablename,
    policyname,
    cmd,
    permissive
FROM pg_policies 
WHERE policyname LIKE '%guidance%'
ORDER BY tablename, policyname;

-- Final instructions
SELECT 
    '🎯 NEXT STEPS:' as instruction,
    '1. The guidance account is now ready to use' as step1,
    '2. Login with: guidance@gmail.com / guidance123' as step2,
    '3. The guidance user has full access to all data' as step3,
    '4. All existing admin and user data remains unchanged' as step4,
    '5. The guidance role has the same privileges as admin' as step5; 