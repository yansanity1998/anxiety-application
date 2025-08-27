import { supabase } from './supabase';

export interface CBTModule {
  id: number;
  profile_id: number;
  module_title: string;
  module_description: string;
  module_status: 'not_started' | 'in_progress' | 'completed' | 'paused';
  module_date_started?: string;
  module_date_complete?: string;
  module_image?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateCBTModuleData {
  profile_id: number;
  module_title: string;
  module_description: string;
  module_image?: string;
  module_status?: 'not_started' | 'in_progress' | 'completed' | 'paused';
}

export interface UpdateCBTModuleData extends Partial<CreateCBTModuleData> {
  id: number;
}

class CBTModuleService {
  // Get all CBT modules for a specific profile
  async getModulesByProfile(profileId: number): Promise<CBTModule[]> {
    try {
      const { data, error } = await supabase
        .from('cbt_module')
        .select('*')
        .eq('profile_id', profileId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching CBT modules:', error);
        throw new Error('Failed to fetch CBT modules');
      }

      return data || [];
    } catch (error) {
      console.error('Error in getModulesByProfile:', error);
      throw error;
    }
  }

  // Get all CBT modules (for admin/guidance to see all)
  async getAllModules(): Promise<CBTModule[]> {
    try {
      const { data, error } = await supabase
        .from('cbt_module')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching all CBT modules:', error);
        throw new Error('Failed to fetch CBT modules');
      }

      return data || [];
    } catch (error) {
      console.error('Error in getAllModules:', error);
      throw error;
    }
  }

  // Get modules by status
  async getModulesByStatus(profileId: number, status: CBTModule['module_status']): Promise<CBTModule[]> {
    try {
      const { data, error } = await supabase
        .from('cbt_module')
        .select('*')
        .eq('profile_id', profileId)
        .eq('module_status', status)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching CBT modules by status:', error);
        throw new Error('Failed to fetch CBT modules');
      }

      return data || [];
    } catch (error) {
      console.error('Error in getModulesByStatus:', error);
      throw error;
    }
  }

  // Get a single CBT module by ID
  async getModuleById(id: number): Promise<CBTModule | null> {
    try {
      const { data, error } = await supabase
        .from('cbt_module')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        console.error('Error fetching CBT module:', error);
        throw new Error('Failed to fetch CBT module');
      }

      return data;
    } catch (error) {
      console.error('Error in getModuleById:', error);
      throw error;
    }
  }

  // Create a new CBT module
  async createModule(moduleData: CreateCBTModuleData): Promise<CBTModule> {
    try {
      const { data, error } = await supabase
        .from('cbt_module')
        .insert([moduleData])
        .select()
        .single();

      if (error) {
        console.error('Error creating CBT module:', error);
        throw new Error('Failed to create CBT module');
      }

      return data;
    } catch (error) {
      console.error('Error in createModule:', error);
      throw error;
    }
  }

  // Update an existing CBT module
  async updateModule(moduleData: UpdateCBTModuleData): Promise<CBTModule> {
    try {
      const { id, ...updateData } = moduleData;
      
      const { data, error } = await supabase
        .from('cbt_module')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error updating CBT module:', error);
        throw new Error('Failed to update CBT module');
      }

      return data;
    } catch (error) {
      console.error('Error in updateModule:', error);
      throw error;
    }
  }

  // Delete a CBT module
  async deleteModule(id: number): Promise<void> {
    try {
      const { error } = await supabase
        .from('cbt_module')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting CBT module:', error);
        throw new Error('Failed to delete CBT module');
      }
    } catch (error) {
      console.error('Error in deleteModule:', error);
      throw error;
    }
  }

  // Update module status
  async updateModuleStatus(id: number, status: CBTModule['module_status']): Promise<CBTModule> {
    try {
      const updateData: any = { module_status: status };
      
      // Set date started if starting the module
      if (status === 'in_progress') {
        updateData.module_date_started = new Date().toISOString();
      }
      
      // Set date completed if completing the module
      if (status === 'completed') {
        updateData.module_date_complete = new Date().toISOString();
      }

      const { data, error } = await supabase
        .from('cbt_module')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error updating CBT module status:', error);
        throw new Error('Failed to update CBT module status');
      }

      return data;
    } catch (error) {
      console.error('Error in updateModuleStatus:', error);
      throw error;
    }
  }

  // Get modules for current user
  async getCurrentUserModules(): Promise<CBTModule[]> {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('No active session');
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', session.user.id)
        .single();

      if (!profile) {
        throw new Error('Profile not found');
      }

      return this.getModulesByProfile(profile.id);
    } catch (error) {
      console.error('Error in getCurrentUserModules:', error);
      throw error;
    }
  }
}

export const cbtModuleService = new CBTModuleService(); 