-- Check if admin user exists in auth.users
SELECT 
    id,
    email,
    created_at,
    last_sign_in_at
FROM auth.users
WHERE email = 'admin@gmail.com';

-- Check if admin user exists in profiles table
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

-- Create or update admin user in profiles table
INSERT INTO profiles (
    user_id,
    email,
    full_name,
    role,
    created_at,
    last_sign_in
)
SELECT 
    id,
    email,
    'Admin User',
    'admin',
    NOW(),
    NOW()
FROM auth.users
WHERE email = 'admin@gmail.com'
ON CONFLICT (user_id) 
DO UPDATE SET 
    role = 'admin',
    email = EXCLUDED.email,
    full_name = EXCLUDED.full_name,
    last_sign_in = NOW();

-- Verify admin user after fix
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

-- Check RLS policies
SELECT 
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies
WHERE tablename = 'profiles'
ORDER BY policyname; 