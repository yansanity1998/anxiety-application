-- EMERGENCY ADMIN ACCESS RESTORE
-- Run this if you still can't access admin data

-- Step 1: Temporarily disable RLS to see what's happening
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;

-- Step 2: Check what data exists
SELECT 'Current profiles data:' as info;
SELECT id, email, full_name, role, created_at FROM profiles ORDER BY created_at DESC;

-- Step 3: Check if admin profile exists
SELECT 'Admin profile check:' as info;
SELECT * FROM profiles WHERE email = 'admin@gmail.com';

-- Step 4: Re-enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Step 5: Create basic admin policy that allows all access for now
DROP POLICY IF EXISTS "Emergency admin access" ON profiles;
CREATE POLICY "Emergency admin access"
    ON profiles
    FOR ALL
    USING (true)
    WITH CHECK (true);

-- Step 6: Grant all permissions
GRANT ALL ON profiles TO authenticated;
GRANT ALL ON anxiety_assessments TO authenticated;

SELECT 'Emergency admin access restored. You should now be able to see your data.' as status; 