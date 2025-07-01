-- Check all users in the profiles table
SELECT 
    id,
    user_id,
    email,
    full_name,
    role,
    created_at,
    last_sign_in
FROM profiles
ORDER BY created_at DESC;

-- Check if admin user exists
SELECT 
    id,
    user_id,
    email,
    full_name,
    role,
    created_at,
    last_sign_in
FROM profiles
WHERE email = 'admin@gmail.com' OR role = 'admin';

-- Count total users
SELECT 
    COUNT(*) as total_users,
    COUNT(CASE WHEN role = 'admin' THEN 1 END) as admin_users,
    COUNT(CASE WHEN role = 'user' THEN 1 END) as regular_users
FROM profiles;

-- Check RLS policies
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE tablename = 'profiles'; 