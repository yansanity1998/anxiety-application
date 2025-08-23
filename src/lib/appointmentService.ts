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

// Create a new appointment
export const createAppointment = async (appointmentData: CreateAppointmentData): Promise<Appointment | null> => {
  try {
    const { data, error } = await supabase
      .from('appointments')
      .insert([appointmentData])
      .select()
      .single();

    if (error) {
      console.error('Error creating appointment:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error in createAppointment:', error);
    throw error;
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