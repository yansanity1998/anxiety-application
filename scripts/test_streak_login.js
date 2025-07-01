const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabaseUrl = 'https://your-project.supabase.co'; // Replace with your actual URL
const supabaseKey = 'your-anon-key'; // Replace with your actual anon key
const supabase = createClient(supabaseUrl, supabaseKey);

// Test streak functionality
async function testStreakLogin() {
  try {
    console.log('=== STREAK LOGIN TEST ===');
    
    // Get current session
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      console.log('No authenticated session found. Please login first.');
      return;
    }
    
    const userId = session.user.id;
    console.log('Testing streak for user:', userId);
    
    // 1. Get current streak before any updates
    console.log('\n1. Getting current streak...');
    const { data: beforeData } = await supabase
      .from('profiles')
      .select('streak, last_activity_date')
      .eq('user_id', userId)
      .single();
    
    console.log('Current streak:', beforeData?.streak);
    console.log('Last activity date:', beforeData?.last_activity_date);
    
    // 2. Test the database function directly
    console.log('\n2. Testing database streak function...');
    const { data: dbStreakResult, error: dbError } = await supabase.rpc('update_user_streak_manual', {
      user_id_param: userId
    });
    
    if (dbError) {
      console.error('Database function error:', dbError);
    } else {
      console.log('Database function result:', dbStreakResult);
    }
    
    // 3. Get streak after database function
    console.log('\n3. Getting streak after database function...');
    const { data: afterData } = await supabase
      .from('profiles')
      .select('streak, last_activity_date')
      .eq('user_id', userId)
      .single();
    
    console.log('Streak after database function:', afterData?.streak);
    console.log('Last activity date after database function:', afterData?.last_activity_date);
    
    // 4. Test the simple increment function
    console.log('\n4. Testing simple increment function...');
    const { data: simpleResult, error: simpleError } = await supabase.rpc('increment_streak_simple', {
      user_id_param: userId
    });
    
    if (simpleError) {
      console.error('Simple increment error:', simpleError);
    } else {
      console.log('Simple increment result:', simpleResult);
    }
    
    // 5. Final verification
    console.log('\n5. Final verification...');
    const { data: finalData } = await supabase
      .from('profiles')
      .select('streak, last_activity_date')
      .eq('user_id', userId)
      .single();
    
    console.log('Final streak:', finalData?.streak);
    console.log('Final last activity date:', finalData?.last_activity_date);
    
    // 6. Summary
    console.log('\n=== SUMMARY ===');
    console.log('Initial streak:', beforeData?.streak);
    console.log('Final streak:', finalData?.streak);
    console.log('Streak increased:', finalData?.streak > beforeData?.streak);
    
  } catch (error) {
    console.error('Test error:', error);
  }
}

// Run the test
testStreakLogin(); 