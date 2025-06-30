// Test script for admin dashboard functionality
// Run this in your browser console when logged in as admin

const SUPABASE_URL = 'https://rcumodwgxwbrzjeuxtpg.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJjdW1vZHdneHdicnpqZXV4dHBnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkxNTg4ODQsImV4cCI6MjA2NDczNDg4NH0.wXtIfeiXi2yOBzTf3K1J9dKtreX62qFqC8W4e8AUnfI';

// Create Supabase client
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Test function to check if we can fetch users
async function testAdminDashboard() {
  console.log('Testing admin dashboard functionality...');
  
  try {
    // Test 1: Check if we're authenticated
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      console.error('❌ No active session found');
      return;
    }
    console.log('✅ Authenticated as:', session.user.email);
    
    // Test 2: Check current user profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', session.user.id)
      .single();
      
    if (profileError) {
      console.error('❌ Error fetching profile:', profileError);
    } else {
      console.log('✅ Profile found:', profile);
    }
    
    // Test 3: Try to fetch all users (admin functionality)
    const { data: users, error: usersError } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });
      
    if (usersError) {
      console.error('❌ Error fetching users:', usersError);
      console.error('Error details:', {
        message: usersError.message,
        code: usersError.code,
        details: usersError.details
      });
    } else {
      console.log('✅ Successfully fetched users:', users.length);
      console.log('Sample users:', users.slice(0, 3));
    }
    
    // Test 4: Try to fetch assessments
    const { data: assessments, error: assessmentsError } = await supabase
      .from('anxiety_assessments')
      .select('*')
      .order('created_at', { ascending: false });
      
    if (assessmentsError) {
      console.error('❌ Error fetching assessments:', assessmentsError);
    } else {
      console.log('✅ Successfully fetched assessments:', assessments.length);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testAdminDashboard();

// Export for use in different environments
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { testAdminDashboard };
} else {
  // Browser environment
  window.testAdminDashboard = testAdminDashboard;
}

// Run the test if this script is executed directly
if (typeof require !== 'undefined') {
  testAdminDashboard();
} 