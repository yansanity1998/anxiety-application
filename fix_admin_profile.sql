-- Fix admin profile by ensuring it exists with all required columns
-- First, add the missing columns if they don't exist
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS streak INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS last_activity_date DATE DEFAULT CURRENT_DATE;

-- Insert or update admin profile
INSERT INTO profiles (
    user_id, 
    email, 
    full_name,
    role,
    streak,
    last_activity_date,
    created_at,
    last_sign_in
)
SELECT 
    id, 
    email, 
    COALESCE(raw_user_meta_data->>'full_name', raw_user_meta_data->>'name', 'Admin User'),
    'admin',
    1,
    CURRENT_DATE,
    NOW(),
    NOW()
FROM auth.users
WHERE email = 'admin@gmail.com'
ON CONFLICT (user_id) 
DO UPDATE SET 
    role = 'admin',
    email = EXCLUDED.email,
    full_name = EXCLUDED.full_name,
    streak = COALESCE(profiles.streak, 1),
    last_activity_date = COALESCE(profiles.last_activity_date, CURRENT_DATE),
    last_sign_in = NOW();

-- Verify the admin profile exists
SELECT 
    user_id,
    email,
    full_name,
    role,
    streak,
    last_activity_date,
    created_at,
    last_sign_in
FROM profiles 
WHERE email = 'admin@gmail.com'; 