import { supabase } from './supabase';

export type NotificationType = 'registration' | 'login' | 'archive' | 'appointment' | 'system';

export interface NotificationRecord {
  id: number;
  user_id: string | null;
  profile_id: number | null;
  type: NotificationType;
  title: string;
  message: string;
  read: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateNotificationInput {
  userId?: string; // defaults to current session user
  profileId?: number;
  type: NotificationType;
  title: string;
  message: string;
}

/**
 * Create a notification. If userId is not provided, it will default to the current session user.
 * RLS allows: owner user, their profile, admin, or guidance.
 */
export async function createNotification(input: CreateNotificationInput): Promise<NotificationRecord> {
  const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
  if (sessionError) throw sessionError;

  const sessionUserId = sessionData.session?.user?.id || null;
  const payload = {
    user_id: input.userId ?? sessionUserId,
    profile_id: input.profileId ?? null,
    type: input.type,
    title: input.title,
    message: input.message,
  };

  const { data, error } = await supabase
    .from('notifications')
    .insert(payload)
    .select('*')
    .single();

  if (error) throw error;
  return data as NotificationRecord;
}

/**
 * Get notifications for the current user (RLS restricts scope). Optionally filter unread and limit count.
 */
export async function getMyNotifications(options?: { unreadOnly?: boolean; limit?: number }): Promise<NotificationRecord[]> {
  const { unreadOnly = false, limit = 50 } = options || {};

  // RLS will ensure we only see our notifications
  let query = supabase
    .from('notifications')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (unreadOnly) {
    query = query.eq('read', false);
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data || []) as NotificationRecord[];
}

/** Mark a single notification as read */
export async function markNotificationRead(notificationId: number): Promise<void> {
  const { error } = await supabase
    .from('notifications')
    .update({ read: true })
    .eq('id', notificationId);
  if (error) throw error;
}

/** Mark all of the current user's notifications as read */
export async function markAllMyNotificationsRead(): Promise<number> {
  const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
  if (sessionError) throw sessionError;
  const userId = sessionData.session?.user?.id;
  if (!userId) return 0;

  const { data, error } = await supabase
    .from('notifications')
    .update({ read: true })
    .eq('user_id', userId)
    .select('id');

  if (error) throw error;
  return (data || []).length;
}

/**
 * Subscribe to realtime notifications visible to the current user via RLS.
 * Returns an unsubscribe function.
 */
export function subscribeToMyNotifications(onInsert: (record: NotificationRecord) => void, onUpdate?: (record: NotificationRecord) => void) {
  const channel = supabase
    .channel('notifications_changes')
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'notifications' },
      (payload: any) => {
        if (payload?.new) onInsert(payload.new as NotificationRecord);
      }
    )
    .on(
      'postgres_changes',
      { event: 'UPDATE', schema: 'public', table: 'notifications' },
      (payload: any) => {
        if (payload?.new && onUpdate) onUpdate(payload.new as NotificationRecord);
      }
    )
    .subscribe();

  return () => {
    try {
      supabase.removeChannel(channel);
    } catch {
      // ignore
    }
  };
} 