-- Fix user deletion functionality
-- Run this in your Supabase SQL Editor

-- 1. First, let's check if the delete_user function exists
SELECT 'Checking delete_user function' as info, 
       routine_name, routine_type 
FROM information_schema.routines 
WHERE routine_name = 'delete_user';

-- 2. Create the delete_user function if it doesn't exist
CREATE OR REPLACE FUNCTION delete_user(user_id_param UUID)
RETURNS VOID AS $$
BEGIN
    -- Delete from auth.users (this requires admin privileges)
    DELETE FROM auth.users WHERE id = user_id_param;
    
    -- Log the deletion
    RAISE LOG 'Deleted user with ID: %', user_id_param;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Grant execute permission on the function
GRANT EXECUTE ON FUNCTION delete_user(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION delete_user(UUID) TO service_role;

-- 4. Create a safer alternative function that doesn't require admin privileges
CREATE OR REPLACE FUNCTION safe_delete_user(user_id_param UUID)
RETURNS JSONB AS $$
DECLARE
    result JSONB;
    profile_exists BOOLEAN;
    assessment_count INTEGER;
BEGIN
    -- Check if profile exists
    SELECT EXISTS(SELECT 1 FROM profiles WHERE user_id = user_id_param) INTO profile_exists;
    
    IF NOT profile_exists THEN
        RETURN jsonb_build_object(
            'success', false,
            'message', 'User profile not found'
        );
    END IF;
    
    -- Count assessments to be deleted
    SELECT COUNT(*) INTO assessment_count 
    FROM anxiety_assessments a
    JOIN profiles p ON a.profile_id = p.id
    WHERE p.user_id = user_id_param;
    
    -- Delete assessments first (due to foreign key constraints)
    DELETE FROM anxiety_assessments 
    WHERE profile_id IN (
        SELECT id FROM profiles WHERE user_id = user_id_param
    );
    
    -- Delete profile
    DELETE FROM profiles WHERE user_id = user_id_param;
    
    -- Note: We cannot delete from auth.users directly without admin privileges
    -- The auth user will remain but will be orphaned (which is often acceptable)
    
    RETURN jsonb_build_object(
        'success', true,
        'message', 'User profile and data deleted successfully',
        'assessments_deleted', assessment_count,
        'note', 'Auth user remains in auth.users table (requires admin privileges to delete)'
    );
    
EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object(
        'success', false,
        'message', 'Error deleting user: ' || SQLERRM
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Grant execute permission on the safe function
GRANT EXECUTE ON FUNCTION safe_delete_user(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION safe_delete_user(UUID) TO service_role;

-- 6. Create RLS policies for anxiety_assessments deletion
DROP POLICY IF EXISTS "Admins can delete all assessments" ON anxiety_assessments;
CREATE POLICY "Admins can delete all assessments" 
ON anxiety_assessments FOR DELETE
USING (
  auth.jwt() ->> 'email' = 'admin@gmail.com'
);

-- 7. Create RLS policies for profiles deletion
DROP POLICY IF EXISTS "Admins can delete all profiles" ON profiles;
CREATE POLICY "Admins can delete all profiles" 
ON profiles FOR DELETE
USING (
  auth.jwt() ->> 'email' = 'admin@gmail.com'
);

-- 8. Test the functions
SELECT 'Testing safe_delete_user function' as info;

-- 9. Show current policies
SELECT 'Current RLS Policies' as info, 
       tablename, policyname, cmd 
FROM pg_policies 
WHERE tablename IN ('profiles', 'anxiety_assessments')
ORDER BY tablename, policyname;

-- 10. Create a test function to verify deletion works
CREATE OR REPLACE FUNCTION test_user_deletion()
RETURNS TEXT AS $$
DECLARE
    test_user_id UUID;
    test_profile_id BIGINT;
    result JSONB;
BEGIN
    -- Create a test user (this is just for testing the deletion process)
    INSERT INTO auth.users (id, email, created_at)
    VALUES (gen_random_uuid(), 'test-delete@example.com', NOW())
    RETURNING id INTO test_user_id;
    
    -- Create a test profile
    INSERT INTO profiles (user_id, email, full_name, role, created_at)
    VALUES (test_user_id, 'test-delete@example.com', 'Test User', 'user', NOW())
    RETURNING id INTO test_profile_id;
    
    -- Test the deletion
    SELECT safe_delete_user(test_user_id) INTO result;
    
    -- Clean up the auth user (if we have permissions)
    DELETE FROM auth.users WHERE id = test_user_id;
    
    RETURN 'Test completed: ' || result::text;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 11. Show the functions we created
SELECT 'Created Functions' as info, routine_name, routine_type
FROM information_schema.routines 
WHERE routine_name IN ('delete_user', 'safe_delete_user', 'test_user_deletion')
ORDER BY routine_name; 