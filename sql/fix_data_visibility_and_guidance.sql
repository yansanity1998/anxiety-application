-- FIX DATA VISIBILITY AND GUIDANCE LOGIN
-- This script will restore your admin data visibility and fix guidance login

-- Step 1: First, let's see what's happening with your data
-- Temporarily disable RLS to check what data exists
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE anxiety_assessments DISABLE ROW LEVEL SECURITY;

-- Step 2: Check what data exists
SELECT '=== PROFILES DATA ===' as info;
SELECT id, email, full_name, role, created_at FROM profiles ORDER BY created_at DESC;

SELECT '=== ASSESSMENTS DATA ===' as info;
SELECT id, profile_id, total_score, anxiety_level, created_at FROM anxiety_assessments ORDER BY created_at DESC;

-- Step 3: Re-enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE anxiety_assessments ENABLE ROW LEVEL SECURITY;

-- Step 4: Create a comprehensive admin policy that allows full access
DROP POLICY IF EXISTS "Admin full access" ON profiles;
CREATE POLICY "Admin full access"
    ON profiles
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE user_id = auth.uid()
            AND role = 'admin'
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE user_id = auth.uid()
            AND role = 'admin'
        )
    );

-- Step 5: Create comprehensive admin policy for assessments
DROP POLICY IF EXISTS "Admin full access assessments" ON anxiety_assessments;
CREATE POLICY "Admin full access assessments"
    ON anxiety_assessments
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE user_id = auth.uid()
            AND role = 'admin'
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE user_id = auth.uid()
            AND role = 'admin'
        )
    );

-- Step 6: Create user policies for normal users
DROP POLICY IF EXISTS "Users own profile" ON profiles;
CREATE POLICY "Users own profile"
    ON profiles
    FOR ALL
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- Step 7: Create user policies for assessments
DROP POLICY IF EXISTS "Users own assessments" ON anxiety_assessments;
CREATE POLICY "Users own assessments"
    ON anxiety_assessments
    FOR ALL
    USING (
        profile_id IN (
            SELECT profile_id FROM profiles WHERE user_id = auth.uid()
        )
    )
    WITH CHECK (
        profile_id IN (
            SELECT profile_id FROM profiles WHERE user_id = auth.uid()
        )
    );

-- Step 8: Create guidance policies
DROP POLICY IF EXISTS "Guidance view all" ON profiles;
CREATE POLICY "Guidance view all"
    ON profiles
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE user_id = auth.uid()
            AND role = 'guidance'
        )
    );

DROP POLICY IF EXISTS "Guidance view assessments" ON anxiety_assessments;
CREATE POLICY "Guidance view assessments"
    ON anxiety_assessments
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE user_id = auth.uid()
            AND role = 'guidance'
        )
    );

-- Step 9: Fix the guidance profile creation issue
-- First, let's check if guidance profile exists
SELECT '=== CHECKING GUIDANCE PROFILE ===' as info;
SELECT * FROM profiles WHERE email = 'guidance@gmail.com';

-- If no guidance profile exists, create one
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM profiles WHERE email = 'guidance@gmail.com'
    ) THEN
        INSERT INTO profiles (
            email,
            full_name,
            role,
            created_at,
            last_sign_in
        ) VALUES (
            'guidance@gmail.com',
            'Guidance Counselor',
            'guidance',
            NOW(),
            NOW()
        );
        RAISE NOTICE 'Guidance profile created successfully';
    ELSE
        RAISE NOTICE 'Guidance profile already exists';
    END IF;
END $$;

-- Step 10: Update the handle_new_user function to properly handle guidance
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    is_admin BOOLEAN;
    is_guidance BOOLEAN;
BEGIN
    -- Check if the user is admin or guidance
    is_admin := NEW.email = 'admin@gmail.com';
    is_guidance := NEW.email = 'guidance@gmail.com';
    
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
            WHEN is_admin THEN 'admin'
            WHEN is_guidance THEN 'guidance'
            ELSE 'user' 
        END,
        NOW(),
        NOW()
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 11: Ensure the trigger is properly set up
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION handle_new_user();

-- Step 12: Grant all necessary permissions
GRANT ALL ON profiles TO authenticated;
GRANT ALL ON anxiety_assessments TO authenticated;
GRANT USAGE ON SEQUENCE profiles_id_seq TO authenticated;

-- Step 13: Verify the setup
SELECT '=== SETUP VERIFICATION ===' as info;

-- Check admin profile
SELECT 'Admin profile:' as check_type, email, role FROM profiles WHERE email = 'admin@gmail.com';

-- Check guidance profile
SELECT 'Guidance profile:' as check_type, email, role FROM profiles WHERE email = 'guidance@gmail.com';

-- List all policies
SELECT 'Policies:' as check_type, policyname, cmd FROM pg_policies WHERE tablename = 'profiles';

-- Final status
SELECT 'Data visibility and guidance system should now be fixed!' as final_status; 