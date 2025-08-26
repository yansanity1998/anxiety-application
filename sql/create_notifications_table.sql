-- Create a simple notifications table to support the Notifications components
-- This table will store notifications for users and prevent any "relation does not exist" errors

-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    profile_id BIGINT REFERENCES profiles(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('registration', 'login', 'archive', 'appointment', 'system')),
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_profile_id ON notifications(profile_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at);

-- Enable Row Level Security
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own notifications
CREATE POLICY "Users can view their own notifications"
    ON notifications
    FOR SELECT
    USING (
        user_id = auth.uid()
        OR profile_id IN (
            SELECT id FROM profiles
            WHERE user_id = auth.uid()
        )
    );

-- Policy: Users can insert their own notifications
CREATE POLICY "Users can insert their own notifications"
    ON notifications
    FOR INSERT
    WITH CHECK (
        user_id = auth.uid()
        OR profile_id IN (
            SELECT id FROM profiles
            WHERE user_id = auth.uid()
        )
    );

-- Policy: Users can update their own notifications
CREATE POLICY "Users can update their own notifications"
    ON notifications
    FOR UPDATE
    USING (
        user_id = auth.uid()
        OR profile_id IN (
            SELECT id FROM profiles
            WHERE user_id = auth.uid()
        )
    );

-- Policy: Users can delete their own notifications
CREATE POLICY "Users can delete their own notifications"
    ON notifications
    FOR DELETE
    USING (
        user_id = auth.uid()
        OR profile_id IN (
            SELECT id FROM profiles
            WHERE user_id = auth.uid()
        )
    );

-- Policy: Admins can view all notifications
CREATE POLICY "Admins can view all notifications"
    ON notifications
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE user_id = auth.uid()
            AND role = 'admin'
        )
    );

-- Policy: Admins can manage all notifications
CREATE POLICY "Admins can manage all notifications"
    ON notifications
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE user_id = auth.uid()
            AND role = 'admin'
        )
    );

-- Policy: Guidance can view all notifications
CREATE POLICY "Guidance can view all notifications"
    ON notifications
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE user_id = auth.uid()
            AND role = 'guidance'
        )
    );

-- Policy: Guidance can manage all notifications
CREATE POLICY "Guidance can manage all notifications"
    ON notifications
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE user_id = auth.uid()
            AND role = 'guidance'
        )
    );

-- Function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_notifications_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc'::text, NOW());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
CREATE TRIGGER update_notifications_updated_at
    BEFORE UPDATE ON notifications
    FOR EACH ROW
    EXECUTE FUNCTION update_notifications_updated_at();

-- Grant necessary permissions
GRANT ALL ON notifications TO authenticated;
GRANT ALL ON notifications TO service_role;
GRANT USAGE ON SEQUENCE notifications_id_seq TO authenticated;
GRANT USAGE ON SEQUENCE notifications_id_seq TO service_role;

-- Insert some sample notifications for testing (optional)
-- INSERT INTO notifications (user_id, profile_id, type, title, message) VALUES
--     ('00000000-0000-0000-0000-000000000000', 1, 'system', 'Welcome', 'Welcome to the anxiety management system!');

-- Verify the table was created
SELECT 
    'Notifications table created successfully' as status,
    COUNT(*) as notification_count
FROM notifications; 