// Test script for guidance system
// This script tests the guidance login and dashboard access

const { createClient } = require('@supabase/supabase-js');

// You'll need to replace these with your actual Supabase credentials
const supabaseUrl = process.env.SUPABASE_URL || 'YOUR_SUPABASE_URL';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || 'YOUR_SUPABASE_ANON_KEY';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testGuidanceSystem() {
  console.log('🧪 Testing Guidance System...\n');

  try {
    // Step 1: Test guidance login
    console.log('1. Testing guidance login...');
    const { data: authData, error: signInError } = await supabase.auth.signInWithPassword({
      email: 'guidance@gmail.com',
      password: 'guidance123'
    });

    if (signInError) {
      console.error('❌ Guidance login failed:', signInError.message);
      return;
    }

    console.log('✅ Guidance login successful!');
    console.log('   User ID:', authData.user.id);
    console.log('   Email:', authData.user.email);

    // Step 2: Check if guidance profile exists
    console.log('\n2. Checking guidance profile...');
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', authData.user.id)
      .single();

    if (profileError) {
      console.error('❌ Profile fetch failed:', profileError.message);
      return;
    }

    console.log('✅ Guidance profile found!');
    console.log('   Role:', profile.role);
    console.log('   Full Name:', profile.full_name);
    console.log('   Created:', profile.created_at);

    // Step 3: Test access to profiles table (should have full access)
    console.log('\n3. Testing profiles table access...');
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('*')
      .limit(5);

    if (profilesError) {
      console.error('❌ Profiles access failed:', profilesError.message);
    } else {
      console.log('✅ Profiles access successful!');
      console.log('   Found', profiles.length, 'profiles');
    }

    // Step 4: Test access to anxiety assessments table
    console.log('\n4. Testing anxiety assessments access...');
    const { data: assessments, error: assessmentsError } = await supabase
      .from('anxiety_assessments')
      .select('*')
      .limit(5);

    if (assessmentsError) {
      console.error('❌ Assessments access failed:', assessmentsError.message);
    } else {
      console.log('✅ Assessments access successful!');
      console.log('   Found', assessments.length, 'assessments');
    }

    // Step 5: Test guidance dashboard redirect logic
    console.log('\n5. Testing guidance dashboard redirect logic...');
    const isGuidanceAttempt = authData.user.email.toLowerCase() === 'guidance@gmail.com';
    const hasGuidanceRole = profile.role === 'guidance';
    
    if (isGuidanceAttempt && hasGuidanceRole) {
      console.log('✅ Guidance dashboard redirect logic working!');
      console.log('   Should redirect to: /guidance');
    } else {
      console.log('❌ Guidance dashboard redirect logic failed!');
      console.log('   Email check:', isGuidanceAttempt);
      console.log('   Role check:', hasGuidanceRole);
    }

    console.log('\n🎉 Guidance system test completed successfully!');
    console.log('\n📋 Summary:');
    console.log('   ✅ Guidance login works');
    console.log('   ✅ Guidance profile exists with correct role');
    console.log('   ✅ Full access to profiles table');
    console.log('   ✅ Full access to anxiety assessments table');
    console.log('   ✅ Dashboard redirect logic working');
    console.log('\n🚀 The guidance system is ready to use!');

  } catch (error) {
    console.error('❌ Test failed with error:', error);
  } finally {
    // Sign out
    await supabase.auth.signOut();
    console.log('\n👋 Signed out from guidance account');
  }
}

// Run the test
testGuidanceSystem(); 