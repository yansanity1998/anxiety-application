import { supabase } from '../lib/supabase';

const AdminLogin = async (email: string, password: string) => {
  try {
    // First, attempt to sign in
    const { data: authData, error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      console.error('Authentication error:', signInError);
      throw new Error('Invalid email or password');
    }

    if (!authData.user) {
      throw new Error('No user data returned from authentication');
    }

    // Check if user is an admin
    const { data: userData, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('user_id', authData.user.id)
      .single();

    if (profileError) {
      console.error('Profile fetch error:', profileError);
      throw new Error('Failed to fetch user profile');
    }

    if (!userData || userData.role !== 'admin') {
      throw new Error('Access denied: Admin privileges required');
    }

    return {
      user: authData.user,
      role: userData.role
    };
  } catch (error) {
    console.error('Admin login error:', error);
    throw error;
  }
};

export default AdminLogin; 