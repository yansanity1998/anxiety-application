-- Fixed Setup Script for Guidance System
-- This version handles the missing unique constraint on email column

-- Step 1: First, let's check the current table structure
-- We'll add a unique constraint on email if it doesn't exist
DO $$
BEGIN
    -- Check if unique constraint on email already exists
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'profiles_email_key' 
        AND conrelid = 'profiles'::regclass
    ) THEN
        -- Add unique constraint on email column
        ALTER TABLE profiles ADD CONSTRAINT profiles_email_key UNIQUE (email);
    END IF;
END $$;

-- Step 2: Update the handle_new_user function to support guidance role
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

-- Step 3: Add RLS policies for guidance users
-- Policy to allow guidance users to view all profiles (for counseling purposes)
DROP POLICY IF EXISTS "Guidance can view all profiles" ON profiles;
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
DROP POLICY IF EXISTS "Guidance can update profiles" ON profiles;
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
DROP POLICY IF EXISTS "Guidance can view anxiety assessments" ON anxiety_assessments;
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

-- Step 4: Ensure the trigger is properly set up
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION handle_new_user();

-- Step 5: Create guidance user profile placeholder
-- We'll use a safer approach without ON CONFLICT
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

-- Step 6: Grant necessary permissions
GRANT SELECT, UPDATE ON profiles TO authenticated;
GRANT SELECT ON anxiety_assessments TO authenticated;

-- Step 7: Verify setup
SELECT 'Guidance system setup completed successfully!' as status;

-- Check if guidance profile exists
SELECT 
    email, 
    full_name, 
    role, 
    created_at 
FROM profiles 
WHERE email = 'guidance@gmail.com';

-- Check if function was updated
SELECT 
    routine_name, 
    routine_definition 
FROM information_schema.routines 
WHERE routine_name = 'handle_new_user';

-- Check if policies exist
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
WHERE policyname LIKE '%guidance%'; 