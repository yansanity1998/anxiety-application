import { useEffect, useState } from 'react';
import { FaVideo, FaPlus, FaEdit, FaTrash, FaCheck, FaPlay, FaFilter, FaSearch, FaLink, FaClock } from 'react-icons/fa';
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
  const [showFilters, setShowFilters] = useState(false);


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
      Swal.fire({ icon: 'error', title: 'Error', text: 'Failed to load videos and users' });
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

  const handleAddVideo = async () => {
    if (!formData.profile_id || !formData.video_title || !formData.video_description || !formData.video_url) {
      Swal.fire({ icon: 'warning', title: 'Missing Information', text: 'Please fill in all required fields' });
      return;
    }
    try {
      const newVideo = await anxietyVideoService.createVideo(formData);
      setVideos(prev => [newVideo, ...prev]);
      setShowAddModal(false);
      resetForm();
      Swal.fire({ icon: 'success', title: 'Success', text: 'Anxiety video created successfully', timer: 2000, showConfirmButton: false });
    } catch (error) {
      console.error('Error creating video:', error);
      Swal.fire({ icon: 'error', title: 'Error', text: 'Failed to create anxiety video' });
    }
  };

  const handleEditVideo = async () => {
    if (!selectedVideo || !formData.video_title || !formData.video_description || !formData.video_url) {
      Swal.fire({ icon: 'warning', title: 'Missing Information', text: 'Please fill in all required fields' });
      return;
    }
    try {
      const updatedVideo = await anxietyVideoService.updateVideo({ id: selectedVideo.id, ...formData });
      setVideos(prev => prev.map(v => v.id === selectedVideo.id ? updatedVideo : v));
      setShowEditModal(false);
      setSelectedVideo(null);
      resetForm();
      Swal.fire({ icon: 'success', title: 'Success', text: 'Anxiety video updated successfully', timer: 2000, showConfirmButton: false });
    } catch (error) {
      console.error('Error updating video:', error);
      Swal.fire({ icon: 'error', title: 'Error', text: 'Failed to update anxiety video' });
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
      confirmButtonColor: '#ef4444'
    });
    if (result.isConfirmed) {
      try {
        await anxietyVideoService.deleteVideo(video.id);
        setVideos(prev => prev.filter(v => v.id !== video.id));
        Swal.fire({ icon: 'success', title: 'Deleted', text: 'Anxiety video deleted successfully', timer: 2000, showConfirmButton: false });
      } catch (error) {
        console.error('Error deleting video:', error);
        Swal.fire({ icon: 'error', title: 'Error', text: 'Failed to delete anxiety video' });
      }
    }
  };

  const handleStatusChange = async (video: AnxietyVideo, newStatus: AnxietyVideo['video_status']) => {
    try {
      const updatedVideo = await anxietyVideoService.updateVideoStatus(video.id, newStatus);
      setVideos(prev => prev.map(v => v.id === video.id ? updatedVideo : v));
      Swal.fire({ icon: 'success', title: 'Status Updated', text: `Video status changed to ${newStatus.replace('_', ' ')}`, timer: 2000, showConfirmButton: false });
    } catch (error) {
      console.error('Error updating status:', error);
      Swal.fire({ icon: 'error', title: 'Error', text: 'Failed to update video status' });
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

  const stats = {
    total: videos.length,
    completed: videos.filter(v => v.video_status === 'completed').length,
    inProgress: videos.filter(v => v.video_status === 'in_progress').length
  };

  if (loading) {
    return (
      <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow p-6`}>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#800000] mx-auto mb-4"></div>
            <p className={`${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Loading anxiety videos...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow p-6`}>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <FaVideo className={`mr-3 text-2xl ${darkMode ? 'text-red-400' : 'text-red-500'}`} />
          <div>
            <h2 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Anxiety Videos</h2>
            <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Manage educational videos for students</p>
          </div>
        </div>
        <button onClick={() => setShowAddModal(true)} className={`flex items-center px-4 py-2 rounded-lg transition-all duration-200 transform hover:scale-105 active:scale-95 ${darkMode ? 'bg-red-600 hover:bg-red-700 text-white shadow-lg' : 'bg-red-900 hover:bg-red-700 text-white shadow-lg'}`}>
          <FaPlus className="mr-2" />
          Add Video
        </button>
      </div>

      {/* Progress Stats - modern style */}
      <div className="flex gap-6 mb-8">
        <div className={`${darkMode ? 'bg-gradient-to-br from-blue-600 to-blue-700' : 'bg-gradient-to-br from-blue-50 to-blue-100'} rounded-2xl p-4 flex items-center justify-center gap-3 border-0 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 flex-1`}>
          <div className={`p-2 rounded-full ${darkMode ? 'bg-blue-500/30' : 'bg-blue-200/50'}`}>
            <FaVideo className={`${darkMode ? 'text-blue-200' : 'text-blue-600'}`} />
          </div>
          <div className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-blue-900'}`}>{stats.total}</div>
          <div className={`text-sm font-semibold ${darkMode ? 'text-blue-200' : 'text-blue-700'}`}>Total Videos</div>
        </div>
        <div className={`${darkMode ? 'bg-gradient-to-br from-amber-600 to-orange-600' : 'bg-gradient-to-br from-amber-50 to-orange-100'} rounded-2xl p-4 flex items-center justify-center gap-3 border-0 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 flex-1`}>
          <div className={`p-2 rounded-full ${darkMode ? 'bg-amber-500/30' : 'bg-amber-200/50'}`}>
            <FaClock className={`${darkMode ? 'text-amber-200' : 'text-amber-600'}`} />
          </div>
          <div className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-amber-900'}`}>{stats.inProgress}</div>
          <div className={`text-sm font-semibold ${darkMode ? 'text-amber-200' : 'text-amber-700'}`}>In Progress</div>
        </div>
        <div className={`${darkMode ? 'bg-gradient-to-br from-green-600 to-emerald-600' : 'bg-gradient-to-br from-green-50 to-emerald-100'} rounded-2xl p-4 flex items-center justify-center gap-3 border-0 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 flex-1`}>
          <div className={`p-2 rounded-full ${darkMode ? 'bg-green-500/30' : 'bg-green-200/50'}`}>
            <FaCheck className={`${darkMode ? 'text-green-200' : 'text-green-600'}`} />
          </div>
          <div className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-green-900'}`}>{stats.completed}</div>
          <div className={`text-sm font-semibold ${darkMode ? 'text-green-200' : 'text-green-700'}`}>Completed</div>
        </div>
      </div>

      {/* Filters & Search - modern style */}
      <div className={`rounded-2xl p-3 mb-6 backdrop-blur-sm border ${darkMode ? 'bg-gray-800/50 border-gray-700/50' : 'bg-white/80 border-gray-200/50'} shadow-lg`}>
        <div className="flex items-center justify-between mb-0">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-xl ${darkMode ? 'bg-blue-600/20' : 'bg-blue-100'}`}>
              <FaFilter className={`text-lg ${darkMode ? 'text-blue-400' : 'text-blue-600'}`} />
            </div>
            <div>
              <h3 className={`font-bold text-lg ${darkMode ? 'text-white' : 'text-gray-800'}`}>Filters & Search</h3>
              <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Customize your video view</p>
            </div>
          </div>
          <button onClick={() => setShowFilters(!showFilters)} className={`p-3 rounded-xl transition-all duration-300 transform hover:scale-105 ${showFilters ? `${darkMode ? 'bg-gradient-to-r from-blue-600 to-blue-700' : 'bg-gradient-to-r from-blue-500 to-blue-600'} text-white shadow-lg` : `${darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'} ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}`}>
            <FaFilter className="text-sm" />
          </button>
        </div>

        {showFilters && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-2 mt-3">
            <div>
              <label className={`block text-xs font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                <FaSearch className="inline mr-1 text-xs" />
                Search
              </label>
              <div className="relative">
                <FaSearch className={`absolute left-4 top-1/2 transform -translate-y-1/2 ${darkMode ? 'text-gray-400' : 'text-gray-400'} text-sm`} />
                <input type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Search videos..." className={`w-full pl-12 pr-4 py-3 rounded-xl border-2 transition-all duration-300 ${darkMode ? 'bg-gray-700/50 border-gray-600 text-white placeholder-gray-400 focus:border-blue-400 focus:bg-gray-700' : 'bg-white border-gray-200 text-gray-900 placeholder-gray-500 focus:border-blue-500 focus:bg-blue-50/30'} focus:outline-none focus:ring-4 focus:ring-blue-500/10 hover:shadow-md`} />
              </div>
            </div>

            <div>
              <label className={`block text-xs font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Status</label>
              <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className={`w-full px-4 py-3 rounded-xl border-2 transition-all duration-300 ${darkMode ? 'bg-gray-700/50 border-gray-600 text-white focus:border-blue-400 focus:bg-gray-700' : 'bg-white border-gray-200 text-gray-900 focus:border-blue-500 focus:bg-blue-50/30'} focus:outline-none focus:ring-4 focus:ring-blue-500/10 hover:shadow-md`}>
                <option value="all">All Status ({stats.total})</option>
                <option value="in_progress">In Progress ({stats.inProgress})</option>
                <option value="completed">Completed ({stats.completed})</option>
              </select>
            </div>

            <div>
              <label className={`block text-xs font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>User</label>
              <select value={selectedUserId || ''} onChange={(e) => setSelectedUserId(e.target.value ? Number(e.target.value) : null)} className={`w-full px-4 py-3 rounded-xl border-2 transition-all duration-300 ${darkMode ? 'bg-gray-700/50 border-gray-600 text-white focus:border-blue-400 focus:bg-gray-700' : 'bg-white border-gray-200 text-gray-900 focus:border-blue-500 focus:bg-blue-50/30'} focus:outline-none focus:ring-4 focus:ring-blue-500/10 hover:shadow-md`}>
                <option value="">All Users ({users.length})</option>
                {users.map(user => (
                  <option key={user.id} value={user.id}>{user.full_name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className={`block text-xs font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Sort By</label>
              <select value={sortField} onChange={(e) => setSortField(e.target.value as typeof sortField)} className={`w-full pl-8 pr-3 py-2 text-sm rounded-lg border transition-colors ${darkMode ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-blue-500' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-blue-500'} focus:outline-none focus:ring-1 focus:ring-blue-500/20`}>
                <option value="created_at">Date Created</option>
                <option value="title">Title</option>
                <option value="status">Status</option>
                <option value="user">User</option>
              </select>
            </div>
          </div>
        )}

        <div className="flex justify-end mt-2">
          <div className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Showing {filteredAndSortedVideos.length} of {videos.length} videos</div>
        </div>
      </div>

      {/* Videos Grid - modern cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {filteredAndSortedVideos.map((video) => (
          <div key={video.id} className={`rounded-2xl border-0 p-6 transition-all duration-300 transform hover:scale-105 hover:shadow-2xl ${darkMode ? 'bg-gradient-to-br from-gray-800 to-gray-900 shadow-xl hover:from-gray-700 hover:to-gray-800' : 'bg-gradient-to-br from-white to-gray-50 shadow-lg hover:from-gray-50 hover:to-white'} backdrop-blur-sm`}>
            <div className="mb-6">
              <div className="mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <FaVideo className={`text-sm ${darkMode ? 'text-blue-400' : 'text-blue-500'}`} />
                  <span className={`text-xs font-semibold uppercase tracking-wide ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Title</span>
                </div>
                <h3 className={`font-bold text-lg line-clamp-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>{video.video_title}</h3>
              </div>
              <div className="mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <FaSearch className={`text-sm ${darkMode ? 'text-green-400' : 'text-green-500'}`} />
                  <span className={`text-xs font-semibold uppercase tracking-wide ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Description</span>
                </div>
                <p className={`text-sm line-clamp-3 leading-relaxed ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>{video.video_description}</p>
              </div>
              <div className="flex items-center justify-between text-xs mb-2">
                <a href={video.video_url} target="_blank" rel="noreferrer" className={`inline-flex items-center gap-1 ${darkMode ? 'text-blue-300' : 'text-blue-600'} hover:underline`}>
                  <FaLink /> Open video
                </a>
                {typeof video.video_duration === 'number' && (
                  <span className={`${darkMode ? 'text-gray-300' : 'text-gray-600'} inline-flex items-center gap-1`}>
                    <FaClock /> {Math.floor(video.video_duration / 60)}m {video.video_duration % 60}s
                  </span>
                )}
              </div>
              <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Assigned to: {getUserName(video.profile_id)}</p>
            </div>

            <div className="flex items-center justify-center mb-6">
              <span className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-bold border-2 transition-all duration-300 hover:scale-105 ${
                video.video_status === 'completed' 
                  ? 'text-green-700 bg-gradient-to-r from-green-100 to-green-200 border-green-300 shadow-green-200/50' 
                  : video.video_status === 'in_progress'
                  ? 'text-blue-700 bg-gradient-to-r from-blue-100 to-blue-200 border-blue-300 shadow-blue-200/50'
                  : 'text-gray-700 bg-gradient-to-r from-gray-100 to-gray-200 border-gray-300 shadow-gray-200/50'
              } shadow-lg`}>
                <span className="capitalize">{video.video_status.replace('_', ' ')}</span>
              </span>
            </div>

            <div className="flex gap-3 mb-4">
              <button onClick={() => openEditModal(video)} className="flex-1 flex items-center justify-center px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-300 transform hover:scale-105 active:scale-95 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-lg hover:shadow-xl hover:shadow-blue-500/25">
                <FaEdit className="mr-2" />
                Edit
              </button>
              <button onClick={() => handleDeleteVideo(video)} className="flex-1 flex items-center justify-center px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-300 transform hover:scale-105 active:scale-95 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white shadow-lg hover:shadow-xl hover:shadow-red-500/25">
                <FaTrash className="mr-2" />
                Delete
              </button>
            </div>

            <div className="flex gap-3">
              {video.video_status !== 'in_progress' && (
                <button onClick={() => handleStatusChange(video, 'in_progress')} className="flex-1 px-4 py-2.5 text-sm bg-gradient-to-r from-indigo-500 to-blue-600 hover:from-indigo-600 hover:to-blue-600 text-white rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 active:scale-95 shadow-lg hover:shadow-xl hover:shadow-indigo-500/25">
                  <FaPlay className="inline mr-2" />
                  In Progress
                </button>
              )}
              {video.video_status !== 'completed' && (
                <button onClick={() => handleStatusChange(video, 'completed')} className="flex-1 px-4 py-2.5 text-sm bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 active:scale-95 shadow-lg hover:shadow-xl hover:shadow-emerald-500/25">
                  <FaCheck className="inline mr-2" />
                  Mark Complete
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {filteredAndSortedVideos.length === 0 && (
        <div className={`text-center py-12 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
          <FaVideo className="text-4xl mx-auto mb-4 opacity-50" />
          <p>No anxiety videos found</p>
        </div>
      )}

      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg p-6 w-full max-w-md mx-4`}>
            <h3 className={`text-xl font-bold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>Add Anxiety Video</h3>
            <div className="space-y-4">
              <div>
                <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Assign to User *</label>
                <select value={formData.profile_id} onChange={(e) => setFormData(prev => ({ ...prev, profile_id: Number(e.target.value) }))} className={`w-full px-3 py-2 rounded-lg border ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`}>
                  <option value={0}>Select a user</option>
                  {users.map(user => (<option key={user.id} value={user.id}>{user.full_name}</option>))}
                </select>
              </div>
              <div>
                <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Video Title *</label>
                <input type="text" value={formData.video_title} onChange={(e) => setFormData(prev => ({ ...prev, video_title: e.target.value }))} className={`w-full px-3 py-2 rounded-lg border ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`} placeholder="Enter video title" />
              </div>
              <div>
                <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Description *</label>
                <textarea value={formData.video_description} onChange={(e) => setFormData(prev => ({ ...prev, video_description: e.target.value }))} rows={3} className={`w-full px-3 py-2 rounded-lg border ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`} placeholder="Enter video description" />
              </div>
              <div>
                <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Video URL *</label>
                <input type="url" value={formData.video_url} onChange={(e) => setFormData(prev => ({ ...prev, video_url: e.target.value }))} className={`w-full px-3 py-2 rounded-lg border ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`} placeholder="https://..." />
              </div>
              <div>
  <label
    className={`block text-sm font-medium mb-2 ${
      darkMode ? "text-gray-300" : "text-gray-700"
    }`}
  >
    Duration
  </label>

  <div className="flex gap-2">
    {/* Minutes Input */}
    <input
      type="number"
      placeholder="Minutes"
      value={
        formData.video_duration !== undefined
          ? Math.floor(formData.video_duration / 60) // extract minutes
          : ""
      }
      onChange={(e) =>
        setFormData((prev) => {
          const minutes = e.target.value ? Number(e.target.value) : 0;
          const seconds =
            prev.video_duration !== undefined ? prev.video_duration % 60 : 0;
          return {
            ...prev,
            video_duration: minutes * 60 + seconds, // store as total seconds
          };
        })
      }
      className={`w-1/2 px-3 py-2 rounded-lg border ${
        darkMode
          ? "bg-gray-700 border-gray-600 text-white"
          : "bg-white border-gray-300 text-gray-900"
      }`}
    />

    {/* Seconds Input */}
    <input
      type="number"
      placeholder="Seconds"
      min={0}
      max={59}
      value={
        formData.video_duration !== undefined
          ? formData.video_duration % 60 // extract seconds
          : ""
      }
      onChange={(e) =>
        setFormData((prev) => {
          const seconds = e.target.value ? Number(e.target.value) : 0;
          const minutes =
            prev.video_duration !== undefined
              ? Math.floor(prev.video_duration / 60)
              : 0;
          return {
            ...prev,
            video_duration: minutes * 60 + seconds, // store as total seconds
          };
        })
      }
      className={`w-1/2 px-3 py-2 rounded-lg border ${
        darkMode
          ? "bg-gray-700 border-gray-600 text-white"
          : "bg-white border-gray-300 text-gray-900"
      }`}
    />
  </div>
</div>

            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => { setShowAddModal(false); resetForm(); }} className={`flex-1 px-4 py-2 rounded-lg border ${darkMode ? 'border-gray-600 text-gray-300 hover:bg-gray-700' : 'border-gray-300 text-gray-700 hover:bg-gray-50'}`}>Cancel</button>
              <button onClick={handleAddVideo} className="flex-1 px-4 py-2 bg-red-900 hover:bg-red-700 text-white rounded-lg">Add Video</button>
            </div>
          </div>
        </div>
      )}

      {showEditModal && selectedVideo && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg p-6 w-full max-w-md mx-4`}>
            <h3 className={`text-xl font-bold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>Edit Anxiety Video</h3>
            <div className="space-y-4">
              <div>
                <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Assign to User *</label>
                <select value={formData.profile_id} onChange={(e) => setFormData(prev => ({ ...prev, profile_id: Number(e.target.value) }))} className={`w-full px-3 py-2 rounded-lg border ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`}>
                  {users.map(user => (<option key={user.id} value={user.id}>{user.full_name}</option>))}
                </select>
              </div>
              <div>
                <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Video Title *</label>
                <input type="text" value={formData.video_title} onChange={(e) => setFormData(prev => ({ ...prev, video_title: e.target.value }))} className={`w-full px-3 py-2 rounded-lg border ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`} />
              </div>
              <div>
                <label className={`block text.sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Description *</label>
                <textarea value={formData.video_description} onChange={(e) => setFormData(prev => ({ ...prev, video_description: e.target.value }))} rows={3} className={`w-full px-3 py-2 rounded-lg border ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`} />
              </div>
              <div>
                <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Video URL *</label>
                <input type="url" value={formData.video_url} onChange={(e) => setFormData(prev => ({ ...prev, video_url: e.target.value }))} className={`w-full px-3 py-2 rounded-lg border ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`} />
              </div>
              <div>
  <label
    className={`block text-sm font-medium mb-2 ${
      darkMode ? "text-gray-300" : "text-gray-700"
    }`}
  >
    Duration
  </label>

  <div className="flex gap-2">
    {/* Minutes Input */}
    <input
      type="number"
      placeholder="Minutes"
      value={
        formData.video_duration !== undefined
          ? Math.floor(formData.video_duration / 60) // extract minutes
          : ""
      }
      onChange={(e) =>
        setFormData((prev) => {
          const minutes = e.target.value ? Number(e.target.value) : 0;
          const seconds =
            prev.video_duration !== undefined ? prev.video_duration % 60 : 0;
          return {
            ...prev,
            video_duration: minutes * 60 + seconds, // store as total seconds
          };
        })
      }
      className={`w-1/2 px-3 py-2 rounded-lg border ${
        darkMode
          ? "bg-gray-700 border-gray-600 text-white"
          : "bg-white border-gray-300 text-gray-900"
      }`}
    />

    {/* Seconds Input */}
    <input
      type="number"
      placeholder="Seconds"
      min={0}
      max={59}
      value={
        formData.video_duration !== undefined
          ? formData.video_duration % 60 // extract seconds
          : ""
      }
      onChange={(e) =>
        setFormData((prev) => {
          const seconds = e.target.value ? Number(e.target.value) : 0;
          const minutes =
            prev.video_duration !== undefined
              ? Math.floor(prev.video_duration / 60)
              : 0;
          return {
            ...prev,
            video_duration: minutes * 60 + seconds, // store as total seconds
          };
        })
      }
      className={`w-1/2 px-3 py-2 rounded-lg border ${
        darkMode
          ? "bg-gray-700 border-gray-600 text-white"
          : "bg-white border-gray-300 text-gray-900"
      }`}
    />
  </div>
</div>

            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => { setShowEditModal(false); setSelectedVideo(null); resetForm(); }} className={`flex-1 px-4 py-2 rounded-lg border ${darkMode ? 'border-gray-600 text-gray-300 hover:bg-gray-700' : 'border-gray-300 text-gray-700 hover:bg-gray-50'}`}>Cancel</button>
              <button onClick={handleEditVideo} className="flex-1 px-4 py-2 bg-red-900 hover:bg-red-700 text-white rounded-lg">Update Video</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AnxietyVideos; 