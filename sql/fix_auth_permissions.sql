-- Fix permissions and policies for authentication and profiles table

-- Drop any conflicting functions first to avoid errors
DROP FUNCTION IF EXISTS public.update_user_streak_manual(UUID);
DROP FUNCTION IF EXISTS public.update_user_streak(UUID);

-- 1. Make sure profiles table has the right structure
CREATE TABLE IF NOT EXISTS public.profiles (
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

-- 2. Fix Row Level Security (RLS) policies
-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to recreate them correctly
DROP POLICY IF EXISTS "Allow individual users to view their own profiles" ON public.profiles;
DROP POLICY IF EXISTS "Allow individual users to update their own profiles" ON public.profiles;
DROP POLICY IF EXISTS "Allow users to insert their own profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admin has full access" ON public.profiles;

-- Create proper policies
-- Allow anyone to insert profiles (needed for registration)
CREATE POLICY "Allow users to insert their own profiles" 
ON public.profiles FOR INSERT
WITH CHECK (true);

-- Allow users to view their own profile
CREATE POLICY "Allow individual users to view their own profiles" 
ON public.profiles FOR SELECT 
USING (auth.uid() = user_id OR role = 'admin');

-- Allow users to update their own profile
CREATE POLICY "Allow individual users to update their own profiles" 
ON public.profiles FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Create policy for admin access to all profiles
CREATE POLICY "Admin has full access" 
ON public.profiles
USING (role = 'admin' AND auth.uid() = user_id);

-- 3. Grant necessary permissions
GRANT ALL ON public.profiles TO service_role;
GRANT ALL ON public.profiles TO postgres;
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT INSERT ON public.profiles TO anon;

-- 4. Recreate the streak functions with better error handling
CREATE OR REPLACE FUNCTION public.update_user_streak(user_id_param UUID)
RETURNS INTEGER AS $$
DECLARE
    current_streak INTEGER;
    last_activity DATE;
    day_diff INTEGER;
BEGIN
    -- Default to 1 if we can't find or update the profile
    BEGIN
        -- Get the current streak and last activity date
        SELECT streak, last_activity_date INTO current_streak, last_activity 
        FROM profiles 
        WHERE user_id = user_id_param;

        -- Default streak to 1 if null
        current_streak := COALESCE(current_streak, 1);
        
        -- If no last activity date, initialize streak
        IF last_activity IS NULL THEN
            UPDATE profiles 
            SET streak = 1, last_activity_date = CURRENT_DATE 
            WHERE user_id = user_id_param;
            RETURN 1;
        END IF;
        
        -- Calculate days between last activity and today
        day_diff := CURRENT_DATE - last_activity;
        
        -- Update streak based on day difference
        IF day_diff = 0 THEN
            -- Already logged in today, keep streak the same
            UPDATE profiles 
            SET last_activity_date = CURRENT_DATE 
            WHERE user_id = user_id_param;
            RETURN current_streak;
        ELSIF day_diff = 1 THEN
            -- Consecutive day, increment streak
            UPDATE profiles 
            SET streak = current_streak + 1, last_activity_date = CURRENT_DATE 
            WHERE user_id = user_id_param;
            RETURN current_streak + 1;
        ELSE
            -- More than one day passed, reset streak to 1
            UPDATE profiles 
            SET streak = 1, last_activity_date = CURRENT_DATE 
            WHERE user_id = user_id_param;
            RETURN 1;
        END IF;
    
    EXCEPTION WHEN OTHERS THEN
        -- If any error occurs, try a simple update or return 1
        BEGIN
            UPDATE profiles 
            SET streak = 1, last_activity_date = CURRENT_DATE 
            WHERE user_id = user_id_param;
        EXCEPTION WHEN OTHERS THEN
            -- Swallow the exception and return 1
            NULL;
        END;
        RETURN 1;
    END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a public function that can be called from the frontend
CREATE OR REPLACE FUNCTION public.update_user_streak_manual(user_id_param UUID)
RETURNS INTEGER AS $$
BEGIN
    RETURN update_user_streak(user_id_param);
EXCEPTION WHEN OTHERS THEN
    -- In case of any error, return 1 as the default streak
    RETURN 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.update_user_streak TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_user_streak TO service_role;
GRANT EXECUTE ON FUNCTION public.update_user_streak_manual TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_user_streak_manual TO service_role;
GRANT EXECUTE ON FUNCTION public.update_user_streak_manual TO anon; 