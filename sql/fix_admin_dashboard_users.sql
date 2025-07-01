-- Comprehensive fix for admin dashboard user fetching
-- Run this in your Supabase SQL Editor

-- 1. First, let's see what's in the profiles table
SELECT 
    'Current Profiles' as info,
    COUNT(*) as total_count
FROM profiles;

-- 2. Check if admin user exists in auth.users
SELECT 
    'Admin in Auth' as info,
    id,
    email,
    created_at,
    last_sign_in_at
FROM auth.users
WHERE email = 'admin@gmail.com';

-- 3. Check if admin profile exists
SELECT 
    'Admin Profile' as info,
    id,
    user_id,
    email,
    full_name,
    role,
    created_at,
    last_sign_in
FROM profiles
WHERE email = 'admin@gmail.com' OR role = 'admin';

-- 4. Check current RLS policies
SELECT 
    'Current RLS Policies' as info,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies
WHERE tablename = 'profiles'
ORDER BY policyname;

-- 5. Drop ALL existing policies to start fresh
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can manage all profiles" ON profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON profiles;
DROP POLICY IF EXISTS "Allow individual users to view their own profiles" ON profiles;
DROP POLICY IF EXISTS "Allow individual users to update their own profiles" ON profiles;
DROP POLICY IF EXISTS "Allow users to insert their own profiles" ON profiles;
DROP POLICY IF EXISTS "Admin has full access" ON profiles;

-- 6. Create simple, working policies
-- Allow users to view their own profile
CREATE POLICY "Users can view own profile" 
ON profiles FOR SELECT 
USING (auth.uid() = user_id);

-- Allow users to update their own profile
CREATE POLICY "Users can update own profile" 
ON profiles FOR UPDATE
USING (auth.uid() = user_id);

-- Allow users to insert their own profile
CREATE POLICY "Users can insert own profile" 
ON profiles FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Allow admins to view ALL profiles (this is crucial for admin dashboard)
CREATE POLICY "Admins can view all profiles" 
ON profiles FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- Allow admins to manage all profiles
CREATE POLICY "Admins can manage all profiles" 
ON profiles FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- 7. Ensure admin profile exists with correct role
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
    COALESCE(raw_user_meta_data->>'full_name', raw_user_meta_data->>'name', 'Admin User'),
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

-- 8. Grant necessary permissions
GRANT ALL ON profiles TO authenticated;
GRANT ALL ON profiles TO service_role;
GRANT USAGE ON SEQUENCE profiles_id_seq TO authenticated;
GRANT USAGE ON SEQUENCE profiles_id_seq TO service_role;

-- 9. Test the query that the admin dashboard uses
-- This should work for admin users
SELECT 
    'Test Query - All Profiles' as info,
    id,
    user_id,
    email,
    full_name,
    role,
    created_at,
    last_sign_in
FROM profiles
ORDER BY created_at DESC
LIMIT 10;

-- 10. Show final RLS policies
SELECT 
    'Final RLS Policies' as info,
    policyname,
    permissive,
    roles,
    cmd
FROM pg_policies
WHERE tablename = 'profiles'
ORDER BY policyname;

-- 11. Verify admin user has admin role
SELECT 
    'Admin Verification' as info,
    user_id,
    email,
    full_name,
    role,
    created_at,
    last_sign_in
FROM profiles 
WHERE email = 'admin@gmail.com';

-- 12. Check table structure
SELECT 
    'Table Structure' as info,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'profiles' 
AND table_schema = 'public'
ORDER BY ordinal_position; 