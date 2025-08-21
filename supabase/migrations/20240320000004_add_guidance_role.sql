-- Migration: Add guidance role support
-- This migration adds guidance role functionality without affecting existing tables

-- First, let's add the guidance role to the profiles table if it doesn't exist
-- We'll use a safe approach that won't break existing functionality

-- Update the handle_new_user function to support guidance role
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

-- Insert guidance user if not exists (this will be created when they first sign up)
-- We'll create a placeholder profile that will be updated when they actually sign up
INSERT INTO profiles (
    user_id, 
    email, 
    full_name,
    role,
    created_at,
    last_sign_in
)
SELECT 
    id, 
    email, 
    COALESCE(raw_user_meta_data->>'full_name', raw_user_meta_data->>'name', 'Guidance Counselor'),
    'guidance',
    NOW(),
    NOW()
FROM auth.users
WHERE email = 'guidance@gmail.com'
ON CONFLICT (user_id) 
DO UPDATE SET 
    role = 'guidance',
    email = EXCLUDED.email,
    full_name = EXCLUDED.full_name,
    last_sign_in = NOW();

-- Add RLS policy for guidance users to view all profiles (for counseling purposes)
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

-- Add RLS policy for guidance users to update profiles (for counseling purposes)
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

-- Add RLS policy for guidance users to view anxiety assessments (for counseling purposes)
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

-- Grant necessary permissions for guidance role
GRANT SELECT, UPDATE ON profiles TO authenticated;
GRANT SELECT ON anxiety_assessments TO authenticated;

-- Ensure the trigger is properly set up
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION handle_new_user(); 