-- Fix CBT Modules Setup
-- This script checks and fixes existing CBT modules without creating duplicates

-- First, let's check if the table exists and see its structure
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'cbt_module'
ORDER BY ordinal_position;

-- Check if RLS is enabled
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'cbt_module';

-- Check existing policies
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
WHERE tablename = 'cbt_module';

-- Check if there are any modules in the table
SELECT COUNT(*) as total_modules FROM cbt_module;

-- Check if there are any users with guidance role
SELECT 
    p.id,
    p.full_name,
    p.email,
    p.role,
    u.id as user_id
FROM profiles p
JOIN auth.users u ON p.user_id = u.id
WHERE p.role = 'guidance';

-- Check if there are any users with admin role
SELECT 
    p.id,
    p.full_name,
    p.email,
    p.role,
    u.id as user_id
FROM profiles p
JOIN auth.users u ON p.user_id = u.id
WHERE p.role = 'admin';

-- Check if there are any students
SELECT 
    p.id,
    p.full_name,
    p.email,
    p.role,
    u.id as user_id
FROM profiles p
JOIN auth.users u ON p.user_id = u.id
WHERE p.role = 'student'
LIMIT 5;

-- Test the policies by checking what a guidance user would see
-- (This will help us understand if the policies are working correctly)
-- Note: This is just for debugging - replace 'your-guidance-user-id' with an actual guidance user ID
-- SELECT 
--     cm.*,
--     p.full_name as assigned_to
-- FROM cbt_module cm
-- JOIN profiles p ON cm.profile_id = p.id
-- WHERE EXISTS (
--     SELECT 1 FROM profiles 
--     WHERE user_id = 'your-guidance-user-id' AND role = 'guidance'
-- ); 