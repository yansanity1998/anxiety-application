-- Fix login issue by improving the handle_new_user function and adding a fallback mechanism
-- Run this in your Supabase SQL Editor

-- 1. First, let's improve the handle_new_user function to be more robust
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    is_admin BOOLEAN;
BEGIN
    -- Check if the user is admin
    is_admin := NEW.email = 'admin@gmail.com';
    
    -- Debug log
    RAISE LOG 'Creating new profile for %: Raw metadata: %', NEW.email, NEW.raw_user_meta_data;
    
    -- Check if profile already exists to avoid duplicates
    IF EXISTS (SELECT 1 FROM public.profiles WHERE user_id = NEW.id) THEN
        RAISE LOG 'Profile already exists for user %', NEW.email;
        RETURN NEW;
    END IF;
    
    INSERT INTO public.profiles (
        user_id, 
        email, 
        full_name,
        id_number,
        age,
        gender,
        school,
        course,
        year_level,
        phone_number,
        guardian_name,
        guardian_phone_number,
        address,
        role,
        created_at,
        last_sign_in,
        streak,
        last_activity_date
    )
    VALUES (
        NEW.id, 
        NEW.email, 
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', 'User'),
        NEW.raw_user_meta_data->>'id_number',
        (NEW.raw_user_meta_data->>'age')::INTEGER,
        NEW.raw_user_meta_data->>'gender',
        NEW.raw_user_meta_data->>'school',
        NEW.raw_user_meta_data->>'course',
        (NEW.raw_user_meta_data->>'year_level')::INTEGER,
        NEW.raw_user_meta_data->>'phone_number',
        NEW.raw_user_meta_data->>'guardian_name',
        NEW.raw_user_meta_data->>'guardian_phone_number',
        NEW.raw_user_meta_data->>'address',
        CASE WHEN is_admin THEN 'admin' ELSE 'student' END,
        NOW(),
        NOW(),
        1,
        CURRENT_DATE
    );
    
    RAISE LOG 'Profile created successfully for user %', NEW.email;
    RETURN NEW;
EXCEPTION WHEN OTHERS THEN
    -- Log the error but don't fail the user creation
    RAISE LOG 'Error creating profile for user %: %', NEW.email, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Create a function to ensure profile exists (for login fallback)
CREATE OR REPLACE FUNCTION ensure_profile_exists(user_id_param UUID)
RETURNS BOOLEAN AS $$
DECLARE
    user_email TEXT;
    user_metadata JSONB;
    is_admin BOOLEAN;
BEGIN
    -- Get user data from auth.users
    SELECT email, raw_user_meta_data INTO user_email, user_metadata
    FROM auth.users
    WHERE id = user_id_param;
    
    IF NOT FOUND THEN
        RAISE LOG 'User not found: %', user_id_param;
        RETURN FALSE;
    END IF;
    
    -- Check if profile already exists
    IF EXISTS (SELECT 1 FROM public.profiles WHERE user_id = user_id_param) THEN
        RAISE LOG 'Profile already exists for user %', user_email;
        RETURN TRUE;
    END IF;
    
    -- Check if admin
    is_admin := user_email = 'admin@gmail.com';
    
    -- Create profile
    INSERT INTO public.profiles (
        user_id,
        email,
        full_name,
        id_number,
        age,
        gender,
        school,
        course,
        year_level,
        phone_number,
        guardian_name,
        guardian_phone_number,
        address,
        role,
        created_at,
        last_sign_in,
        streak,
        last_activity_date
    )
    VALUES (
        user_id_param,
        user_email,
        COALESCE(user_metadata->>'full_name', user_metadata->>'name', 'User'),
        user_metadata->>'id_number',
        (user_metadata->>'age')::INTEGER,
        user_metadata->>'gender',
        user_metadata->>'school',
        user_metadata->>'course',
        (user_metadata->>'year_level')::INTEGER,
        user_metadata->>'phone_number',
        user_metadata->>'guardian_name',
        user_metadata->>'guardian_phone_number',
        user_metadata->>'address',
        CASE WHEN is_admin THEN 'admin' ELSE 'student' END,
        NOW(),
        NOW(),
        1,
        CURRENT_DATE
    );
    
    RAISE LOG 'Profile created for existing user %', user_email;
    RETURN TRUE;
EXCEPTION WHEN OTHERS THEN
    RAISE LOG 'Error ensuring profile exists for user %: %', user_id_param, SQLERRM;
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Create a function to handle login profile verification
CREATE OR REPLACE FUNCTION verify_login_profile(user_id_param UUID)
RETURNS JSONB AS $$
DECLARE
    profile_data JSONB;
    user_exists BOOLEAN;
    profile_exists BOOLEAN;
BEGIN
    -- Check if user exists in auth.users
    SELECT EXISTS(SELECT 1 FROM auth.users WHERE id = user_id_param) INTO user_exists;
    
    IF NOT user_exists THEN
        RETURN jsonb_build_object('success', false, 'error', 'User not found');
    END IF;
    
    -- Check if profile exists
    SELECT EXISTS(SELECT 1 FROM public.profiles WHERE user_id = user_id_param) INTO profile_exists;
    
    IF NOT profile_exists THEN
        -- Try to create profile
        SELECT ensure_profile_exists(user_id_param) INTO profile_exists;
    END IF;
    
    -- Get profile data
    SELECT to_jsonb(p.*) INTO profile_data
    FROM public.profiles p
    WHERE p.user_id = user_id_param;
    
    IF profile_data IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Failed to retrieve profile');
    END IF;
    
    RETURN jsonb_build_object('success', true, 'profile', profile_data);
EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Grant permissions for the new functions
GRANT EXECUTE ON FUNCTION ensure_profile_exists(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION ensure_profile_exists(UUID) TO service_role;
GRANT EXECUTE ON FUNCTION ensure_profile_exists(UUID) TO anon;

GRANT EXECUTE ON FUNCTION verify_login_profile(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION verify_login_profile(UUID) TO service_role;
GRANT EXECUTE ON FUNCTION verify_login_profile(UUID) TO anon;

-- 5. Update RLS policies to ensure they work for login
DROP POLICY IF EXISTS "Allow users to insert their own profiles" ON public.profiles;
CREATE POLICY "Allow users to insert their own profiles" 
ON public.profiles FOR INSERT
WITH CHECK (true);

-- 6. Test the functions
-- This will show you if the functions were created successfully
SELECT 
    routine_name, 
    routine_type,
    data_type
FROM information_schema.routines 
WHERE routine_name IN ('handle_new_user', 'ensure_profile_exists', 'verify_login_profile')
AND routine_schema = 'public'
ORDER BY routine_name;

-- 7. Check current profiles to see if there are any issues
SELECT 
    user_id,
    email,
    full_name,
    role,
    created_at,
    last_sign_in
FROM public.profiles
ORDER BY created_at DESC
LIMIT 10; 