-- Simple test to check admin dashboard issue
-- Run this in your Supabase SQL Editor

-- 1. Check if we can see any profiles at all
SELECT 'Step 1: Can we see profiles?' as test, COUNT(*) as count FROM profiles;

-- 2. Check if admin user exists in auth
SELECT 'Step 2: Admin in auth?' as test, COUNT(*) as count 
FROM auth.users WHERE email = 'admin@gmail.com';

-- 3. Check if admin profile exists
SELECT 'Step 3: Admin profile exists?' as test, COUNT(*) as count 
FROM profiles WHERE email = 'admin@gmail.com';

-- 4. Show all profiles (this should work)
SELECT 'Step 4: All profiles' as test, id, user_id, email, role, created_at 
FROM profiles 
ORDER BY created_at DESC 
LIMIT 5;

-- 5. Check RLS policies
SELECT 'Step 5: RLS policies' as test, policyname, cmd, qual 
FROM pg_policies 
WHERE tablename = 'profiles';

-- 6. Try to disable RLS temporarily to test
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;

-- 7. Test query again
SELECT 'Step 6: After disabling RLS' as test, COUNT(*) as count FROM profiles;

-- 8. Re-enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- 9. Create a simple admin policy
DROP POLICY IF EXISTS "Admin can see all" ON profiles;
CREATE POLICY "Admin can see all" ON profiles FOR SELECT USING (true);

-- 10. Test final query
SELECT 'Step 7: Final test' as test, COUNT(*) as count FROM profiles; 