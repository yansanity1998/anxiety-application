-- Fix Guidance Login and Admin Data Visibility
-- This script fixes the guidance account and restores admin access
-- Run this in your Supabase SQL Editor

-- Step 1: First, let's check what's currently in the system
SELECT 'Current System Status:' as info;

-- Check existing users
SELECT 
    'Users in auth.users:' as check_type,
    id,
    email,
    role,
    created_at
FROM auth.users 
WHERE email IN ('admin@gmail.com', 'guidance@gmail.com')
ORDER BY email;

-- Check existing profiles
SELECT 
    'Profiles in profiles table:' as check_type,
    id,
    user_id,
    email,
    role,
    created_at
FROM profiles 
WHERE email IN ('admin@gmail.com', 'guidance@gmail.com')
ORDER BY email;

-- Step 2: Fix the guidance user creation (force recreate if needed)
DO $$
DECLARE
    guidance_user_id UUID;
    instance_id UUID;
    existing_user_id UUID;
BEGIN
    -- Get the instance ID
    SELECT id INTO instance_id FROM auth.instances LIMIT 1;
    
    -- Check if guidance user exists
    SELECT id INTO existing_user_id FROM auth.users WHERE email = 'guidance@gmail.com';
    
    IF existing_user_id IS NOT NULL THEN
        -- Delete existing guidance user completely
        DELETE FROM profiles WHERE user_id = existing_user_id;
        DELETE FROM auth.users WHERE id = existing_user_id;
        RAISE NOTICE '🗑️  Deleted existing guidance user to recreate properly';
    END IF;
    
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
END $$;

-- Step 3: Ensure the profiles table has the necessary structure
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' AND column_name = 'role'
    ) THEN
        ALTER TABLE profiles ADD COLUMN role TEXT DEFAULT 'user';
    END IF;
END $$;

-- Step 4: Update the handle_new_user function to support guidance role
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

-- Step 5: Manually create the guidance profile (since trigger might not fire for existing users)
DO $$
DECLARE
    profile_exists BOOLEAN;
BEGIN
    -- Check if profile exists
    SELECT EXISTS (
        SELECT 1 FROM profiles WHERE email = 'guidance@gmail.com'
    ) INTO profile_exists;
    
    IF NOT profile_exists THEN
        -- Manually create the profile
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

-- Step 6: Ensure admin profile exists and has correct role
DO $$
DECLARE
    admin_profile_exists BOOLEAN;
BEGIN
    -- Check if admin profile exists
    SELECT EXISTS (
        SELECT 1 FROM profiles WHERE email = 'admin@gmail.com'
    ) INTO admin_profile_exists;
    
    IF NOT admin_profile_exists THEN
        -- Create admin profile if it doesn't exist
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
            COALESCE(raw_user_meta_data->>'full_name', 'Admin User'),
            'admin',
            NOW(),
            NOW()
        FROM auth.users
        WHERE email = 'admin@gmail.com';
        
        RAISE NOTICE '✅ Admin profile created';
    ELSE
        -- Update admin role if it's not set correctly
        UPDATE profiles 
        SET role = 'admin' 
        WHERE email = 'admin@gmail.com' AND role != 'admin';
        
        IF FOUND THEN
            RAISE NOTICE '✅ Admin role updated';
        END IF;
    END IF;
END $$;

-- Step 7: Clear all existing policies and recreate them properly
-- This ensures no conflicts between old and new policies

-- Drop all existing policies
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can manage all profiles" ON profiles;
DROP POLICY IF EXISTS "Guidance can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Guidance can update profiles" ON profiles;
DROP POLICY IF EXISTS "Guidance can insert profiles" ON profiles;
DROP POLICY IF EXISTS "Guidance can delete profiles" ON profiles;

-- Drop anxiety assessment policies
DROP POLICY IF EXISTS "Users can view their own assessments" ON anxiety_assessments;
DROP POLICY IF EXISTS "Users can insert their own assessments" ON anxiety_assessments;
DROP POLICY IF EXISTS "Users can update their own assessments" ON anxiety_assessments;
DROP POLICY IF EXISTS "Users can delete their own assessments" ON anxiety_assessments;
DROP POLICY IF EXISTS "Admins can view all assessments" ON anxiety_assessments;
DROP POLICY IF EXISTS "Admins can manage all assessments" ON anxiety_assessments;
DROP POLICY IF EXISTS "Guidance can view anxiety assessments" ON anxiety_assessments;
DROP POLICY IF EXISTS "Guidance can insert anxiety assessments" ON anxiety_assessments;
DROP POLICY IF EXISTS "Guidance can update anxiety assessments" ON anxiety_assessments;
DROP POLICY IF EXISTS "Guidance can delete anxiety assessments" ON anxiety_assessments;

-- Step 8: Recreate all policies properly

-- Profiles table policies
-- Users can view their own profile
CREATE POLICY "Users can view their own profile"
    ON profiles
    FOR SELECT
    USING (user_id = auth.uid());

-- Users can update their own profile
CREATE POLICY "Users can update their own profile"
    ON profiles
    FOR UPDATE
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- Users can insert their own profile
CREATE POLICY "Users can insert their own profile"
    ON profiles
    FOR INSERT
    WITH CHECK (user_id = auth.uid());

-- Admins can view all profiles
CREATE POLICY "Admins can view all profiles"
    ON profiles
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE user_id = auth.uid()
            AND role = 'admin'
        )
    );

-- Admins can manage all profiles
CREATE POLICY "Admins can manage all profiles"
    ON profiles
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE user_id = auth.uid()
            AND role = 'admin'
        )
    );

-- Guidance can view all profiles
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

-- Guidance can update profiles
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

-- Guidance can insert profiles
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

-- Guidance can delete profiles
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

-- Anxiety assessments table policies
-- Users can view their own assessments
CREATE POLICY "Users can view their own assessments"
    ON anxiety_assessments
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = anxiety_assessments.profile_id
            AND profiles.user_id = auth.uid()
        )
    );

-- Users can insert their own assessments
CREATE POLICY "Users can insert their own assessments"
    ON anxiety_assessments
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = anxiety_assessments.profile_id
            AND profiles.user_id = auth.uid()
        )
    );

-- Users can update their own assessments
CREATE POLICY "Users can update their own assessments"
    ON anxiety_assessments
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = anxiety_assessments.profile_id
            AND profiles.user_id = auth.uid()
        )
    );

-- Users can delete their own assessments
CREATE POLICY "Users can delete their own assessments"
    ON anxiety_assessments
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = anxiety_assessments.profile_id
            AND profiles.user_id = auth.uid()
        )
    );

-- Admins can view all assessments
CREATE POLICY "Admins can view all assessments"
    ON anxiety_assessments
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE user_id = auth.uid()
            AND role = 'admin'
        )
    );

-- Admins can manage all assessments
CREATE POLICY "Admins can manage all assessments"
    ON anxiety_assessments
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE user_id = auth.uid()
            AND role = 'admin'
        )
    );

-- Guidance can view all assessments
CREATE POLICY "Guidance can view all assessments"
    ON anxiety_assessments
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE user_id = auth.uid()
            AND role = 'guidance'
        )
    );

-- Guidance can insert assessments
CREATE POLICY "Guidance can insert assessments"
    ON anxiety_assessments
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE user_id = auth.uid()
            AND role = 'guidance'
        )
    );

-- Guidance can update assessments
CREATE POLICY "Guidance can update assessments"
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

-- Guidance can delete assessments
CREATE POLICY "Guidance can delete assessments"
    ON anxiety_assessments
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE user_id = auth.uid()
            AND role = 'guidance'
        )
    );

-- Step 9: Ensure the trigger is properly set up
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION handle_new_user();

-- Step 10: Grant necessary permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON anxiety_assessments TO authenticated;

-- Step 11: Verification
SELECT 
    '🔧 FIX COMPLETED' as status,
    'Guidance account should now work' as guidance_status,
    'Admin data should now be visible' as admin_status;

-- Show current status
SELECT 
    'Current Users:' as info,
    u.email,
    u.role as auth_role,
    p.role as profile_role,
    p.full_name
FROM auth.users u
LEFT JOIN profiles p ON u.id = p.user_id
WHERE u.email IN ('admin@gmail.com', 'guidance@gmail.com')
ORDER BY u.email;

-- Show all policies
SELECT 
    'All Policies:' as info,
    tablename,
    policyname,
    cmd,
    permissive
FROM pg_policies 
ORDER BY tablename, policyname;

-- Final instructions
SELECT 
    '🎯 NEXT STEPS:' as instruction,
    '1. Try logging in with guidance@gmail.com / guidance123' as step1,
    '2. Admin data should now be visible' as step2,
    '3. All policies have been reset and recreated' as step3,
    '4. If issues persist, check the verification results above' as step4; 