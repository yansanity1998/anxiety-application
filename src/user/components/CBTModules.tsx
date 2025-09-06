import { useState, useEffect } from 'react';
import { FaBrain, FaBookOpen, FaSearch, FaEye, FaPlay, FaCheck, FaCalendarAlt, FaArrowLeft, FaFilter, FaTimes, FaLeaf, FaHeart } from 'react-icons/fa';
import { cbtModuleService } from '../../lib/cbtModuleService';
import type { CBTModule } from '../../lib/cbtModuleService';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
// Removed SweetAlert2 - using modern alerts instead

interface CBTModulesProps {
  darkMode?: boolean;
}

const CBTModules = ({ }: CBTModulesProps) => {
  const [modules, setModules] = useState<CBTModule[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedModule, setSelectedModule] = useState<CBTModule | null>(null);
  const [showModuleDetail, setShowModuleDetail] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [showFilters, setShowFilters] = useState(false);
  
  const navigate = useNavigate();

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
      showAlert('error', 'Error', 'Failed to load your CBT modules');
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
      
      showAlert('success', 'Status Updated', statusMessages[newStatus] || 'Status updated successfully');
    } catch (error) {
      console.error('Error updating status:', error);
      showAlert('error', 'Error', 'Failed to update module status');
    }
  };

  const openModuleDetail = (module: CBTModule) => {
    setSelectedModule(module);
    setShowModuleDetail(true);
  };

  const openImageModal = (module: CBTModule) => {
    setSelectedModule(module);
    setShowImageModal(true);
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
      <div className="min-h-screen bg-[#800000]/20 flex items-center justify-center">
        <div className="text-center">
          <motion.div
            className="w-20 h-20 border-4 border-blue-200 border-t-blue-600 rounded-full mx-auto mb-6"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          />
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <h3 className="text-xl font-semibold text-gray-700 mb-2">Loading Your Modules</h3>
            <p className="text-gray-500">Preparing your anxiety management journey...</p>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#800000]/20">
      {/* Modern Header */}
      <motion.div 
        className="bg-white/95 backdrop-blur-xl border-b border-white/20 sticky top-0 z-20 shadow-lg shadow-blue-500/10"
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      >
        <div className="px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <motion.button
                onClick={() => navigate('/dashboard')}
                className="p-3 rounded-2xl bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/30 transition-all duration-300"
                whileHover={{ scale: 1.05, x: -2 }}
                whileTap={{ scale: 0.95 }}
              >
                <FaArrowLeft className="text-lg" />
              </motion.button>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-700 bg-clip-text text-transparent">
                  CBT Therapy
                </h1>
                <p className="text-gray-600 font-medium">Anxiety Management Modules</p>
              </div>
            </div>
            
            <motion.button
              onClick={() => setShowFilters(!showFilters)}
              className={`p-3 rounded-2xl transition-all duration-300 ${
                showFilters 
                  ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg' 
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
                  <label className="block text-sm font-semibold text-gray-700 mb-3">Search Modules</label>
                  <div className="relative">
                    <FaSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Search anxiety modules..."
                      className="w-full pl-12 pr-4 py-4 bg-white/80 backdrop-blur-sm border-0 rounded-2xl focus:ring-2 focus:ring-blue-500/30 focus:bg-white transition-all duration-300 text-gray-800 placeholder-gray-500"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">Filter by Status</label>
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="w-full px-4 py-4 bg-white/80 backdrop-blur-sm border-0 rounded-2xl focus:ring-2 focus:ring-blue-500/30 focus:bg-white transition-all duration-300 text-gray-800"
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
      <div className="px-4 py-6">
        {filteredModules.length === 0 ? (
          <motion.div 
            className="text-center py-20"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
          >
            <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-12 shadow-xl shadow-blue-500/10 max-w-md mx-auto border border-white/40">
              <div className="w-20 h-20 bg-gradient-to-r from-blue-400 to-indigo-500 rounded-3xl flex items-center justify-center mx-auto mb-6">
                <FaLeaf className="text-3xl text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-800 mb-3">No Modules Found</h3>
              <p className="text-gray-600 mb-6 leading-relaxed">
                {filterStatus === 'all' 
                  ? "Your anxiety management journey will begin soon. Check back later for new modules!" 
                  : `No ${filterStatus.replace('_', ' ')} modules found.`
                }
              </p>
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-2xl font-semibold hover:from-blue-600 hover:to-indigo-700 transition-all duration-300"
                >
                  Clear search
                </button>
              )}
            </div>
          </motion.div>
        ) : (
          <div className="space-y-6">
            {filteredModules.map((module, index) => (
              <motion.div
                key={module.id}
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                whileHover={{ y: -8, scale: 1.02 }}
                className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-xl shadow-blue-500/10 border border-white/40 overflow-hidden hover:shadow-2xl hover:shadow-blue-500/20 transition-all duration-500"
              >
                                 {/* Module Header with Title and Status */}
                <div className="p-6 pb-4 bg-gradient-to-r from-white/95 to-gray-50/95 backdrop-blur-sm border-b border-gray-100/50">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <h3 className="text-2xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent mb-3 leading-tight">
                        {module.module_title}
                      </h3>
                      <p className="text-gray-600 text-base leading-relaxed">
                        {module.module_description}
                      </p>
                    </div>
                    <div className="flex-shrink-0">
                      <span className={`inline-flex items-center px-4 py-2 rounded-2xl text-sm font-bold shadow-lg ${
                        module.module_status === 'completed' 
                          ? 'text-emerald-700 bg-gradient-to-r from-emerald-100 to-emerald-200 border border-emerald-300/50' 
                          : module.module_status === 'in_progress'
                          ? 'text-amber-700 bg-gradient-to-r from-amber-100 to-amber-200 border border-amber-300/50'
                          : 'text-slate-700 bg-gradient-to-r from-slate-100 to-slate-200 border border-slate-300/50'
                      }`}>
                        {getStatusIcon(module.module_status)}
                        <span className="ml-2 capitalize">{module.module_status.replace('_', ' ')}</span>
                      </span>
                    </div>
                  </div>
                </div>

                {/* Large Module Image */}
                <div className="relative h-64 overflow-hidden cursor-pointer" onClick={() => openImageModal(module)}>
                  {module.module_image ? (
                    <>
                      <img
                        src={module.module_image}
                        alt={module.module_title}
                        className="w-full h-full object-cover hover:scale-110 transition-transform duration-700"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                      {/* Subtle gradient overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent" />
                      
                      {/* View Image Indicator */}
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity duration-300 bg-black/20">
                        <div className="bg-white/90 backdrop-blur-sm rounded-2xl px-4 py-2 flex items-center gap-2 text-gray-700 font-semibold">
                          <FaEye />
                          <span>View Image</span>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="h-full bg-gradient-to-br from-blue-400 via-indigo-500 to-purple-600 flex flex-col items-center justify-center cursor-pointer group">
                      <FaBrain className="text-6xl text-white/80 mb-4 group-hover:scale-110 transition-transform duration-300" />
                      <div className="bg-white/20 backdrop-blur-sm rounded-2xl px-4 py-2 flex items-center gap-2 text-white font-semibold opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <FaEye />
                        <span>View Details</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Module Content */}
                <div className="p-6 pt-4">

                  {/* Progress Timeline */}
                  {(module.module_date_started || module.module_date_complete) && (
                    <div className="bg-gradient-to-r from-gray-50 to-white rounded-2xl p-4 mb-6 border border-gray-100/50">
                      <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                        <FaCalendarAlt className="text-blue-500" />
                        Progress Timeline
                      </h4>
                      <div className="space-y-2">
                        {module.module_date_started && (
                          <div className="flex items-center gap-3 text-sm text-gray-600">
                            <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0"></div>
                            <span>Started on {formatDate(module.module_date_started)}</span>
                          </div>
                        )}
                        {module.module_date_complete && (
                          <div className="flex items-center gap-3 text-sm text-gray-600">
                            <div className="w-2 h-2 bg-emerald-500 rounded-full flex-shrink-0"></div>
                            <span>Completed on {formatDate(module.module_date_complete)}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <motion.button
                      onClick={() => openModuleDetail(module)}
                      className="py-4 bg-gradient-to-r from-gray-100 to-gray-200 hover:from-gray-200 hover:to-gray-300 text-gray-700 rounded-2xl font-semibold transition-all duration-300 flex items-center justify-center gap-3 shadow-md hover:shadow-lg border border-gray-200/50"
                      whileHover={{ scale: 1.02, y: -2 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <FaEye className="text-lg" />
                      <span>View Details</span>
                    </motion.button>
                    
                    {module.module_status !== 'in_progress' && (
                      <motion.button
                        onClick={() => handleStatusChange(module, 'in_progress')}
                        className="py-4 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white rounded-2xl font-semibold transition-all duration-300 flex items-center justify-center gap-3 shadow-lg hover:shadow-xl"
                        whileHover={{ scale: 1.02, y: -2 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <FaPlay className="text-lg" />
                        <span>{module.module_status === 'completed' ? 'Restart Module' : 'Start Module'}</span>
                      </motion.button>
                    )}
                    
                    {module.module_status !== 'completed' && (
                      <motion.button
                        onClick={() => handleStatusChange(module, 'completed')}
                        className="py-4 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white rounded-2xl font-semibold transition-all duration-300 flex items-center justify-center gap-3 shadow-lg hover:shadow-xl"
                        whileHover={{ scale: 1.02, y: -2 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <FaCheck className="text-lg" />
                        <span>Mark Complete</span>
                      </motion.button>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Enhanced Module Detail Modal */}
      <AnimatePresence>
        {showModuleDetail && selectedModule && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-end sm:items-center justify-center z-50 p-4"
            onClick={() => setShowModuleDetail(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 100 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 100 }}
              className="bg-white rounded-t-3xl sm:rounded-3xl w-full sm:max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header with Large Image */}
              <div className="relative">
                {selectedModule.module_image ? (
                  <div className="h-80 overflow-hidden">
                    <img
                      src={selectedModule.module_image}
                      alt={selectedModule.module_title}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                  </div>
                ) : (
                  <div className="h-80 bg-gradient-to-br from-blue-400 via-indigo-500 to-purple-600 flex items-center justify-center">
                    <FaBrain className="text-8xl text-white/80" />
                  </div>
                )}
                
                {/* Close Button */}
                <button
                  onClick={() => setShowModuleDetail(false)}
                  className="absolute top-4 right-4 p-3 rounded-2xl bg-black/20 backdrop-blur-md text-white hover:bg-black/40 transition-all duration-200"
                >
                  <FaTimes className="text-xl" />
                </button>

                {/* Title Overlay */}
                <div className="absolute bottom-6 left-6 right-6">
                  <h2 className="text-3xl font-bold text-white mb-2 drop-shadow-lg">
                    {selectedModule.module_title}
                  </h2>
                  <span className={`inline-flex items-center px-4 py-2 rounded-2xl text-sm font-bold backdrop-blur-md ${
                    selectedModule.module_status === 'completed' 
                      ? 'text-emerald-700 bg-emerald-100/80' 
                      : selectedModule.module_status === 'in_progress'
                      ? 'text-amber-700 bg-amber-100/80'
                      : 'text-slate-700 bg-slate-100/80'
                  }`}>
                    {getStatusIcon(selectedModule.module_status)}
                    <span className="ml-2 capitalize">{selectedModule.module_status.replace('_', ' ')}</span>
                  </span>
                </div>
              </div>

              {/* Modal Content */}
              <div className="p-6">
                {/* Description */}
                <div className="mb-8">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    <FaHeart className="text-red-500" />
                    About This Module
                  </h3>
                  <p className="text-gray-600 text-lg leading-relaxed">
                    {selectedModule.module_description}
                  </p>
                </div>

                {/* Dates */}
                {(selectedModule.module_date_started || selectedModule.module_date_complete) && (
                  <div className="mb-8 p-6 bg-gray-50 rounded-2xl">
                    <h4 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                      <FaCalendarAlt className="text-blue-500" />
                      Progress Timeline
                    </h4>
                    <div className="space-y-3">
                      {selectedModule.module_date_started && (
                        <div className="flex items-center gap-3 text-gray-600">
                          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                          <span>Started on {formatDate(selectedModule.module_date_started)}</span>
                        </div>
                      )}
                      {selectedModule.module_date_complete && (
                        <div className="flex items-center gap-3 text-gray-600">
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          <span>Completed on {formatDate(selectedModule.module_date_complete)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={() => setShowModuleDetail(false)}
                    className="flex-1 py-4 border-2 border-gray-200 text-gray-700 rounded-2xl hover:bg-gray-50 transition-all duration-200 font-semibold"
                  >
                    Close
                  </button>
                  
                  <div className="flex gap-3 flex-1">
                    {selectedModule.module_status !== 'in_progress' && (
                      <button
                        onClick={() => {
                          handleStatusChange(selectedModule, 'in_progress');
                          setShowModuleDetail(false);
                        }}
                        className="flex-1 py-4 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white rounded-2xl font-semibold transition-all duration-200 shadow-lg"
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

      {/* Image-Only Modal */}
      <AnimatePresence>
        {showImageModal && selectedModule && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center z-50"
            onClick={() => setShowImageModal(false)}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="relative w-full h-full flex items-center justify-center p-4"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close Button */}
              <button
                onClick={() => setShowImageModal(false)}
                className="absolute top-8 right-8 z-10 p-4 rounded-full bg-black/40 backdrop-blur-md text-white hover:bg-black/60 transition-all duration-200"
              >
                <FaTimes className="text-2xl" />
              </button>

              {/* Full Screen Image */}
              {selectedModule.module_image ? (
                <img
                  src={selectedModule.module_image}
                  alt={selectedModule.module_title}
                  className="max-w-full max-h-full object-contain rounded-2xl"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
              ) : (
                <div className="w-96 h-96 bg-gradient-to-br from-blue-400 via-indigo-500 to-purple-600 rounded-3xl flex items-center justify-center">
                  <FaBrain className="text-8xl text-white/80" />
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CBTModules; 