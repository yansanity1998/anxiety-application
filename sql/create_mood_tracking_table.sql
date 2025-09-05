-- Create mood_entries table for tracking daily mood
CREATE TABLE IF NOT EXISTS mood_entries (
    id SERIAL PRIMARY KEY,
    profile_id INTEGER NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    mood_level INTEGER NOT NULL CHECK (mood_level >= 1 AND mood_level <= 5),
    mood_emoji VARCHAR(10) NOT NULL,
    mood_label VARCHAR(50) NOT NULL,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    entry_date DATE DEFAULT CURRENT_DATE,
    
    -- Ensure one mood entry per user per day
    UNIQUE(profile_id, entry_date)
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_mood_entries_created_at ON mood_entries(created_at);

-- Enable RLS (Row Level Security)
ALTER TABLE mood_entries ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Users can only see their own mood entries
CREATE POLICY "Users can view own mood entries" ON mood_entries
    FOR SELECT USING (
        profile_id IN (
            SELECT id FROM profiles WHERE user_id = auth.uid()
        )
    );

-- Users can insert their own mood entries
CREATE POLICY "Users can insert own mood entries" ON mood_entries
    FOR INSERT WITH CHECK (
        profile_id IN (
            SELECT id FROM profiles WHERE user_id = auth.uid()
        )
    );

-- Users can update their own mood entries
CREATE POLICY "Users can update own mood entries" ON mood_entries
    FOR UPDATE USING (
        profile_id IN (
            SELECT id FROM profiles WHERE user_id = auth.uid()
        )
    );

-- Users can delete their own mood entries
CREATE POLICY "Users can delete own mood entries" ON mood_entries
    FOR DELETE USING (
        profile_id IN (
            SELECT id FROM profiles WHERE user_id = auth.uid()
        )
    );

-- Note: Guidance counselor policy removed since guidance_counselor_id column doesn't exist
-- If you need guidance counselor access, add the guidance_counselor_id column to profiles table first

-- Admins can view all mood entries
CREATE POLICY "Admins can view all mood entries" ON mood_entries
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE user_id = auth.uid()
            AND role = 'admin'
        )
    );

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_mood_entries_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_mood_entries_updated_at
    BEFORE UPDATE ON mood_entries
    FOR EACH ROW
    EXECUTE FUNCTION update_mood_entries_updated_at();

-- Insert some sample mood data for testing (optional)
-- You can remove this section if you don't want sample data
/*
INSERT INTO mood_entries (profile_id, mood_level, mood_emoji, mood_label, notes) VALUES
(1, 5, '😊', 'Very Happy', 'Had a great day with friends'),
(1, 4, '😄', 'Happy', 'Completed my CBT module'),
(1, 3, '😐', 'Neutral', 'Regular day, nothing special'),
(1, 2, '😔', 'Sad', 'Feeling a bit down today'),
(1, 1, '😢', 'Very Sad', 'Having a difficult time');
*/
