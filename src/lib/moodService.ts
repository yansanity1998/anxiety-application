import { supabase } from './supabase';

export interface MoodEntry {
  id: number;
  profile_id: number;
  mood_level: number;
  mood_emoji: string;
  mood_label: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface MoodStats {
  totalEntries: number;
  averageMood: number;
  moodDistribution: {
    level: number;
    count: number;
    emoji: string;
    label: string;
    percentage: number;
  }[];
  currentStreak: number;
  longestStreak: number;
}

export const MOOD_OPTIONS = [
  { level: 1, emoji: '😢', label: 'Very Sad', color: 'bg-red-500' },
  { level: 2, emoji: '😔', label: 'Sad', color: 'bg-orange-500' },
  { level: 3, emoji: '😐', label: 'Neutral', color: 'bg-yellow-500' },
  { level: 4, emoji: '😄', label: 'Happy', color: 'bg-green-500' },
  { level: 5, emoji: '😊', label: 'Very Happy', color: 'bg-blue-500' },
  { level: 6, emoji: '😠', label: 'Angry', color: 'bg-red-600' },
  { level: 7, emoji: '😍', label: 'In Love', color: 'bg-pink-500' },
  { level: 8, emoji: '😭', label: 'Crying', color: 'bg-blue-600' }
];

class MoodService {
  // Get current day's mood entry for a user (considers 8am reset)
  async getTodaysMood(profileId: number): Promise<MoodEntry | null> {
    try {
      const currentMoodDate = this.getCurrentMoodDate();
      
      const { data, error } = await supabase
        .from('mood_entries')
        .select('*')
        .eq('profile_id', profileId)
        .eq('entry_date', currentMoodDate)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error fetching today\'s mood:', error);
      return null;
    }
  }

  // Get the current mood date (always uses the actual calendar date)
  private getCurrentMoodDate(): string {
    const now = new Date();
    // Always use today's actual calendar date
    return now.toISOString().split('T')[0];
  }

  // Public method to get the current mood date for components to use
  getCurrentMoodDateString(): string {
    return this.getCurrentMoodDate();
  }

  // Public method to check if a given date string matches the current mood date
  isCurrentMoodDate(dateString: string): boolean {
    return dateString === this.getCurrentMoodDate();
  }

  // Create or update today's mood entry
  async setTodaysMood(profileId: number, moodLevel: number, notes?: string): Promise<MoodEntry | null> {
    try {
      const moodOption = MOOD_OPTIONS.find(option => option.level === moodLevel);
      if (!moodOption) {
        throw new Error('Invalid mood level');
      }

      // Check if mood entry already exists for today
      const existingMood = await this.getTodaysMood(profileId);
      
      if (existingMood) {
        // Update existing entry
        const { data, error } = await supabase
          .from('mood_entries')
          .update({
            mood_level: moodLevel,
            mood_emoji: moodOption.emoji,
            mood_label: moodOption.label,
            notes: notes || null,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingMood.id)
          .select()
          .single();

        if (error) {
          console.error('Error updating mood:', error);
          return null;
        }

        return data;
      } else {
        // Create new entry
        const { data, error } = await supabase
          .from('mood_entries')
          .insert({
            profile_id: profileId,
            mood_level: moodLevel,
            mood_emoji: moodOption.emoji,
            mood_label: moodOption.label,
            notes: notes || null,
            entry_date: this.getCurrentMoodDate()
          })
          .select()
          .single();

        if (error) {
          console.error('Error creating mood:', error);
          return null;
        }

        return data;
      }
    } catch (error) {
      console.error('Error in setTodaysMood:', error);
      return null;
    }
  }

  // Get mood entries for a specific month
  async getMonthlyMoods(profileId: number, year: number, month: number): Promise<MoodEntry[]> {
    try {
      const { data, error } = await supabase
        .from('mood_entries')
        .select('*')
        .eq('profile_id', profileId)
        .gte('entry_date', `${year}-${month.toString().padStart(2, '0')}-01`)
        .lte('entry_date', `${year}-${month.toString().padStart(2, '0')}-31`)
        .order('entry_date', { ascending: true });

      if (error) {
        console.error('Error fetching monthly moods:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error in getMonthlyMoods:', error);
      return [];
    }
  }

  // Get mood statistics for a specific month
  async getMonthlyStats(profileId: number, year: number, month: number): Promise<MoodStats> {
    try {
      const moods = await this.getMonthlyMoods(profileId, year, month);
      
      if (moods.length === 0) {
        return {
          totalEntries: 0,
          averageMood: 0,
          moodDistribution: MOOD_OPTIONS.map(option => ({
            level: option.level,
            count: 0,
            emoji: option.emoji,
            label: option.label,
            percentage: 0
          })),
          currentStreak: 0,
          longestStreak: 0
        };
      }

      // Calculate average mood
      const totalMood = moods.reduce((sum, mood) => sum + mood.mood_level, 0);
      const averageMood = totalMood / moods.length;

      // Calculate mood distribution
      const distribution = MOOD_OPTIONS.map(option => {
        const count = moods.filter(mood => mood.mood_level === option.level).length;
        const percentage = (count / moods.length) * 100;
        
        return {
          level: option.level,
          count,
          emoji: option.emoji,
          label: option.label,
          percentage: Math.round(percentage)
        };
      });

      // Calculate streaks (simplified - consecutive days with mood entries)
      const currentStreak = await this.calculateCurrentStreak(profileId);
      const longestStreak = await this.calculateLongestStreak(profileId, year, month);

      return {
        totalEntries: moods.length,
        averageMood: Math.round(averageMood * 10) / 10,
        moodDistribution: distribution,
        currentStreak,
        longestStreak
      };
    } catch (error) {
      console.error('Error in getMonthlyStats:', error);
      return {
        totalEntries: 0,
        averageMood: 0,
        moodDistribution: [],
        currentStreak: 0,
        longestStreak: 0
      };
    }
  }

  // Calculate current streak of consecutive days with mood entries
  private async calculateCurrentStreak(profileId: number): Promise<number> {
    try {
      const { data, error } = await supabase
        .from('mood_entries')
        .select('created_at')
        .eq('profile_id', profileId)
        .order('created_at', { ascending: false })
        .limit(30); // Check last 30 days

      if (error || !data) {
        return 0;
      }

      let streak = 0;
      const today = new Date();
      
      for (let i = 0; i < data.length; i++) {
        const entryDate = new Date(data[i].created_at);
        const expectedDate = new Date(today);
        expectedDate.setDate(today.getDate() - i);
        
        // Check if entry is from the expected consecutive day
        if (entryDate.toDateString() === expectedDate.toDateString()) {
          streak++;
        } else {
          break;
        }
      }

      return streak;
    } catch (error) {
      console.error('Error calculating current streak:', error);
      return 0;
    }
  }

  // Calculate longest streak for a specific month
  private async calculateLongestStreak(profileId: number, year: number, month: number): Promise<number> {
    try {
      const moods = await this.getMonthlyMoods(profileId, year, month);
      
      if (moods.length === 0) return 0;

      let longestStreak = 1;
      let currentStreak = 1;

      for (let i = 1; i < moods.length; i++) {
        const prevDate = new Date(moods[i - 1].created_at);
        const currDate = new Date(moods[i].created_at);
        
        // Check if dates are consecutive
        const diffTime = currDate.getTime() - prevDate.getTime();
        const diffDays = diffTime / (1000 * 3600 * 24);
        
        if (diffDays === 1) {
          currentStreak++;
          longestStreak = Math.max(longestStreak, currentStreak);
        } else {
          currentStreak = 1;
        }
      }

      return longestStreak;
    } catch (error) {
      console.error('Error calculating longest streak:', error);
      return 0;
    }
  }

  // Get recent mood entries (last 7 days)
  async getRecentMoods(profileId: number, days: number = 7): Promise<MoodEntry[]> {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const { data, error } = await supabase
        .from('mood_entries')
        .select('*')
        .eq('profile_id', profileId)
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching recent moods:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error in getRecentMoods:', error);
      return [];
    }
  }
}

export const moodService = new MoodService();
