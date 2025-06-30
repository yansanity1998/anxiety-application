-- Fix admin role in database
-- Run this in your Supabase SQL Editor

-- Check current admin profiles
SELECT user_id, email, role, created_at 
FROM profiles 
WHERE email = 'admin@gmail.com' OR role = 'admin';

-- Update admin user to have admin role
UPDATE profiles 
SET role = 'admin'
WHERE email = 'admin@gmail.com';

-- If admin user doesn't exist in profiles, create it
INSERT INTO profiles (
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

-- Verify the fix
SELECT user_id, email, role, created_at 
FROM profiles 
WHERE email = 'admin@gmail.com' OR role = 'admin'
ORDER BY created_at DESC; 