// Debug script for admin dashboard
// Run this in your browser console when logged in as admin

console.log('🔍 Starting Admin Dashboard Debug...');

// Test 1: Check authentication
async function testAuth() {
  console.log('\n1️⃣ Testing Authentication...');
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    console.error('❌ No session found - please log in as admin');
    return false;
  }
  console.log('✅ Authenticated as:', session.user.email);
  console.log('   User ID:', session.user.id);
  return session;
}

// Test 2: Check current user profile
async function testCurrentProfile(session) {
  console.log('\n2️⃣ Testing Current User Profile...');
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', session.user.id)
    .single();
    
  if (error) {
    console.error('❌ Error fetching current profile:', error);
    return false;
  }
  
  console.log('✅ Current profile:', profile);
  console.log('   Role:', profile.role);
  console.log('   Is admin:', profile.role === 'admin');
  return profile;
}

// Test 3: Test basic profile query
async function testBasicQuery() {
  console.log('\n3️⃣ Testing Basic Profile Query...');
  const { data, error } = await supabase
    .from('profiles')
    .select('id, user_id, email, role')
    .limit(1);
    
  if (error) {
    console.error('❌ Basic query failed:', error);
    console.error('   Error code:', error.code);
    console.error('   Error message:', error.message);
    return false;
  }
  
  console.log('✅ Basic query successful');
  console.log('   Result:', data);
  return true;
}

// Test 4: Test admin query (the one that fails)
async function testAdminQuery() {
  console.log('\n4️⃣ Testing Admin Query (All Profiles)...');
  const { data, error } = await supabase
    .from('profiles')
    .select(`
      id,
      user_id,
      email,
      full_name,
      role,
      created_at,
      last_sign_in,
      age,
      gender,
      school,
      course,
      year_level,
      phone_number,
      guardian_name,
      guardian_phone_number,
      address,
      id_number
    `)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('❌ Admin query failed:', error);
    console.error('   Error code:', error.code);
    console.error('   Error message:', error.message);
    console.error('   Error details:', error.details);
    console.error('   Error hint:', error.hint);
    return false;
  }
  
  console.log('✅ Admin query successful');
  console.log('   Total users:', data.length);
  console.log('   Sample users:', data.slice(0, 3));
  return data;
}

// Test 5: Test assessments query
async function testAssessmentsQuery() {
  console.log('\n5️⃣ Testing Assessments Query...');
  const { data, error } = await supabase
    .from('anxiety_assessments')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('❌ Assessments query failed:', error);
    return false;
  }
  
  console.log('✅ Assessments query successful');
  console.log('   Total assessments:', data.length);
  return data;
}

// Main debug function
async function debugAdminDashboard() {
  try {
    // Test 1: Authentication
    const session = await testAuth();
    if (!session) return;
    
    // Test 2: Current profile
    const profile = await testCurrentProfile(session);
    if (!profile) return;
    
    // Test 3: Basic query
    const basicOk = await testBasicQuery();
    if (!basicOk) {
      console.log('\n❌ Basic query failed - this indicates a fundamental permission issue');
      return;
    }
    
    // Test 4: Admin query
    const adminData = await testAdminQuery();
    if (!adminData) {
      console.log('\n❌ Admin query failed - this is the main issue');
      console.log('   This usually means RLS policies are not configured correctly');
      console.log('   Please run the fix_admin_dashboard_users.sql script');
      return;
    }
    
    // Test 5: Assessments
    const assessmentsData = await testAssessmentsQuery();
    
    // Summary
    console.log('\n📊 DEBUG SUMMARY:');
    console.log('   Authentication: ✅');
    console.log('   Current Profile: ✅');
    console.log('   Basic Query: ✅');
    console.log('   Admin Query: ✅');
    console.log('   Assessments Query:', assessmentsData ? '✅' : '❌');
    console.log('   Total Users:', adminData.length);
    console.log('   Total Assessments:', assessmentsData ? assessmentsData.length : 0);
    
    console.log('\n✅ Admin dashboard should work correctly now!');
    
  } catch (error) {
    console.error('❌ Debug failed with error:', error);
  }
}

// Run the debug
debugAdminDashboard(); 