import { supabase } from './supabase';

/**
 * Service to handle user streak-related functionality
 */
export const streakService = {
  /**
   * Get the current streak for a user
   * @param userId The user ID
   * @returns The current streak count or 0 if not found
   */
  async getUserStreak(userId: string): Promise<number> {
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
  
  /**
   * Update the user's streak when they perform an activity
   * @param userId The user ID
   * @returns The updated streak count
   */
  async updateUserStreak(userId: string): Promise<number> {
    try {
      console.log('Updating streak for user:', userId);
      if (!userId) {
        console.error('Invalid userId provided to updateUserStreak:', userId);
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
        // Initialize with streak of 1 if profile fetch fails
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
      const todayDateString = now.toISOString().split('T')[0]; // 'YYYY-MM-DD'
      const { data, error } = await supabase
        .from('profiles')
        .update({
          streak: newStreak,
          last_activity_date: todayDateString // Store as DATE string
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
      // Initialize with streak of 1 if update fails
      return this.initializeUserStreak(userId);
    }
  },
  
  /**
   * Initialize a user's streak to 1
   * @param userId The user ID
   * @returns Always returns 1
   */
  async initializeUserStreak(userId: string): Promise<number> {
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
  
  /**
   * Check and reset streaks for users who haven't been active for more than a day
   * This would typically be called by a scheduled function/cron job
   */
  async resetInactiveStreaks(): Promise<void> {
    try {
      const { error } = await supabase.rpc('reset_inactive_streaks');
      
      if (error) {
        console.error('Error resetting inactive streaks:', error);
      }
    } catch (err) {
      console.error('Unexpected error resetting streaks:', err);
    }
  }
};

export default streakService; 