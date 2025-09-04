-- Simple referrals table fix - compatible with Supabase SQL editor
-- This will only create what's missing

-- Check if referrals table exists and create if needed
CREATE TABLE IF NOT EXISTS referrals (
    id BIGSERIAL PRIMARY KEY,
    student_id BIGINT REFERENCES profiles(id) ON DELETE CASCADE,
    referred_by BIGINT REFERENCES profiles(id) ON DELETE SET NULL,
    psychiatrist_name TEXT NOT NULL,
    psychiatrist_email TEXT NOT NULL,
    psychiatrist_phone TEXT,
    referral_reason TEXT NOT NULL,
    urgency_level TEXT DEFAULT 'medium' CHECK (urgency_level IN ('low', 'medium', 'high', 'critical')),
    uploaded_files JSONB DEFAULT '[]',
    file_storage_urls JSONB DEFAULT '[]',
    referral_status TEXT DEFAULT 'pending' CHECK (referral_status IN ('pending', 'sent', 'acknowledged', 'accepted', 'declined', 'completed')),
    email_sent BOOLEAN DEFAULT FALSE,
    email_sent_at TIMESTAMP WITH TIME ZONE,
    documents_sent JSONB DEFAULT '[]',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- Create indexes if they don't exist
CREATE INDEX IF NOT EXISTS idx_referrals_student_id ON referrals(student_id);
CREATE INDEX IF NOT EXISTS idx_referrals_referred_by ON referrals(referred_by);
CREATE INDEX IF NOT EXISTS idx_referrals_status ON referrals(referral_status);
CREATE INDEX IF NOT EXISTS idx_referrals_urgency ON referrals(urgency_level);
CREATE INDEX IF NOT EXISTS idx_referrals_created_at ON referrals(created_at);

-- Enable RLS
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Admins can view all referrals" ON referrals;
DROP POLICY IF EXISTS "Guidance can view all referrals" ON referrals;
DROP POLICY IF EXISTS "Admins can manage all referrals" ON referrals;
DROP POLICY IF EXISTS "Guidance can manage all referrals" ON referrals;

-- Create policies
CREATE POLICY "Admins can view all referrals"
    ON referrals
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE user_id = auth.uid()
            AND role = 'admin'
        )
    );

CREATE POLICY "Guidance can view all referrals"
    ON referrals
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE user_id = auth.uid()
            AND role = 'guidance'
        )
    );

CREATE POLICY "Admins can manage all referrals"
    ON referrals
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE user_id = auth.uid()
            AND role = 'admin'
        )
    );

CREATE POLICY "Guidance can manage all referrals"
    ON referrals
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE user_id = auth.uid()
            AND role = 'guidance'
        )
    );

-- Drop existing function and trigger if they exist
DROP TRIGGER IF EXISTS update_referrals_updated_at ON referrals;
DROP FUNCTION IF EXISTS update_referrals_updated_at();

-- Create function
CREATE OR REPLACE FUNCTION update_referrals_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc'::text, NOW());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
CREATE TRIGGER update_referrals_updated_at
    BEFORE UPDATE ON referrals
    FOR EACH ROW
    EXECUTE FUNCTION update_referrals_updated_at();

-- Grant permissions
GRANT ALL ON referrals TO authenticated;
GRANT ALL ON referrals TO service_role;
GRANT USAGE ON SEQUENCE referrals_id_seq TO authenticated;
GRANT USAGE ON SEQUENCE referrals_id_seq TO service_role;

-- Show result
SELECT 'Referrals table setup complete!' as status; 