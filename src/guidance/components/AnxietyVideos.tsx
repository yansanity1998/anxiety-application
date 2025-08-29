import { useEffect, useState } from 'react';
import { FaVideo, FaPlus, FaEdit, FaTrash, FaCheck, FaPlay, FaSearch, FaLink, FaClock, FaTimes, FaSpinner, FaTrophy } from 'react-icons/fa';
import Swal from 'sweetalert2';
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

  useEffect(() => {
    fetchData();
  }, []);

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
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Failed to load videos and users',
        confirmButtonColor: '#800000'
      });
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
      Swal.fire({
        icon: 'warning',
        title: 'Missing Information',
        text: 'Please fill in all required fields',
        confirmButtonColor: '#800000'
      });
      return;
    }
    if (!newVideoFile) {
      Swal.fire({
        icon: 'warning',
        title: 'No Video Selected',
        text: 'Please choose a video file to upload',
        confirmButtonColor: '#800000'
      });
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
      Swal.fire({
        icon: 'success',
        title: 'Success!',
        text: 'Anxiety video uploaded successfully',
        timer: 2000,
        showConfirmButton: false
      });
    } catch (error: any) {
      console.error('Error creating video:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error?.message || 'Failed to upload anxiety video',
        confirmButtonColor: '#800000'
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleEditVideo = async () => {
    if (!selectedVideo || !formData.video_title || !formData.video_description) {
      Swal.fire({
        icon: 'warning',
        title: 'Missing Information',
        text: 'Please fill in all required fields',
        confirmButtonColor: '#800000'
      });
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
      Swal.fire({
        icon: 'success',
        title: 'Success!',
        text: 'Anxiety video updated successfully',
        timer: 2000,
        showConfirmButton: false
      });
    } catch (error: any) {
      console.error('Error updating video:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error?.message || 'Failed to update anxiety video',
        confirmButtonColor: '#800000'
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteVideo = async (video: AnxietyVideo) => {
    const result = await Swal.fire({
      icon: 'warning',
      title: 'Delete Video',
      text: `Are you sure you want to delete "${video.video_title}"?`,
      showCancelButton: true,
      confirmButtonText: 'Delete',
      cancelButtonText: 'Cancel',
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#6b7280'
    });
    if (result.isConfirmed) {
      try {
        await anxietyVideoService.deleteVideo(video.id);
        setVideos(prev => prev.filter(v => v.id !== video.id));
        Swal.fire({
          icon: 'success',
          title: 'Deleted!',
          text: 'Anxiety video deleted successfully',
          timer: 2000,
          showConfirmButton: false
        });
      } catch (error) {
        console.error('Error deleting video:', error);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Failed to delete anxiety video',
          confirmButtonColor: '#800000'
        });
      }
    }
  };

  const handleStatusChange = async (video: AnxietyVideo, newStatus: AnxietyVideo['video_status']) => {
    try {
      const updatedVideo = await anxietyVideoService.updateVideoStatus(video.id, newStatus);
      setVideos(prev => prev.map(v => v.id === video.id ? updatedVideo : v));
      Swal.fire({
        icon: 'success',
        title: 'Status Updated',
        text: `Video status changed to ${newStatus.replace('_', ' ')}`,
        timer: 2000,
        showConfirmButton: false
      });
    } catch (error) {
      console.error('Error updating status:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Failed to update video status',
        confirmButtonColor: '#800000'
      });
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
    <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-lg p-6`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
        <div className="flex items-center">
          <div className={`p-3 rounded-xl ${darkMode ? 'bg-orange-600/20' : 'bg-orange-100'} mr-4`}>
            <FaVideo className={`text-2xl ${darkMode ? 'text-orange-400' : 'text-orange-600'}`} />
          </div>
          <div>
            <h2 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              Anxiety Videos
            </h2>
            <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Manage educational anxiety videos for students
            </p>
          </div>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center px-4 py-2.5 bg-[#800000] hover:bg-[#b56576] text-white rounded-lg font-medium transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
        >
          <FaPlus className="mr-2" />
          Add Video
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className={`p-4 rounded-xl border-2 ${darkMode ? 'bg-gray-700/50 border-blue-500/20' : 'bg-blue-50 border-blue-200'} transition-all duration-200 hover:shadow-lg`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm font-medium ${darkMode ? 'text-blue-400' : 'text-blue-600'}`}>
                Total Videos
              </p>
              <p className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-blue-900'}`}>
                {stats.total}
              </p>
            </div>
            <FaVideo className={`text-2xl ${darkMode ? 'text-blue-400' : 'text-blue-500'}`} />
          </div>
        </div>
        
        <div className={`p-4 rounded-xl border-2 ${darkMode ? 'bg-gray-700/50 border-amber-500/20' : 'bg-amber-50 border-amber-200'} transition-all duration-200 hover:shadow-lg`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm font-medium ${darkMode ? 'text-amber-400' : 'text-amber-600'}`}>
                In Progress
              </p>
              <p className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-amber-600'}`}>
                {stats.inProgress}
              </p>
            </div>
            <FaClock className={`text-2xl ${darkMode ? 'text-amber-400' : 'text-amber-500'}`} />
          </div>
        </div>
        
        <div className={`p-4 rounded-xl border-2 ${darkMode ? 'bg-gray-700/50 border-green-500/20' : 'bg-green-50 border-green-200'} transition-all duration-200 hover:shadow-lg`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm font-medium ${darkMode ? 'text-green-400' : 'text-green-600'}`}>
                Completed
              </p>
              <p className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-green-700'}`}>
                {stats.completed}
              </p>
            </div>
            <FaTrophy className={`text-2xl ${darkMode ? 'text-green-400' : 'text-green-500'}`} />
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className={`mb-6 p-3 rounded-lg border ${darkMode ? 'bg-gray-700/30 border-gray-600' : 'bg-gray-50 border-gray-200'}`}>
        <div className="flex flex-col lg:flex-row gap-3">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <FaSearch className={`absolute left-3 top-1/2 transform -translate-y-1/2 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search videos, descriptions, or users..."
                className={`w-full pl-10 pr-4 py-2 rounded-lg border transition-colors ${
                  darkMode 
                    ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-[#800000]' 
                    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-[#800000]'
                } focus:outline-none focus:ring-2 focus:ring-[#800000]/20`}
              />
            </div>
          </div>

          {/* Status Filter */}
          <div className="lg:w-44">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className={`w-full px-3 py-2 rounded-lg border transition-colors ${
                darkMode 
                  ? 'bg-gray-700 border-gray-600 text-white focus:border-[#800000]' 
                  : 'bg-white border-gray-300 text-gray-900 focus:border-[#800000]'
              } focus:outline-none focus:ring-2 focus:ring-[#800000]/20`}
            >
              <option value="all">All Status ({stats.total})</option>
              <option value="in_progress">In Progress ({stats.inProgress})</option>
              <option value="completed">Completed ({stats.completed})</option>
            </select>
          </div>

          {/* User Filter */}
          <div className="lg:w-44">
            <select
              value={selectedUserId || ''}
              onChange={(e) => setSelectedUserId(e.target.value ? Number(e.target.value) : null)}
              className={`w-full px-3 py-2 rounded-lg border transition-colors ${
                darkMode 
                  ? 'bg-gray-700 border-gray-600 text-white focus:border-[#800000]' 
                  : 'bg-white border-gray-300 text-gray-900 focus:border-[#800000]'
              } focus:outline-none focus:ring-2 focus:ring-[#800000]/20`}
            >
              <option value="">All Users ({users.length})</option>
              {users.map(user => (
                <option key={user.id} value={user.id}>{user.full_name}</option>
              ))}
            </select>
          </div>

          {/* Sort */}
          <div className="lg:w-44">
            <select
              value={sortField}
              onChange={(e) => setSortField(e.target.value as typeof sortField)}
              className={`w-full px-3 py-2 rounded-lg border transition-colors ${
                darkMode 
                  ? 'bg-gray-700 border-gray-600 text-white focus:border-[#800000]' 
                  : 'bg-white border-gray-300 text-gray-900 focus:border-[#800000]'
              } focus:outline-none focus:ring-2 focus:ring-[#800000]/20`}
            >
              <option value="created_at">Sort by Date</option>
              <option value="title">Sort by Title</option>
              <option value="status">Sort by Status</option>
              <option value="user">Sort by User</option>
            </select>
          </div>
        </div>

        {/* Results count */}
        <div className="mt-2 text-right">
          <span className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Showing {filteredAndSortedVideos.length} of {videos.length} videos
          </span>
        </div>
      </div>

      {/* Videos Grid */}
      {filteredAndSortedVideos.length === 0 ? (
        <div className={`text-center py-12 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
          <FaVideo className="text-6xl mx-auto mb-4 opacity-30" />
          <h3 className="text-xl font-semibold mb-2">No videos found</h3>
          <p>Try adjusting your search or filters, or add a new video.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {filteredAndSortedVideos.map((video) => (
            <div
              key={video.id}
              className={`rounded-lg border p-4 transition-all duration-300 hover:shadow-lg transform hover:-translate-y-1 ${
                darkMode 
                  ? 'bg-gray-700/50 border-gray-600 hover:border-gray-500' 
                  : 'bg-white border-gray-200 hover:border-gray-300 hover:shadow-xl'
              }`}
            >
              {/* Video Icon Placeholder */}
              <div className={`mb-3 h-24 rounded-md flex items-center justify-center ${
                darkMode ? 'bg-gray-600/50' : 'bg-gray-100'
              }`}>
                <FaVideo className={`text-xl ${darkMode ? 'text-gray-400' : 'text-gray-400'} opacity-50`} />
              </div>

              {/* Video Content */}
              <div className="mb-3">
                <h3 className={`font-semibold text-sm mb-1 line-clamp-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  {video.video_title}
                </h3>
                <p className={`text-xs line-clamp-2 mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                  {video.video_description}
                </p>
                
                <div className="flex items-center justify-between mb-2">
                  <a
                    href={video.video_url}
                    target="_blank"
                    rel="noreferrer"
                    className={`inline-flex items-center gap-1 text-xs ${
                      darkMode ? 'text-blue-300 hover:text-blue-200' : 'text-blue-600 hover:text-blue-800'
                    } hover:underline`}
                  >
                    <FaLink className="text-xs" />
                    Watch
                  </a>
                  {typeof video.video_duration === 'number' && (
                    <span className={`text-xs ${darkMode ? 'text-gray-300' : 'text-gray-600'} inline-flex items-center gap-1`}>
                      <FaClock className="text-xs" />
                      {Math.floor(video.video_duration / 60)}m {video.video_duration % 60}s
                    </span>
                  )}
                </div>
                
                <div className="flex items-center justify-between mb-3">
                  <span className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    <span className="font-medium">{getUserName(video.profile_id)}</span>
                  </span>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(video.video_status)}`}>
                    {getStatusIcon(video.video_status)}
                    <span className="ml-1 capitalize">{video.video_status.replace('_', ' ')}</span>
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-1.5">
                <div className="flex gap-1.5">
                  <button
                    onClick={() => openEditModal(video)}
                    className="flex-1 flex items-center justify-center px-2 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-xs font-medium transition-colors"
                  >
                    <FaEdit className="mr-1" />
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeleteVideo(video)}
                    className="flex-1 flex items-center justify-center px-2 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-md text-xs font-medium transition-colors"
                  >
                    <FaTrash className="mr-1" />
                    Delete
                  </button>
                </div>
                
                {/* Status Change Buttons */}
                <div className="flex gap-1.5">
                  {video.video_status !== 'in_progress' && (
                    <button
                      onClick={() => handleStatusChange(video, 'in_progress')}
                      className="flex-1 px-2 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-md text-xs font-medium transition-colors"
                    >
                      <FaPlay className="inline mr-1" />
                      In Progress
                    </button>
                  )}
                  {video.video_status !== 'completed' && (
                    <button
                      onClick={() => handleStatusChange(video, 'completed')}
                      className="flex-1 px-2 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-md text-xs font-medium transition-colors"
                    >
                      <FaCheck className="inline mr-1" />
                      Complete
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Video Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
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
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
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