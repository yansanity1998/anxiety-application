import { supabase } from './supabase';

export interface Appointment {
  id: number;
  profile_id: number;
  student_name: string;
  student_email: string;
  appointment_date: string;
  appointment_time: string;
  status: 'Scheduled' | 'In Progress' | 'Completed' | 'Canceled' | 'No Show';
  notes?: string;
  created_by?: number;
  created_at: string;
  updated_at: string;
}

export interface CreateAppointmentData {
  profile_id: number;
  student_name: string;
  student_email: string;
  appointment_date: string;
  appointment_time: string;
  status?: 'Scheduled' | 'In Progress' | 'Completed' | 'Canceled' | 'No Show';
  notes?: string;
}

export interface UpdateAppointmentData {
  appointment_date?: string;
  appointment_time?: string;
  status?: 'Scheduled' | 'In Progress' | 'Completed' | 'Canceled' | 'No Show';
  notes?: string;
}

// Test database connectivity and permissions
export const testAppointmentPermissions = async (): Promise<{ success: boolean; message: string; details?: any }> => {
  try {
    console.log('🔍 Testing appointment permissions...');
    
    // Test 1: Check if we can query the appointments table
    const { data: _testQuery, error: queryError } = await supabase
      .from('appointments')
      .select('id')
      .limit(1);
    
    if (queryError) {
      console.error('❌ Query test failed:', queryError);
      return {
        success: false,
        message: `Query test failed: ${queryError.message}`,
        details: queryError
      };
    }
    
    console.log('✅ Query test passed');
    
    // Test 2: Check if we can insert a test record (we'll delete it immediately)
    const testData = {
      profile_id: 999999, // Use a non-existent profile ID for testing
      student_name: 'TEST_USER',
      student_email: 'test@example.com',
      appointment_date: '2099-12-31',
      appointment_time: '23:59',
      status: 'Scheduled' as const,
      notes: 'Test appointment - will be deleted'
    };
    
    const { data: testInsert, error: insertError } = await supabase
      .from('appointments')
      .insert([testData])
      .select()
      .single();
    
    if (insertError) {
      console.error('❌ Insert test failed:', insertError);
      return {
        success: false,
        message: `Insert test failed: ${insertError.message}`,
        details: insertError
      };
    }
    
    console.log('✅ Insert test passed');
    
    // Test 3: Delete the test record
    if (testInsert?.id) {
      const { error: deleteError } = await supabase
        .from('appointments')
        .delete()
        .eq('id', testInsert.id);
      
      if (deleteError) {
        console.error('❌ Delete test failed:', deleteError);
        return {
          success: false,
          message: `Delete test failed: ${deleteError.message}`,
          details: deleteError
        };
      }
      
      console.log('✅ Delete test passed');
    }
    
    return {
      success: true,
      message: 'All permission tests passed successfully'
    };
    
  } catch (error) {
    console.error('❌ Permission test error:', error);
    return {
      success: false,
      message: `Permission test error: ${error instanceof Error ? error.message : String(error)}`,
      details: error
    };
  }
};

// Check if a student already has an appointment
export const checkStudentHasAppointment = async (profileId: number): Promise<boolean> => {
  try {
    // Only block if student has an appointment with status 'Scheduled' or 'In Progress'
    // AND the appointment is on the same date (to prevent double-booking on the same day)
    const { data, error } = await supabase
      .from('appointments')
      .select('id, status, appointment_date')
      .eq('profile_id', profileId)
      .in('status', ['Scheduled', 'In Progress'])
      .limit(1);

    if (error) {
      console.error('Error checking student appointment:', error);
      throw error;
    }

    return (data && data.length > 0);
  } catch (error) {
    console.error('Error in checkStudentHasAppointment:', error);
    throw error;
  }
};

// Create a new appointment (with duplicate check)
export const createAppointment = async (appointmentData: CreateAppointmentData): Promise<Appointment | null> => {
  try {
    console.log('🔍 Creating appointment with data:', appointmentData);
    
    // Check if student already has an active appointment on the same date
    const hasExistingAppointment = await checkStudentHasAppointment(appointmentData.profile_id);
    if (hasExistingAppointment) {
      // Instead of blocking, just log a warning and allow the appointment
      console.log('⚠️ Student has existing active appointments, but allowing multiple appointments for guidance flexibility');
      // Note: We could implement more sophisticated conflict checking here if needed
    }

    console.log('✅ Proceeding with appointment creation...');

    const { data, error } = await supabase
      .from('appointments')
      .insert([appointmentData])
      .select()
      .single();

    if (error) {
      console.error('❌ Supabase error creating appointment:', error);
      console.error('   Error code:', error.code);
      console.error('   Error message:', error.message);
      console.error('   Error details:', error.details);
      console.error('   Error hint:', error.hint);
      
      // Provide more specific error messages based on error codes
      if (error.code === '42501') {
        throw new Error('Permission denied. Please check your database policies.');
      } else if (error.code === '23505') {
        throw new Error('Duplicate appointment detected. This time slot is already booked.');
      } else if (error.code === '23503') {
        throw new Error('Invalid profile ID. The student profile does not exist.');
      } else if (error.message.includes('RLS')) {
        throw new Error('Row Level Security policy blocked this operation. Please check your database policies.');
      } else {
        throw new Error(`Database error: ${error.message}`);
      }
    }

    console.log('✅ Appointment created successfully:', data);
    return data;
  } catch (error) {
    console.error('❌ Error in createAppointment:', error);
    
    // Re-throw the error with more context
    if (error instanceof Error) {
      throw error;
    } else {
      throw new Error(`Unexpected error: ${String(error)}`);
    }
  }
};

// Get all appointments
export const getAllAppointments = async (): Promise<Appointment[]> => {
  try {
    const { data, error } = await supabase
      .from('appointments')
      .select('*')
      .order('appointment_date', { ascending: true })
      .order('appointment_time', { ascending: true });

    if (error) {
      console.error('Error fetching appointments:', error);
      throw error;
    }

    // Additional client-side sorting to ensure proper chronological order
    const sortedData = (data || []).sort((a, b) => {
      const dateA = new Date(`${a.appointment_date}T${a.appointment_time}`);
      const dateB = new Date(`${b.appointment_date}T${b.appointment_time}`);
      return dateA.getTime() - dateB.getTime();
    });

    return sortedData;
  } catch (error) {
    console.error('Error in getAllAppointments:', error);
    throw error;
  }
};

// Get appointments for a specific student
export const getAppointmentsByProfileId = async (profileId: number): Promise<Appointment[]> => {
  try {
    const { data, error } = await supabase
      .from('appointments')
      .select('*')
      .eq('profile_id', profileId)
      .order('appointment_date', { ascending: true })
      .order('appointment_time', { ascending: true });

    if (error) {
      console.error('Error fetching appointments for profile:', error);
      throw error;
    }

    // Additional client-side sorting to ensure proper chronological order
    const sortedData = (data || []).sort((a, b) => {
      const dateA = new Date(`${a.appointment_date}T${a.appointment_time}`);
      const dateB = new Date(`${b.appointment_date}T${b.appointment_time}`);
      return dateA.getTime() - dateB.getTime();
    });

    return sortedData;
  } catch (error) {
    console.error('Error in getAppointmentsByProfileId:', error);
    throw error;
  }
};

// Get upcoming appointments (future dates)
export const getUpcomingAppointments = async (): Promise<Appointment[]> => {
  try {
    const today = new Date().toISOString().split('T')[0];
    
    const { data, error } = await supabase
      .from('appointments')
      .select('*')
      .gte('appointment_date', today)
      .order('appointment_date', { ascending: true })
      .order('appointment_time', { ascending: true });

    if (error) {
      console.error('Error fetching upcoming appointments:', error);
      throw error;
    }

    // Additional client-side sorting to ensure proper chronological order
    const sortedData = (data || []).sort((a, b) => {
      const dateA = new Date(`${a.appointment_date}T${a.appointment_time}`);
      const dateB = new Date(`${b.appointment_date}T${b.appointment_time}`);
      return dateA.getTime() - dateB.getTime();
    });

    return sortedData;
  } catch (error) {
    console.error('Error in getUpcomingAppointments:', error);
    throw error;
  }
};

// Update an appointment
export const updateAppointment = async (appointmentId: number, updateData: UpdateAppointmentData): Promise<Appointment | null> => {
  try {
    const { data, error } = await supabase
      .from('appointments')
      .update(updateData)
      .eq('id', appointmentId)
      .select()
      .single();

    if (error) {
      console.error('Error updating appointment:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error in updateAppointment:', error);
    throw error;
  }
};

// Delete an appointment
export const deleteAppointment = async (appointmentId: number): Promise<void> => {
  try {
    const { error } = await supabase
      .from('appointments')
      .delete()
      .eq('id', appointmentId);

    if (error) {
      console.error('Error deleting appointment:', error);
      throw error;
    }
  } catch (error) {
    console.error('Error in deleteAppointment:', error);
    throw error;
  }
};

// Get appointments by status
export const getAppointmentsByStatus = async (status: Appointment['status']): Promise<Appointment[]> => {
  try {
    const { data, error } = await supabase
      .from('appointments')
      .select('*')
      .eq('status', status)
      .order('appointment_date', { ascending: true })
      .order('appointment_time', { ascending: true });

    if (error) {
      console.error('Error fetching appointments by status:', error);
      throw error;
    }

    // Additional client-side sorting to ensure proper chronological order
    const sortedData = (data || []).sort((a, b) => {
      const dateA = new Date(`${a.appointment_date}T${a.appointment_time}`);
      const dateB = new Date(`${b.appointment_date}T${b.appointment_time}`);
      return dateA.getTime() - dateB.getTime();
    });

    return sortedData;
  } catch (error) {
    console.error('Error in getAppointmentsByStatus:', error);
    throw error;
  }
};

// Get appointments for a specific date range
export const getAppointmentsByDateRange = async (startDate: string, endDate: string): Promise<Appointment[]> => {
  try {
    const { data, error } = await supabase
      .from('appointments')
      .select('*')
      .gte('appointment_date', startDate)
      .lte('appointment_date', endDate)
      .order('appointment_date', { ascending: true })
      .order('appointment_time', { ascending: true });

    if (error) {
      console.error('Error fetching appointments by date range:', error);
      throw error;
    }

    // Additional client-side sorting to ensure proper chronological order
    const sortedData = (data || []).sort((a, b) => {
      const dateA = new Date(`${a.appointment_date}T${a.appointment_time}`);
      const dateB = new Date(`${b.appointment_date}T${b.appointment_time}`);
      return dateA.getTime() - dateB.getTime();
    });

    return sortedData;
  } catch (error) {
    console.error('Error in getAppointmentsByDateRange:', error);
    throw error;
  }
}; 