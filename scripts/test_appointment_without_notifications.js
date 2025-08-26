// Test script to verify appointment scheduling works without notifications
// This will help isolate whether the notifications component was causing the database error

const { createClient } = require('@supabase/supabase-js');

// Replace with your actual Supabase credentials
const supabaseUrl = 'YOUR_SUPABASE_URL';
const supabaseKey = 'YOUR_SUPABASE_ANON_KEY';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testAppointmentCreation() {
  try {
    console.log('🔍 Testing appointment creation without notifications...');
    
    // Test 1: Check if we can query the appointments table
    console.log('Testing query permissions...');
    const { data: testQuery, error: queryError } = await supabase
      .from('appointments')
      .select('id')
      .limit(1);
    
    if (queryError) {
      console.error('❌ Query test failed:', queryError);
      return;
    }
    
    console.log('✅ Query test passed');
    
    // Test 2: Try to create a test appointment
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
      return;
    }
    
    console.log('✅ Appointment creation test passed');
    console.log('Created appointment:', createdAppointment);
    
    // Test 3: Delete the test appointment
    if (createdAppointment?.id) {
      console.log('Testing appointment deletion...');
      const { error: deleteError } = await supabase
        .from('appointments')
        .delete()
        .eq('id', createdAppointment.id);
      
      if (deleteError) {
        console.error('❌ Appointment deletion failed:', deleteError);
        return;
      }
      
      console.log('✅ Appointment deletion test passed');
    }
    
    console.log('🎉 All appointment tests passed successfully!');
    console.log('The notifications component was likely causing the database error.');
    
  } catch (error) {
    console.error('❌ Test error:', error);
  }
}

// Run the test
testAppointmentCreation(); 