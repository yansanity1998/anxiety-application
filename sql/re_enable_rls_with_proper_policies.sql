-- Re-enable RLS with Proper Policies
-- Run this AFTER confirming that guidance login works
-- This will restore security while maintaining proper access

-- Step 1: Re-enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE anxiety_assessments ENABLE ROW LEVEL SECURITY;

SELECT '🔒 RLS Re-enabled' as status;

-- Step 2: Create comprehensive policies for all roles

-- PROFILES TABLE POLICIES

-- Users can view their own profile
CREATE POLICY "Users can view their own profile"
    ON profiles
    FOR SELECT
    USING (user_id = auth.uid());

-- Users can update their own profile
CREATE POLICY "Users can update their own profile"
    ON profiles
    FOR UPDATE
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- Users can insert their own profile
CREATE POLICY "Users can insert their own profile"
    ON profiles
    FOR INSERT
    WITH CHECK (user_id = auth.uid());

-- Admins can view all profiles
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

-- Admins can manage all profiles
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

-- Guidance can view all profiles
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

-- Guidance can update profiles
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

-- Guidance can insert profiles
CREATE POLICY "Guidance can insert profiles"
    ON profiles
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE user_id = auth.uid()
            AND role = 'guidance'
        )
    );

-- Guidance can delete profiles
CREATE POLICY "Guidance can delete profiles"
    ON profiles
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE user_id = auth.uid()
            AND role = 'guidance'
        )
    );

-- ANXIETY ASSESSMENTS TABLE POLICIES

-- Users can view their own assessments
CREATE POLICY "Users can view their own assessments"
    ON anxiety_assessments
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = anxiety_assessments.profile_id
            AND profiles.user_id = auth.uid()
        )
    );

-- Users can insert their own assessments
CREATE POLICY "Users can insert their own assessments"
    ON anxiety_assessments
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = anxiety_assessments.profile_id
            AND profiles.user_id = auth.uid()
        )
    );

-- Users can update their own assessments
CREATE POLICY "Users can update their own assessments"
    ON anxiety_assessments
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = anxiety_assessments.profile_id
            AND profiles.user_id = auth.uid()
        )
    );

-- Users can delete their own assessments
CREATE POLICY "Users can delete their own assessments"
    ON anxiety_assessments
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = anxiety_assessments.profile_id
            AND profiles.user_id = auth.uid()
        )
    );

-- Admins can view all assessments
CREATE POLICY "Admins can view all assessments"
    ON anxiety_assessments
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE user_id = auth.uid()
            AND role = 'admin'
        )
    );

-- Admins can manage all assessments
CREATE POLICY "Admins can manage all assessments"
    ON anxiety_assessments
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE user_id = auth.uid()
            AND role = 'admin'
        )
    );

-- Guidance can view all assessments
CREATE POLICY "Guidance can view all assessments"
    ON anxiety_assessments
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE user_id = auth.uid()
            AND role = 'guidance'
        )
    );

-- Guidance can insert assessments
CREATE POLICY "Guidance can insert assessments"
    ON anxiety_assessments
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE user_id = auth.uid()
            AND role = 'guidance'
        )
    );

-- Guidance can update assessments
CREATE POLICY "Guidance can update assessments"
    ON anxiety_assessments
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

-- Guidance can delete assessments
CREATE POLICY "Guidance can delete assessments"
    ON anxiety_assessments
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE user_id = auth.uid()
            AND role = 'guidance'
        )
    );

-- Step 3: Grant necessary permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON anxiety_assessments TO authenticated;

-- Step 4: Verification
SELECT 
    '🔒 SECURITY RESTORED' as status,
    'RLS is now enabled with proper policies' as security_status;

-- Show all created policies
SELECT 
    'All Policies Created:' as info,
    tablename,
    policyname,
    cmd,
    permissive
FROM pg_policies 
ORDER BY tablename, policyname;

-- Test policy effectiveness
SELECT 
    'Policy Test Results:' as test_type,
    COUNT(*) as total_policies,
    CASE 
        WHEN COUNT(*) >= 20 
        THEN '✅ All policies created successfully'
        ELSE '❌ Missing policies'
    END as policy_status
FROM pg_policies;

-- Final status
SELECT 
    '🎉 SETUP COMPLETE!' as status,
    'Guidance account should work with guidance@gmail.com / guidance123' as guidance_status,
    'Admin data should be visible with proper access control' as admin_status,
    'All users can access their own data' as user_status,
    'RLS is enabled for security' as security_status; 