-- Simple Streak Fix for Profiles Table
-- Run this in your Supabase SQL Editor

-- Step 1: Make sure streak columns exist with correct defaults
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS streak INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS last_activity_date DATE;

-- Change default to 1 instead of 0
ALTER TABLE profiles 
ALTER COLUMN streak SET DEFAULT 1;

-- Step 2: Set any NULL values to 1
UPDATE profiles 
SET streak = 1,
    last_activity_date = CURRENT_DATE
WHERE streak IS NULL OR streak = 0 OR last_activity_date IS NULL;

-- Step 3: Simple basic update streak function that just adds 1
-- This doesn't need to be complex since your frontend code handles the logic
CREATE OR REPLACE FUNCTION increment_streak(user_id_param UUID)
RETURNS INTEGER AS $$
DECLARE
    current_streak INTEGER;
BEGIN
    -- Get current streak
    SELECT streak INTO current_streak FROM profiles WHERE user_id = user_id_param;
    
    -- Default to 1 if null
    IF current_streak IS NULL THEN
        current_streak := 0;
    END IF;
    
    -- Add 1 to streak
    current_streak := current_streak + 1;
    
    -- Update the profile
    UPDATE profiles 
    SET streak = current_streak,
        last_activity_date = CURRENT_DATE
    WHERE user_id = user_id_param;
    
    RETURN current_streak;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions to the function
GRANT EXECUTE ON FUNCTION increment_streak TO authenticated;
GRANT EXECUTE ON FUNCTION increment_streak TO service_role;

-- Create a function to reset streak to 1
CREATE OR REPLACE FUNCTION reset_streak(user_id_param UUID)
RETURNS INTEGER AS $$
BEGIN
    -- Reset streak to 1
    UPDATE profiles 
    SET streak = 1,
        last_activity_date = CURRENT_DATE
    WHERE user_id = user_id_param;
    
    RETURN 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions to the function
GRANT EXECUTE ON FUNCTION reset_streak TO authenticated;
GRANT EXECUTE ON FUNCTION reset_streak TO service_role; 