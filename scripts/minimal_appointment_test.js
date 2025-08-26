// Minimal test to isolate the notifications database error
// This script only tests the basic appointment creation without any UI components

const { createClient } = require('@supabase/supabase-js');

// Replace with your actual Supabase credentials
const supabaseUrl = 'YOUR_SUPABASE_URL';
const supabaseKey = 'YOUR_SUPABASE_ANON_KEY';

const supabase = createClient(supabaseUrl, supabaseKey);

async function minimalAppointmentTest() {
  try {
    console.log('🔍 Starting minimal appointment test...');
    
    // Test 1: Basic connection test
    console.log('Testing basic connection...');
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.error('❌ Session error:', sessionError);
      return;
    }
    
    if (!session) {
      console.log('ℹ️ No active session, trying to sign in...');
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email: 'admin@gmail.com',
        password: 'YOUR_ADMIN_PASSWORD'
      });
      
      if (signInError) {
        console.error('❌ Sign in failed:', signInError);
        return;
      }
      
      console.log('✅ Signed in successfully');
    } else {
      console.log('✅ Already signed in');
    }
    
    // Test 2: Check if we can query profiles
    console.log('Testing profiles query...');
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, email, role')
      .limit(1);
    
    if (profilesError) {
      console.error('❌ Profiles query failed:', profilesError);
      return;
    }
    
    console.log('✅ Profiles query successful');
    
    // Test 3: Check if we can query appointments
    console.log('Testing appointments query...');
    const { data: appointments, error: appointmentsError } = await supabase
      .from('appointments')
      .select('id')
      .limit(1);
    
    if (appointmentsError) {
      console.error('❌ Appointments query failed:', appointmentsError);
      return;
    }
    
    console.log('✅ Appointments query successful');
    
    // Test 4: Try to create a test appointment
    console.log('Testing appointment creation...');
    const testAppointment = {
      profile_id: 999999, // Use a non-existent profile ID for testing
      student_name: 'TEST_STUDENT',
      student_email: 'test.student@example.com',
      appointment_date: '2099-12-31',
      appointment_time: '23:59',
      status: 'Scheduled',
      notes: 'Test appointment - will be deleted'
    };
    
    const { data: createdAppointment, error: createError } = await supabase
      .from('appointments')
      .insert([testAppointment])
      .select()
      .single();
    
    if (createError) {
      console.error('❌ Appointment creation failed:', createError);
      console.error('Error code:', createError.code);
      console.error('Error message:', createError.message);
      console.error('Error details:', createError.details);
      console.error('Error hint:', createError.hint);
      
      // Check if this is the notifications error
      if (createError.message.includes('notifications')) {
        console.error('🚨 This is the notifications error!');
        console.error('The error is coming from a database trigger or function, not the UI code.');
      }
      
      return;
    }
    
    console.log('✅ Appointment creation successful:', createdAppointment);
    
    // Test 5: Clean up - delete the test appointment
    if (createdAppointment?.id) {
      console.log('Cleaning up test appointment...');
      const { error: deleteError } = await supabase
        .from('appointments')
        .delete()
        .eq('id', createdAppointment.id);
      
      if (deleteError) {
        console.error('⚠️ Failed to delete test appointment:', deleteError);
      } else {
        console.log('✅ Test appointment cleaned up');
      }
    }
    
    console.log('🎉 All tests passed! The issue is not in the basic appointment creation.');
    
  } catch (error) {
    console.error('❌ Test error:', error);
  }
}

// Run the test
minimalAppointmentTest(); 