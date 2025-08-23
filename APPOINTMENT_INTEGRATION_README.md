# Appointment System Integration Guide

This guide explains how to integrate the new SQL-based appointment system with your existing schedule functionality.

## Overview

I've created a comprehensive appointment system that includes:

1. **SQL Table**: `appointments` table with full appointment management
2. **Service Layer**: `AppointmentService` class for all appointment operations
3. **Database Features**: Triggers, views, and RLS policies for security

## Files Created

### 1. SQL Table (`sql/create_appointment_table.sql`)
- Complete `appointments` table with all necessary fields
- Automatic triggers for conflict checking and status updates
- Views for upcoming and today's appointments
- Row Level Security (RLS) policies
- Sample data for testing

### 2. Service Layer (`src/lib/appointmentService.ts`)
- TypeScript interfaces for type safety
- Complete CRUD operations for appointments
- Conflict checking functionality
- Statistics and reporting methods

## Key Features

### Database Features
- **Conflict Prevention**: Automatically prevents double-booking
- **Business Hours**: Enforces 8 AM - 5 PM scheduling
- **Status Management**: Automatic status updates based on time
- **Audit Trail**: Complete tracking of who scheduled, completed, or canceled
- **Views**: Pre-built views for common queries

### Service Features
- **Type Safety**: Full TypeScript support
- **Error Handling**: Comprehensive error management
- **Conflict Checking**: Prevents scheduling conflicts
- **Statistics**: Built-in reporting capabilities

## Integration Steps

### Step 1: Run the SQL Script
Execute the `sql/create_appointment_table.sql` script in your Supabase dashboard:

1. Go to your Supabase project
2. Navigate to SQL Editor
3. Copy and paste the entire SQL script
4. Run the script

### Step 2: Update Your Schedule Handler

Replace your current in-memory schedule handling with the new service. In your `GuidanceDashboard.tsx` and `AdminDashboard.tsx`, update the `handleSchedule` function:

```typescript
// Import the service
import AppointmentService from '../lib/appointmentService';

// Update the handleSchedule function
const handleSchedule = async (user: UserProfile) => {
  try {
    // Check for conflicts first
    const hasConflict = await AppointmentService.checkConflicts(
      user.profile_id.toString(),
      formValues.date,
      formValues.time
    );

    if (hasConflict) {
      await Toast.fire({
        icon: 'error',
        title: 'Conflict',
        text: 'Student already has an appointment at this time',
      });
      return;
    }

    // Create the appointment
    const appointment = await AppointmentService.createAppointment({
      student_profile_id: user.profile_id.toString(),
      student_name: user.full_name || user.email,
      student_email: user.email,
      appointment_date: formValues.date,
      appointment_time: formValues.time,
      meeting_notes: 'Guidance visit scheduled via dashboard'
    });

    await Toast.fire({
      icon: 'success',
      title: 'Scheduled',
      text: `Appointment scheduled for ${formValues.date} at ${formValues.time}`,
    });

  } catch (error) {
    console.error('Error scheduling:', error);
    await Toast.fire({
      icon: 'error',
      title: 'Error',
      text: error instanceof Error ? error.message : 'Failed to schedule appointment',
    });
  }
};
```

### Step 3: Update Schedule Component

Update your `Schedule.tsx` component to use real data:

```typescript
import { useState, useEffect } from 'react';
import AppointmentService, { Appointment } from '../lib/appointmentService';

const Schedule = ({ darkMode }: ScheduleProps) => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAppointments();
  }, []);

  const loadAppointments = async () => {
    try {
      setLoading(true);
      const data = await AppointmentService.getUpcomingAppointments();
      setAppointments(data);
    } catch (error) {
      console.error('Error loading appointments:', error);
    } finally {
      setLoading(false);
    }
  };

  // Rest of your component...
};
```

### Step 4: Add Appointment Management Features

You can now add features like:

```typescript
// Cancel an appointment
const handleCancel = async (appointmentId: string) => {
  try {
    await AppointmentService.cancelAppointment(appointmentId, 'Cancelled by guidance');
    await loadAppointments(); // Refresh the list
  } catch (error) {
    console.error('Error cancelling appointment:', error);
  }
};

// Complete an appointment
const handleComplete = async (appointmentId: string) => {
  try {
    await AppointmentService.completeAppointment(appointmentId);
    await loadAppointments(); // Refresh the list
  } catch (error) {
    console.error('Error completing appointment:', error);
  }
};
```

## Database Schema

### Main Table: `appointments`
- `id`: UUID primary key
- `student_profile_id`: Reference to student profile
- `student_name`, `student_email`: Student information
- `appointment_date`, `appointment_time`: Date and time
- `appointment_datetime`: Computed field for easier querying
- `status`: Scheduled, In Progress, Completed, Canceled, No Show
- `scheduled_by`: Who scheduled the appointment
- `meeting_notes`: Notes about the appointment
- `meeting_duration_minutes`: Duration (default 60)
- `meeting_type`: Type of meeting (default "Guidance Visit")
- `meeting_location`: Location (default "Guidance Office")
- Various timestamps for audit trail

### Views
- `upcoming_appointments`: Future appointments
- `todays_appointments`: Today's appointments

## Security Features

### Row Level Security (RLS)
- Guidance counselors can see and manage all appointments
- Students can only see their own appointments
- Admins have full access

### Data Validation
- Prevents scheduling in the past
- Enforces business hours (8 AM - 5 PM)
- Prevents double-booking for same student
- Automatic status updates

## Benefits Over In-Memory Storage

1. **Persistence**: Data survives page refreshes and server restarts
2. **Multi-user**: Multiple guidance counselors can see the same data
3. **Audit Trail**: Complete history of all changes
4. **Conflict Prevention**: Automatic conflict detection
5. **Scalability**: Can handle thousands of appointments
6. **Backup**: Data is automatically backed up by Supabase
7. **Security**: Row-level security and proper access controls

## Testing

The SQL script includes sample data for testing. You can also add more test data:

```sql
INSERT INTO appointments (
    student_profile_id,
    student_name,
    student_email,
    appointment_date,
    appointment_time,
    status,
    meeting_notes
) VALUES 
(
    'your-student-profile-id',
    'Test Student',
    'test@example.com',
    CURRENT_DATE + INTERVAL '3 days',
    '11:00',
    'Scheduled',
    'Test appointment'
);
```

## Migration from In-Memory

If you have existing in-memory appointments, you can migrate them by:

1. Exporting the current schedules state
2. Converting the data format to match the new schema
3. Using the `AppointmentService.createAppointment()` method to insert them

## Support

The system is designed to be robust and handle edge cases. If you encounter any issues:

1. Check the browser console for error messages
2. Verify the SQL script ran successfully
3. Ensure your Supabase RLS policies are correctly configured
4. Check that the user has the correct role permissions 