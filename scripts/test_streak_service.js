// Test file for streak service
// Run this file with Node.js to test the streak functionality

// Import the Supabase client
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client - replace with your actual URL and anon key
const supabaseUrl = 'https://rcumodwgxwbrzjeuxtpg.supabase.co'; // Replace with your real Supabase project URL
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJjdW1vZHdneHdicnpqZXV4dHBnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkxNTg4ODQsImV4cCI6MjA2NDczNDg4NH0.wXtIfeiXi2yOBzTf3K1J9dKtreX62qFqC8W4e8AUnfI';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Mock implementation of the streak service
const streakService = {
  async getUserStreak(userId) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('streak')
        .eq('user_id', userId)
        .single();
      
      if (error) {
        console.error('Error fetching streak:', error);
        return 0;
      }
      
      console.log('Fetched streak value:', data?.streak);
      return data?.streak || 0;
    } catch (err) {
      console.error('Unexpected error fetching streak:', err);
      return 0;
    }
  },
  
  async updateUserStreak(userId) {
    try {
      console.log('Updating streak for user:', userId);
      
      if (!userId) {
        console.error('Invalid userId provided:', userId);
        return 0;
      }
      
      // First, get the current user profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('streak, last_activity_date')
        .eq('user_id', userId)
        .single();
      
      if (profileError) {
        console.error('Error fetching profile for streak update:', profileError);
        return this.initializeUserStreak(userId);
      }
      
      console.log('Current profile data:', profile);
      
      // Get current date and normalize to 12:00am of the current day
      const now = new Date();
      const todayMidnight = new Date(now);
      todayMidnight.setHours(0, 0, 0, 0); // Set to 12:00am
      console.log('Today (midnight boundary):', todayMidnight.toLocaleString());
      
      let newStreak = 1; // Default to 1 (at least one day streak)
      
      // Make sure we have a valid date string before trying to create a Date object
      let lastActivityDate = null;
      if (profile?.last_activity_date) {
        // Ensure proper date format with time component
        lastActivityDate = new Date(`${profile.last_activity_date}T00:00:00Z`);
        
        // Check if the date is valid
        if (isNaN(lastActivityDate.getTime())) {
          console.error('Invalid last_activity_date:', profile.last_activity_date);
          lastActivityDate = null;
        }
      }
      
      if (lastActivityDate) {
        // Normalize last activity to 12:00am
        const lastActivityMidnight = new Date(lastActivityDate);
        lastActivityMidnight.setHours(0, 0, 0, 0);
        console.log('Last activity (midnight boundary):', lastActivityMidnight.toLocaleString());
        
        // Calculate the difference in days
        const timeDiff = todayMidnight.getTime() - lastActivityMidnight.getTime();
        const dayDiff = Math.floor(timeDiff / (1000 * 3600 * 24));
        console.log('Day difference:', dayDiff);
        
        if (dayDiff === 0) {
          // Already logged in today, keep the streak the same
          newStreak = Math.max(profile.streak || 1, 1);
          console.log('Same day, keeping streak at:', newStreak);
        } else if (dayDiff === 1) {
          // Next consecutive day, increment streak by 1
          newStreak = Math.max((profile.streak || 0) + 1, 1);
          console.log('Incrementing streak to:', newStreak);
        } else if (dayDiff > 1) {
          // Missed one or more days, reset streak
          newStreak = 1;
          console.log('Missed days, resetting streak to 1');
        } else {
          // If for some reason last activity is in the future, reset streak
          newStreak = 1;
          console.log('Last activity in the future, resetting streak to 1');
        }
      } else {
        // First time logging in, start streak at 1
        newStreak = 1;
        console.log('First login, setting streak to 1');
      }
      
      console.log('New streak value to save:', newStreak);
      
      // Update the profile with the new streak and last_activity_date (YYYY-MM-DD)
      const todayDateString = now.toISOString().split('T')[0]; // Format as YYYY-MM-DD
      const { data, error } = await supabase
        .from('profiles')
        .update({
          streak: newStreak,
          last_activity_date: todayDateString
        })
        .eq('user_id', userId)
        .select('streak')
        .single();
      
      if (error) {
        console.error('Error updating streak:', error);
        return Math.max(profile?.streak || 1, 1); // Ensure it's at least 1
      }
      
      console.log('Streak updated successfully. New streak:', data?.streak);
      return data?.streak || 1; // Ensure it's at least 1
    } catch (err) {
      console.error('Unexpected error updating streak:', err);
      return this.initializeUserStreak(userId);
    }
  },
  
  async initializeUserStreak(userId) {
    try {
      console.log('Initializing streak for user:', userId);
      const today = new Date();
      
      const todayDateString = today.toISOString().split('T')[0];
      const { error } = await supabase
        .from('profiles')
        .update({
          streak: 1,
          last_activity_date: todayDateString
        })
        .eq('user_id', userId);
      
      if (error) {
        console.error('Error initializing streak:', error);
      }
      
      return 1;
    } catch (err) {
      console.error('Unexpected error initializing streak:', err);
      return 1;
    }
  },

  async resetInactiveStreaks() {
    try {
      const { error } = await supabase.rpc('reset_inactive_streaks');
      
      if (error) {
        console.error('Error resetting inactive streaks:', error);
      } else {
        console.log('Successfully reset inactive streaks');
      }
    } catch (err) {
      console.error('Unexpected error resetting streaks:', err);
    }
  }
};

// Simulate login and streak update
async function simulateLogin() {
  try {
    console.log('Simulating user login...');
    
    // Get the current user session
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      console.error('No authenticated user session found. Please login first.');
      return;
    }
    
    const userId = session.user.id;
    console.log('Logged in user ID:', userId);
    
    // 1. Get current streak before update
    console.log('\n1. Getting current streak before login...');
    const beforeStreak = await streakService.getUserStreak(userId);
    console.log('Current streak before login:', beforeStreak);
    
    // 2. Update streak (as if user just logged in)
    console.log('\n2. Updating streak on login...');
    const updatedStreak = await streakService.updateUserStreak(userId);
    console.log('Updated streak after login:', updatedStreak);
    
    // 3. Verify streak was updated correctly
    console.log('\n3. Verifying streak was updated correctly...');
    const afterStreak = await streakService.getUserStreak(userId);
    console.log('Verified streak after login:', afterStreak);
    
    // 4. Compare before and after
    if (afterStreak > beforeStreak) {
      console.log('\nSuccess! Streak was incremented from', beforeStreak, 'to', afterStreak);
    } else if (afterStreak === beforeStreak) {
      console.log('\nStreak remained the same at', afterStreak, '(user likely logged in earlier today)');
    } else {
      console.log('\nUnexpected behavior: Streak decreased from', beforeStreak, 'to', afterStreak);
    }
    
    return afterStreak;
  } catch (err) {
    console.error('Error in simulated login:', err);
  }
}

// Main test function
async function testStreakService() {
  try {
    console.log('=== STREAK SERVICE TEST ===');
    await simulateLogin();
    console.log('\n=== TEST COMPLETED ===');
  } catch (err) {
    console.error('Error running tests:', err);
  }
}

// Run the test
testStreakService(); 