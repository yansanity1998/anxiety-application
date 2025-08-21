-- CREATE GUIDANCE USER IN AUTH.USERS TABLE
-- This script will create the guidance account in the proper authentication system

-- Step 1: First, let's check what currently exists
SELECT '=== CURRENT STATUS ===' as info;
SELECT 'Profiles table:' as location, COUNT(*) as count FROM profiles WHERE email = 'guidance@gmail.com';
SELECT 'Auth.users table:' as location, COUNT(*) as count FROM auth.users WHERE email = 'guidance@gmail.com';

-- Step 2: Remove the guidance profile from profiles table since it should be in auth.users
SELECT '=== REMOVING GUIDANCE FROM PROFILES TABLE ===' as info;
DELETE FROM profiles WHERE email = 'guidance@gmail.com';

-- Step 3: Check if we can see the auth.users table structure
SELECT '=== AUTH.USERS TABLE STRUCTURE ===' as info;
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'users' 
AND table_schema = 'auth'
ORDER BY ordinal_position;

-- Step 4: Since we cannot directly insert into auth.users (Supabase security),
-- we need to create the user through the proper authentication flow
-- Let's set up the system so when guidance signs up, it gets the right role

-- Step 5: Update the handle_new_user function to properly handle guidance
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

-- Step 6: Ensure the trigger is properly set up
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION handle_new_user();

-- Step 7: Create proper policies for all user types
-- Drop existing policies
DO $$
DECLARE
    policy_record RECORD;
BEGIN
    FOR policy_record IN 
        SELECT policyname, tablename 
        FROM pg_policies 
        WHERE tablename IN ('profiles', 'anxiety_assessments')
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I', 
                      policy_record.policyname, 
                      policy_record.tablename);
    END LOOP;
END $$;

-- Create comprehensive policies
CREATE POLICY "Users own profile access"
    ON profiles
    FOR ALL
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

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

CREATE POLICY "Guidance view all profiles"
    ON profiles
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE user_id = auth.uid() 
            AND role = 'guidance'
        )
    );

CREATE POLICY "Guidance update profiles"
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

-- Assessment policies
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

CREATE POLICY "Admin all assessments"
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

-- Step 8: Grant permissions
GRANT ALL ON profiles TO authenticated;
GRANT ALL ON anxiety_assessments TO authenticated;
GRANT USAGE ON SEQUENCE profiles_id_seq TO authenticated;

-- Step 9: Final verification
SELECT '=== FINAL STATUS ===' as info;
SELECT 'Guidance profile removed from profiles table.' as status;
SELECT 'System ready for guidance user creation in auth.users.' as next_step;

-- Step 10: Instructions for creating guidance account
SELECT '=== HOW TO CREATE GUIDANCE ACCOUNT ===' as info;
SELECT '1. Go to Supabase Dashboard → Authentication → Users' as step;
SELECT '2. Click "Add User"' as step;
SELECT '3. Enter:' as step;
SELECT '   - Email: guidance@gmail.com' as step;
SELECT '4. Set password: guidance123' as step;
SELECT '5. The trigger will automatically create the profile with guidance role' as step;
SELECT '6. You can then login with guidance@gmail.com / guidance123' as step;

-- Alternative method
SELECT '=== ALTERNATIVE METHOD ===' as info;
SELECT '1. Go to your app registration page' as step;
SELECT '2. Create account with guidance@gmail.com / guidance123' as step;
SELECT '3. System will automatically assign guidance role' as step; 