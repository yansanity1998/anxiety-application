-- Fix Student Role Registration
-- This script ensures that new student registrations get the 'student' role instead of 'user'

-- Step 1: Update the handle_new_user function to properly assign 'student' role
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    is_admin BOOLEAN;
    is_guidance BOOLEAN;
    user_role TEXT;
BEGIN
    -- Check if the user is admin or guidance
    is_admin := NEW.email = 'admin@gmail.com';
    is_guidance := NEW.email = 'guidance@gmail.com';
    
    -- Determine the role based on email and metadata
    IF is_admin THEN
        user_role := 'admin';
    ELSIF is_guidance THEN
        user_role := 'guidance';
    ELSE
        -- For all other users, check if they explicitly set a role in metadata
        -- If no role is specified, default to 'student'
        user_role := COALESCE(NEW.raw_user_meta_data->>'role', 'student');
    END IF;
    
    -- Debug log
    RAISE LOG 'Creating new profile for % with role: % (metadata role: %)', 
        NEW.email, 
        user_role, 
        NEW.raw_user_meta_data->>'role';
    
    INSERT INTO public.profiles (
        user_id, 
        email, 
        full_name,
        id_number,
        age,
        gender,
        school,
        course,
        year_level,
        phone_number,
        guardian_name,
        guardian_phone_number,
        address,
        role,
        created_at,
        last_sign_in,
        streak,
        last_activity_date
    )
    VALUES (
        NEW.id, 
        NEW.email, 
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name'),
        NEW.raw_user_meta_data->>'id_number',
        (NEW.raw_user_meta_data->>'age')::INTEGER,
        NEW.raw_user_meta_data->>'gender',
        NEW.raw_user_meta_data->>'school',
        NEW.raw_user_meta_data->>'course',
        (NEW.raw_user_meta_data->>'year_level')::INTEGER,
        NEW.raw_user_meta_data->>'phone_number',
        NEW.raw_user_meta_data->>'guardian_name',
        NEW.raw_user_meta_data->>'guardian_phone_number',
        NEW.raw_user_meta_data->>'address',
        user_role, -- Use the determined role
        NOW(),
        NOW(),
        1, -- Default streak
        CURRENT_DATE -- Default last activity date
    );
    
    RAISE LOG 'Profile created successfully for user % with role %', NEW.email, user_role;
    RETURN NEW;
EXCEPTION WHEN OTHERS THEN
    -- Log the error but don't fail the user creation
    RAISE LOG 'Error creating profile for user %: %', NEW.email, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 2: Make sure the trigger is properly attached
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE handle_new_user();

-- Step 3: Fix any existing profiles that might have 'user' role instead of 'student'
-- This will update existing profiles to have 'student' role if they don't have admin/guidance role
UPDATE profiles 
SET role = 'student' 
WHERE role = 'user' 
  AND email NOT IN ('admin@gmail.com', 'guidance@gmail.com');

-- Step 4: Verify the changes
SELECT 
    email, 
    role, 
    full_name, 
    created_at 
FROM profiles 
ORDER BY created_at DESC 
LIMIT 10;

-- Step 5: Grant necessary permissions
GRANT ALL ON profiles TO authenticated;
GRANT ALL ON profiles TO service_role;
GRANT USAGE ON SEQUENCE profiles_id_seq TO authenticated;
GRANT USAGE ON SEQUENCE profiles_id_seq TO service_role;

-- Step 6: Ensure RLS policies allow profile creation during registration
DROP POLICY IF EXISTS "Allow users to insert their own profiles" ON public.profiles;
CREATE POLICY "Allow users to insert their own profiles" 
ON public.profiles FOR INSERT
WITH CHECK (true);

-- Step 7: Test the trigger function
-- You can test this by creating a new user and checking if the role is set correctly
-- The function should now properly assign 'student' role to new registrations 