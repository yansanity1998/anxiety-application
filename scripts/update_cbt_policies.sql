-- Update CBT Module Policies
-- This script updates existing policies to ensure they work correctly

-- First, let's drop the existing policies to recreate them properly
DROP POLICY IF EXISTS "Students can view their own CBT modules" ON cbt_module;
DROP POLICY IF EXISTS "Students can update their own CBT modules" ON cbt_module;
DROP POLICY IF EXISTS "Guidance counselors can view all CBT modules" ON cbt_module;
DROP POLICY IF EXISTS "Guidance counselors can create CBT modules" ON cbt_module;
DROP POLICY IF EXISTS "Guidance counselors can update CBT modules" ON cbt_module;
DROP POLICY IF EXISTS "Guidance counselors can delete CBT modules" ON cbt_module;
DROP POLICY IF EXISTS "Admins can view all CBT modules" ON cbt_module;
DROP POLICY IF EXISTS "Admins can create CBT modules" ON cbt_module;
DROP POLICY IF EXISTS "Admins can update CBT modules" ON cbt_module;
DROP POLICY IF EXISTS "Admins can delete CBT modules" ON cbt_module;

-- Now recreate the policies with improved logic

-- Policy for students: Can view their own modules
CREATE POLICY "Students can view their own CBT modules"
    ON cbt_module FOR SELECT
    USING (
        profile_id IN (
            SELECT id FROM profiles 
            WHERE user_id = auth.uid() AND role = 'student'
        )
    );

-- Policy for students: Can update their own modules
CREATE POLICY "Students can update their own CBT modules"
    ON cbt_module FOR UPDATE
    USING (
        profile_id IN (
            SELECT id FROM profiles 
            WHERE user_id = auth.uid() AND role = 'student'
        )
    );

-- Policy for guidance counselors: Can view all modules
CREATE POLICY "Guidance counselors can view all CBT modules"
    ON cbt_module FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE user_id = auth.uid() AND role = 'guidance'
        )
    );

-- Policy for guidance counselors: Can create modules for any student
CREATE POLICY "Guidance counselors can create CBT modules"
    ON cbt_module FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE user_id = auth.uid() AND role = 'guidance'
        )
    );

-- Policy for guidance counselors: Can update any module
CREATE POLICY "Guidance counselors can update CBT modules"
    ON cbt_module FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE user_id = auth.uid() AND role = 'guidance'
        )
    );

-- Policy for guidance counselors: Can delete any module
CREATE POLICY "Guidance counselors can delete CBT modules"
    ON cbt_module FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE user_id = auth.uid() AND role = 'guidance'
        )
    );

-- Policy for admins: Can view all modules
CREATE POLICY "Admins can view all CBT modules"
    ON cbt_module FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    );

-- Policy for admins: Can create modules for any user
CREATE POLICY "Admins can create CBT modules"
    ON cbt_module FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    );

-- Policy for admins: Can update any module
CREATE POLICY "Admins can update CBT modules"
    ON cbt_module FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    );

-- Policy for admins: Can delete any module
CREATE POLICY "Admins can delete CBT modules"
    ON cbt_module FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    );

-- Verify the policies were created
SELECT 
    policyname,
    cmd,
    permissive
FROM pg_policies 
WHERE tablename = 'cbt_module'
ORDER BY policyname; 