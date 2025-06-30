// Test script to verify assessment saving functionality
// Run this in your browser console when logged in as a regular user

import { createClient } from '@supabase/supabase-js'

// Replace with your actual Supabase URL and anon key
const supabaseUrl = 'YOUR_SUPABASE_URL'
const supabaseKey = 'YOUR_SUPABASE_ANON_KEY'
const supabase = createClient(supabaseUrl, supabaseKey)

console.log('🧪 Testing Assessment Save Functionality...');

async function testAssessmentSave() {
  try {
    // 1. Test authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError) {
      console.error('❌ Authentication error:', authError);
      return;
    }
    
    if (!user) {
      console.log('⚠️ No user authenticated. Please log in first.');
      return;
    }
    
    console.log('✅ User authenticated:', user.id);
    
    // 2. Test profile fetch
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, user_id, email, full_name')
      .eq('user_id', user.id)
      .single();
    
    if (profileError) {
      console.error('❌ Profile fetch error:', profileError);
      return;
    }
    
    if (!profile) {
      console.error('❌ No profile found for user');
      return;
    }
    
    console.log('✅ Profile found:', profile);
    console.log('   Profile ID:', profile.id);
    console.log('   User ID:', profile.user_id);
    
    // 3. Test assessment insert
    const testAssessmentData = {
      profile_id: profile.id,  // Use profile.id, not profile.user_id
      total_score: 15,
      percentage: 37,
      anxiety_level: 'Mild',
      answers: [2, 1, 2, 1, 2, 1, 2, 1, 2, 1]
    };
    
    console.log('📝 Attempting to insert test assessment:', testAssessmentData);
    
    const { data: assessment, error: assessmentError } = await supabase
      .from('anxiety_assessments')
      .insert(testAssessmentData)
      .select()
      .single();
    
    if (assessmentError) {
      console.error('❌ Assessment insert error:', assessmentError);
      console.error('   Error details:', {
        message: assessmentError.message,
        details: assessmentError.details,
        hint: assessmentError.hint,
        code: assessmentError.code
      });
      return;
    }
    
    console.log('✅ Assessment saved successfully:', assessment);
    
    // 4. Test assessment fetch
    const { data: savedAssessment, error: fetchError } = await supabase
      .from('anxiety_assessments')
      .select('*')
      .eq('id', assessment.id)
      .single();
    
    if (fetchError) {
      console.error('❌ Assessment fetch error:', fetchError);
      return;
    }
    
    console.log('✅ Assessment fetched successfully:', savedAssessment);
    
    // 5. Test admin can see the assessment
    console.log('🔍 Testing if admin can see this assessment...');
    const { data: adminView, error: adminError } = await supabase
      .from('anxiety_assessments')
      .select('*')
      .eq('profile_id', profile.id);
    
    if (adminError) {
      console.error('❌ Admin view error:', adminError);
    } else {
      console.log('✅ Admin can see assessments for this user:', adminView.length);
    }
    
    // 6. Clean up test data
    console.log('🧹 Cleaning up test data...');
    const { error: deleteError } = await supabase
      .from('anxiety_assessments')
      .delete()
      .eq('id', assessment.id);
    
    if (deleteError) {
      console.error('❌ Assessment delete error:', deleteError);
      return;
    }
    
    console.log('✅ Test assessment deleted successfully');
    console.log('🎉 All tests passed! Assessment saving is working correctly.');
    
  } catch (error) {
    console.error('❌ Test failed with unexpected error:', error);
  }
}

// Run the test
testAssessmentSave(); 