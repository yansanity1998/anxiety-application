// Test script to verify authentication functionality
// Run this in your browser console or as a separate test file

import { createClient } from '@supabase/supabase-js'

// Replace with your actual Supabase URL and anon key
const supabaseUrl = 'https://rcumodwgxwbrzjeuxtpg.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJjdW1vZHdneHdicnpqZXV4dHBnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkxNTg4ODQsImV4cCI6MjA2NDczNDg4NH0.wXtIfeiXi2yOBzTf3K1J9dKtreX62qFqC8W4e8AUnfI'
const supabase = createClient(supabaseUrl, supabaseKey)

async function testAuthentication() {
  try {
    console.log('=== Testing Authentication System ===')
    
    // 1. Test current session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    if (sessionError) {
      console.error('Session error:', sessionError)
    } else if (session) {
      console.log('✅ Current session found:', session.user.email)
    } else {
      console.log('ℹ️ No current session')
    }
    
    // 2. Test profiles table access
    console.log('\n--- Testing Profiles Table ---')
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('user_id, email, role, streak, last_activity_date')
      .limit(5)
    
    if (profilesError) {
      console.error('❌ Profiles table error:', profilesError)
    } else {
      console.log('✅ Profiles table accessible')
      console.log('Profiles found:', profiles?.length || 0)
      if (profiles && profiles.length > 0) {
        console.log('Sample profile:', profiles[0])
      }
    }
    
    // 3. Test ensure_profile_exists function
    console.log('\n--- Testing ensure_profile_exists Function ---')
    if (session?.user) {
      const { data: functionResult, error: functionError } = await supabase.rpc('ensure_profile_exists', {
        user_id_param: session.user.id
      })
      
      if (functionError) {
        console.error('❌ Function error:', functionError)
      } else {
        console.log('✅ Function executed successfully:', functionResult)
      }
    } else {
      console.log('ℹ️ No user session to test function')
    }
    
    // 4. Test streak function
    console.log('\n--- Testing Streak Function ---')
    if (session?.user) {
      const { data: streakResult, error: streakError } = await supabase.rpc('update_user_streak_manual', {
        user_id_param: session.user.id
      })
      
      if (streakError) {
        console.error('❌ Streak function error:', streakError)
      } else {
        console.log('✅ Streak function executed successfully:', streakResult)
      }
    } else {
      console.log('ℹ️ No user session to test streak function')
    }
    
    // 5. Test anxiety_assessments table
    console.log('\n--- Testing Anxiety Assessments Table ---')
    const { data: assessments, error: assessmentsError } = await supabase
      .from('anxiety_assessments')
      .select('id, profile_id, total_score, anxiety_level, created_at')
      .limit(3)
    
    if (assessmentsError) {
      console.error('❌ Assessments table error:', assessmentsError)
    } else {
      console.log('✅ Assessments table accessible')
      console.log('Assessments found:', assessments?.length || 0)
      if (assessments && assessments.length > 0) {
        console.log('Sample assessment:', assessments[0])
      }
    }
    
    console.log('\n=== Authentication Test Complete ===')
    
  } catch (error) {
    console.error('❌ Test failed:', error)
  }
}

// Test login functionality
async function testLogin(email, password) {
  try {
    console.log(`\n=== Testing Login for ${email} ===`)
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })
    
    if (error) {
      console.error('❌ Login failed:', error.message)
      return false
    }
    
    console.log('✅ Login successful:', data.user.email)
    
    // Test profile access after login
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', data.user.id)
      .single()
    
    if (profileError) {
      console.error('❌ Profile fetch failed:', profileError)
    } else {
      console.log('✅ Profile found:', profile)
    }
    
    return true
    
  } catch (error) {
    console.error('❌ Login test failed:', error)
    return false
  }
}

// Test logout
async function testLogout() {
  try {
    console.log('\n=== Testing Logout ===')
    
    const { error } = await supabase.auth.signOut()
    
    if (error) {
      console.error('❌ Logout failed:', error)
      return false
    }
    
    console.log('✅ Logout successful')
    return true
    
  } catch (error) {
    console.error('❌ Logout test failed:', error)
    return false
  }
}

// Export functions for use in browser console
window.testAuthentication = testAuthentication
window.testLogin = testLogin
window.testLogout = testLogout

console.log('Authentication test functions loaded:')
console.log('- testAuthentication() - Test overall system')
console.log('- testLogin(email, password) - Test login')
console.log('- testLogout() - Test logout')

// Run initial test
testAuthentication() 