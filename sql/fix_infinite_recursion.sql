-- Fix infinite recursion in profiles RLS policies
-- Run this in your Supabase SQL Editor

-- 1. First, let's see what policies exist
SELECT 'Current Policies' as info, policyname, cmd, qual 
FROM pg_policies 
WHERE tablename = 'profiles';

-- 2. Drop ALL existing policies to start fresh
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
DROP POLICY IF EXISTS "Admin can see all" ON profiles;
DROP POLICY IF EXISTS "Allow all" ON profiles;

-- 3. Temporarily disable RLS to test
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;

-- 4. Test that we can access the table
SELECT 'Test without RLS' as info, COUNT(*) as count FROM profiles;

-- 5. Re-enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- 6. Create simple, non-recursive policies
-- Allow users to view their own profile (simple check)
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

-- Allow admin users to view all profiles (using email check instead of recursive query)
CREATE POLICY "Admins can view all profiles" 
ON profiles FOR SELECT
USING (
  auth.jwt() ->> 'email' = 'admin@gmail.com'
);

-- Allow admin users to manage all profiles
CREATE POLICY "Admins can manage all profiles" 
ON profiles FOR ALL
USING (
  auth.jwt() ->> 'email' = 'admin@gmail.com'
);

-- 7. Test the policies
SELECT 'Testing policies' as info, COUNT(*) as count FROM profiles;

-- 8. Show final policies
SELECT 'Final Policies' as info, policyname, cmd, qual 
FROM pg_policies 
WHERE tablename = 'profiles'
ORDER BY policyname;

-- 9. Ensure admin profile exists
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

-- 10. Final test
SELECT 'Final Test' as info, COUNT(*) as count FROM profiles; 