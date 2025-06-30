// Simple browser test - run this in your browser console when logged in as admin
console.log('🔍 Simple Admin Test Starting...');

// Test 1: Check if we're logged in
const { data: { session } } = await supabase.auth.getSession();
console.log('1. Session:', session ? '✅ Logged in as ' + session.user.email : '❌ Not logged in');

if (!session) {
  console.log('Please log in as admin first');
} else {
  // Test 2: Try to fetch profiles
  console.log('2. Trying to fetch profiles...');
  const { data, error } = await supabase
    .from('profiles')
    .select('*');
  
  if (error) {
    console.log('❌ Error fetching profiles:');
    console.log('   Code:', error.code);
    console.log('   Message:', error.message);
    console.log('   Details:', error.details);
    console.log('   Hint:', error.hint);
  } else {
    console.log('✅ Successfully fetched profiles:', data.length);
    console.log('   Sample:', data.slice(0, 2));
  }
} 