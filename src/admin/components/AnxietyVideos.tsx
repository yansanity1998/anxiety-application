import { useEffect, useState } from 'react';
import { FaVideo, FaPlus, FaEdit, FaTrash, FaCheck, FaPlay, FaSearch, FaLink, FaClock, FaTimes, FaSpinner, FaTrophy, FaUser } from 'react-icons/fa';
// Removed SweetAlert2 - using modern alerts instead
import { supabase } from '../../lib/supabase';
import { anxietyVideoService } from '../../lib/anxietyVideoService';
import type { AnxietyVideo, CreateAnxietyVideoData } from '../../lib/anxietyVideoService';

interface AnxietyVideosProps {
  darkMode: boolean;
}

interface UserProfile {
  id: number;
  full_name: string;
  email: string;
  role: string;
}

const AnxietyVideos = ({ darkMode }: AnxietyVideosProps) => {
  const [videos, setVideos] = useState<AnxietyVideo[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState<AnxietyVideo | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [sortField, setSortField] = useState<'title' | 'status' | 'created_at' | 'user'>('created_at');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // New: video upload state
  const [newVideoFile, setNewVideoFile] = useState<File | null>(null);
  const [editVideoFile, setEditVideoFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState<boolean>(false);

  const [formData, setFormData] = useState<CreateAnxietyVideoData>({
    profile_id: 0,
    video_title: '',
    video_description: '',
    video_url: '',
    video_duration: undefined,
    video_status: 'in_progress'
  });

  // Modern alert function
  const showAlert = (type: 'success' | 'error' | 'warning', title: string, message: string) => {
    const colors = {
      success: { border: 'border-emerald-500', bg: 'bg-emerald-50', text: 'text-emerald-700', icon: 'text-emerald-500' },
      error: { border: 'border-red-500', bg: 'bg-red-50', text: 'text-red-700', icon: 'text-red-500' },
      warning: { border: 'border-yellow-500', bg: 'bg-yellow-50', text: 'text-yellow-700', icon: 'text-yellow-500' }
    };
    
    const alertDiv = document.createElement('div');
    alertDiv.className = `fixed top-4 right-4 z-50 bg-white border-l-4 ${colors[type].border} rounded-lg shadow-lg p-4 max-w-sm transform transition-all duration-300 ease-in-out`;
    alertDiv.innerHTML = `
      <div class="flex items-start">
        <div class="flex-shrink-0">
          <svg class="h-5 w-5 ${colors[type].icon}" fill="currentColor" viewBox="0 0 20 20">
            ${type === 'success' ? 
              '<path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>' :
              type === 'error' ?
              '<path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"/>' :
              '<path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd"/>'
            }
          </svg>
        </div>
        <div class="ml-3 flex-1">
          <p class="text-sm font-medium text-gray-900">${title}</p>
          <p class="text-xs text-gray-500 mt-1">${message}</p>
        </div>
        <div class="ml-auto pl-3">
          <button type="button" class="inline-flex bg-white rounded-md p-1.5 text-gray-400 hover:text-gray-500 focus:outline-none" onclick="this.closest('div').remove()">
            <svg class="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"/>
            </svg>
          </button>
        </div>
      </div>
    `;
    document.body.appendChild(alertDiv);
    setTimeout(() => alertDiv.remove(), 4000);
  };

  // Modern confirmation dialog
  const showConfirmDialog = (title: string, message: string, confirmText = 'Confirm', cancelText = 'Cancel'): Promise<boolean> => {
    return new Promise((resolve) => {
      const confirmDiv = document.createElement('div');
      confirmDiv.className = 'fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[9999] overflow-y-auto';
      document.body.style.overflow = 'hidden';
      confirmDiv.innerHTML = `
        <div class="${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-2xl p-6 max-w-sm mx-4 shadow-2xl">
          <div class="text-center">
            <div class="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
              <svg class="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16c-.77.833.192 2.5 1.732 2.5z"/>
              </svg>
            </div>
            <h3 class="text-lg font-medium ${darkMode ? 'text-white' : 'text-gray-900'} mb-2">${title}</h3>
            <p class="text-sm ${darkMode ? 'text-gray-300' : 'text-gray-500'} mb-6">${message}</p>
            <div class="flex space-x-3">
              <button id="cancelBtn" class="flex-1 ${darkMode ? 'bg-gray-700 text-gray-200 hover:bg-gray-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'} px-4 py-2 rounded-xl font-medium transition-colors">${cancelText}</button>
              <button id="confirmBtn" class="flex-1 bg-red-500 text-white px-4 py-2 rounded-xl font-medium hover:bg-red-600 transition-colors">${confirmText}</button>
            </div>
          </div>
        </div>
      `;
      
      document.body.appendChild(confirmDiv);
      
      const cancelBtn = confirmDiv.querySelector('#cancelBtn');
      const confirmBtn = confirmDiv.querySelector('#confirmBtn');
      
      cancelBtn?.addEventListener('click', () => {
        document.body.style.overflow = '';
        confirmDiv.remove();
        resolve(false);
      });
      confirmBtn?.addEventListener('click', () => {
        document.body.style.overflow = '';
        confirmDiv.remove();
        resolve(true);
      });
    });
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Manage body overflow when modals are open
  useEffect(() => {
    if (showAddModal || showEditModal) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [showAddModal, showEditModal]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [videosData, usersData] = await Promise.all([
        anxietyVideoService.getAllVideos(),
        fetchUsers()
      ]);
      setVideos(videosData);
      setUsers(usersData);
    } catch (error) {
      console.error('Error fetching data:', error);
      showAlert('error', 'Error', 'Failed to load videos and users');
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async (): Promise<UserProfile[]> => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, email, role')
        .in('role', ['student', 'guidance'])
        .order('full_name');
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching users:', error);
      return [];
    }
  };

  // New: helper to upload video to Supabase Storage and return public URL
  const uploadVideoFile = async (file: File, profileId: number): Promise<string> => {
    const fileExt = file.name.split('.').pop() || 'mp4';
    const sanitizedExt = fileExt.toLowerCase().replace(/[^a-z0-9]/g, '') || 'mp4';
    const fileName = `${Date.now()}_${Math.random().toString(36).slice(2)}.${sanitizedExt}`;
    const filePath = `${profileId}/${fileName}`;

    const { error: uploadError } = await supabase
      .storage
      .from('anxiety-videos')
      .upload(filePath, file, { upsert: false, contentType: file.type });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      throw new Error(uploadError.message || 'Failed to upload video');
    }

    const { data } = supabase
      .storage
      .from('anxiety-videos')
      .getPublicUrl(filePath);

    if (!data?.publicUrl) {
      throw new Error('Could not get public URL for uploaded video');
    }

    return data.publicUrl;
  };

  const handleAddVideo = async () => {
    if (!formData.profile_id || !formData.video_title || !formData.video_description) {
      showAlert('warning', 'Missing Information', 'Please fill in all required fields');
      return;
    }
    if (!newVideoFile) {
      showAlert('warning', 'No Video Selected', 'Please choose a video file to upload');
      return;
    }
    try {
      setIsUploading(true);
      const uploadedUrl = await uploadVideoFile(newVideoFile, formData.profile_id);
      const newVideo = await anxietyVideoService.createVideo({
        ...formData,
        video_url: uploadedUrl
      });
      setVideos(prev => [newVideo, ...prev]);
      setShowAddModal(false);
      resetForm();
      setNewVideoFile(null);
      showAlert('success', 'Success!', 'Anxiety video uploaded successfully');
    } catch (error: any) {
      console.error('Error creating video:', error);
      showAlert('error', 'Error', error?.message || 'Failed to upload anxiety video');
    } finally {
      setIsUploading(false);
    }
  };

  const handleEditVideo = async () => {
    if (!selectedVideo || !formData.video_title || !formData.video_description) {
      showAlert('warning', 'Missing Information', 'Please fill in all required fields');
      return;
    }
    try {
      setIsUploading(true);
      let uploadedUrl = formData.video_url;
      if (editVideoFile) {
        uploadedUrl = await uploadVideoFile(editVideoFile, formData.profile_id);
      }
      const updatedVideo = await anxietyVideoService.updateVideo({ id: selectedVideo.id, ...formData, video_url: uploadedUrl });
      setVideos(prev => prev.map(v => v.id === selectedVideo.id ? updatedVideo : v));
      setShowEditModal(false);
      setSelectedVideo(null);
      resetForm();
      setEditVideoFile(null);
      showAlert('success', 'Success!', 'Anxiety video updated successfully');
    } catch (error: any) {
      console.error('Error updating video:', error);
      showAlert('error', 'Error', error?.message || 'Failed to update anxiety video');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteVideo = async (video: AnxietyVideo) => {
    const confirmed = await showConfirmDialog(
      'Delete Video',
      `Are you sure you want to delete "${video.video_title}"?`,
      'Delete',
      'Cancel'
    );
    if (confirmed) {
      try {
        await anxietyVideoService.deleteVideo(video.id);
        setVideos(prev => prev.filter(v => v.id !== video.id));
        showAlert('success', 'Deleted!', 'Anxiety video deleted successfully');
      } catch (error) {
        console.error('Error deleting video:', error);
        showAlert('error', 'Error', 'Failed to delete anxiety video');
      }
    }
  };

  const handleStatusChange = async (video: AnxietyVideo, newStatus: AnxietyVideo['video_status']) => {
    try {
      const updatedVideo = await anxietyVideoService.updateVideoStatus(video.id, newStatus);
      setVideos(prev => prev.map(v => v.id === video.id ? updatedVideo : v));
      showAlert('success', 'Status Updated', `Video status changed to ${newStatus.replace('_', ' ')}`);
    } catch (error) {
      console.error('Error updating status:', error);
      showAlert('error', 'Error', 'Failed to update video status');
    }
  };

  const openEditModal = (video: AnxietyVideo) => {
    setSelectedVideo(video);
    setFormData({
      profile_id: video.profile_id,
      video_title: video.video_title,
      video_description: video.video_description,
      video_url: video.video_url,
      video_duration: video.video_duration,
      video_status: video.video_status
    });
    setEditVideoFile(null);
    setShowEditModal(true);
  };

  const resetForm = () => {
    setFormData({
      profile_id: 0,
      video_title: '',
      video_description: '',
      video_url: '',
      video_duration: undefined,
      video_status: 'in_progress'
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'in_progress': return <FaPlay className="text-xs" />;
      case 'completed': return <FaCheck className="text-xs" />;
      default: return <FaVideo className="text-xs" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': 
        return 'bg-green-100 text-green-800 border-green-200';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default: 
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getUserName = (profileId: number) => {
    const user = users.find(u => u.id === profileId);
    return user ? user.full_name : 'Unknown User';
  };

  const filteredAndSortedVideos = videos
    .filter(video => {
      if (filterStatus !== 'all' && video.video_status !== filterStatus) return false;
      if (selectedUserId && video.profile_id !== selectedUserId) return false;
      if (searchTerm) {
        const s = searchTerm.toLowerCase();
        return video.video_title.toLowerCase().includes(s) ||
               video.video_description.toLowerCase().includes(s) ||
               getUserName(video.profile_id).toLowerCase().includes(s);
      }
      return true;
    })
    .sort((a, b) => {
      let aValue: any, bValue: any;
      switch (sortField) {
        case 'title':
          aValue = a.video_title.toLowerCase();
          bValue = b.video_title.toLowerCase();
          break;
        case 'status':
          aValue = a.video_status;
          bValue = b.video_status;
          break;
        case 'user':
          aValue = getUserName(a.profile_id).toLowerCase();
          bValue = getUserName(b.profile_id).toLowerCase();
          break;
        case 'created_at':
        default:
          aValue = new Date(a.created_at || '');
          bValue = new Date(b.created_at || '');
          break;
      }
      if (aValue < bValue) return -1;
      if (aValue > bValue) return 1;
      return 0;
    });

  const getProgressStats = () => {
    const total = videos.length;
    const completed = videos.filter(v => v.video_status === 'completed').length;
    const inProgress = videos.filter(v => v.video_status === 'in_progress').length;
    
    return { total, completed, inProgress };
  };

  const stats = getProgressStats();

  if (loading) {
    return (
      <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-lg p-8`}>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <FaSpinner className="animate-spin text-4xl text-[#800000] mx-auto mb-4" />
            <p className={`text-lg font-medium ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
              Loading anxiety videos...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`${darkMode ? 'bg-gray-800' : 'bg-gray-100'} rounded-xl shadow-lg p-3 sm:p-4 lg:p-6`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 sm:mb-6 gap-3 sm:gap-4">
        <div className="flex items-center">
          <div className={`p-2 sm:p-3 rounded-xl ${darkMode ? 'bg-orange-600/20' : 'bg-orange-100'} mr-3 sm:mr-4`}>
            <FaVideo className={`text-lg sm:text-xl lg:text-2xl ${darkMode ? 'text-orange-400' : 'text-orange-600'}`} />
          </div>
          <div>
            <h2 className={`text-lg sm:text-xl lg:text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              Anxiety Videos
            </h2>
            <p className={`text-xs sm:text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Manage educational anxiety videos for students
            </p>
          </div>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center justify-center px-3 py-2 sm:px-4 sm:py-2.5 bg-[#800000] hover:bg-[#b56576] text-white rounded-lg font-medium transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95 text-sm sm:text-base w-full sm:w-auto"
        >
          <FaPlus className="mr-2 text-sm" />
          Add Video
        </button>
      </div>

      {/* Status Overview Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3 mb-4 sm:mb-6">
        <div className={`p-2 sm:p-3 rounded-xl bg-gradient-to-br ${darkMode ? 'from-gray-700 to-gray-900' : 'from-gray-50 to-gray-100'} border border-blue-200 transition-all duration-300 hover:shadow-xl hover:scale-105 shadow-lg backdrop-blur-sm`}>
          <div className="flex items-center justify-between mb-1 sm:mb-2">
            <div>
              <p className={`text-[10px] sm:text-xs font-medium ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Total</p>
              <h3 className={`text-lg sm:text-xl font-bold mt-0.5 ${darkMode ? 'text-white' : 'text-gray-900'}`}>{stats.total}</h3>
            </div>
            <div className="p-1 sm:p-1.5 bg-blue-500 rounded-lg">
              <FaVideo className="text-white text-xs sm:text-sm" />
            </div>
          </div>
          <div className="relative">
            <div className="h-1 rounded-full bg-white/30 overflow-hidden">
              <div className="h-full rounded-full bg-blue-400 transition-all duration-500 shadow-sm" style={{ width: '100%' }}></div>
            </div>
          </div>
        </div>

        <div className={`p-2 sm:p-3 rounded-xl bg-gradient-to-br ${darkMode ? 'from-gray-700 to-gray-900' : 'from-gray-50 to-gray-100'} border border-amber-200 transition-all duration-300 hover:shadow-xl hover:scale-105 shadow-lg backdrop-blur-sm`}>
          <div className="flex items-center justify-between mb-1 sm:mb-2">
            <div>
              <p className={`text-[10px] sm:text-xs font-medium ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>In Progress</p>
              <h3 className={`text-lg sm:text-xl font-bold mt-0.5 ${darkMode ? 'text-white' : 'text-gray-900'}`}>{stats.inProgress}</h3>
            </div>
            <div className="p-1 sm:p-1.5 bg-amber-500 rounded-lg">
              <FaClock className="text-white text-xs sm:text-sm" />
            </div>
          </div>
          <div className="relative">
            <div className="h-1 rounded-full bg-white/30 overflow-hidden">
              <div className="h-full rounded-full bg-amber-400 transition-all duration-500 shadow-sm" style={{ width: `${(stats.inProgress / stats.total) * 100}%` }}></div>
            </div>
          </div>
        </div>

        <div className={`p-2 sm:p-3 rounded-xl bg-gradient-to-br ${darkMode ? 'from-gray-700 to-gray-900' : 'from-gray-50 to-gray-100'} border border-emerald-200 transition-all duration-300 hover:shadow-xl hover:scale-105 shadow-lg backdrop-blur-sm`}>
          <div className="flex items-center justify-between mb-1 sm:mb-2">
            <div>
              <p className={`text-[10px] sm:text-xs font-medium ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Completed</p>
              <h3 className={`text-lg sm:text-xl font-bold mt-0.5 ${darkMode ? 'text-white' : 'text-gray-900'}`}>{stats.completed}</h3>
            </div>
            <div className="p-1 sm:p-1.5 bg-emerald-500 rounded-lg">
              <FaTrophy className="text-white text-xs sm:text-sm" />
            </div>
          </div>
          <div className="relative">
            <div className="h-1 rounded-full bg-white/30 overflow-hidden">
              <div className="h-full rounded-full bg-emerald-400 transition-all duration-500 shadow-sm" style={{ width: `${(stats.completed / stats.total) * 100}%` }}></div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 mb-4 sm:mb-6">
        <div className="flex-1">
          <div className="relative">
            <FaSearch className={`absolute left-3 top-1/2 transform -translate-y-1/2 text-xs ${darkMode ? 'text-gray-400' : 'text-gray-400'}`} />
            <input
              type="text"
              placeholder="Search videos or users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`w-full pl-9 pr-4 py-2 text-sm border rounded-xl ${
                darkMode 
                  ? 'bg-gray-700/50 border-gray-600 text-white placeholder-gray-400' 
                  : 'bg-white border-gray-300 placeholder-gray-500'
              } focus:ring-2 focus:ring-red-800 focus:border-transparent focus:outline-none transition-all duration-200`}
            />
          </div>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 overflow-x-auto pb-1">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className={`px-3 py-2 text-sm border rounded-xl whitespace-nowrap ${
              darkMode 
                ? 'bg-gray-700/50 border-gray-600 text-white' 
                : 'bg-white border-gray-300'
            } focus:ring-2 focus:ring-red-800 focus:border-transparent focus:outline-none`}
          >
            <option value="all">All Status ({stats.total})</option>
            <option value="in_progress">In Progress ({stats.inProgress})</option>
            <option value="completed">Completed ({stats.completed})</option>
          </select>

          <select
            value={selectedUserId || ''}
            onChange={(e) => setSelectedUserId(e.target.value ? Number(e.target.value) : null)}
            className={`px-3 py-2 text-sm border rounded-xl whitespace-nowrap ${
              darkMode 
                ? 'bg-gray-700/50 border-gray-600 text-white' 
                : 'bg-white border-gray-300'
            } focus:ring-2 focus:ring-red-800 focus:border-transparent focus:outline-none`}
          >
            <option value="">All Users ({users.length})</option>
            {users.map(user => (
              <option key={user.id} value={user.id}>{user.full_name}</option>
            ))}
          </select>

          <select
            value={sortField}
            onChange={(e) => setSortField(e.target.value as typeof sortField)}
            className={`px-3 py-2 text-sm border rounded-xl whitespace-nowrap ${
              darkMode 
                ? 'bg-gray-700/50 border-gray-600 text-white' 
                : 'bg-white border-gray-300'
            } focus:ring-2 focus:ring-red-800 focus:border-transparent focus:outline-none`}
          >
            <option value="created_at">Sort by Date</option>
            <option value="title">Sort by Title</option>
            <option value="status">Sort by Status</option>
            <option value="user">Sort by User</option>
          </select>
        </div>
      </div>

      {/* Results count */}
      <div className="mb-6 text-right">
        <span className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
          Showing {filteredAndSortedVideos.length} of {videos.length} videos
        </span>
      </div>

      {/* Videos Grid */}
      {filteredAndSortedVideos.length === 0 ? (
        <div className={`text-center py-12 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
          <FaVideo className="text-6xl mx-auto mb-4 opacity-30" />
          <h3 className="text-xl font-semibold mb-2">No videos found</h3>
          <p>Try adjusting your search or filters, or add a new video.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
          {filteredAndSortedVideos.map((video) => (
            <div
              key={video.id}
              className={`group relative p-4 rounded-xl border transition-all duration-200 hover:shadow-lg hover:-translate-y-1 overflow-hidden flex flex-col ${
                darkMode 
                  ? 'bg-gray-700/50 border-gray-600 hover:bg-gray-700' 
                  : 'bg-white border-gray-200 hover:shadow-xl'
              }`}
            >
              {video.video_url && (
                <div className="absolute inset-0 -z-10">
                  <div className="w-full h-full bg-gradient-to-br from-purple-500/3 to-blue-500/3">
                    <video
                      src={video.video_url}
                      className="w-full h-full object-cover opacity-85"
                      muted
                      playsInline
                    />
                  </div>
                  <div className={`absolute inset-0 backdrop-blur-[2px] ${darkMode ? 'bg-gray-900/40' : 'bg-white/40'}`}></div>
                </div>
              )}

              {/* Card Header */}
              <div className="flex items-start mb-3">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <div className={`p-2 rounded-lg ${darkMode ? 'bg-purple-500/10' : 'bg-purple-50'}`}>
                    <FaVideo className={`text-sm ${darkMode ? 'text-purple-400 group-hover:text-purple-300' : 'text-purple-500 group-hover:text-purple-600'}`} />
                  </div>
                  <h3 className={`font-semibold text-sm leading-tight truncate transition-colors ${
                    darkMode ? 'text-white group-hover:text-white' : 'text-gray-900 group-hover:text-gray-900'
                  }`}>
                    {video.video_title}
                  </h3>
                </div>
                <div className="absolute top-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  <button
                    onClick={() => openEditModal(video)}
                    className={`p-1.5 rounded-lg text-xs transition-colors ${
                      darkMode 
                        ? 'text-blue-400 hover:bg-blue-900/50 hover:text-blue-300' 
                        : 'text-blue-600 hover:bg-blue-50 hover:text-blue-700'
                    }`}
                    title="Edit video"
                  >
                    <FaEdit />
                  </button>
                  <button
                    onClick={() => handleDeleteVideo(video)}
                    className={`p-1.5 rounded-lg text-xs transition-colors ${
                      darkMode 
                        ? 'text-red-400 hover:bg-red-900/50 hover:text-red-300' 
                        : 'text-red-600 hover:bg-red-50 hover:text-red-700'
                    }`}
                    title="Delete video"
                  >
                    <FaTrash />
                  </button>
                </div>
              </div>

              {/* Card Content - Flexible */}
              <div className="flex-1 flex flex-col">
                <p className={`text-xs leading-relaxed mb-3 line-clamp-2 transition-colors ${
                  darkMode ? 'text-gray-300 group-hover:text-white' : 'text-gray-600 group-hover:text-gray-700'
                }`}>
                  {video.video_description}
                </p>

                <div className="flex items-center justify-between mb-3">
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium transition-colors ${getStatusColor(video.video_status)} group-hover:bg-opacity-100`}>
                    {getStatusIcon(video.video_status)}
                    <span className="ml-1 capitalize">{video.video_status.replace('_', ' ')}</span>
                  </span>
                </div>

                <div className="flex items-center gap-2 mb-3">
                  <a
                    href={video.video_url}
                    target="_blank"
                    rel="noreferrer"
                    className={`inline-flex items-center gap-1 text-xs transition-colors ${
                      darkMode 
                        ? 'text-blue-300 hover:text-blue-200 group-hover:text-blue-200' 
                        : 'text-blue-600 hover:text-blue-800 group-hover:text-blue-800'
                    } hover:underline`}
                  >
                    <FaLink className="text-xs" />
                    Watch Video
                  </a>
                  {typeof video.video_duration === 'number' && (
                    <span className={`text-xs inline-flex items-center gap-1 transition-colors ${
                      darkMode ? 'text-gray-400 group-hover:text-white' : 'text-gray-500 group-hover:text-black'
                    }`}>
                      <FaClock className="text-xs" />
                      {Math.floor(video.video_duration / 60)}m {video.video_duration % 60}s
                    </span>
                  )}
                </div>

                <div className="space-y-2 pt-3 border-t border-gray-200/50">
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <FaUser className="text-xs" />
                    <span className={`truncate font-bold transition-colors ${
                      darkMode ? 'group-hover:text-white' : 'group-hover:text-gray-700'
                    }`}>{getUserName(video.profile_id)}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <FaClock className="text-xs" />
                    <span className={`transition-colors ${
                      darkMode ? 'group-hover:text-white' : 'group-hover:text-gray-700'
                    }`}>Created: {new Date(video.created_at!).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>

              {/* Card Actions - Fixed at bottom */}
              <div className="flex gap-1.5 mt-3">
                {video.video_status !== 'in_progress' && (
                  <button
                    onClick={() => handleStatusChange(video, 'in_progress')}
                    className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-medium transition-colors"
                  >
                    <FaPlay className="text-xs" />
                    In Progress
                  </button>
                )}
                {video.video_status !== 'completed' && (
                  <button
                    onClick={() => handleStatusChange(video, 'completed')}
                    className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-lg text-xs font-medium transition-colors"
                  >
                    <FaCheck className="text-xs" />
                    Complete
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Video Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[9999] p-4 overflow-y-auto">
          <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-2xl w-full max-w-md max-h-[80vh] overflow-y-auto`}>
            <div className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  Add New Anxiety Video
                </h3>
                <button
                  onClick={() => {
                    setShowAddModal(false);
                    resetForm();
                    setNewVideoFile(null);
                  }}
                  className={`p-1.5 rounded-lg transition-colors ${
                    darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
                  }`}
                >
                  <FaTimes className={`${darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                </button>
              </div>
              
              <div className="space-y-3">
                <div>
                  <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Assign to User <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.profile_id}
                    onChange={(e) => setFormData(prev => ({ ...prev, profile_id: Number(e.target.value) }))}
                    className={`w-full px-3 py-2 rounded-lg border transition-colors ${
                      darkMode 
                        ? 'bg-gray-700 border-gray-600 text-white focus:border-[#800000]' 
                        : 'bg-white border-gray-300 text-gray-900 focus:border-[#800000]'
                    } focus:outline-none focus:ring-2 focus:ring-[#800000]/20`}
                  >
                    <option value={0}>Select a user</option>
                    {users.map(user => (
                      <option key={user.id} value={user.id}>{user.full_name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Video Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.video_title}
                    onChange={(e) => setFormData(prev => ({ ...prev, video_title: e.target.value }))}
                    className={`w-full px-3 py-2 rounded-lg border transition-colors ${
                      darkMode 
                        ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-[#800000]' 
                        : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-[#800000]'
                    } focus:outline-none focus:ring-2 focus:ring-[#800000]/20`}
                    placeholder="Enter video title"
                  />
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Description <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={formData.video_description}
                    onChange={(e) => setFormData(prev => ({ ...prev, video_description: e.target.value }))}
                    rows={3}
                    className={`w-full px-3 py-2 rounded-lg border transition-colors resize-none ${
                      darkMode 
                        ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-[#800000]' 
                        : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-[#800000]'
                    } focus:outline-none focus:ring-2 focus:ring-[#800000]/20`}
                    placeholder="Enter video description"
                  />
                </div>

                {/* New: Video upload input with preview */}
                <div>
                  <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Upload Video <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="file"
                    accept="video/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0] || null;
                      setNewVideoFile(file);
                    }}
                    className={`w-full px-3 py-2 rounded-lg border transition-colors ${
                      darkMode 
                        ? 'bg-gray-700 border-gray-600 text-white focus:border-[#800000]' 
                        : 'bg-white border-gray-300 text-gray-900 focus:border-[#800000]'
                    } focus:outline-none focus:ring-2 focus:ring-[#800000]/20`}
                  />
                  {newVideoFile && (
                    <div className="mt-2">
                      <video
                        src={URL.createObjectURL(newVideoFile)}
                        controls
                        className="w-full h-32 object-cover rounded-lg border border-gray-200"
                      />
                      <button
                        type="button"
                        onClick={() => setNewVideoFile(null)}
                        className={`mt-1 px-2 py-1 text-xs rounded-lg border ${darkMode ? 'border-gray-600 text-gray-300 hover:bg-gray-700' : 'border-gray-300 text-gray-700 hover:bg-gray-50'}`}
                      >
                        Remove Video
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-3 mt-4">
                <button
                  onClick={() => {
                    setShowAddModal(false);
                    resetForm();
                    setNewVideoFile(null);
                  }}
                  className={`flex-1 px-4 py-2 rounded-lg border transition-colors font-medium ${
                    darkMode 
                      ? 'border-gray-600 text-gray-300 hover:bg-gray-700' 
                      : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddVideo}
                  disabled={isUploading}
                  className={`flex-1 px-4 py-2 rounded-lg transition-colors font-medium text-white ${isUploading ? 'bg-gray-400 cursor-not-allowed' : 'bg-[#800000] hover:bg-[#b56576]'} `}
                >
                  {isUploading ? 'Uploading...' : 'Add Video'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Video Modal */}
      {showEditModal && selectedVideo && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[9999] p-4 overflow-y-auto">
          <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-2xl w-full max-w-md max-h-[80vh] overflow-y-auto`}>
            <div className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  Edit Anxiety Video
                </h3>
                <button
                  onClick={() => {
                    setShowEditModal(false);
                    setSelectedVideo(null);
                    resetForm();
                    setEditVideoFile(null);
                  }}
                  className={`p-1.5 rounded-lg transition-colors ${
                    darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
                  }`}
                >
                  <FaTimes className={`${darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                </button>
              </div>
              
              <div className="space-y-3">
                <div>
                  <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Assign to User <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.profile_id}
                    onChange={(e) => setFormData(prev => ({ ...prev, profile_id: Number(e.target.value) }))}
                    className={`w-full px-3 py-2 rounded-lg border transition-colors ${
                      darkMode 
                        ? 'bg-gray-700 border-gray-600 text-white focus:border-[#800000]' 
                        : 'bg-white border-gray-300 text-gray-900 focus:border-[#800000]'
                    } focus:outline-none focus:ring-2 focus:ring-[#800000]/20`}
                  >
                    {users.map(user => (
                      <option key={user.id} value={user.id}>{user.full_name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Video Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.video_title}
                    onChange={(e) => setFormData(prev => ({ ...prev, video_title: e.target.value }))}
                    className={`w-full px-3 py-2 rounded-lg border transition-colors ${
                      darkMode 
                        ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-[#800000]' 
                        : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-[#800000]'
                    } focus:outline-none focus:ring-2 focus:ring-[#800000]/20`}
                    placeholder="Enter video title"
                  />
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Description <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={formData.video_description}
                    onChange={(e) => setFormData(prev => ({ ...prev, video_description: e.target.value }))}
                    rows={3}
                    className={`w-full px-3 py-2 rounded-lg border transition-colors resize-none ${
                      darkMode 
                        ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-[#800000]' 
                        : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-[#800000]'
                    } focus:outline-none focus:ring-2 focus:ring-[#800000]/20`}
                    placeholder="Enter video description"
                  />
                </div>

                {/* New: Video upload input with preview and current video */}
                <div>
                  <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Video File
                  </label>
                  {formData.video_url && !editVideoFile && (
                    <div className="mb-2">
                      <video
                        src={formData.video_url}
                        controls
                        className="w-full h-32 object-cover rounded-lg border border-gray-200"
                      />
                    </div>
                  )}
                  {editVideoFile && (
                    <div className="mb-2">
                      <video
                        src={URL.createObjectURL(editVideoFile)}
                        controls
                        className="w-full h-32 object-cover rounded-lg border border-gray-200"
                      />
                    </div>
                  )}
                  <input
                    type="file"
                    accept="video/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0] || null;
                      setEditVideoFile(file);
                    }}
                    className={`w-full px-3 py-2 rounded-lg border transition-colors ${
                      darkMode 
                        ? 'bg-gray-700 border-gray-600 text-white focus:border-[#800000]' 
                        : 'bg-white border-gray-300 text-gray-900 focus:border-[#800000]'
                    } focus:outline-none focus:ring-2 focus:ring-[#800000]/20`}
                  />
                  {editVideoFile && (
                    <button
                      type="button"
                      onClick={() => setEditVideoFile(null)}
                      className={`mt-1 px-2 py-1 text-xs rounded-lg border ${darkMode ? 'border-gray-600 text-gray-300 hover:bg-gray-700' : 'border-gray-300 text-gray-700 hover:bg-gray-50'}`}
                    >
                      Remove Selected Video
                    </button>
                  )}
                </div>
              </div>

              <div className="flex gap-3 mt-4">
                <button
                  onClick={() => {
                    setShowEditModal(false);
                    setSelectedVideo(null);
                    resetForm();
                    setEditVideoFile(null);
                  }}
                  className={`flex-1 px-4 py-2 rounded-lg border transition-colors font-medium ${
                    darkMode 
                      ? 'border-gray-600 text-gray-300 hover:bg-gray-700' 
                      : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  Cancel
                </button>
                <button
                  onClick={handleEditVideo}
                  disabled={isUploading}
                  className={`flex-1 px-4 py-2 rounded-lg transition-colors font-medium text-white ${isUploading ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'} `}
                >
                  {isUploading ? 'Uploading...' : 'Update Video'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AnxietyVideos; 