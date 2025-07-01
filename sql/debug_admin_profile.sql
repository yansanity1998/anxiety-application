-- Debug script to check and fix admin profile issues

-- 1. First, let's check if the admin user exists in auth.users
SELECT 
    id,
    email,
    created_at,
    raw_user_meta_data
FROM auth.users 
WHERE email = 'admin@gmail.com';

-- 2. Check if the admin profile exists in profiles table
SELECT 
    id,
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

-- 3. Check the current table structure
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'profiles' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 4. If admin profile doesn't exist, create it manually
-- (This will only run if the admin user exists but no profile)
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
    COALESCE(u.raw_user_meta_data->>'full_name', u.raw_user_meta_data->>'name', 'Admin User'),
    'admin',
    1,
    CURRENT_DATE,
    NOW(),
    NOW()
FROM auth.users u
WHERE u.email = 'admin@gmail.com'
AND NOT EXISTS (
    SELECT 1 FROM profiles p WHERE p.user_id = u.id
);

-- 5. Verify the fix
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