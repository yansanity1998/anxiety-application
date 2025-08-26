# Fix Appointment Scheduling Issue

## Problem
When trying to schedule appointments for students, you get the error:
```
Error
Failed to schedule appointment. Please try again.
```

## Root Cause
The issue is with the Row Level Security (RLS) policies in your `appointments` table. The current policies are too restrictive and don't properly allow admins and guidance counselors to create appointments for students.

## Solution

### Step 1: Run the Fixed SQL Script
Execute the following SQL script in your Supabase SQL Editor:

```sql
-- Fix appointment table policies to allow admins and guidance to create appointments for students
-- This script fixes the RLS policies that were preventing appointment creation

-- Drop all existing policies to start fresh
DROP POLICY IF EXISTS "Admins can view all appointments" ON appointments;
DROP POLICY IF EXISTS "Admins can manage all appointments" ON appointments;
DROP POLICY IF EXISTS "Guidance can view all appointments" ON appointments;
DROP POLICY IF EXISTS "Guidance can manage all appointments" ON appointments;
DROP POLICY IF EXISTS "Students can view their own appointments" ON appointments;
DROP POLICY IF EXISTS "Students can create their own appointments" ON appointments;
DROP POLICY IF EXISTS "Students can update their own appointments" ON appointments;
DROP POLICY IF EXISTS "Students can delete their own appointments" ON appointments;

-- Policy: Admins can view ALL appointments (including those they didn't create)
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

-- Policy: Admins can INSERT appointments for any student
CREATE POLICY "Admins can insert appointments"
    ON appointments
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE user_id = auth.uid()
            AND role = 'admin'
        )
    );

-- Policy: Admins can UPDATE any appointment
CREATE POLICY "Admins can update appointments"
    ON appointments
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE user_id = auth.uid()
            AND role = 'admin'
        )
    );

-- Policy: Admins can DELETE any appointment
CREATE POLICY "Admins can delete appointments"
    ON appointments
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE user_id = auth.uid()
            AND role = 'admin'
        )
    );

-- Policy: Guidance can view ALL appointments
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

-- Policy: Guidance can INSERT appointments for any student
CREATE POLICY "Guidance can insert appointments"
    ON appointments
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE user_id = auth.uid()
            AND role = 'guidance'
        )
    );

-- Policy: Guidance can UPDATE any appointment
CREATE POLICY "Guidance can update appointments"
    ON appointments
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE user_id = auth.uid()
            AND role = 'guidance'
        )
    );

-- Policy: Guidance can DELETE any appointment
CREATE POLICY "Guidance can delete appointments"
    ON appointments
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE user_id = auth.uid()
            AND role = 'guidance'
        )
    );

-- Policy: Students can view their own appointments
CREATE POLICY "Students can view their own appointments"
    ON appointments
    FOR SELECT
    USING (
        profile_id IN (
            SELECT id FROM profiles
            WHERE user_id = auth.uid()
        )
    );

-- Policy: Students can create their own appointments
CREATE POLICY "Students can create their own appointments"
    ON appointments
    FOR INSERT
    WITH CHECK (
        profile_id IN (
            SELECT id FROM profiles
            WHERE user_id = auth.uid()
        )
    );

-- Policy: Students can update their own appointments
CREATE POLICY "Students can update their own appointments"
    ON appointments
    FOR UPDATE
    USING (
        profile_id IN (
            SELECT id FROM profiles
            WHERE user_id = auth.uid()
        )
    );

-- Policy: Students can delete their own appointments
CREATE POLICY "Students can delete their own appointments"
    ON appointments
    FOR DELETE
    USING (
        profile_id IN (
            SELECT id FROM profiles
            WHERE user_id = auth.uid()
        )
    );
```

### Step 2: Verify the Policies
After running the script, verify that all policies were created successfully:

```sql
-- Check if all policies exist
SELECT 
    p.policyname,
    p.cmd,
    p.permissive,
    p.roles,
    p.qual,
    p.with_check
FROM pg_policies p
WHERE p.tablename = 'appointments'
ORDER BY p.policyname;
```

You should see 12 policies:
- 4 for admins (SELECT, INSERT, UPDATE, DELETE)
- 4 for guidance (SELECT, INSERT, UPDATE, DELETE)  
- 4 for students (SELECT, INSERT, UPDATE, DELETE)

### Step 3: Test the Fix
1. Go to your admin dashboard
2. Try to schedule an appointment for a student
3. The appointment should now be created successfully

## What Was Wrong?

### Old Policies (Problematic)
The old policies had this structure:
```sql
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
```

**Problem**: The `FOR ALL` clause with `USING` only applies to SELECT, UPDATE, and DELETE operations. It doesn't cover INSERT operations, which need `WITH CHECK` instead.

### New Policies (Fixed)
The new policies separate each operation:
```sql
-- Separate policy for INSERT
CREATE POLICY "Admins can insert appointments"
    ON appointments
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE user_id = auth.uid()
            AND role = 'admin'
        )
    );

-- Separate policy for SELECT
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
```

**Solution**: Each operation (SELECT, INSERT, UPDATE, DELETE) now has its own policy with the correct clause (`USING` for SELECT/UPDATE/DELETE, `WITH CHECK` for INSERT).

## Additional Improvements Made

### 1. Better Error Handling
The appointment service now provides more detailed error messages:
- Permission denied errors
- Duplicate appointment errors
- Invalid profile ID errors
- RLS policy errors

### 2. Debug Logging
Added console logs to help track down future issues:
- Logs appointment data being created
- Logs each step of the process
- Logs detailed error information

### 3. Permission Testing
Added a test function to verify database permissions:
```typescript
import { testAppointmentPermissions } from '../lib/appointmentService';

// Test permissions
const result = await testAppointmentPermissions();
console.log(result);
```

## Troubleshooting

### If the issue persists:

1. **Check Browser Console**: Look for detailed error messages
2. **Verify User Role**: Ensure your admin user has `role = 'admin'` in the profiles table
3. **Check RLS Status**: Ensure RLS is enabled on the appointments table
4. **Test Permissions**: Use the test function to verify database access

### Common Issues:

1. **User not authenticated**: Make sure you're logged in as admin
2. **Wrong role**: Check that your profile has `role = 'admin'`
3. **Table doesn't exist**: Verify the appointments table exists
4. **RLS disabled**: Ensure Row Level Security is enabled

## Testing the Fix

After applying the fix:

1. **Admin Dashboard**: Try scheduling appointments for students
2. **Guidance Dashboard**: Try scheduling appointments for students  
3. **Student Dashboard**: Students should still be able to view their own appointments
4. **Error Messages**: Should now show specific error details instead of generic messages

## Files Modified

- `sql/fix_appointment_policies.sql` - Fixed SQL policies
- `src/lib/appointmentService.ts` - Enhanced error handling and logging
- `scripts/test_appointment_permissions.js` - Test script for debugging
- `APPOINTMENT_FIX_README.md` - This documentation

The fix should resolve the appointment scheduling issue and allow admins and guidance counselors to properly create appointments for students. 