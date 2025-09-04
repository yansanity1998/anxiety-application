const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testReferralInsert() {
  try {
    console.log('🔍 Testing referral insertion...');
    
    // 1. Check if referrals table exists
    console.log('\n1. Checking referrals table...');
    const { data: tableCheck, error: tableError } = await supabase
      .from('referrals')
      .select('id')
      .limit(1);
    
    if (tableError) {
      console.error('❌ Referrals table error:', tableError);
      return;
    }
    console.log('✅ Referrals table exists');
    
    // 2. Get a sample student profile
    console.log('\n2. Getting sample student profile...');
    const { data: students, error: studentsError } = await supabase
      .from('profiles')
      .select('id, full_name, email, role')
      .in('role', ['student', 'user'])
      .neq('role', 'admin')
      .neq('role', 'admin')
      .limit(1);
    
    if (studentsError || !students || students.length === 0) {
      console.error('❌ No students found:', studentsError);
      return;
    }
    
    const student = students[0];
    console.log('✅ Found student:', student);
    
    // 3. Get a sample admin profile
    console.log('\n3. Getting sample admin profile...');
    const { data: admins, error: adminsError } = await supabase
      .from('profiles')
      .select('id, full_name, email, role')
      .eq('role', 'admin')
      .limit(1);
    
    if (adminsError || !admins || admins.length === 0) {
      console.error('❌ No admins found:', adminsError);
      return;
    }
    
    const admin = admins[0];
    console.log('✅ Found admin:', admin);
    
    // 4. Test referral insertion
    console.log('\n4. Testing referral insertion...');
    const testReferral = {
      student_id: student.id,
      referred_by: admin.id,
      psychiatrist_name: 'Dr. Test Psychiatrist',
      psychiatrist_email: 'test@psychiatrist.com',
      psychiatrist_phone: '+1234567890',
      referral_reason: 'Test referral for debugging',
      urgency_level: 'medium',
      uploaded_files: [],
      file_storage_urls: [],
      referral_status: 'pending',
      email_sent: false
    };
    
    console.log('📝 Inserting test referral:', testReferral);
    
    const { data: insertResult, error: insertError } = await supabase
      .from('referrals')
      .insert([testReferral])
      .select();
    
    if (insertError) {
      console.error('❌ Insert failed:', insertError);
      console.error('Error details:', {
        message: insertError.message,
        details: insertError.details,
        hint: insertError.hint
      });
      return;
    }
    
    console.log('✅ Referral inserted successfully!');
    console.log('Inserted referral:', insertResult);
    
    // 5. Clean up test data
    console.log('\n5. Cleaning up test data...');
    if (insertResult && insertResult[0]) {
      const { error: deleteError } = await supabase
        .from('referrals')
        .delete()
        .eq('id', insertResult[0].id);
      
      if (deleteError) {
        console.log('⚠️  Could not clean up test data:', deleteError.message);
      } else {
        console.log('✅ Test data cleaned up');
      }
    }
    
    console.log('\n🎉 Test completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testReferralInsert(); 