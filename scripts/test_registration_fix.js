// Test script to verify registration fix
// Run this in your browser console or Node.js environment

const { createClient } = require('@supabase/supabase-js');

// Replace with your actual Supabase URL and anon key
const supabaseUrl = 'YOUR_SUPABASE_URL';
const supabaseKey = 'YOUR_SUPABASE_ANON_KEY';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testRegistrationFix() {
  console.log('Testing registration fix...');
  
  try {
    // 1. Test if id_number column exists
    const { data: columns, error: columnError } = await supabase
      .from('profiles')
      .select('*')
      .limit(1);
    
    if (columnError) {
      console.error('Error checking profiles table:', columnError);
      return;
    }
    
    console.log('✅ Profiles table is accessible');
    
    // 2. Test if we can insert a test profile (this will be cleaned up)
    const testUserId = '00000000-0000-0000-0000-000000000000';
    const { error: insertError } = await supabase
      .from('profiles')
      .insert([{
        user_id: testUserId,
        email: 'test@example.com',
        full_name: 'Test User',
        id_number: 'TEST-123',
        age: 20,
        gender: 'Male',
        school: 'Test University',
        course: 'Test Course',
        year_level: 1,
        phone_number: '+1234567890',
        guardian_name: 'Test Guardian',
        guardian_phone_number: '+1234567890',
        address: 'Test Address',
        role: 'student',
        streak: 1,
        last_activity_date: new Date().toISOString().split('T')[0]
      }]);
    
    if (insertError) {
      console.error('❌ Error inserting test profile:', insertError);
      console.log('This means the id_number column or other required columns are missing');
      return;
    }
    
    console.log('✅ Test profile inserted successfully - all columns exist');
    
    // 3. Clean up test data
    const { error: deleteError } = await supabase
      .from('profiles')
      .delete()
      .eq('user_id', testUserId);
    
    if (deleteError) {
      console.error('Warning: Could not clean up test data:', deleteError);
    } else {
      console.log('✅ Test data cleaned up');
    }
    
    console.log('🎉 Registration fix test passed! The database schema is correct.');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testRegistrationFix(); 