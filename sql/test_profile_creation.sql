-- Test script to check profile creation and RLS policies

-- 1. Check current RLS policies on profiles table
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
WHERE tablename = 'profiles';

-- 2. Check if RLS is enabled
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE tablename = 'profiles';

-- 3. Test profile creation with service role (bypass RLS)
-- This will help us see if the issue is with RLS policies
DO $$
DECLARE
    admin_user_id UUID;
    test_result TEXT;
BEGIN
    -- Get admin user ID
    SELECT id INTO admin_user_id FROM auth.users WHERE email = 'admin@gmail.com';
    
    IF admin_user_id IS NULL THEN
        RAISE NOTICE 'Admin user not found in auth.users';
        RETURN;
    END IF;
    
    -- Try to create profile with service role context
    BEGIN
        INSERT INTO profiles (
            user_id, 
            email, 
            full_name,
            role,
            created_at,
            last_sign_in
        ) VALUES (
            admin_user_id,
            'admin@gmail.com',
            'Admin User',
            'admin',
            NOW(),
            NOW()
        );
        
        test_result := 'Profile created successfully';
    EXCEPTION 
        WHEN OTHERS THEN
            test_result := 'Error: ' || SQLERRM;
    END;
    
    RAISE NOTICE 'Test result: %', test_result;
END $$;

-- 4. Check if admin profile now exists
SELECT 
    id,
    user_id,
    email,
    full_name,
    role,
    created_at,
    last_sign_in
FROM profiles 
WHERE email = 'admin@gmail.com'; 