-- Create Anxiety Videos table
CREATE TABLE IF NOT EXISTS anxiety_video (
    id BIGSERIAL PRIMARY KEY,
    profile_id BIGINT REFERENCES profiles(id) ON DELETE CASCADE,
    video_title TEXT NOT NULL,
    video_description TEXT NOT NULL,
    video_url TEXT NOT NULL,
    video_duration INTEGER, -- duration in seconds
    video_status TEXT NOT NULL DEFAULT 'not_started' CHECK (video_status IN ('not_started', 'in_progress', 'completed', 'paused')),
    video_date_started TIMESTAMP WITH TIME ZONE,
    video_date_completed TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_anxiety_video_profile_id ON anxiety_video(profile_id);
CREATE INDEX IF NOT EXISTS idx_anxiety_video_status ON anxiety_video(video_status);
CREATE INDEX IF NOT EXISTS idx_anxiety_video_created_at ON anxiety_video(created_at);

-- Enable Row Level Security
ALTER TABLE anxiety_video ENABLE ROW LEVEL SECURITY;

-- Policies
-- Students: can view their own videos
CREATE POLICY "Students can view their own anxiety videos"
    ON anxiety_video FOR SELECT
    USING (
        profile_id IN (
            SELECT id FROM profiles WHERE user_id = auth.uid() AND role = 'student'
        )
    );

-- Students: can update their own videos (e.g., progress)
CREATE POLICY "Students can update their own anxiety videos"
    ON anxiety_video FOR UPDATE
    USING (
        profile_id IN (
            SELECT id FROM profiles WHERE user_id = auth.uid() AND role = 'student'
        )
    );

-- Guidance: can view all
CREATE POLICY "Guidance can view all anxiety videos"
    ON anxiety_video FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role = 'guidance'
        )
    );

-- Guidance: can create for any student
CREATE POLICY "Guidance can create anxiety videos"
    ON anxiety_video FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role = 'guidance'
        )
    );

-- Guidance: can update any
CREATE POLICY "Guidance can update anxiety videos"
    ON anxiety_video FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role = 'guidance'
        )
    );

-- Guidance: can delete any
CREATE POLICY "Guidance can delete anxiety videos"
    ON anxiety_video FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role = 'guidance'
        )
    );

-- Admins: can view all
CREATE POLICY "Admins can view all anxiety videos"
    ON anxiety_video FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role = 'admin'
        )
    );

-- Admins: can create for any user
CREATE POLICY "Admins can create anxiety videos"
    ON anxiety_video FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role = 'admin'
        )
    );

-- Admins: can update any
CREATE POLICY "Admins can update anxiety videos"
    ON anxiety_video FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role = 'admin'
        )
    );

-- Admins: can delete any
CREATE POLICY "Admins can delete anxiety videos"
    ON anxiety_video FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role = 'admin'
        )
    );

-- Trigger function to keep updated_at fresh
CREATE OR REPLACE FUNCTION update_anxiety_video_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger
CREATE TRIGGER update_anxiety_video_updated_at_trigger
    BEFORE UPDATE ON anxiety_video
    FOR EACH ROW
    EXECUTE FUNCTION update_anxiety_video_updated_at(); 