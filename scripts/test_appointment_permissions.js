// Test script to check appointment permissions
// Run this in your browser console or as a Node.js script

const { createClient } = require('@supabase/supabase-js');

// Replace with your actual Supabase credentials
const supabaseUrl = 'YOUR_SUPABASE_URL';
const supabaseKey = 'YOUR_SUPABASE_ANON_KEY';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testAppointmentPermissions() {
  try {
    console.log('🔍 Testing appointment permissions...');
    
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
    
    // Test 2: Check if we can insert a test record
    console.log('Testing insert permissions...');
    const testData = {
      profile_id: 999999, // Use a non-existent profile ID for testing
      student_name: 'TEST_USER',
      student_email: 'test@example.com',
      appointment_date: '2099-12-31',
      appointment_time: '23:59',
      status: 'Scheduled',
      notes: 'Test appointment - will be deleted'
    };
    
    const { data: testInsert, error: insertError } = await supabase
      .from('appointments')
      .insert([testData])
      .select()
      .single();
    
    if (insertError) {
      console.error('❌ Insert test failed:', insertError);
      console.error('Error code:', insertError.code);
      console.error('Error message:', insertError.message);
      console.error('Error details:', insertError.details);
      console.error('Error hint:', insertError.hint);
      return;
    }
    
    console.log('✅ Insert test passed');
    
    // Test 3: Delete the test record
    if (testInsert?.id) {
      console.log('Testing delete permissions...');
      const { error: deleteError } = await supabase
        .from('appointments')
        .delete()
        .eq('id', testInsert.id);
      
      if (deleteError) {
        console.error('❌ Delete test failed:', deleteError);
        return;
      }
      
      console.log('✅ Delete test passed');
    }
    
    console.log('🎉 All permission tests passed successfully!');
    
  } catch (error) {
    console.error('❌ Permission test error:', error);
  }
}

// Run the test
testAppointmentPermissions(); 