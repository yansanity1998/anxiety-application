import { supabase } from './supabase';
import { RealtimeChannel } from '@supabase/supabase-js';

type ProfileUpdateCallback = (payload: any) => void;

class RealtimeService {
  private channel: RealtimeChannel | null = null;
  private callbacks: Set<ProfileUpdateCallback> = new Set();

  /**
   * Initialize real-time subscriptions for profile updates
   */
  initialize() {
    if (this.channel) {
      console.log('Real-time service already initialized');
      return;
    }

    console.log('🔄 Initializing real-time profile updates...');
    
    this.channel = supabase
      .channel('profile-updates')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'profiles'
        },
        (payload) => {
          console.log('📡 Real-time profile update received:', payload);
          this.notifyCallbacks(payload);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'profiles'
        },
        (payload) => {
          console.log('📡 Real-time profile insert received:', payload);
          this.notifyCallbacks(payload);
        }
      )
      .subscribe((status) => {
        console.log('📡 Real-time subscription status:', status);
      });
  }

  /**
   * Subscribe to profile updates
   */
  subscribe(callback: ProfileUpdateCallback) {
    this.callbacks.add(callback);
    
    // Initialize if not already done
    if (!this.channel) {
      this.initialize();
    }

    // Return unsubscribe function
    return () => {
      this.callbacks.delete(callback);
    };
  }

  /**
   * Notify all subscribers of profile updates
   */
  private notifyCallbacks(payload: any) {
    this.callbacks.forEach(callback => {
      try {
        callback(payload);
      } catch (error) {
        console.error('Error in real-time callback:', error);
      }
    });
  }

  /**
   * Broadcast a profile update event manually (for immediate UI updates)
   */
  broadcastProfileUpdate(profileData: any) {
    console.log('📤 Broadcasting profile update:', profileData);
    this.notifyCallbacks({
      eventType: 'UPDATE',
      new: profileData,
      old: null,
      table: 'profiles'
    });
  }

  /**
   * Cleanup real-time subscriptions
   */
  cleanup() {
    if (this.channel) {
      console.log('🧹 Cleaning up real-time subscriptions...');
      supabase.removeChannel(this.channel);
      this.channel = null;
    }
    this.callbacks.clear();
  }
}

// Export singleton instance
export const realtimeService = new RealtimeService();

// Export types
export type { ProfileUpdateCallback };
