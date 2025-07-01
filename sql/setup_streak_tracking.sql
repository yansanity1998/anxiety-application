-- Align streak implementation between frontend and database
-- Run this in your Supabase SQL Editor

-- 1. First, ensure streak columns exist and have correct defaults
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS streak INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS last_activity_date DATE;

ALTER TABLE profiles 
ALTER COLUMN streak SET DEFAULT 1;

-- 2. Improve the update_user_streak function to ensure proper streak calculation
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
END;
$$ LANGUAGE plpgsql;

-- 3. Create a trigger function specifically for the sign-in event
CREATE OR REPLACE FUNCTION trigger_update_streak_on_sign_in()
RETURNS TRIGGER AS $$
BEGIN
    -- Call our streak update function with the user_id from the NEW record
    PERFORM update_user_streak(NEW.user_id);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Ensure the trigger works correctly
DROP TRIGGER IF EXISTS update_streak_on_sign_in ON profiles;

-- Create the trigger using the trigger function
CREATE TRIGGER update_streak_on_sign_in
AFTER UPDATE OF last_sign_in ON profiles
FOR EACH ROW
WHEN (OLD.last_sign_in IS DISTINCT FROM NEW.last_sign_in)
EXECUTE FUNCTION trigger_update_streak_on_sign_in();

-- 4. Create a function that can be called from frontend to manually update streaks
CREATE OR REPLACE FUNCTION update_user_streak_manual(user_id_param UUID)
RETURNS INTEGER AS $$
BEGIN
    RETURN update_user_streak(user_id_param);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Ensure permissions are set correctly
GRANT EXECUTE ON FUNCTION update_user_streak_manual TO authenticated;
GRANT EXECUTE ON FUNCTION update_user_streak_manual TO service_role;

-- 6. Fix any existing NULL values
UPDATE profiles 
SET streak = 1,
    last_activity_date = CURRENT_DATE
WHERE streak IS NULL OR last_activity_date IS NULL;

-- 7. Create a function to reset inactive streaks that could be called by a cron job
CREATE OR REPLACE FUNCTION reset_inactive_streaks()
RETURNS void AS $$
BEGIN
    UPDATE profiles
    SET streak = 1
    WHERE last_activity_date < (CURRENT_DATE - INTERVAL '2 days');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions for the reset function
GRANT EXECUTE ON FUNCTION reset_inactive_streaks TO service_role; 