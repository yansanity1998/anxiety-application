-- Create APPOINTMENT table for guidance scheduling system
-- This table stores all appointment data for guidance visits

CREATE TABLE IF NOT EXISTS appointments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    
    -- Student/User Information
    student_profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    student_name VARCHAR(255) NOT NULL,
    student_email VARCHAR(255) NOT NULL,
    
    -- Appointment Details
    appointment_date DATE NOT NULL,
    appointment_time TIME NOT NULL,
    appointment_datetime TIMESTAMP WITH TIME ZONE GENERATED ALWAYS AS (appointment_date + appointment_time) STORED,
    
    -- Status Management
    status VARCHAR(50) DEFAULT 'Scheduled' CHECK (status IN ('Scheduled', 'In Progress', 'Completed', 'Canceled', 'No Show')),
    
    -- Scheduling Information
    scheduled_by UUID REFERENCES profiles(id) ON DELETE SET NULL, -- Guidance counselor or admin who scheduled
    scheduled_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Meeting Details
    meeting_notes TEXT,
    meeting_duration_minutes INTEGER DEFAULT 60,
    meeting_type VARCHAR(100) DEFAULT 'Guidance Visit',
    
    -- Location/Platform (for future use)
    meeting_location VARCHAR(255) DEFAULT 'Guidance Office',
    meeting_platform VARCHAR(100), -- For online meetings
    
    -- Reminder Settings
    reminder_sent BOOLEAN DEFAULT FALSE,
    reminder_sent_at TIMESTAMP WITH TIME ZONE,
    
    -- Completion Information
    completed_at TIMESTAMP WITH TIME ZONE,
    completed_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    
    -- Cancellation Information
    canceled_at TIMESTAMP WITH TIME ZONE,
    canceled_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    cancellation_reason TEXT,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_appointments_student_profile_id ON appointments(student_profile_id);
CREATE INDEX IF NOT EXISTS idx_appointments_date ON appointments(appointment_date);
CREATE INDEX IF NOT EXISTS idx_appointments_datetime ON appointments(appointment_datetime);
CREATE INDEX IF NOT EXISTS idx_appointments_status ON appointments(status);
CREATE INDEX IF NOT EXISTS idx_appointments_scheduled_by ON appointments(scheduled_by);
CREATE INDEX IF NOT EXISTS idx_appointments_upcoming ON appointments(appointment_datetime) WHERE appointment_datetime > NOW();

-- Create a function to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_appointments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
CREATE TRIGGER trigger_update_appointments_updated_at
    BEFORE UPDATE ON appointments
    FOR EACH ROW
    EXECUTE FUNCTION update_appointments_updated_at();

-- Create a function to check for appointment conflicts
CREATE OR REPLACE FUNCTION check_appointment_conflicts()
RETURNS TRIGGER AS $$
BEGIN
    -- Check if there's an overlapping appointment for the same student
    IF EXISTS (
        SELECT 1 FROM appointments 
        WHERE student_profile_id = NEW.student_profile_id
        AND id != NEW.id
        AND status NOT IN ('Canceled', 'Completed')
        AND appointment_date = NEW.appointment_date
        AND appointment_time = NEW.appointment_time
    ) THEN
        RAISE EXCEPTION 'Appointment conflict: Student already has an appointment at this date and time';
    END IF;
    
    -- Check if appointment is in the past
    IF NEW.appointment_date < CURRENT_DATE THEN
        RAISE EXCEPTION 'Cannot schedule appointments in the past';
    END IF;
    
    -- Check if appointment time is during business hours (8 AM to 5 PM)
    IF NEW.appointment_time < '08:00' OR NEW.appointment_time > '17:00' THEN
        RAISE EXCEPTION 'Appointments must be scheduled during business hours (8:00 AM - 5:00 PM)';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to check for conflicts before insert/update
CREATE TRIGGER trigger_check_appointment_conflicts
    BEFORE INSERT OR UPDATE ON appointments
    FOR EACH ROW
    EXECUTE FUNCTION check_appointment_conflicts();

-- Create a function to automatically update status based on datetime
CREATE OR REPLACE FUNCTION update_appointment_status()
RETURNS TRIGGER AS $$
BEGIN
    -- If appointment is in the past and still scheduled, mark as "No Show"
    IF NEW.appointment_datetime < NOW() AND NEW.status = 'Scheduled' THEN
        NEW.status = 'No Show';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update status based on datetime
CREATE TRIGGER trigger_update_appointment_status
    BEFORE UPDATE ON appointments
    FOR EACH ROW
    EXECUTE FUNCTION update_appointment_status();

-- Create a view for upcoming appointments
CREATE OR REPLACE VIEW upcoming_appointments AS
SELECT 
    a.id,
    a.student_profile_id,
    a.student_name,
    a.student_email,
    a.appointment_date,
    a.appointment_time,
    a.appointment_datetime,
    a.status,
    a.meeting_notes,
    a.meeting_duration_minutes,
    a.meeting_type,
    a.meeting_location,
    a.scheduled_by,
    a.scheduled_at,
    p.full_name as scheduled_by_name,
    p.email as scheduled_by_email
FROM appointments a
LEFT JOIN profiles p ON a.scheduled_by = p.id
WHERE a.appointment_datetime > NOW()
AND a.status IN ('Scheduled', 'In Progress')
ORDER BY a.appointment_datetime ASC;

-- Create a view for today's appointments
CREATE OR REPLACE VIEW todays_appointments AS
SELECT 
    a.id,
    a.student_profile_id,
    a.student_name,
    a.student_email,
    a.appointment_date,
    a.appointment_time,
    a.appointment_datetime,
    a.status,
    a.meeting_notes,
    a.meeting_duration_minutes,
    a.meeting_type,
    a.meeting_location,
    a.scheduled_by,
    a.scheduled_at,
    p.full_name as scheduled_by_name,
    p.email as scheduled_by_email
FROM appointments a
LEFT JOIN profiles p ON a.scheduled_by = p.id
WHERE a.appointment_date = CURRENT_DATE
AND a.status IN ('Scheduled', 'In Progress')
ORDER BY a.appointment_time ASC;

-- Insert sample data for testing
INSERT INTO appointments (
    student_profile_id,
    student_name,
    student_email,
    appointment_date,
    appointment_time,
    status,
    meeting_type,
    meeting_notes
) VALUES 
(
    (SELECT id FROM profiles WHERE role = 'student' LIMIT 1),
    'John Doe',
    'john.doe@example.com',
    CURRENT_DATE + INTERVAL '1 day',
    '10:00',
    'Scheduled',
    'Guidance Visit',
    'Initial consultation for academic concerns'
),
(
    (SELECT id FROM profiles WHERE role = 'student' LIMIT 1 OFFSET 1),
    'Jane Smith',
    'jane.smith@example.com',
    CURRENT_DATE + INTERVAL '2 days',
    '14:30',
    'Scheduled',
    'Guidance Visit',
    'Career counseling session'
);

-- Grant permissions (adjust based on your RLS policies)
-- This assumes you have RLS enabled on the profiles table
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for appointments
-- Guidance counselors can see all appointments
CREATE POLICY "Guidance can view all appointments" ON appointments
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND role IN ('guidance', 'admin')
        )
    );

-- Guidance counselors can insert appointments
CREATE POLICY "Guidance can insert appointments" ON appointments
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND role IN ('guidance', 'admin')
        )
    );

-- Guidance counselors can update appointments
CREATE POLICY "Guidance can update appointments" ON appointments
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND role IN ('guidance', 'admin')
        )
    );

-- Students can view their own appointments
CREATE POLICY "Students can view own appointments" ON appointments
    FOR SELECT USING (
        student_profile_id IN (
            SELECT id FROM profiles 
            WHERE user_id = auth.uid()
        )
    );

-- Comments for documentation
COMMENT ON TABLE appointments IS 'Stores all guidance appointment data including scheduling, status, and meeting details';
COMMENT ON COLUMN appointments.student_profile_id IS 'Reference to the student profile who the appointment is for';
COMMENT ON COLUMN appointments.appointment_datetime IS 'Computed field combining date and time for easier querying';
COMMENT ON COLUMN appointments.status IS 'Current status of the appointment: Scheduled, In Progress, Completed, Canceled, No Show';
COMMENT ON COLUMN appointments.scheduled_by IS 'Reference to the guidance counselor or admin who scheduled the appointment';
COMMENT ON COLUMN appointments.meeting_notes IS 'Notes about the appointment or meeting outcomes';
COMMENT ON COLUMN appointments.meeting_duration_minutes IS 'Expected duration of the meeting in minutes';
COMMENT ON COLUMN appointments.meeting_platform IS 'Platform for online meetings (Zoom, Teams, etc.)'; 