-- Ensure admin profile exists with all required fields

-- First, add missing columns if they don't exist
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS streak INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS last_activity_date DATE DEFAULT CURRENT_DATE;

-- Create or update admin profile
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
    u.id, 
    u.email, 
    'Admin User',
    'admin',
    1,
    CURRENT_DATE,
    NOW(),
    NOW()
FROM auth.users u
WHERE u.email = 'admin@gmail.com'
ON CONFLICT (user_id) 
DO UPDATE SET 
    role = 'admin',
    email = EXCLUDED.email,
    full_name = EXCLUDED.full_name,
    streak = COALESCE(profiles.streak, 1),
    last_activity_date = COALESCE(profiles.last_activity_date, CURRENT_DATE),
    last_sign_in = NOW();

-- Verify admin profile exists
SELECT 
    'Admin Profile Status' as status,
    CASE 
        WHEN EXISTS(SELECT 1 FROM profiles WHERE email = 'admin@gmail.com') 
        THEN 'EXISTS' 
        ELSE 'MISSING' 
    END as profile_status,
    CASE 
        WHEN EXISTS(SELECT 1 FROM auth.users WHERE email = 'admin@gmail.com') 
        THEN 'EXISTS' 
        ELSE 'MISSING' 
    END as auth_status; 