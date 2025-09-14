-- Updated referrals table based on the referral form structure
-- This matches the physical referral form with all required fields

-- Drop existing table if it exists (be careful in production)
DROP TABLE IF EXISTS referrals CASCADE;

-- Create updated referrals table matching the form structure
CREATE TABLE referrals (
    id BIGSERIAL PRIMARY KEY,
    
    -- Student Information
    student_id BIGINT REFERENCES profiles(id) ON DELETE CASCADE,
    student_name TEXT, -- Store student name for easier access
    
    -- Referral Source Information
    referred_by BIGINT REFERENCES profiles(id) ON DELETE SET NULL,
    referred_by_faculty BOOLEAN DEFAULT FALSE,
    referred_by_staff BOOLEAN DEFAULT FALSE,
    referred_by_parent_guardian BOOLEAN DEFAULT FALSE,
    referred_by_peer BOOLEAN DEFAULT FALSE,
    referred_by_self BOOLEAN DEFAULT FALSE,
    referred_by_others BOOLEAN DEFAULT FALSE,
    referred_by_others_specify TEXT,
    
    -- Preferred Mode of Counseling
    preferred_face_to_face_individual BOOLEAN DEFAULT FALSE,
    preferred_face_to_face_group BOOLEAN DEFAULT FALSE,
    preferred_online BOOLEAN DEFAULT FALSE,
    
    -- Reason for Referral (Check all that apply)
    reason_academic_concerns BOOLEAN DEFAULT FALSE,
    reason_behavioral_issues BOOLEAN DEFAULT FALSE,
    reason_emotional_psychological_concerns BOOLEAN DEFAULT FALSE,
    reason_career_counseling BOOLEAN DEFAULT FALSE,
    reason_peer_relationship_social_adjustment BOOLEAN DEFAULT FALSE,
    reason_family_concerns BOOLEAN DEFAULT FALSE,
    reason_personal_concerns BOOLEAN DEFAULT FALSE,
    reason_psychological_assessment_request BOOLEAN DEFAULT FALSE,
    reason_others BOOLEAN DEFAULT FALSE,
    reason_others_specify TEXT,
    
    -- Brief Description of Concern
    brief_description_of_concern TEXT NOT NULL,
    
    -- Immediate Action Taken (If Any)
    immediate_action_taken TEXT,
    
    -- Signatures and Notes
    requested_by_signature TEXT,
    requested_by_printed_name TEXT,
    noted_by_principal_dean TEXT,
    
    -- System fields for tracking
    urgency_level TEXT DEFAULT 'medium' CHECK (urgency_level IN ('low', 'medium', 'high', 'critical')),
    referral_status TEXT DEFAULT 'pending' CHECK (referral_status IN ('pending', 'sent', 'acknowledged', 'accepted', 'declined', 'completed')),
    
    -- File attachments and documents
    uploaded_files JSONB DEFAULT '[]',
    file_storage_urls JSONB DEFAULT '[]',
    
    -- Email tracking
    email_sent BOOLEAN DEFAULT FALSE,
    email_sent_at TIMESTAMP WITH TIME ZONE,
    documents_sent JSONB DEFAULT '[]',
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_referrals_student_id ON referrals(student_id);
CREATE INDEX IF NOT EXISTS idx_referrals_referred_by ON referrals(referred_by);
CREATE INDEX IF NOT EXISTS idx_referrals_status ON referrals(referral_status);
CREATE INDEX IF NOT EXISTS idx_referrals_urgency ON referrals(urgency_level);
CREATE INDEX IF NOT EXISTS idx_referrals_created_at ON referrals(created_at);

-- Enable Row Level Security
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;

-- Policy to allow admins to view all referrals
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

-- Policy to allow guidance counselors to view all referrals
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

-- Policy to allow admins to manage all referrals
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

-- Policy to allow guidance counselors to manage all referrals
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

-- Function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_referrals_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc'::text, NOW());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
CREATE TRIGGER update_referrals_updated_at
    BEFORE UPDATE ON referrals
    FOR EACH ROW
    EXECUTE FUNCTION update_referrals_updated_at();

-- Grant necessary permissions
GRANT ALL ON referrals TO authenticated;
GRANT ALL ON referrals TO service_role;
GRANT USAGE ON SEQUENCE referrals_id_seq TO authenticated;
GRANT USAGE ON SEQUENCE referrals_id_seq TO service_role;

-- Enable RLS bypass for service role
ALTER TABLE referrals FORCE ROW LEVEL SECURITY;
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;
