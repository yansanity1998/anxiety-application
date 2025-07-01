-- Script to fix streak values for existing accounts
-- Run this in your Supabase SQL Editor

-- First, update all existing profiles with streak 1 to have streak 2 if they've logged in today
UPDATE profiles
SET streak = 2
WHERE streak = 1 
AND last_sign_in::date = CURRENT_DATE;

-- Show the updated profiles to verify changes
SELECT user_id, email, streak, last_activity_date, last_sign_in
FROM profiles
ORDER BY last_sign_in DESC
LIMIT 10; 