-- Setup CBT Modules Table
-- Run this script in your Supabase SQL Editor

-- Create CBT modules table
CREATE TABLE IF NOT EXISTS cbt_module (
    id BIGSERIAL PRIMARY KEY,
    profile_id BIGINT REFERENCES profiles(id) ON DELETE CASCADE,
    module_title TEXT NOT NULL,
    module_description TEXT NOT NULL,
    module_status TEXT NOT NULL DEFAULT 'not_started' CHECK (module_status IN ('not_started', 'in_progress', 'completed', 'paused')),
    module_date_started TIMESTAMP WITH TIME ZONE,
    module_date_complete TIMESTAMP WITH TIME ZONE,
    module_image TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_cbt_module_profile_id ON cbt_module(profile_id);
CREATE INDEX IF NOT EXISTS idx_cbt_module_status ON cbt_module(module_status);
CREATE INDEX IF NOT EXISTS idx_cbt_module_created_at ON cbt_module(created_at);

-- Enable Row Level Security
ALTER TABLE cbt_module ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
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

-- Create policies for different user roles

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

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_cbt_module_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS update_cbt_module_updated_at_trigger ON cbt_module;

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_cbt_module_updated_at_trigger
    BEFORE UPDATE ON cbt_module
    FOR EACH ROW
    EXECUTE FUNCTION update_cbt_module_updated_at();

-- Insert some sample data for testing (only if table is empty)
INSERT INTO cbt_module (profile_id, module_title, module_description, module_status, module_image) 
SELECT 
    1, 
    'Understanding Anxiety', 
    'Learn about the basics of anxiety and how it affects your daily life.', 
    'in_progress', 
    'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400'
WHERE NOT EXISTS (SELECT 1 FROM cbt_module LIMIT 1);

INSERT INTO cbt_module (profile_id, module_title, module_description, module_status, module_image) 
SELECT 
    1, 
    'Breathing Techniques', 
    'Master various breathing exercises to help manage anxiety symptoms.', 
    'completed', 
    'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=400'
WHERE NOT EXISTS (SELECT 1 FROM cbt_module WHERE module_title = 'Breathing Techniques');

INSERT INTO cbt_module (profile_id, module_title, module_description, module_status, module_image) 
SELECT 
    2, 
    'Cognitive Behavioral Therapy', 
    'Introduction to CBT techniques for managing negative thoughts.', 
    'not_started', 
    'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=400'
WHERE NOT EXISTS (SELECT 1 FROM cbt_module WHERE module_title = 'Cognitive Behavioral Therapy'); 