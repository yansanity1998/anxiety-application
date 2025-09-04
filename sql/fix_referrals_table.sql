-- Safe fix for referrals table - only creates what's missing
-- This will work whether the table exists or not

-- Check if referrals table exists, if not create it
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'referrals') THEN
        CREATE TABLE referrals (
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
        RAISE NOTICE 'Referrals table created successfully';
    ELSE
        RAISE NOTICE 'Referrals table already exists';
    END IF;
END $$;

-- Create indexes only if they don't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_referrals_student_id') THEN
        CREATE INDEX idx_referrals_student_id ON referrals(student_id);
        RAISE NOTICE 'Index idx_referrals_student_id created';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_referrals_referred_by') THEN
        CREATE INDEX idx_referrals_referred_by ON referrals(referred_by);
        RAISE NOTICE 'Index idx_referrals_referred_by created';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_referrals_status') THEN
        CREATE INDEX idx_referrals_status ON referrals(referral_status);
        RAISE NOTICE 'Index idx_referrals_status created';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_referrals_urgency') THEN
        CREATE INDEX idx_referrals_urgency ON referrals(urgency_level);
        RAISE NOTICE 'Index idx_referrals_urgency created';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_referrals_created_at') THEN
        CREATE INDEX idx_referrals_created_at ON referrals(created_at);
        RAISE NOTICE 'Index idx_referrals_created_at created';
    END IF;
END $$;

-- Enable RLS only if not already enabled
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'referrals' AND rowsecurity = true) THEN
        ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;
        RAISE NOTICE 'RLS enabled on referrals table';
    ELSE
        RAISE NOTICE 'RLS already enabled on referrals table';
    END IF;
END $$;

-- Create policies only if they don't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'referrals' AND policyname = 'Admins can view all referrals') THEN
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
        RAISE NOTICE 'Policy "Admins can view all referrals" created';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'referrals' AND policyname = 'Guidance can view all referrals') THEN
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
        RAISE NOTICE 'Policy "Guidance can view all referrals" created';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'referrals' AND policyname = 'Admins can manage all referrals') THEN
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
        RAISE NOTICE 'Policy "Admins can manage all referrals" created';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'referrals' AND policyname = 'Guidance can manage all referrals') THEN
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
        RAISE NOTICE 'Policy "Guidance can manage all referrals" created';
    END IF;
END $$;

-- Create function only if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'update_referrals_updated_at') THEN
        CREATE OR REPLACE FUNCTION update_referrals_updated_at()
        RETURNS TRIGGER AS $$
        BEGIN
            NEW.updated_at = TIMEZONE('utc'::text, NOW());
            RETURN NEW;
        END;
        $$ LANGUAGE plpgsql;
        RAISE NOTICE 'Function update_referrals_updated_at created';
    END IF;
END $$;

-- Create trigger only if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_referrals_updated_at') THEN
        CREATE TRIGGER update_referrals_updated_at
            BEFORE UPDATE ON referrals
            FOR EACH ROW
            EXECUTE FUNCTION update_referrals_updated_at();
        RAISE NOTICE 'Trigger update_referrals_updated_at created';
    END IF;
END $$;

-- Grant permissions (safe to run multiple times)
GRANT ALL ON referrals TO authenticated;
GRANT ALL ON referrals TO service_role;
GRANT USAGE ON SEQUENCE referrals_id_seq TO authenticated;
GRANT USAGE ON SEQUENCE referrals_id_seq TO service_role;

-- Final check
SELECT 
    'Referrals table setup complete!' as status,
    (SELECT COUNT(*) FROM referrals) as existing_referrals_count; 