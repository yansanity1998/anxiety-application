-- Update mood_entries table to support new mood levels (6-8)
-- This migration adds support for angry, in love, and crying emojis

-- First, update the CHECK constraint to allow mood levels 1-8
ALTER TABLE mood_entries 
DROP CONSTRAINT IF EXISTS mood_entries_mood_level_check;

ALTER TABLE mood_entries 
ADD CONSTRAINT mood_entries_mood_level_check 
CHECK (mood_level >= 1 AND mood_level <= 8);

-- Insert sample data for the new mood levels (optional)
-- You can remove this section if you don't want sample data
/*
INSERT INTO mood_entries (profile_id, mood_level, mood_emoji, mood_label, notes) VALUES
(1, 6, '😠', 'Angry', 'Feeling frustrated about something'),
(1, 7, '😍', 'In Love', 'Feeling romantic and excited'),
(1, 8, '😭', 'Crying', 'Having an emotional breakdown');
*/

-- Note: The existing schema already supports:
-- - mood_level INTEGER (can handle 1-8)
-- - mood_emoji VARCHAR(10) (sufficient for emoji characters)
-- - mood_label VARCHAR(50) (sufficient for labels like 'Angry', 'In Love', 'Crying')
-- - All other columns remain unchanged

-- The application code (moodService.ts) has been updated to include:
-- Level 6: 😠 Angry
-- Level 7: 😍 In Love  
-- Level 8: 😭 Crying
