import { useState, useEffect } from 'react';
import { FaBrain, FaBookOpen, FaSearch, FaEye, FaPlay, FaCheck, FaCalendarAlt, FaTrophy, FaArrowLeft, FaFilter, FaTimes } from 'react-icons/fa';
import { cbtModuleService } from '../../lib/cbtModuleService';
import type { CBTModule } from '../../lib/cbtModuleService';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';

interface CBTModulesProps {
  darkMode?: boolean;
}

const CBTModules = ({ }: CBTModulesProps) => {
  const [modules, setModules] = useState<CBTModule[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedModule, setSelectedModule] = useState<CBTModule | null>(null);
  const [showModuleDetail, setShowModuleDetail] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [showFilters, setShowFilters] = useState(false);
  
  const navigate = useNavigate();

  useEffect(() => {
    fetchModules();
  }, []);

  const fetchModules = async () => {
    setLoading(true);
    try {
      const userModules = await cbtModuleService.getCurrentUserModules();
      setModules(userModules);
    } catch (error) {
      console.error('Error fetching modules:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Failed to load your CBT modules'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (module: CBTModule, newStatus: CBTModule['module_status']) => {
    try {
      const updatedModule = await cbtModuleService.updateModuleStatus(module.id, newStatus);
      setModules(prev => prev.map(m => m.id === module.id ? updatedModule : m));
      
      const statusMessages: Record<string, string> = {
        'in_progress': 'Module started! Keep going! 🚀',
        'completed': 'Congratulations! Module completed! 🎉'
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
        text: 'Failed to update module status'
      });
    }
  };

  const openModuleDetail = (module: CBTModule) => {
    setSelectedModule(module);
    setShowModuleDetail(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'in_progress': return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'completed': return 'text-green-600 bg-green-50 border-green-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'in_progress': return <FaPlay />;
      case 'completed': return <FaCheck />;
      default: return <FaBookOpen />;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const filteredModules = modules.filter(module => {
    // Status filter
    if (filterStatus !== 'all' && module.module_status !== filterStatus) return false;
    
    // Search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      const titleMatch = module.module_title.toLowerCase().includes(searchLower);
      const descMatch = module.module_description.toLowerCase().includes(searchLower);
      return titleMatch || descMatch;
    }
    
    return true;
  });

  const getProgressStats = () => {
    const total = modules.length;
    const completed = modules.filter(m => m.module_status === 'completed').length;
    const inProgress = modules.filter(m => m.module_status === 'in_progress').length;
    
    return { total, completed, inProgress };
  };

  const stats = getProgressStats();

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#800000]/5 to-[#800000]/10 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-[#800000] mx-auto mb-4"></div>
          <p className="text-[#800000] font-medium">Loading your CBT modules...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#800000]/5 to-[#800000]/10">
      {/* Enhanced Header with Back Arrow */}
      <motion.div 
        className="bg-white/90 backdrop-blur-md border-b border-gray-200 sticky top-0 z-20 shadow-sm"
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <div className="px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <motion.button
                onClick={() => navigate('/dashboard')}
                className="p-2 rounded-full bg-[#800000]/10 hover:bg-[#800000]/20 text-[#800000] transition-all duration-200 hover:scale-105 active:scale-95"
                whileHover={{ x: -3 }}
                whileTap={{ scale: 0.95 }}
                title="Back to Dashboard"
              >
                <FaArrowLeft className="text-lg" />
              </motion.button>
              <div className="flex items-center">
                <FaBrain className="mr-3 text-2xl text-[#800000]" />
                <div>
                  <h1 className="text-xl font-bold text-[#800000]">CBT Modules</h1>
                  <p className="text-sm text-gray-600">Your learning journey</p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <motion.button
                onClick={() => setShowFilters(!showFilters)}
                className={`p-2 rounded-lg transition-all duration-200 ${
                  showFilters 
                    ? 'bg-[#800000] text-white' 
                    : 'bg-[#800000]/10 text-[#800000] hover:bg-[#800000]/20'
                }`}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <FaFilter className="text-sm" />
              </motion.button>
            </div>
          </div>
        </div>

        {/* Enhanced Filters Section */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="px-4 pb-4 border-t border-gray-100 bg-white/50"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Search Modules</label>
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
                    <option value="all">All Modules ({stats.total})</option>
                    <option value="in_progress">In Progress ({stats.inProgress})</option>
                    <option value="completed">Completed ({stats.completed})</option>
                  </select>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Main Content */}
      <motion.div 
        className="px-4 py-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >

        {/* Modules Grid */}
        {filteredModules.length === 0 ? (
          <motion.div 
            className="text-center py-16"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
          >
            <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 max-w-md mx-auto">
              <FaBrain className="text-6xl mx-auto mb-4 text-gray-300" />
              <h3 className="text-xl font-semibold text-gray-600 mb-2">No CBT Modules Found</h3>
              <p className="text-gray-500 mb-4">
                {filterStatus === 'all' 
                  ? "You don't have any CBT modules assigned yet. Check back later!" 
                  : `No ${filterStatus.replace('_', ' ')} modules found.`
                }
              </p>
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="text-[#800000] hover:underline text-sm"
                >
                  Clear search
                </button>
              )}
            </div>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredModules.map((module, index) => (
              <motion.div
                key={module.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
                whileHover={{ y: -5, boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)" }}
                className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-lg transition-all duration-300"
              >
                {/* Module Image */}
                {module.module_image ? (
                  <div className="h-32 overflow-hidden relative cursor-pointer" onClick={() => openModuleDetail(module)}>
                    <img
                      src={module.module_image}
                      alt={module.module_title}
                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  </div>
                ) : (
                  <div className="h-32 bg-gradient-to-br from-[#800000]/10 to-[#800000]/20 flex items-center justify-center cursor-pointer" onClick={() => openModuleDetail(module)}>
                    <FaBrain className="text-3xl text-[#800000]/40" />
                  </div>
                )}

                {/* Enhanced Module Content */}
                <div className="p-4">
                  <div className="mb-3">
                    <div className="flex items-center gap-2 mb-1">
                      <FaBookOpen className="text-sm text-blue-500" />
                      <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">Module Title</span>
                    </div>
                    <h3 className="font-bold text-base text-gray-900 line-clamp-2">
                      {module.module_title}
                    </h3>
                  </div>
                  
                  <div className="mb-3">
                    <div className="flex items-center gap-2 mb-1">
                      <FaSearch className="text-sm text-green-500" />
                      <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">Description</span>
                    </div>
                    <p className="text-gray-600 text-sm line-clamp-2 leading-relaxed">
                      {module.module_description}
                    </p>
                  </div>

                  {/* Enhanced Status Badge */}
                  <div className="flex items-center justify-center mb-3">
                    <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-bold border-2 transition-all duration-300 hover:scale-105 ${
                      module.module_status === 'completed' 
                        ? 'text-green-700 bg-gradient-to-r from-green-100 to-green-200 border-green-300 shadow-green-200/50' 
                        : module.module_status === 'in_progress'
                        ? 'text-blue-700 bg-gradient-to-r from-blue-100 to-blue-200 border-blue-300 shadow-blue-200/50'
                        : 'text-gray-700 bg-gradient-to-r from-gray-100 to-gray-200 border-gray-300 shadow-gray-200/50'
                    } shadow-lg`}>
                      <div className="mr-1.5 p-0.5 rounded-full bg-white/50">
                        {getStatusIcon(module.module_status)}
                      </div>
                      <span className="capitalize">{module.module_status.replace('_', ' ')}</span>
                    </span>
                  </div>

                  {/* Enhanced Dates */}
                  <div className="space-y-1 mb-3 bg-gray-50 rounded-lg p-2">
                    {module.module_date_started && (
                      <div className="flex items-center text-xs text-gray-600">
                        <FaCalendarAlt className="mr-1.5 text-[#800000]" />
                        <span className="font-medium">Started:</span>
                        <span className="ml-1">{formatDate(module.module_date_started)}</span>
                      </div>
                    )}
                    {module.module_date_complete && (
                      <div className="flex items-center text-xs text-gray-600">
                        <FaTrophy className="mr-1.5 text-yellow-500" />
                        <span className="font-medium">Completed:</span>
                        <span className="ml-1">{formatDate(module.module_date_complete)}</span>
                      </div>
                    )}
                  </div>

                  {/* Icon-Only Action Buttons */}
                  <div className="flex items-center justify-center gap-3">
                    <button
                      onClick={() => openModuleDetail(module)}
                      className="p-2.5 bg-gradient-to-r from-[#800000] to-[#660000] hover:from-[#660000] hover:to-[#4d0000] text-white rounded-xl transition-all duration-300 transform hover:scale-110 active:scale-95 shadow-lg hover:shadow-xl hover:shadow-[#800000]/25"
                      title="View Details"
                    >
                      <FaEye className="text-sm" />
                    </button>
                    
                    {module.module_status !== 'in_progress' && (
                      <button
                        onClick={() => handleStatusChange(module, 'in_progress')}
                        className="p-2.5 bg-gradient-to-r from-indigo-500 to-blue-600 hover:from-indigo-600 hover:to-blue-600 text-white rounded-xl transition-all duration-300 transform hover:scale-110 active:scale-95 shadow-lg hover:shadow-xl hover:shadow-indigo-500/25"
                        title={module.module_status === 'completed' ? 'Restart Module' : 'Start Module'}
                      >
                        <FaPlay className="text-sm" />
                      </button>
                    )}
                    
                    {module.module_status !== 'completed' && (
                      <button
                        onClick={() => handleStatusChange(module, 'completed')}
                        className="p-2.5 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white rounded-xl transition-all duration-300 transform hover:scale-110 active:scale-95 shadow-lg hover:shadow-xl hover:shadow-emerald-500/25"
                        title="Mark Complete"
                      >
                        <FaCheck className="text-sm" />
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>

      {/* Enhanced Module Detail Modal */}
      <AnimatePresence>
        {showModuleDetail && selectedModule && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setShowModuleDetail(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-[#800000]/5 to-[#800000]/10">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <FaBrain className="mr-3 text-2xl text-[#800000]" />
                    <h2 className="text-xl font-bold text-gray-900">Module Details</h2>
                  </div>
                  <button
                    onClick={() => setShowModuleDetail(false)}
                    className="p-2 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-all duration-200"
                  >
                    <FaTimes className="text-xl" />
                  </button>
                </div>
              </div>

              {/* Modal Content */}
              <div className="p-6">
                {/* Module Image */}
                {selectedModule.module_image && (
                  <div className="mb-6">
                    <img
                      src={selectedModule.module_image}
                      alt={selectedModule.module_title}
                      className="w-full h-64 object-cover rounded-lg shadow-md"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  </div>
                )}

                {/* Module Info */}
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-2xl font-bold text-gray-900">{selectedModule.module_title}</h3>
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(selectedModule.module_status)}`}>
                      {getStatusIcon(selectedModule.module_status)}
                      <span className="ml-1 capitalize">{selectedModule.module_status.replace('_', ' ')}</span>
                    </span>
                  </div>
                  
                  <p className="text-gray-600 text-lg leading-relaxed mb-4">
                    {selectedModule.module_description}
                  </p>

                  {/* Dates */}
                  <div className="space-y-2 bg-gray-50 rounded-lg p-4">
                    {selectedModule.module_date_started && (
                      <div className="flex items-center text-sm text-gray-600">
                        <FaCalendarAlt className="mr-2 text-[#800000]" />
                        Started: {formatDate(selectedModule.module_date_started)}
                      </div>
                    )}
                    {selectedModule.module_date_complete && (
                      <div className="flex items-center text-sm text-gray-600">
                        <FaTrophy className="mr-2 text-yellow-500" />
                        Completed: {formatDate(selectedModule.module_date_complete)}
                      </div>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowModuleDetail(false)}
                    className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all duration-200 font-medium"
                  >
                    Close
                  </button>
                  
                  {/* Status Change Buttons */}
                  <div className="flex gap-2">
                    {selectedModule.module_status !== 'in_progress' && (
                      <button
                        onClick={() => {
                          handleStatusChange(selectedModule, 'in_progress');
                          setShowModuleDetail(false);
                        }}
                        className="px-4 py-3 text-sm bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-lg font-medium transition-all duration-200 transform hover:scale-105 active:scale-95"
                      >
                        {selectedModule.module_status === 'completed' ? 'Restart' : 'Start'}
                      </button>
                    )}
                    {selectedModule.module_status !== 'completed' && (
                      <button
                        onClick={() => {
                          handleStatusChange(selectedModule, 'completed');
                          setShowModuleDetail(false);
                        }}
                        className="px-4 py-3 text-sm bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white rounded-lg font-medium transition-all duration-200 transform hover:scale-105 active:scale-95"
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

export default CBTModules; 