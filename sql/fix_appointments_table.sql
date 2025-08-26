-- DROP TABLE IF EXISTS appointments CASCADE;
CREATE TABLE IF NOT EXISTS appointments (
    id SERIAL PRIMARY KEY,
    student_profile_id INTEGER NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    student_name TEXT NOT NULL,
    student_email TEXT NOT NULL,
    appointment_date DATE NOT NULL,
    appointment_time TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('Scheduled', 'In Progress', 'Completed', 'Canceled', 'No Show')),
    notes TEXT,
    scheduled_by INTEGER REFERENCES profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    meeting_duration_minutes INTEGER,
    meeting_platform TEXT
);

-- Indexes for fast lookup
CREATE INDEX IF NOT EXISTS idx_appointments_student_profile_id ON appointments(student_profile_id);
CREATE INDEX IF NOT EXISTS idx_appointments_date ON appointments(appointment_date);
CREATE INDEX IF NOT EXISTS idx_appointments_status ON appointments(status);

-- Trigger to update updated_at on change
CREATE OR REPLACE FUNCTION update_appointments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_appointments_updated_at ON appointments;
CREATE TRIGGER trigger_update_appointments_updated_at
    BEFORE UPDATE ON appointments
    FOR EACH ROW
    EXECUTE FUNCTION update_appointments_updated_at();

-- Enable RLS
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;

-- Guidance and admin can view, insert, update, delete all appointments
CREATE POLICY "GuidanceAdminAllAppointments" ON appointments
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('guidance', 'admin')
        )
    ) WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('guidance', 'admin')
        )
    );

-- Students can view and insert their own appointments
CREATE POLICY "StudentOwnAppointments" ON appointments
    FOR SELECT, INSERT USING (
        student_profile_id IN (
            SELECT id FROM profiles WHERE user_id = auth.uid()
        )
    ) WITH CHECK (
        student_profile_id IN (
            SELECT id FROM profiles WHERE user_id = auth.uid()
        )
    );

-- Comments for documentation
COMMENT ON TABLE appointments IS 'Stores all guidance appointment data including scheduling, status, and meeting details.';
COMMENT ON COLUMN appointments.student_profile_id IS 'Reference to the student profile who the appointment is for.';
COMMENT ON COLUMN appointments.status IS 'Current status of the appointment: Scheduled, In Progress, Completed, Canceled, No Show.';
COMMENT ON COLUMN appointments.scheduled_by IS 'Reference to the guidance counselor or admin who scheduled the appointment.';
COMMENT ON COLUMN appointments.meeting_notes IS 'Notes about the appointment or meeting outcomes.';
COMMENT ON COLUMN appointments.meeting_duration_minutes IS 'Expected duration of the meeting in minutes.';
COMMENT ON COLUMN appointments.meeting_platform IS 'Platform for online meetings (Zoom, Teams, etc.).';
