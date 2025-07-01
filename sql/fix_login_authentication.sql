-- Complete Authentication Fix for Anxiety Application
-- Run this in your Supabase SQL Editor to fix all login issues

-- 1. Drop all existing tables and functions to start fresh
DROP TABLE IF EXISTS anxiety_assessments CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;
DROP FUNCTION IF EXISTS handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS update_last_sign_in() CASCADE;
DROP FUNCTION IF EXISTS update_user_streak(UUID) CASCADE;
DROP FUNCTION IF EXISTS update_user_streak_manual(UUID) CASCADE;
DROP FUNCTION IF EXISTS increment_streak(UUID) CASCADE;
DROP FUNCTION IF EXISTS reset_streak(UUID) CASCADE;

-- 2. Create clean profiles table with all necessary fields
CREATE TABLE public.profiles (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  full_name TEXT,
  id_number TEXT,
  age INTEGER,
  gender TEXT,
  school TEXT,
  course TEXT,
  year_level INTEGER,
  phone_number TEXT,
  guardian_name TEXT,
  guardian_phone_number TEXT,
  address TEXT,
  role TEXT DEFAULT 'student',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_sign_in TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  streak INTEGER DEFAULT 1,
  last_activity_date DATE DEFAULT CURRENT_DATE
);

-- 3. Create anxiety_assessments table
CREATE TABLE public.anxiety_assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  total_score INTEGER NOT NULL,
  percentage INTEGER NOT NULL,
  anxiety_level TEXT NOT NULL,
  answers INTEGER[] NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Create indexes for better performance
CREATE INDEX idx_profiles_user_id ON public.profiles(user_id);
CREATE INDEX idx_profiles_email ON public.profiles(email);
CREATE INDEX idx_anxiety_assessments_profile_id ON public.anxiety_assessments(profile_id);
CREATE INDEX idx_anxiety_assessments_created_at ON public.anxiety_assessments(created_at);

-- 5. Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.anxiety_assessments ENABLE ROW LEVEL SECURITY;

-- 6. Drop any existing policies
DROP POLICY IF EXISTS "Allow individual users to view their own profiles" ON public.profiles;
DROP POLICY IF EXISTS "Allow individual users to update their own profiles" ON public.profiles;
DROP POLICY IF EXISTS "Allow users to insert their own profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admin has full access" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can manage all profiles" ON public.profiles;

-- 7. Create simple, working RLS policies for profiles
-- Allow users to view their own profile
CREATE POLICY "Users can view own profile" 
ON public.profiles FOR SELECT 
USING (auth.uid() = user_id);

-- Allow users to update their own profile
CREATE POLICY "Users can update own profile" 
ON public.profiles FOR UPDATE
USING (auth.uid() = user_id);

-- Allow users to insert their own profile
CREATE POLICY "Users can insert own profile" 
ON public.profiles FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Allow admins to view all profiles
CREATE POLICY "Admins can view all profiles" 
ON public.profiles FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- Allow admins to update all profiles
CREATE POLICY "Admins can update all profiles" 
ON public.profiles FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- 8. Create RLS policies for anxiety_assessments
-- Allow users to view their own assessments
CREATE POLICY "Users can view own assessments" 
ON public.anxiety_assessments FOR SELECT
USING (profile_id = auth.uid());

-- Allow users to insert their own assessments
CREATE POLICY "Users can insert own assessments" 
ON public.anxiety_assessments FOR INSERT
WITH CHECK (profile_id = auth.uid());

-- Allow users to update their own assessments
CREATE POLICY "Users can update own assessments" 
ON public.anxiety_assessments FOR UPDATE
USING (profile_id = auth.uid());

-- Allow admins to view all assessments
CREATE POLICY "Admins can view all assessments" 
ON public.anxiety_assessments FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- 9. Create function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    is_admin BOOLEAN;
BEGIN
    -- Check if the user is admin
    is_admin := NEW.email = 'admin@gmail.com';
    
    -- Insert profile for new user
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
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name'),
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
    RETURN NEW;
EXCEPTION WHEN OTHERS THEN
    -- Log the error but don't fail the user creation
    RAISE LOG 'Error creating profile for user %: %', NEW.email, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 10. Create trigger for new user registration
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- 11. Create function to update last sign in
CREATE OR REPLACE FUNCTION public.update_last_sign_in()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.profiles
    SET last_sign_in = NOW()
    WHERE user_id = NEW.id;
    RETURN NEW;
EXCEPTION WHEN OTHERS THEN
    -- Log the error but don't fail the sign in
    RAISE LOG 'Error updating last_sign_in for user %: %', NEW.email, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 12. Create trigger for updating last sign in
CREATE TRIGGER on_auth_user_sign_in
    AFTER UPDATE OF last_sign_in_at ON auth.users
    FOR EACH ROW
    WHEN (OLD.last_sign_in_at IS DISTINCT FROM NEW.last_sign_in_at)
    EXECUTE FUNCTION public.update_last_sign_in();

-- 13. Create streak management functions
CREATE OR REPLACE FUNCTION public.update_user_streak(user_id_param UUID)
RETURNS INTEGER AS $$
DECLARE
    current_streak INTEGER;
    last_activity DATE;
    day_diff INTEGER;
BEGIN
    -- Get the current streak and last activity date
    SELECT streak, last_activity_date INTO current_streak, last_activity 
    FROM public.profiles 
    WHERE user_id = user_id_param;

    -- Default streak to 1 if null
    current_streak := COALESCE(current_streak, 1);
    
    -- If no last activity date, initialize streak
    IF last_activity IS NULL THEN
        UPDATE public.profiles 
        SET streak = 1, last_activity_date = CURRENT_DATE 
        WHERE user_id = user_id_param;
        RETURN 1;
    END IF;
    
    -- Calculate days between last activity and today
    day_diff := CURRENT_DATE - last_activity;
    
    -- Update streak based on day difference
    IF day_diff = 0 THEN
        -- Already logged in today, keep streak the same
        UPDATE public.profiles 
        SET last_activity_date = CURRENT_DATE 
        WHERE user_id = user_id_param;
        RETURN current_streak;
    ELSIF day_diff = 1 THEN
        -- Consecutive day, increment streak
        UPDATE public.profiles 
        SET streak = current_streak + 1, last_activity_date = CURRENT_DATE 
        WHERE user_id = user_id_param;
        RETURN current_streak + 1;
    ELSE
        -- More than one day passed, reset streak to 1
        UPDATE public.profiles 
        SET streak = 1, last_activity_date = CURRENT_DATE 
        WHERE user_id = user_id_param;
        RETURN 1;
    END IF;
EXCEPTION WHEN OTHERS THEN
    -- If any error occurs, return 1 as default
    RAISE LOG 'Error updating streak for user %: %', user_id_param, SQLERRM;
    RETURN 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 14. Create public function for streak updates
CREATE OR REPLACE FUNCTION public.update_user_streak_manual(user_id_param UUID)
RETURNS INTEGER AS $$
BEGIN
    RETURN public.update_user_streak(user_id_param);
EXCEPTION WHEN OTHERS THEN
    RAISE LOG 'Error in update_user_streak_manual for user %: %', user_id_param, SQLERRM;
    RETURN 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 15. Grant all necessary permissions
GRANT ALL ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
GRANT ALL ON public.profiles TO anon;
GRANT ALL ON public.anxiety_assessments TO authenticated;
GRANT ALL ON public.anxiety_assessments TO service_role;
GRANT ALL ON public.anxiety_assessments TO anon;

-- Grant execute permissions on functions
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO service_role;
GRANT EXECUTE ON FUNCTION public.update_last_sign_in() TO service_role;
GRANT EXECUTE ON FUNCTION public.update_user_streak(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_user_streak(UUID) TO service_role;
GRANT EXECUTE ON FUNCTION public.update_user_streak_manual(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_user_streak_manual(UUID) TO service_role;
GRANT EXECUTE ON FUNCTION public.update_user_streak_manual(UUID) TO anon;

-- 16. Create admin user if it doesn't exist
-- This will create a profile for the admin user if they exist in auth.users
INSERT INTO public.profiles (
    user_id, 
    email, 
    full_name,
    role,
    created_at,
    last_sign_in,
    streak,
    last_activity_date
)
SELECT 
    id, 
    email, 
    COALESCE(raw_user_meta_data->>'full_name', raw_user_meta_data->>'name', 'Admin User'),
    'admin',
    NOW(),
    NOW(),
    1,
    CURRENT_DATE
FROM auth.users
WHERE email = 'admin@gmail.com'
ON CONFLICT (user_id) 
DO UPDATE SET 
    role = 'admin',
    email = EXCLUDED.email,
    full_name = EXCLUDED.full_name,
    last_sign_in = NOW();

-- 17. Update existing profiles to ensure they have proper defaults
UPDATE public.profiles 
SET 
    streak = COALESCE(streak, 1),
    last_activity_date = COALESCE(last_activity_date, CURRENT_DATE),
    role = COALESCE(role, 'student')
WHERE streak IS NULL OR last_activity_date IS NULL OR role IS NULL;

-- 18. Create a function to ensure profile exists (for manual profile creation)
CREATE OR REPLACE FUNCTION public.ensure_profile_exists(user_id_param UUID)
RETURNS BOOLEAN AS $$
BEGIN
    -- Check if profile exists
    IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE user_id = user_id_param) THEN
        -- Create a basic profile
        INSERT INTO public.profiles (
            user_id,
            email,
            full_name,
            role,
            created_at,
            last_sign_in,
            streak,
            last_activity_date
        )
        SELECT 
            user_id_param,
            email,
            COALESCE(raw_user_meta_data->>'full_name', raw_user_meta_data->>'name', 'User'),
            CASE WHEN email = 'admin@gmail.com' THEN 'admin' ELSE 'student' END,
            NOW(),
            NOW(),
            1,
            CURRENT_DATE
        FROM auth.users
        WHERE id = user_id_param;
        
        RETURN TRUE;
    END IF;
    
    RETURN TRUE;
EXCEPTION WHEN OTHERS THEN
    RAISE LOG 'Error ensuring profile exists for user %: %', user_id_param, SQLERRM;
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.ensure_profile_exists(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.ensure_profile_exists(UUID) TO service_role;
GRANT EXECUTE ON FUNCTION public.ensure_profile_exists(UUID) TO anon;

-- 19. Final verification query
-- This will show you the current state of your profiles table
SELECT 
    user_id,
    email,
    role,
    streak,
    last_activity_date,
    created_at
FROM public.profiles
ORDER BY created_at DESC
LIMIT 10; 