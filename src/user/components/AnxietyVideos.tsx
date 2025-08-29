import { useEffect, useState } from 'react';
import { FaVideo, FaArrowLeft, FaClock, FaCheck, FaPlay, FaExternalLinkAlt, FaSearch, FaFilter, FaTimes, FaHeart, FaCalendarAlt, FaTrophy, FaEye } from 'react-icons/fa';
import { anxietyVideoService } from '../../lib/anxietyVideoService';
import type { AnxietyVideo } from '../../lib/anxietyVideoService';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Swal from 'sweetalert2';

const AnxietyVideos = () => {
  const [videos, setVideos] = useState<AnxietyVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedVideo, setSelectedVideo] = useState<AnxietyVideo | null>(null);
  const [showVideoDetail, setShowVideoDetail] = useState(false);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const data = await anxietyVideoService.getCurrentUserVideos();
        setVideos(data);
      } catch (e) {
        console.error('Error loading videos:', e);
        setVideos([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleStatusChange = async (video: AnxietyVideo, newStatus: AnxietyVideo['video_status']) => {
    try {
      const updated = await anxietyVideoService.updateVideoStatus(video.id, newStatus);
      setVideos(prev => prev.map(v => v.id === video.id ? updated : v));
      
      const statusMessages: Record<string, string> = {
        'in_progress': 'Video started! Enjoy watching! 🎬',
        'completed': 'Congratulations! Video completed! 🎉'
      };
      
      Swal.fire({
        icon: 'success',
        title: 'Status Updated',
        text: statusMessages[newStatus] || 'Status updated successfully',
        timer: 2000,
        showConfirmButton: false
      });
    } catch (error) {
      console.error('Error updating status:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Failed to update video status'
      });
    }
  };

  const openVideoDetail = (video: AnxietyVideo) => {
    setSelectedVideo(video);
    setShowVideoDetail(true);
  };



  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'in_progress': return <FaPlay />;
      case 'completed': return <FaCheck />;
      default: return <FaVideo />;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatDuration = (duration?: number) => {
    if (!duration) return 'Unknown';
    const minutes = Math.floor(duration / 60);
    const seconds = duration % 60;
    return `${minutes}m ${seconds}s`;
  };

  const filteredVideos = videos.filter(video => {
    if (filterStatus !== 'all' && video.video_status !== filterStatus) return false;
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      const titleMatch = video.video_title.toLowerCase().includes(searchLower);
      const descMatch = video.video_description.toLowerCase().includes(searchLower);
      return titleMatch || descMatch;
    }
    return true;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-red-50 to-pink-100 flex items-center justify-center">
        <div className="text-center">
          <motion.div
            className="w-20 h-20 border-4 border-red-200 border-t-red-600 rounded-full mx-auto mb-6"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          />
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <h3 className="text-xl font-semibold text-gray-700 mb-2">Loading Your Videos</h3>
            <p className="text-gray-500">Preparing your anxiety support content...</p>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-red-50 to-pink-100">
      {/* Modern Header */}
      <motion.div 
        className="bg-white/95 backdrop-blur-xl border-b border-white/20 sticky top-0 z-20 shadow-lg shadow-red-500/10"
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      >
        <div className="px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <motion.button
                onClick={() => navigate('/dashboard')}
                className="p-3 rounded-2xl bg-gradient-to-r from-red-500 to-pink-600 text-white shadow-lg shadow-red-500/25 hover:shadow-xl hover:shadow-red-500/30 transition-all duration-300"
                whileHover={{ scale: 1.05, x: -2 }}
                whileTap={{ scale: 0.95 }}
              >
                <FaArrowLeft className="text-lg" />
              </motion.button>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-red-600 to-pink-700 bg-clip-text text-transparent">
                  Video Therapy
                </h1>
                <p className="text-gray-600 font-medium">Guided Anxiety Support</p>
              </div>
            </div>
            
            <motion.button
              onClick={() => setShowFilters(!showFilters)}
              className={`p-3 rounded-2xl transition-all duration-300 ${
                showFilters 
                  ? 'bg-gradient-to-r from-red-500 to-pink-600 text-white shadow-lg' 
                  : 'bg-white/80 text-gray-600 hover:bg-white shadow-md'
              }`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <FaFilter className="text-lg" />
            </motion.button>
          </div>
        </div>

        {/* Enhanced Filters Section */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="px-4 pb-6 border-t border-white/20 bg-white/30 backdrop-blur-sm"
            >
              <div className="grid grid-cols-1 gap-4 pt-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">Search Videos</label>
                  <div className="relative">
                    <FaSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Search anxiety videos..."
                      className="w-full pl-12 pr-4 py-4 bg-white/80 backdrop-blur-sm border-0 rounded-2xl focus:ring-2 focus:ring-red-500/30 focus:bg-white transition-all duration-300 text-gray-800 placeholder-gray-500"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">Filter by Status</label>
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="w-full px-4 py-4 bg-white/80 backdrop-blur-sm border-0 rounded-2xl focus:ring-2 focus:ring-red-500/30 focus:bg-white transition-all duration-300 text-gray-800"
                  >
                    <option value="all">All Videos ({videos.length})</option>
                    <option value="in_progress">In Progress ({videos.filter(v => v.video_status === 'in_progress').length})</option>
                    <option value="completed">Completed ({videos.filter(v => v.video_status === 'completed').length})</option>
                  </select>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Main Content */}
      <div className="px-4 py-6">
        {filteredVideos.length === 0 ? (
          <motion.div 
            className="text-center py-20"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
          >
            <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-12 shadow-xl shadow-red-500/10 max-w-md mx-auto border border-white/40">
              <div className="w-20 h-20 bg-gradient-to-r from-red-400 to-pink-500 rounded-3xl flex items-center justify-center mx-auto mb-6">
                <FaVideo className="text-3xl text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-800 mb-3">No Videos Found</h3>
              <p className="text-gray-600 mb-6 leading-relaxed">
                {filterStatus === 'all' 
                  ? "Your video therapy library will be available soon. Check back later for new content!" 
                  : `No ${filterStatus.replace('_', ' ')} videos found.`
                }
              </p>
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="px-6 py-3 bg-gradient-to-r from-red-500 to-pink-600 text-white rounded-2xl font-semibold hover:from-red-600 hover:to-pink-700 transition-all duration-300"
                >
                  Clear search
                </button>
              )}
            </div>
          </motion.div>
        ) : (
          <div className="space-y-6">
            {filteredVideos.map((video, index) => (
              <motion.div
                key={video.id}
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                whileHover={{ y: -8, scale: 1.02 }}
                className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-xl shadow-red-500/10 border border-white/40 overflow-hidden hover:shadow-2xl hover:shadow-red-500/20 transition-all duration-500"
              >
                {/* Large Video Thumbnail Placeholder */}
                <div className="relative h-64 overflow-hidden cursor-pointer" onClick={() => openVideoDetail(video)}>
                  <div className="h-full bg-gradient-to-br from-red-400 via-pink-500 to-purple-600 flex flex-col items-center justify-center">
                    {/* Video Play Icon */}
                    <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center mb-4 border-2 border-white/30">
                      <FaPlay className="text-white text-2xl ml-1" />
                    </div>
                    
                    {/* Video Title Overlay */}
                    <h3 className="text-2xl font-bold text-white text-center px-4 drop-shadow-lg">
                      {video.video_title}
                    </h3>
                    
                    {/* Duration Badge */}
                    {video.video_duration && (
                      <div className="absolute top-4 left-4">
                        <span className="inline-flex items-center px-3 py-1 rounded-2xl text-sm font-bold bg-black/40 backdrop-blur-md text-white border border-white/20">
                          <FaClock className="mr-2" />
                          {formatDuration(video.video_duration)}
                        </span>
                      </div>
                    )}
                    
                    {/* Status Badge */}
                    <div className="absolute top-4 right-4">
                      <span className={`inline-flex items-center px-4 py-2 rounded-2xl text-sm font-bold backdrop-blur-md border ${
                        video.video_status === 'completed' 
                          ? 'text-emerald-700 bg-emerald-100/80 border-emerald-300/50' 
                          : video.video_status === 'in_progress'
                          ? 'text-amber-700 bg-amber-100/80 border-amber-300/50'
                          : 'text-slate-700 bg-slate-100/80 border-slate-300/50'
                      }`}>
                        {getStatusIcon(video.video_status)}
                        <span className="ml-2 capitalize">{video.video_status.replace('_', ' ')}</span>
                      </span>
                    </div>
                  </div>
                </div>

                {/* Video Content - Minimized */}
                <div className="p-6">
                  {/* Description */}
                  <p className="text-gray-600 text-lg leading-relaxed mb-6 line-clamp-2">
                    {video.video_description}
                  </p>

                  {/* Dates - Compact */}
                  {(video.video_date_started || video.video_date_completed) && (
                    <div className="flex items-center gap-6 mb-6 text-sm text-gray-500">
                      {video.video_date_started && (
                        <div className="flex items-center gap-2">
                          <FaCalendarAlt className="text-red-500" />
                          <span>Started {formatDate(video.video_date_started)}</span>
                        </div>
                      )}
                      {video.video_date_completed && (
                        <div className="flex items-center gap-2">
                          <FaTrophy className="text-amber-500" />
                          <span>Completed {formatDate(video.video_date_completed)}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex gap-3">
                    <motion.button
                      onClick={() => openVideoDetail(video)}
                      className="flex-1 py-4 bg-gradient-to-r from-slate-100 to-slate-200 hover:from-slate-200 hover:to-slate-300 text-slate-700 rounded-2xl font-semibold transition-all duration-300 flex items-center justify-center gap-3"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <FaEye />
                      View Details
                    </motion.button>
                    
                    {video.video_status !== 'in_progress' && (
                      <motion.button
                        onClick={() => handleStatusChange(video, 'in_progress')}
                        className="flex-1 py-4 bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 text-white rounded-2xl font-semibold transition-all duration-300 flex items-center justify-center gap-3 shadow-lg"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <FaPlay />
                        {video.video_status === 'completed' ? 'Rewatch' : 'Start'}
                      </motion.button>
                    )}
                    
                    {video.video_status !== 'completed' && (
                      <motion.button
                        onClick={() => handleStatusChange(video, 'completed')}
                        className="flex-1 py-4 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white rounded-2xl font-semibold transition-all duration-300 flex items-center justify-center gap-3 shadow-lg"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <FaCheck />
                        Complete
                      </motion.button>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Enhanced Video Detail Modal */}
      <AnimatePresence>
        {showVideoDetail && selectedVideo && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-end sm:items-center justify-center z-50 p-4"
            onClick={() => setShowVideoDetail(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 100 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 100 }}
              className="bg-white rounded-t-3xl sm:rounded-3xl w-full sm:max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header with Large Video Placeholder */}
              <div className="relative">
                <div className="h-80 bg-gradient-to-br from-red-400 via-pink-500 to-purple-600 flex items-center justify-center">
                  <div className="text-center">
                    <div className="w-24 h-24 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center mb-6 border-2 border-white/30 mx-auto">
                      <FaPlay className="text-white text-3xl ml-1" />
                    </div>
                    {selectedVideo.video_duration && (
                      <span className="inline-flex items-center px-4 py-2 rounded-2xl text-lg font-bold bg-black/40 backdrop-blur-md text-white border border-white/20 mb-4">
                        <FaClock className="mr-2" />
                        {formatDuration(selectedVideo.video_duration)}
                      </span>
                    )}
                  </div>
                </div>
                
                {/* Close Button */}
                <button
                  onClick={() => setShowVideoDetail(false)}
                  className="absolute top-4 right-4 p-3 rounded-2xl bg-black/20 backdrop-blur-md text-white hover:bg-black/40 transition-all duration-200"
                >
                  <FaTimes className="text-xl" />
                </button>

                {/* Title Overlay */}
                <div className="absolute bottom-6 left-6 right-6">
                  <h2 className="text-3xl font-bold text-white mb-2 drop-shadow-lg">
                    {selectedVideo.video_title}
                  </h2>
                  <span className={`inline-flex items-center px-4 py-2 rounded-2xl text-sm font-bold backdrop-blur-md ${
                    selectedVideo.video_status === 'completed' 
                      ? 'text-emerald-700 bg-emerald-100/80' 
                      : selectedVideo.video_status === 'in_progress'
                      ? 'text-amber-700 bg-amber-100/80'
                      : 'text-slate-700 bg-slate-100/80'
                  }`}>
                    {getStatusIcon(selectedVideo.video_status)}
                    <span className="ml-2 capitalize">{selectedVideo.video_status.replace('_', ' ')}</span>
                  </span>
                </div>
              </div>

              {/* Modal Content */}
              <div className="p-6">
                {/* Description */}
                <div className="mb-8">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    <FaHeart className="text-red-500" />
                    About This Video
                  </h3>
                  <p className="text-gray-600 text-lg leading-relaxed">
                    {selectedVideo.video_description}
                  </p>
                </div>

                {/* Dates */}
                {(selectedVideo.video_date_started || selectedVideo.video_date_completed) && (
                  <div className="mb-8 p-6 bg-gray-50 rounded-2xl">
                    <h4 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                      <FaCalendarAlt className="text-red-500" />
                      Viewing History
                    </h4>
                    <div className="space-y-3">
                      {selectedVideo.video_date_started && (
                        <div className="flex items-center gap-3 text-gray-600">
                          <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                          <span>Started on {formatDate(selectedVideo.video_date_started)}</span>
                        </div>
                      )}
                      {selectedVideo.video_date_completed && (
                        <div className="flex items-center gap-3 text-gray-600">
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          <span>Completed on {formatDate(selectedVideo.video_date_completed)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={() => setShowVideoDetail(false)}
                    className="flex-1 py-4 border-2 border-gray-200 text-gray-700 rounded-2xl hover:bg-gray-50 transition-all duration-200 font-semibold"
                  >
                    Close
                  </button>
                  
                  <div className="flex gap-3 flex-1">
                    <a 
                      href={selectedVideo.video_url} 
                      target="_blank" 
                      rel="noreferrer"
                      className="flex-1 py-4 bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 text-white rounded-2xl font-semibold transition-all duration-200 shadow-lg flex items-center justify-center gap-3"
                    >
                      <FaExternalLinkAlt />
                      Watch Video
                    </a>
                    
                    {selectedVideo.video_status !== 'completed' && (
                      <button
                        onClick={() => {
                          handleStatusChange(selectedVideo, 'completed');
                          setShowVideoDetail(false);
                        }}
                        className="flex-1 py-4 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white rounded-2xl font-semibold transition-all duration-200 shadow-lg"
                      >
                        Complete
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AnxietyVideos; 