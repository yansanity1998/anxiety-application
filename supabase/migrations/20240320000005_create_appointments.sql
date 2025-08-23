-- Create appointments table
CREATE TABLE IF NOT EXISTS appointments (
    id BIGSERIAL PRIMARY KEY,
    profile_id BIGINT REFERENCES profiles(id) ON DELETE CASCADE,
    student_name TEXT NOT NULL,
    student_email TEXT NOT NULL,
    appointment_date DATE NOT NULL,
    appointment_time TIME NOT NULL,
    status TEXT DEFAULT 'Scheduled' CHECK (status IN ('Scheduled', 'In Progress', 'Completed', 'Canceled', 'No Show')),
    notes TEXT,
    created_by BIGINT REFERENCES profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
    UNIQUE(profile_id, appointment_date, appointment_time)
);

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_appointments_profile_id ON appointments(profile_id);
CREATE INDEX IF NOT EXISTS idx_appointments_date ON appointments(appointment_date);
CREATE INDEX IF NOT EXISTS idx_appointments_status ON appointments(status);
CREATE INDEX IF NOT EXISTS idx_appointments_created_by ON appointments(created_by);

-- Enable Row Level Security
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;

-- Policy to allow admins to view all appointments
CREATE POLICY "Admins can view all appointments"
    ON appointments
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE user_id = auth.uid()
            AND role = 'admin'
        )
    );

-- Policy to allow guidance counselors to view all appointments
CREATE POLICY "Guidance can view all appointments"
    ON appointments
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE user_id = auth.uid()
            AND role = 'guidance'
        )
    );

-- Policy to allow admins to manage all appointments
CREATE POLICY "Admins can manage all appointments"
    ON appointments
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE user_id = auth.uid()
            AND role = 'admin'
        )
    );

-- Policy to allow guidance counselors to manage all appointments
CREATE POLICY "Guidance can manage all appointments"
    ON appointments
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE user_id = auth.uid()
            AND role = 'guidance'
        )
    );

-- Function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_appointments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc'::text, NOW());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
CREATE TRIGGER update_appointments_updated_at
    BEFORE UPDATE ON appointments
    FOR EACH ROW
    EXECUTE FUNCTION update_appointments_updated_at();

-- Grant necessary permissions
GRANT ALL ON appointments TO authenticated;
GRANT ALL ON appointments TO service_role;
GRANT USAGE ON SEQUENCE appointments_id_seq TO authenticated;
GRANT USAGE ON SEQUENCE appointments_id_seq TO service_role;

-- Enable RLS bypass for service role
ALTER TABLE appointments FORCE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY; 