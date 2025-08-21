-- RESTORE ADMIN ACCESS AND SAFELY SETUP GUIDANCE SYSTEM
-- This script will restore your admin access and safely add guidance functionality

-- Step 1: First, let's restore the original admin policies that might have been affected
-- Drop any problematic guidance policies first
DROP POLICY IF EXISTS "Guidance can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Guidance can update profiles" ON profiles;
DROP POLICY IF EXISTS "Guidance can view anxiety assessments" ON anxiety_assessments;

-- Step 2: Restore the original admin policies
-- Policy to allow admins to view all profiles
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
CREATE POLICY "Admins can view all profiles"
    ON profiles
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE user_id = auth.uid()
            AND role = 'admin'
        )
    );

-- Policy to allow admins to manage all profiles
DROP POLICY IF EXISTS "Admins can manage all profiles" ON profiles;
CREATE POLICY "Admins can manage all profiles"
    ON profiles
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE user_id = auth.uid()
            AND role = 'admin'
        )
    );

-- Step 3: Restore the original user policies
-- Policy to allow users to view their own profile
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
CREATE POLICY "Users can view their own profile"
    ON profiles
    FOR SELECT
    USING (user_id = auth.uid());

-- Policy to allow users to update their own profile
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
CREATE POLICY "Users can update their own profile"
    ON profiles
    FOR UPDATE
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- Policy to allow users to insert their own profile
DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
CREATE POLICY "Users can insert their own profile"
    ON profiles
    FOR INSERT
    WITH CHECK (user_id = auth.uid());

-- Step 4: Now safely add guidance policies without affecting admin access
-- Policy to allow guidance users to view all profiles (for counseling purposes)
CREATE POLICY "Guidance can view all profiles"
    ON profiles
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE user_id = auth.uid()
            AND role = 'guidance'
        )
    );

-- Policy to allow guidance users to update profiles (for counseling purposes)
CREATE POLICY "Guidance can update profiles"
    ON profiles
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE user_id = auth.uid()
            AND role = 'guidance'
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE user_id = auth.uid()
            AND role = 'guidance'
        )
    );

-- Policy to allow guidance users to view anxiety assessments (for counseling purposes)
CREATE POLICY "Guidance can view anxiety assessments"
    ON anxiety_assessments
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE user_id = auth.uid()
            AND role = 'guidance'
        )
    );

-- Step 5: Restore the original handle_new_user function with guidance support
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

-- Step 6: Ensure the trigger is properly set up
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION handle_new_user();

-- Step 7: Create guidance user profile safely
-- First, check if it already exists
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
    END IF;
END $$;

-- Step 8: Grant necessary permissions
GRANT ALL ON profiles TO authenticated;
GRANT ALL ON anxiety_assessments TO authenticated;
GRANT USAGE ON SEQUENCE profiles_id_seq TO authenticated;

-- Step 9: Verify admin access is restored
SELECT 'Admin access should now be restored!' as status;

-- Check if admin profile exists and has correct role
SELECT 
    email, 
    full_name, 
    role, 
    created_at 
FROM profiles 
WHERE email = 'admin@gmail.com';

-- Check if guidance profile exists
SELECT 
    email, 
    full_name, 
    role, 
    created_at 
FROM profiles 
WHERE email = 'guidance@gmail.com';

-- List all policies to verify they're correct
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    cmd
FROM pg_policies 
WHERE tablename = 'profiles'
ORDER BY policyname; 