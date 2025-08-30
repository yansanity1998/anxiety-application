-- Drop existing table if needed
DROP TABLE IF EXISTS todo_items CASCADE;

-- To-Do items table linked to profiles
CREATE TABLE todo_items (
    id BIGSERIAL PRIMARY KEY,
    profile_id BIGINT REFERENCES profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    category TEXT, -- e.g., Exposure, Relaxation, Lifestyle, Study, Social
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','in_progress','completed','canceled')),
    priority INTEGER DEFAULT 3 CHECK (priority BETWEEN 1 AND 5), -- 1=highest, 5=lowest
    due_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- Helpful indexes
CREATE INDEX IF NOT EXISTS idx_todo_items_profile ON todo_items(profile_id);
CREATE INDEX IF NOT EXISTS idx_todo_items_status ON todo_items(status);
CREATE INDEX IF NOT EXISTS idx_todo_items_due_at ON todo_items(due_at);

-- Simple trigger to update updated_at
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc'::text, NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_todo_items_updated_at ON todo_items;
CREATE TRIGGER trg_todo_items_updated_at
BEFORE UPDATE ON todo_items
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

-- Enable Row Level Security
ALTER TABLE todo_items ENABLE ROW LEVEL SECURITY;

-- Users can view their own to-dos
CREATE POLICY "Users can view their own todos"
    ON todo_items
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM profiles p
            WHERE p.id = todo_items.profile_id
              AND p.user_id = auth.uid()
        )
    );

-- Users can insert their own to-dos
CREATE POLICY "Users can insert their own todos"
    ON todo_items
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles p
            WHERE p.id = todo_items.profile_id
              AND p.user_id = auth.uid()
        )
    );

-- Users can update their own to-dos
CREATE POLICY "Users can update their own todos"
    ON todo_items
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM profiles p
            WHERE p.id = todo_items.profile_id
              AND p.user_id = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles p
            WHERE p.id = todo_items.profile_id
              AND p.user_id = auth.uid()
        )
    );

-- Users can delete their own to-dos
CREATE POLICY "Users can delete their own todos"
    ON todo_items
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM profiles p
            WHERE p.id = todo_items.profile_id
              AND p.user_id = auth.uid()
        )
    );

-- Admins can view all to-dos
CREATE POLICY "Admins can view all todos"
    ON todo_items
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM profiles p
            WHERE p.user_id = auth.uid()
              AND p.role = 'admin'
        )
    );

-- Admins can manage all to-dos
CREATE POLICY "Admins can manage all todos"
    ON todo_items
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM profiles p
            WHERE p.user_id = auth.uid()
              AND p.role = 'admin'
        )
    );

-- Grants
GRANT ALL ON todo_items TO authenticated;
GRANT ALL ON todo_items TO service_role;
GRANT USAGE ON SEQUENCE todo_items_id_seq TO authenticated;
GRANT USAGE ON SEQUENCE todo_items_id_seq TO service_role;

-- Enforce RLS
ALTER TABLE todo_items FORCE ROW LEVEL SECURITY; 