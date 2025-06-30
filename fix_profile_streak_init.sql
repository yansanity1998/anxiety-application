-- Migration to fix streak initialization in profiles table
-- Run this in your Supabase SQL Editor

-- Change default streak value to 1 instead of 0
ALTER TABLE profiles 
ALTER COLUMN streak SET DEFAULT 1;

-- Create a trigger that automatically sets last_activity_date when profiles are created
CREATE OR REPLACE FUNCTION set_profile_activity_date()
RETURNS TRIGGER AS $$
BEGIN
  -- Set last_activity_date to current date if it's null
  IF NEW.last_activity_date IS NULL THEN
    NEW.last_activity_date := CURRENT_DATE;
  END IF;
  
  -- Ensure streak starts at 1
  IF NEW.streak IS NULL THEN
    NEW.streak := 1;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop the trigger if it exists
DROP TRIGGER IF EXISTS set_profile_activity_date_trigger ON profiles;

-- Create the trigger
CREATE TRIGGER set_profile_activity_date_trigger
BEFORE INSERT ON profiles
FOR EACH ROW
EXECUTE FUNCTION set_profile_activity_date();

-- Update any existing profiles with NULL streak
UPDATE profiles 
SET streak = 1,
    last_activity_date = CURRENT_DATE
WHERE streak IS NULL OR streak = 0;

-- Update the handle_new_user function to include streak and last_activity_date initialization
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    is_admin BOOLEAN;
BEGIN
    -- Check if the user is admin
    is_admin := NEW.email = 'admin@gmail.com';
    
    INSERT INTO public.profiles (
        user_id, 
        email, 
        full_name,
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
        (NEW.raw_user_meta_data->>'age')::INTEGER,
        NEW.raw_user_meta_data->>'gender',
        NEW.raw_user_meta_data->>'school',
        NEW.raw_user_meta_data->>'course',
        (NEW.raw_user_meta_data->>'year_level')::INTEGER,
        NEW.raw_user_meta_data->>'phone_number',
        NEW.raw_user_meta_data->>'guardian_name',
        NEW.raw_user_meta_data->>'guardian_phone_number',
        NEW.raw_user_meta_data->>'address',
        CASE WHEN is_admin THEN 'admin' ELSE 'user' END,
        NOW(),
        NOW(),
        1,
        CURRENT_DATE
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- SQL query to check and fix profile streaks
-- Run this in your Supabase SQL Editor

-- First, let's see what's in the profiles table
SELECT user_id, email, streak, last_activity_date, created_at, last_sign_in
FROM profiles
ORDER BY last_sign_in DESC
LIMIT 10;

-- Now, let's fix any potential issues with the streak columns
-- This will ensure that all profiles have the streak columns properly set
UPDATE profiles
SET 
  streak = COALESCE(streak, 0),
  last_activity_date = CURRENT_DATE
WHERE streak IS NULL OR last_activity_date IS NULL;

-- Now, let's fix the issue where streaks aren't incrementing correctly
-- This function will properly handle date comparisons and streak calculations
CREATE OR REPLACE FUNCTION update_user_streak(user_id_param UUID)
RETURNS INTEGER AS $$
DECLARE
    current_streak INTEGER;
    last_activity DATE;
    day_diff INTEGER;
BEGIN
    -- Get the current streak and last activity date
    SELECT streak, last_activity_date INTO current_streak, last_activity 
    FROM profiles 
    WHERE user_id = user_id_param;

    -- Default streak to 1 if null
    current_streak := COALESCE(current_streak, 0);
    
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
        -- Do nothing to the streak value
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
END;
$$ LANGUAGE plpgsql;

-- Add a trigger to automatically update streaks on sign in
DROP TRIGGER IF EXISTS update_streak_on_sign_in ON profiles;

CREATE OR REPLACE TRIGGER update_streak_on_sign_in
AFTER UPDATE OF last_sign_in ON profiles
FOR EACH ROW
WHEN (OLD.last_sign_in IS DISTINCT FROM NEW.last_sign_in)
EXECUTE FUNCTION update_user_streak(NEW.user_id);

-- Reset the streak for testing (optional - uncomment if you want to reset)
-- UPDATE profiles SET streak = 0, last_activity_date = CURRENT_DATE - INTERVAL '2 days';

-- Show the updated profiles
SELECT user_id, email, streak, last_activity_date, created_at, last_sign_in
FROM profiles
ORDER BY last_sign_in DESC
LIMIT 10; 