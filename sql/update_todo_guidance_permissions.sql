-- Update todo_items policies to allow guidance users to manage todos
-- Run this in Supabase SQL Editor

-- Drop existing admin policies
DROP POLICY IF EXISTS "Admins can view all todos" ON todo_items;
DROP POLICY IF EXISTS "Admins can manage all todos" ON todo_items;

-- Create new policies for both admin and guidance
CREATE POLICY "Admins and guidance can view all todos"
    ON todo_items
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM profiles p
            WHERE p.user_id = auth.uid()
              AND p.role IN ('admin', 'guidance')
        )
    );

-- Admins and guidance can manage all todos
CREATE POLICY "Admins and guidance can manage all todos"
    ON todo_items
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM profiles p
            WHERE p.user_id = auth.uid()
              AND p.role IN ('admin', 'guidance')
        )
    );

-- Note: User policies remain unchanged - users can still manage their own todos 