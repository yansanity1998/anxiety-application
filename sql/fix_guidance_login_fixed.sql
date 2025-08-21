-- FIX GUIDANCE LOGIN ISSUE (FIXED VERSION)
-- This script will fix the guidance login by properly setting up the guidance user account

-- Step 1: Check current guidance profile status
SELECT '=== CURRENT GUIDANCE STATUS ===' as info;
SELECT * FROM profiles WHERE email = 'guidance@gmail.com';

-- Step 2: Check if guidance user exists in auth.users
SELECT '=== CHECKING AUTH.USERS ===' as info;
SELECT id, email, created_at FROM auth.users WHERE email = 'guidance@gmail.com';

-- Step 3: The issue is likely that guidance@gmail.com doesn't exist in auth.users
-- We need to create the actual user account first
-- Since we can't directly insert into auth.users, we need to do this through the app

-- Step 4: Let's create a proper guidance profile that will work when they sign up
-- First, let's make sure the profile is properly set up
UPDATE profiles 
SET 
    full_name = 'Guidance Counselor',
    role = 'guidance',
    created_at = NOW(),
    last_sign_in = NOW()
WHERE email = 'guidance@gmail.com';

-- Step 5: If no profile exists, create one
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

-- Step 6: Update the handle_new_user function to properly handle guidance
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

-- Step 7: Ensure the trigger is properly set up (FIXED SYNTAX)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION handle_new_user();

-- Step 8: Verify the setup
SELECT '=== GUIDANCE SETUP VERIFICATION ===' as info;
SELECT * FROM profiles WHERE email = 'guidance@gmail.com';

-- Step 9: Instructions for creating guidance account
SELECT '=== NEXT STEPS TO CREATE GUIDANCE ACCOUNT ===' as info;
SELECT '1. Go to your app registration page' as step;
SELECT '2. Create a new account with:' as step;
SELECT '   - Email: guidance@gmail.com' as step;
SELECT '   - Password: guidance123' as step;
SELECT '   - Full Name: Guidance Counselor' as step;
SELECT '3. The system will automatically assign guidance role' as step;
SELECT '4. You can then login with these credentials' as step;

-- Step 10: Alternative - Check if we can see any existing guidance users
SELECT '=== EXISTING USERS WITH GUIDANCE ROLE ===' as info;
SELECT * FROM profiles WHERE role = 'guidance';

-- Step 11: Final status
SELECT '=== FINAL STATUS ===' as info;
SELECT 'Guidance profile is ready. You need to create the auth account through the app.' as status; 