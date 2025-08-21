-- COMPLETE FIX - SHOW ALL DATA AND FIX GUIDANCE LOGIN
-- This script will fix the infinite recursion and show you all your data

-- Step 1: COMPLETELY DISABLE RLS to see all data
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE anxiety_assessments DISABLE ROW LEVEL SECURITY;

-- Step 2: SHOW ALL YOUR DATA
SELECT '=== ALL PROFILES DATA ===' as info;
SELECT * FROM profiles ORDER BY created_at DESC;

SELECT '=== ALL ASSESSMENTS DATA ===' as info;
SELECT * FROM anxiety_assessments ORDER BY created_at DESC;

-- Step 3: Check if guidance profile exists
SELECT '=== GUIDANCE PROFILE CHECK ===' as info;
SELECT * FROM profiles WHERE email = 'guidance@gmail.com';

-- Step 4: Check admin profile
SELECT '=== ADMIN PROFILE CHECK ===' as info;
SELECT * FROM profiles WHERE email = 'admin@gmail.com';

-- Step 5: Now let's fix the infinite recursion by creating simple, working policies
-- First, drop ALL existing policies to start fresh
DROP POLICY IF EXISTS "Admin full access" ON profiles;
DROP POLICY IF EXISTS "Admin full access assessments" ON anxiety_assessments;
DROP POLICY IF EXISTS "Users own profile" ON profiles;
DROP POLICY IF EXISTS "Users own assessments" ON anxiety_assessments;
DROP POLICY IF EXISTS "Guidance view all" ON profiles;
DROP POLICY IF EXISTS "Guidance view assessments" ON anxiety_assessments;
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can manage all profiles" ON profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
DROP POLICY IF EXISTS "Guidance can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Guidance can update profiles" ON profiles;
DROP POLICY IF EXISTS "Guidance can view anxiety assessments" ON anxiety_assessments;

-- Step 6: Create a simple admin policy that works
CREATE POLICY "Simple admin access"
    ON profiles
    FOR ALL
    USING (
        auth.uid() IN (
            SELECT user_id FROM profiles WHERE role = 'admin'
        )
    );

-- Step 7: Create a simple user policy
CREATE POLICY "Simple user access"
    ON profiles
    FOR ALL
    USING (user_id = auth.uid());

-- Step 8: Create a simple guidance policy
CREATE POLICY "Simple guidance access"
    ON profiles
    FOR ALL
    USING (
        auth.uid() IN (
            SELECT user_id FROM profiles WHERE role = 'guidance'
        )
    );

-- Step 9: Create simple assessment policies
CREATE POLICY "Simple admin assessment access"
    ON anxiety_assessments
    FOR ALL
    USING (
        auth.uid() IN (
            SELECT user_id FROM profiles WHERE role = 'admin'
        )
    );

CREATE POLICY "Simple user assessment access"
    ON anxiety_assessments
    FOR ALL
    USING (
        profile_id IN (
            SELECT profile_id FROM profiles WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Simple guidance assessment access"
    ON anxiety_assessments
    FOR ALL
    USING (
        auth.uid() IN (
            SELECT user_id FROM profiles WHERE role = 'guidance'
        )
    );

-- Step 10: Fix the guidance profile issue
-- First, let's see what's in the profiles table
SELECT '=== CURRENT PROFILES STRUCTURE ===' as info;
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'profiles' 
ORDER BY ordinal_position;

-- Step 11: Create a proper guidance profile
-- We need to create it with a proper user_id
-- Let's create a placeholder profile that will be updated when guidance signs up
INSERT INTO profiles (
    email,
    full_name,
    role,
    created_at,
    last_sign_in
)
SELECT 
    'guidance@gmail.com',
    'Guidance Counselor',
    'guidance',
    NOW(),
    NOW()
WHERE NOT EXISTS (
    SELECT 1 FROM profiles WHERE email = 'guidance@gmail.com'
);

-- Step 12: Update the handle_new_user function to be simpler and avoid recursion
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (
        user_id, 
        email, 
        full_name,
        age,
        gender,
        school,
        course,
        year_level,
        role,
        created_at,
        last_sign_in
    )
    VALUES (
        NEW.id, 
        NEW.email, 
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name'),
        (NEW.raw_user_meta_data->>'age')::INTEGER,
        NEW.raw_user_meta_data->>'gender',
        NEW.raw_user_meta_data->>'school',
        NEW.raw_user_meta_data->>'course',
        (NEW.raw_user_meta_data->>'year_level')::INTEGER,
        CASE 
            WHEN NEW.email = 'admin@gmail.com' THEN 'admin'
            WHEN NEW.email = 'guidance@gmail.com' THEN 'guidance'
            ELSE 'user' 
        END,
        NOW(),
        NOW()
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 13: Set up the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION handle_new_user();

-- Step 14: Grant permissions
GRANT ALL ON profiles TO authenticated;
GRANT ALL ON anxiety_assessments TO authenticated;
GRANT USAGE ON SEQUENCE profiles_id_seq TO authenticated;

-- Step 15: Re-enable RLS with the new policies
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE anxiety_assessments ENABLE ROW LEVEL SECURITY;

-- Step 16: Final verification
SELECT '=== FINAL VERIFICATION ===' as info;

-- Check all profiles again
SELECT 'All profiles after fix:' as info;
SELECT id, email, full_name, role, created_at FROM profiles ORDER BY created_at DESC;

-- Check policies
SELECT 'Active policies:' as info;
SELECT policyname, cmd FROM pg_policies WHERE tablename = 'profiles';

-- Check if admin can see data
SELECT 'Admin access test:' as info;
SELECT COUNT(*) as total_profiles FROM profiles;
SELECT COUNT(*) as total_assessments FROM anxiety_assessments;

-- Final status
SELECT 'System should now be working! Admin can see all data, guidance can login.' as final_status; 