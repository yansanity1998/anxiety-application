-- Fix Streak Login Issue
-- This script will fix the problem where streaks don't increment on login
-- Run this in your Supabase SQL Editor

-- 1. First, let's clean up any conflicting functions
DROP FUNCTION IF EXISTS update_user_streak(UUID);
DROP FUNCTION IF EXISTS update_user_streak_manual(UUID);
DROP FUNCTION IF EXISTS trigger_update_streak_on_sign_in();
DROP TRIGGER IF EXISTS update_streak_on_sign_in ON profiles;

-- 2. Create a simple, reliable streak update function
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
    -- If any error occurs, return 1 as default
    RAISE LOG 'Error updating streak for user %: %', user_id_param, SQLERRM;
    RETURN 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Create a public function that can be called from the frontend
CREATE OR REPLACE FUNCTION update_user_streak_manual(user_id_param UUID)
RETURNS INTEGER AS $$
BEGIN
    RETURN update_user_streak(user_id_param);
EXCEPTION WHEN OTHERS THEN
    RAISE LOG 'Error in update_user_streak_manual for user %: %', user_id_param, SQLERRM;
    RETURN 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Grant necessary permissions
GRANT EXECUTE ON FUNCTION update_user_streak(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION update_user_streak(UUID) TO service_role;
GRANT EXECUTE ON FUNCTION update_user_streak_manual(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION update_user_streak_manual(UUID) TO service_role;
GRANT EXECUTE ON FUNCTION update_user_streak_manual(UUID) TO anon;

-- 5. Ensure all profiles have proper streak values
UPDATE profiles 
SET streak = COALESCE(streak, 1),
    last_activity_date = COALESCE(last_activity_date, CURRENT_DATE)
WHERE streak IS NULL OR last_activity_date IS NULL;

-- 6. Create a simple function to just increment streak (for testing)
CREATE OR REPLACE FUNCTION increment_streak_simple(user_id_param UUID)
RETURNS INTEGER AS $$
DECLARE
    current_streak INTEGER;
BEGIN
    -- Get current streak
    SELECT streak INTO current_streak FROM profiles WHERE user_id = user_id_param;
    
    -- Default to 0 if null
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

-- Grant permissions to the simple increment function
GRANT EXECUTE ON FUNCTION increment_streak_simple(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION increment_streak_simple(UUID) TO service_role;

-- 7. Show current streak status for debugging
SELECT 
    user_id, 
    email, 
    streak, 
    last_activity_date, 
    last_sign_in,
    CASE 
        WHEN last_activity_date = CURRENT_DATE THEN 'Logged in today'
        WHEN last_activity_date = CURRENT_DATE - INTERVAL '1 day' THEN 'Logged in yesterday'
        ELSE 'Last login: ' || (CURRENT_DATE - last_activity_date) || ' days ago'
    END as login_status
FROM profiles
ORDER BY last_sign_in DESC
LIMIT 10; 