import { supabase } from './supabase';

export interface AnxietyVideo {
  id: number;
  profile_id: number;
  video_title: string;
  video_description: string;
  video_url: string;
  video_duration?: number;
  video_status: 'not_started' | 'in_progress' | 'completed' | 'paused';
  video_date_started?: string;
  video_date_completed?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateAnxietyVideoData {
  profile_id: number;
  video_title: string;
  video_description: string;
  video_url: string;
  video_duration?: number;
  video_status?: 'not_started' | 'in_progress' | 'completed' | 'paused';
}

export interface UpdateAnxietyVideoData extends Partial<CreateAnxietyVideoData> {
  id: number;
}

class AnxietyVideoService {
  async getVideosByProfile(profileId: number): Promise<AnxietyVideo[]> {
    const { data, error } = await supabase
      .from('anxiety_video')
      .select('*')
      .eq('profile_id', profileId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  }

  async getAllVideos(): Promise<AnxietyVideo[]> {
    const { data, error } = await supabase
      .from('anxiety_video')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  }

  async getVideoById(id: number): Promise<AnxietyVideo | null> {
    const { data, error } = await supabase
      .from('anxiety_video')
      .select('*')
      .eq('id', id)
      .single();
    if (error) throw error;
    return data;
  }

  async createVideo(videoData: CreateAnxietyVideoData): Promise<AnxietyVideo> {
    const { data, error } = await supabase
      .from('anxiety_video')
      .insert([videoData])
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  async updateVideo(videoData: UpdateAnxietyVideoData): Promise<AnxietyVideo> {
    const { id, ...updateData } = videoData;
    const { data, error } = await supabase
      .from('anxiety_video')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  async deleteVideo(id: number): Promise<void> {
    const { error } = await supabase
      .from('anxiety_video')
      .delete()
      .eq('id', id);
    if (error) throw error;
  }

  async updateVideoStatus(id: number, status: AnxietyVideo['video_status']): Promise<AnxietyVideo> {
    const updateData: any = { video_status: status };
    if (status === 'in_progress') updateData.video_date_started = new Date().toISOString();
    if (status === 'completed') updateData.video_date_completed = new Date().toISOString();

    const { data, error } = await supabase
      .from('anxiety_video')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  async getCurrentUserVideos(): Promise<AnxietyVideo[]> {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error('No active session');

    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('user_id', session.user.id)
      .single();

    if (!profile) throw new Error('Profile not found');

    return this.getVideosByProfile(profile.id);
  }
}

export const anxietyVideoService = new AnxietyVideoService(); 