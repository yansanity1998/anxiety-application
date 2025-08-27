import { useEffect, useState } from 'react';
import { FaVideo, FaArrowLeft, FaClock, FaCheck, FaPlay, FaExternalLinkAlt, FaSearch } from 'react-icons/fa';
import { anxietyVideoService } from '../../lib/anxietyVideoService';
import type { AnxietyVideo } from '../../lib/anxietyVideoService';
import { useNavigate } from 'react-router-dom';

const AnxietyVideos = () => {
  const [videos, setVideos] = useState<AnxietyVideo[]>([]);
  const [loading, setLoading] = useState(true);
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
        setVideos([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);



  const handleStart = async (video: AnxietyVideo) => {
    const updated = await anxietyVideoService.updateVideoStatus(video.id, 'in_progress');
    setVideos(prev => prev.map(v => v.id === video.id ? updated : v));
  };

  const handleComplete = async (video: AnxietyVideo) => {
    const updated = await anxietyVideoService.updateVideoStatus(video.id, 'completed');
    setVideos(prev => prev.map(v => v.id === video.id ? updated : v));
  };

  const filteredVideos = videos.filter(v => {
    if (filterStatus !== 'all' && v.video_status !== filterStatus) return false;
    if (searchTerm) {
      const s = searchTerm.toLowerCase();
      return v.video_title.toLowerCase().includes(s) || v.video_description.toLowerCase().includes(s);
    }
    return true;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#800000]/5 to-[#800000]/10 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-[#800000] mx-auto mb-4"></div>
          <p className="text-[#800000] font-medium">Loading your anxiety videos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#800000]/5 to-[#800000]/10">
      {/* Header with Back Arrow */}
      <div className="bg-white/90 backdrop-blur-md border-b border-gray-200 sticky top-0 z-20 shadow-sm">
        <div className="px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/dashboard')}
                className="p-2 rounded-full bg-[#800000]/10 hover:bg-[#800000]/20 text-[#800000] transition-all duration-200 hover:scale-105 active:scale-95"
                title="Back to Dashboard"
              >
                <FaArrowLeft className="text-lg" />
              </button>
              <div className="flex items-center">
                <FaVideo className="mr-3 text-2xl text-[#800000]" />
                <div>
                  <h1 className="text-xl font-bold text-[#800000]">Anxiety Videos</h1>
                  <p className="text-sm text-gray-600">Guided support content</p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`p-2 rounded-lg transition-all duration-200 ${
                  showFilters 
                    ? 'bg-[#800000] text-white' 
                    : 'bg-[#800000]/10 text-[#800000] hover:bg-[#800000]/20'
                }`}
              >
                <FaSearch className="text-sm" />
              </button>
            </div>
          </div>
        </div>

        {/* Filters Section */}
        {showFilters && (
          <div className="px-4 pb-4 border-t border-gray-100 bg-white/50">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Search Videos</label>
                <div className="relative">
                  <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search by title or description..."
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#800000]/20 focus:border-[#800000] transition-all duration-200"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Filter by Status</label>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#800000]/20 focus:border-[#800000] transition-all duration-200"
                >
                  <option value="all">All Videos ({videos.length})</option>
                  <option value="in_progress">In Progress ({videos.filter(v => v.video_status === 'in_progress').length})</option>
                  <option value="completed">Completed ({videos.filter(v => v.video_status === 'completed').length})</option>
                </select>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="px-4 py-6">
        {filteredVideos.length === 0 ? (
          <div className="text-center py-16">
            <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 max-w-md mx-auto">
              <FaVideo className="text-6xl mx-auto mb-4 text-gray-300" />
              <h3 className="text-xl font-semibold text-gray-600 mb-2">No Videos Found</h3>
              <p className="text-gray-500">{filterStatus === 'all' ? "You don't have any anxiety videos assigned yet. Check back later!" : `No ${filterStatus.replace('_', ' ')} videos found.`}</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredVideos.map((video) => (
              <div key={video.id} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 overflow-hidden hover:shadow-lg transition-all duration-300">
                <div className="mb-2">
                  <span className="text-xs font-medium text-gray-500">Title:</span>
                  <h3 className="font-bold text-base text-gray-900 line-clamp-2">{video.video_title}</h3>
                </div>
                <div className="mb-3">
                  <span className="text-xs font-medium text-gray-500">Description:</span>
                  <p className="text-gray-600 text-sm line-clamp-3">{video.video_description}</p>
                </div>
                <div className="text-xs text-gray-500 flex items-center gap-3 mb-3">
                  {typeof video.video_duration === 'number' && (
                    <span className="inline-flex items-center gap-1"><FaClock /> {Math.floor(video.video_duration / 60)}m {video.video_duration % 60}s</span>
                  )}
                  <span className="capitalize inline-flex items-center gap-1">
                    {video.video_status === 'completed' ? <FaCheck className="text-green-500" /> : video.video_status === 'in_progress' ? <FaPlay className="text-blue-500" /> : null}
                    {video.video_status.replace('_', ' ')}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {video.video_status !== 'in_progress' && (
                    <button onClick={() => handleStart(video)} className="flex-1 px-3 py-2 text-xs bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-lg font-medium">
                      <FaPlay className="inline mr-1" /> Start
                    </button>
                  )}
                  {video.video_status !== 'completed' && (
                    <button onClick={() => handleComplete(video)} className="flex-1 px-3 py-2 text-xs bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white rounded-lg font-medium">
                      <FaCheck className="inline mr-1" /> Complete
                    </button>
                  )}
                  <a href={video.video_url} target="_blank" rel="noreferrer" className="ml-auto text-sm text-blue-600 hover:underline inline-flex items-center gap-1">
                    Open <FaExternalLinkAlt />
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AnxietyVideos; 