-- Fix appointment table policies to allow admins and guidance to create appointments for students
-- This script fixes the RLS policies that were preventing appointment creation

-- First, let's check the current table structure
-- The table should already exist from your previous script

-- Drop all existing policies to start fresh
DROP POLICY IF EXISTS "Admins can view all appointments" ON appointments;
DROP POLICY IF EXISTS "Admins can manage all appointments" ON appointments;
DROP POLICY IF EXISTS "Guidance can view all appointments" ON appointments;
DROP POLICY IF EXISTS "Guidance can manage all appointments" ON appointments;
DROP POLICY IF EXISTS "Students can view their own appointments" ON appointments;
DROP POLICY IF EXISTS "Students can create their own appointments" ON appointments;
DROP POLICY IF EXISTS "Students can update their own appointments" ON appointments;
DROP POLICY IF EXISTS "Students can delete their own appointments" ON appointments;

-- Policy: Admins can view ALL appointments (including those they didn't create)
CREATE POLICY "Admins can view all appointments"
    ON appointments
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE user_id = auth.uid()
            AND role = 'admin'
        )
    );

-- Policy: Admins can INSERT appointments for any student
CREATE POLICY "Admins can insert appointments"
    ON appointments
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE user_id = auth.uid()
            AND role = 'admin'
        )
    );

-- Policy: Admins can UPDATE any appointment
CREATE POLICY "Admins can update appointments"
    ON appointments
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE user_id = auth.uid()
            AND role = 'admin'
        )
    );

-- Policy: Admins can DELETE any appointment
CREATE POLICY "Admins can delete appointments"
    ON appointments
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE user_id = auth.uid()
            AND role = 'admin'
        )
    );

-- Policy: Guidance can view ALL appointments
CREATE POLICY "Guidance can view all appointments"
    ON appointments
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE user_id = auth.uid()
            AND role = 'guidance'
        )
    );

-- Policy: Guidance can INSERT appointments for any student
CREATE POLICY "Guidance can insert appointments"
    ON appointments
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE user_id = auth.uid()
            AND role = 'guidance'
        )
    );

-- Policy: Guidance can UPDATE any appointment
CREATE POLICY "Guidance can update appointments"
    ON appointments
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE user_id = auth.uid()
            AND role = 'guidance'
        )
    );

-- Policy: Guidance can DELETE any appointment
CREATE POLICY "Guidance can delete appointments"
    ON appointments
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE user_id = auth.uid()
            AND role = 'guidance'
        )
    );

-- Policy: Students can view their own appointments
CREATE POLICY "Students can view their own appointments"
    ON appointments
    FOR SELECT
    USING (
        profile_id IN (
            SELECT id FROM profiles
            WHERE user_id = auth.uid()
        )
    );

-- Policy: Students can create their own appointments
CREATE POLICY "Students can create their own appointments"
    ON appointments
    FOR INSERT
    WITH CHECK (
        profile_id IN (
            SELECT id FROM profiles
            WHERE user_id = auth.uid()
        )
    );

-- Policy: Students can update their own appointments
CREATE POLICY "Students can update their own appointments"
    ON appointments
    FOR UPDATE
    USING (
        profile_id IN (
            SELECT id FROM profiles
            WHERE user_id = auth.uid()
        )
    );

-- Policy: Students can delete their own appointments
CREATE POLICY "Students can delete their own appointments"
    ON appointments
    FOR DELETE
    USING (
        profile_id IN (
            SELECT id FROM profiles
            WHERE user_id = auth.uid()
        )
    );

-- Verify the policies were created
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'appointments'
ORDER BY policyname;

-- Test the policies by checking if they exist
SELECT 
    p.policyname,
    p.cmd,
    p.permissive,
    p.roles,
    p.qual,
    p.with_check
FROM pg_policies p
WHERE p.tablename = 'appointments'
ORDER BY p.policyname; 