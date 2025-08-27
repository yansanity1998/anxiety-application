import { useState, useEffect } from 'react';
import { FaBrain, FaPlus, FaEdit, FaTrash, FaCheck, FaPlay, FaFilter, FaSearch, FaTrophy, FaBookOpen, FaUsers, FaClock, FaChartLine, FaLayerGroup, FaSort } from 'react-icons/fa';
import { cbtModuleService } from '../../lib/cbtModuleService';
import type { CBTModule, CreateCBTModuleData } from '../../lib/cbtModuleService';
import { supabase } from '../../lib/supabase';
import Swal from 'sweetalert2';

interface CBTModulesProps {
  darkMode: boolean;
}

interface UserProfile {
  id: number;
  full_name: string;
  email: string;
  role: string;
}

const CBTModules = ({ darkMode }: CBTModulesProps) => {
  const [modules, setModules] = useState<CBTModule[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedModule, setSelectedModule] = useState<CBTModule | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [sortField, setSortField] = useState<'title' | 'status' | 'created_at' | 'user'>('created_at');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [showFilters, setShowFilters] = useState(false);

  // Form state
  const [formData, setFormData] = useState<CreateCBTModuleData>({
    profile_id: 0,
    module_title: '',
    module_description: '',
    module_image: '',
    module_status: 'in_progress'
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [modulesData, usersData] = await Promise.all([
        cbtModuleService.getAllModules(),
        fetchUsers()
      ]);
      setModules(modulesData);
      setUsers(usersData);
    } catch (error) {
      console.error('Error fetching data:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Failed to load CBT modules and users'
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

  const handleAddModule = async () => {
    if (!formData.profile_id || !formData.module_title || !formData.module_description) {
      Swal.fire({
        icon: 'warning',
        title: 'Missing Information',
        text: 'Please fill in all required fields'
      });
      return;
    }

    try {
      const newModule = await cbtModuleService.createModule(formData);
      setModules(prev => [newModule, ...prev]);
      setShowAddModal(false);
      resetForm();
      Swal.fire({
        icon: 'success',
        title: 'Success',
        text: 'CBT module created successfully',
        timer: 2000,
        showConfirmButton: false
      });
    } catch (error) {
      console.error('Error creating module:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Failed to create CBT module'
      });
    }
  };

  const handleEditModule = async () => {
    if (!selectedModule || !formData.module_title || !formData.module_description) {
      Swal.fire({
        icon: 'warning',
        title: 'Missing Information',
        text: 'Please fill in all required fields'
      });
      return;
    }

    try {
      const updatedModule = await cbtModuleService.updateModule({
        id: selectedModule.id,
        ...formData
      });
      setModules(prev => prev.map(m => m.id === selectedModule.id ? updatedModule : m));
      setShowEditModal(false);
      setSelectedModule(null);
      resetForm();
      Swal.fire({
        icon: 'success',
        title: 'Success',
        text: 'CBT module updated successfully',
        timer: 2000,
        showConfirmButton: false
      });
    } catch (error) {
      console.error('Error updating module:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Failed to update CBT module'
      });
    }
  };

  const handleDeleteModule = async (module: CBTModule) => {
    const result = await Swal.fire({
      icon: 'warning',
      title: 'Delete Module',
      text: `Are you sure you want to delete "${module.module_title}"?`,
      showCancelButton: true,
      confirmButtonText: 'Delete',
      cancelButtonText: 'Cancel',
      confirmButtonColor: '#ef4444'
    });

    if (result.isConfirmed) {
      try {
        await cbtModuleService.deleteModule(module.id);
        setModules(prev => prev.filter(m => m.id !== module.id));
        Swal.fire({
          icon: 'success',
          title: 'Deleted',
          text: 'CBT module deleted successfully',
          timer: 2000,
          showConfirmButton: false
        });
      } catch (error) {
        console.error('Error deleting module:', error);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Failed to delete CBT module'
        });
      }
    }
  };

  const handleStatusChange = async (module: CBTModule, newStatus: CBTModule['module_status']) => {
    try {
      const updatedModule = await cbtModuleService.updateModuleStatus(module.id, newStatus);
      setModules(prev => prev.map(m => m.id === module.id ? updatedModule : m));
      Swal.fire({
        icon: 'success',
        title: 'Status Updated',
        text: `Module status changed to ${newStatus.replace('_', ' ')}`,
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

  const openEditModal = (module: CBTModule) => {
    setSelectedModule(module);
    setFormData({
      profile_id: module.profile_id,
      module_title: module.module_title,
      module_description: module.module_description,
      module_image: module.module_image || '',
      module_status: module.module_status
    });
    setShowEditModal(true);
  };

  const resetForm = () => {
    setFormData({
      profile_id: 0,
      module_title: '',
      module_description: '',
      module_image: '',
      module_status: 'in_progress'
    });
  };



  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'in_progress': return <FaPlay />;
      case 'completed': return <FaCheck />;
      default: return <FaBookOpen />;
    }
  };

  // Sorting and filtering logic




  const filteredAndSortedModules = modules
    .filter(module => {
      // Status filter
      if (filterStatus !== 'all' && module.module_status !== filterStatus) return false;
      
      // User filter
      if (selectedUserId && module.profile_id !== selectedUserId) return false;
      
      // Search filter
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        const titleMatch = module.module_title.toLowerCase().includes(searchLower);
        const descMatch = module.module_description.toLowerCase().includes(searchLower);
        const userMatch = getUserName(module.profile_id).toLowerCase().includes(searchLower);
        return titleMatch || descMatch || userMatch;
      }
      
      return true;
    })
    .sort((a, b) => {
      let aValue: any, bValue: any;
      
      switch (sortField) {
        case 'title':
          aValue = a.module_title.toLowerCase();
          bValue = b.module_title.toLowerCase();
          break;
        case 'status':
          aValue = a.module_status;
          bValue = b.module_status;
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

  const getUserName = (profileId: number) => {
    const user = users.find(u => u.id === profileId);
    return user ? user.full_name : 'Unknown User';
  };

  const getProgressStats = () => {
    const total = modules.length;
    const completed = modules.filter(m => m.module_status === 'completed').length;
    const inProgress = modules.filter(m => m.module_status === 'in_progress').length;
    
    return { total, completed, inProgress };
  };

  const stats = getProgressStats();

  if (loading) {
    return (
      <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow p-6`}>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#800000] mx-auto mb-4"></div>
            <p className={`${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Loading CBT modules...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow p-6`}>
      {/* Enhanced Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <FaBrain className={`mr-3 text-2xl ${darkMode ? 'text-green-400' : 'text-green-500'}`} />
          <div>
            <h2 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>CBT Modules</h2>
            <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Manage learning modules for students</p>
          </div>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className={`flex items-center px-4 py-2 rounded-lg transition-all duration-200 transform hover:scale-105 active:scale-95 ${
            darkMode 
              ? 'bg-red-600 hover:bg-red-700 text-white shadow-lg' 
              : 'bg-red-900 hover:bg-red-700 text-white shadow-lg'
          }`}
        >
          <FaPlus className="mr-2" />
          Add Module
        </button>
      </div>

      {/* Enhanced Progress Stats with Icons - Single Line */}
      <div className="flex gap-6 mb-8">
        <div className={`${darkMode ? 'bg-gradient-to-br from-blue-600 to-blue-700' : 'bg-gradient-to-br from-blue-50 to-blue-100'} rounded-2xl p-4 flex items-center justify-center gap-3 border-0 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 flex-1`}>
          <div className={`p-2 rounded-full ${darkMode ? 'bg-blue-500/30' : 'bg-blue-200/50'}`}>
            <FaLayerGroup className={`text-lg ${darkMode ? 'text-blue-200' : 'text-blue-600'}`} />
          </div>
          <div className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-blue-900'}`}>{stats.total}</div>
          <div className={`text-sm font-semibold ${darkMode ? 'text-blue-200' : 'text-blue-700'}`}>Total Modules</div>
        </div>
        <div className={`${darkMode ? 'bg-gradient-to-br from-amber-600 to-orange-600' : 'bg-gradient-to-br from-amber-50 to-orange-100'} rounded-2xl p-4 flex items-center justify-center gap-3 border-0 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 flex-1`}>
          <div className={`p-2 rounded-full ${darkMode ? 'bg-amber-500/30' : 'bg-amber-200/50'}`}>
            <FaClock className={`text-lg ${darkMode ? 'text-amber-200' : 'text-amber-600'}`} />
          </div>
          <div className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-amber-900'}`}>{stats.inProgress}</div>
          <div className={`text-sm font-semibold ${darkMode ? 'text-amber-200' : 'text-amber-700'}`}>In Progress</div>
        </div>
        <div className={`${darkMode ? 'bg-gradient-to-br from-green-600 to-emerald-600' : 'bg-gradient-to-br from-green-50 to-emerald-100'} rounded-2xl p-4 flex items-center justify-center gap-3 border-0 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 flex-1`}>
          <div className={`p-2 rounded-full ${darkMode ? 'bg-green-500/30' : 'bg-green-200/50'}`}>
            <FaTrophy className={`text-lg ${darkMode ? 'text-green-200' : 'text-green-600'}`} />
          </div>
          <div className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-green-900'}`}>{stats.completed}</div>
          <div className={`text-sm font-semibold ${darkMode ? 'text-green-200' : 'text-green-700'}`}>Completed</div>
        </div>
      </div>

      {/* Modern Filters and Search */}
      <div className={`rounded-2xl p-3 mb-6 backdrop-blur-sm border ${
        darkMode ? 'bg-gray-800/50 border-gray-700/50' : 'bg-white/80 border-gray-200/50'
      } shadow-lg`}>
        <div className="flex items-center justify-between mb-0">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-xl ${darkMode ? 'bg-blue-600/20' : 'bg-blue-100'}`}>
              <FaFilter className={`text-lg ${darkMode ? 'text-blue-400' : 'text-blue-600'}`} />
            </div>
            <div>
              <h3 className={`font-bold text-lg ${darkMode ? 'text-white' : 'text-gray-800'}`}>Filters & Search</h3>
              <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Customize your module view</p>
            </div>
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`p-3 rounded-xl transition-all duration-300 transform hover:scale-105 ${
              showFilters 
                ? `${darkMode ? 'bg-gradient-to-r from-blue-600 to-blue-700' : 'bg-gradient-to-r from-blue-500 to-blue-600'} text-white shadow-lg` 
                : `${darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'} ${darkMode ? 'text-gray-300' : 'text-gray-600'}`
            }`}
          >
            <FaFilter className="text-sm" />
          </button>
        </div>
        
        {showFilters && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
            {/* Enhanced Search */}
            <div>
              <label className={`block text-xs font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                <FaSearch className="inline mr-1 text-xs" />
                Search
              </label>
              <div className="relative">
                <FaSearch className={`absolute left-4 top-1/2 transform -translate-y-1/2 ${darkMode ? 'text-gray-400' : 'text-gray-400'} text-sm`} />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search by title, description..."
                  className={`w-full pl-12 pr-4 py-3 rounded-xl border-2 transition-all duration-300 ${
                    darkMode 
                      ? 'bg-gray-700/50 border-gray-600 text-white placeholder-gray-400 focus:border-blue-400 focus:bg-gray-700' 
                      : 'bg-white border-gray-200 text-gray-900 placeholder-gray-500 focus:border-blue-500 focus:bg-blue-50/30'
                  } focus:outline-none focus:ring-4 focus:ring-blue-500/10 hover:shadow-md`}
                />
              </div>
            </div>

            {/* Enhanced Status Filter */}
            <div>
              <label className={`block text-xs font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                <FaChartLine className="inline mr-1 text-xs" />
                Status
              </label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className={`w-full px-4 py-3 rounded-xl border-2 transition-all duration-300 ${
                  darkMode 
                    ? 'bg-gray-700/50 border-gray-600 text-white focus:border-blue-400 focus:bg-gray-700' 
                    : 'bg-white border-gray-200 text-gray-900 focus:border-blue-500 focus:bg-blue-50/30'
                } focus:outline-none focus:ring-4 focus:ring-blue-500/10 hover:shadow-md cursor-pointer`}
              >
                <option value="all">🔍 All Status ({stats.total})</option>
                <option value="in_progress">⏳ In Progress ({stats.inProgress})</option>
                <option value="completed">✅ Completed ({stats.completed})</option>
              </select>
            </div>

            {/* Enhanced User Filter */}
            <div>
              <label className={`block text-sm font-semibold mb-2 ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                <FaUsers className="inline mr-2" />
                Filter by User
              </label>
              <select
                value={selectedUserId || ''}
                onChange={(e) => setSelectedUserId(e.target.value ? Number(e.target.value) : null)}
                className={`w-full px-4 py-3 rounded-xl border-2 transition-all duration-300 ${
                  darkMode 
                    ? 'bg-gray-700/50 border-gray-600 text-white focus:border-blue-400 focus:bg-gray-700' 
                    : 'bg-white border-gray-200 text-gray-900 focus:border-blue-500 focus:bg-blue-50/30'
                } focus:outline-none focus:ring-4 focus:ring-blue-500/10 hover:shadow-md cursor-pointer`}
              >
                <option value="">👥 All Users ({users.length})</option>
                {users.map(user => (
                  <option key={user.id} value={user.id}>👤 {user.full_name}</option>
                ))}
              </select>
            </div>

            {/* Enhanced Sort */}
            <div>
              <label className={`block text-xs font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                <FaSort className="inline mr-1 text-xs" />
                Sort By
              </label>
              <select
                value={sortField}
                onChange={(e) => setSortField(e.target.value as typeof sortField)}
                className={`w-full pl-8 pr-3 py-2 text-sm rounded-lg border transition-colors ${
                  darkMode 
                    ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-blue-500' 
                    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-blue-500'
                } focus:outline-none focus:ring-1 focus:ring-blue-500/20`}
              >
                <option value="module_title">📚 Module Title</option>
                <option value="module_status">📊 Status</option>
                <option value="created_at">📅 Date Created</option>
                <option value="profile_id">👤 User</option>
              </select>
            </div>
          </div>
        )}

        {/* Results Count */}
        <div className="flex justify-end mt-2">
          <div className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            Showing {filteredAndSortedModules.length} of {modules.length} modules
          </div>
        </div>
      </div>

      {/* Modern Modules Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredAndSortedModules.map((module) => (
          <div
            key={module.id}
            className={`rounded-2xl border-0 p-6 transition-all duration-300 transform hover:scale-105 hover:shadow-2xl ${
              darkMode 
                ? 'bg-gradient-to-br from-gray-800 to-gray-900 shadow-xl hover:from-gray-700 hover:to-gray-800' 
                : 'bg-gradient-to-br from-white to-gray-50 shadow-lg hover:from-gray-50 hover:to-white'
            } backdrop-blur-sm`}
          >
            {/* Enhanced Module Image */}
            {module.module_image ? (
              <div className="mb-6 relative overflow-hidden rounded-xl">
                <img
                  src={module.module_image}
                  alt={module.module_title}
                  className="w-full h-40 object-cover transition-transform duration-300 hover:scale-110"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
              </div>
            ) : (
              <div className={`mb-6 h-40 rounded-xl flex items-center justify-center ${
                darkMode ? 'bg-gradient-to-br from-blue-600/20 to-purple-600/20' : 'bg-gradient-to-br from-blue-100 to-purple-100'
              }`}>
                <FaBrain className={`text-4xl ${darkMode ? 'text-blue-400' : 'text-blue-500'} opacity-50`} />
              </div>
            )}

            {/* Enhanced Module Content */}
            <div className="mb-6">
              <div className="mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <FaBookOpen className={`text-sm ${darkMode ? 'text-blue-400' : 'text-blue-500'}`} />
                  <span className={`text-xs font-semibold uppercase tracking-wide ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Module Title</span>
                </div>
                <h3 className={`font-bold text-lg line-clamp-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  {module.module_title}
                </h3>
              </div>
              <div className="mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <FaEdit className={`text-sm ${darkMode ? 'text-green-400' : 'text-green-500'}`} />
                  <span className={`text-xs font-semibold uppercase tracking-wide ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Description</span>
                </div>
                <p className={`text-sm line-clamp-3 leading-relaxed ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                  {module.module_description}
                </p>
              </div>
              <div className={`flex items-center gap-2 p-3 rounded-xl ${darkMode ? 'bg-gray-700/50' : 'bg-gray-100/50'}`}>
                <FaUsers className={`text-sm ${darkMode ? 'text-purple-400' : 'text-purple-500'}`} />
                <span className={`text-xs font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Assigned to: <span className="font-semibold">{getUserName(module.profile_id)}</span>
                </span>
              </div>
            </div>

            {/* Enhanced Status Badge */}
            <div className="flex items-center justify-center mb-6">
              <span className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-bold border-2 transition-all duration-300 hover:scale-105 ${
                module.module_status === 'completed' 
                  ? 'text-green-700 bg-gradient-to-r from-green-100 to-green-200 border-green-300 shadow-green-200/50' 
                  : module.module_status === 'in_progress'
                  ? 'text-blue-700 bg-gradient-to-r from-blue-100 to-blue-200 border-blue-300 shadow-blue-200/50'
                  : 'text-gray-700 bg-gradient-to-r from-gray-100 to-gray-200 border-gray-300 shadow-gray-200/50'
              } shadow-lg`}>
                <div className="mr-2 p-1 rounded-full bg-white/50">
                  {getStatusIcon(module.module_status)}
                </div>
                <span className="capitalize">{module.module_status.replace('_', ' ')}</span>
              </span>
            </div>

            {/* Modern Action Buttons */}
            <div className="flex gap-3 mb-4">
              <button
                onClick={() => openEditModal(module)}
                className="flex-1 flex items-center justify-center px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-300 transform hover:scale-105 active:scale-95 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-lg hover:shadow-xl hover:shadow-blue-500/25"
              >
                <FaEdit className="mr-2" />
                Edit
              </button>
              <button
                onClick={() => handleDeleteModule(module)}
                className="flex-1 flex items-center justify-center px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-300 transform hover:scale-105 active:scale-95 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white shadow-lg hover:shadow-xl hover:shadow-red-500/25"
              >
                <FaTrash className="mr-2" />
                Delete
              </button>
            </div>

            {/* Enhanced Status Change Buttons */}
            <div className="flex gap-3">
              {module.module_status !== 'in_progress' && (
                <button
                  onClick={() => handleStatusChange(module, 'in_progress')}
                  className="flex-1 px-4 py-2.5 text-sm bg-gradient-to-r from-indigo-500 to-blue-600 hover:from-indigo-600 hover:to-blue-600 text-white rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 active:scale-95 shadow-lg hover:shadow-xl hover:shadow-indigo-500/25"
                >
                  <FaPlay className="inline mr-2" />
                  In Progress
                </button>
              )}
              {module.module_status !== 'completed' && (
                <button
                  onClick={() => handleStatusChange(module, 'completed')}
                  className="flex-1 px-4 py-2.5 text-sm bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 active:scale-95 shadow-lg hover:shadow-xl hover:shadow-emerald-500/25"
                >
                  <FaCheck className="inline mr-2" />
                  Mark Complete
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {filteredAndSortedModules.length === 0 && (
        <div className={`text-center py-12 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
          <FaBrain className="text-4xl mx-auto mb-4 opacity-50" />
          <p>No CBT modules found</p>
        </div>
      )}

      {/* Add Module Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg p-6 w-full max-w-md mx-4`}>
            <h3 className={`text-xl font-bold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              Add CBT Module
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Assign to User *
                </label>
                <select
                  value={formData.profile_id}
                  onChange={(e) => setFormData(prev => ({ ...prev, profile_id: Number(e.target.value) }))}
                  className={`w-full px-3 py-2 rounded-lg border ${
                    darkMode 
                      ? 'bg-gray-700 border-gray-600 text-white' 
                      : 'bg-white border-gray-300 text-gray-900'
                  }`}
                >
                  <option value={0}>Select a user</option>
                  {users.map(user => (
                    <option key={user.id} value={user.id}>{user.full_name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Module Title *
                </label>
                <input
                  type="text"
                  value={formData.module_title}
                  onChange={(e) => setFormData(prev => ({ ...prev, module_title: e.target.value }))}
                  className={`w-full px-3 py-2 rounded-lg border ${
                    darkMode 
                      ? 'bg-gray-700 border-gray-600 text-white' 
                      : 'bg-white border-gray-300 text-gray-900'
                  }`}
                  placeholder="Enter module title"
                />
              </div>

              <div>
                <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Description *
                </label>
                <textarea
                  value={formData.module_description}
                  onChange={(e) => setFormData(prev => ({ ...prev, module_description: e.target.value }))}
                  rows={3}
                  className={`w-full px-3 py-2 rounded-lg border ${
                    darkMode 
                      ? 'bg-gray-700 border-gray-600 text-white' 
                      : 'bg-white border-gray-300 text-gray-900'
                  }`}
                  placeholder="Enter module description"
                />
              </div>

              <div>
                <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Image URL (Optional)
                </label>
                <input
                  type="url"
                  value={formData.module_image}
                  onChange={(e) => setFormData(prev => ({ ...prev, module_image: e.target.value }))}
                  className={`w-full px-3 py-2 rounded-lg border ${
                    darkMode 
                      ? 'bg-gray-700 border-gray-600 text-white' 
                      : 'bg-white border-gray-300 text-gray-900'
                  }`}
                  placeholder="https://example.com/image.jpg"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowAddModal(false);
                  resetForm();
                }}
                className={`flex-1 px-4 py-2 rounded-lg border transition-colors ${
                  darkMode 
                    ? 'border-gray-600 text-gray-300 hover:bg-gray-700' 
                    : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                Cancel
              </button>
              <button
                onClick={handleAddModule}
                className="flex-1 px-4 py-2 bg-red-900 hover:bg-red-700 text-white rounded-lg transition-colors"
              >
                Add Module
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Module Modal */}
      {showEditModal && selectedModule && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg p-6 w-full max-w-md mx-4`}>
            <h3 className={`text-xl font-bold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              Edit CBT Module
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Assign to User *
                </label>
                <select
                  value={formData.profile_id}
                  onChange={(e) => setFormData(prev => ({ ...prev, profile_id: Number(e.target.value) }))}
                  className={`w-full px-3 py-2 rounded-lg border ${
                    darkMode 
                      ? 'bg-gray-700 border-gray-600 text-white' 
                      : 'bg-white border-gray-300 text-gray-900'
                  }`}
                >
                  {users.map(user => (
                    <option key={user.id} value={user.id}>{user.full_name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Module Title *
                </label>
                <input
                  type="text"
                  value={formData.module_title}
                  onChange={(e) => setFormData(prev => ({ ...prev, module_title: e.target.value }))}
                  className={`w-full px-3 py-2 rounded-lg border ${
                    darkMode 
                      ? 'bg-gray-700 border-gray-600 text-white' 
                      : 'bg-white border-gray-300 text-gray-900'
                  }`}
                  placeholder="Enter module title"
                />
              </div>

              <div>
                <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Description *
                </label>
                <textarea
                  value={formData.module_description}
                  onChange={(e) => setFormData(prev => ({ ...prev, module_description: e.target.value }))}
                  rows={3}
                  className={`w-full px-3 py-2 rounded-lg border ${
                    darkMode 
                      ? 'bg-gray-700 border-gray-600 text-white' 
                      : 'bg-white border-gray-300 text-gray-900'
                  }`}
                  placeholder="Enter module description"
                />
              </div>

              <div>
                <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Image URL (Optional)
                </label>
                <input
                  type="url"
                  value={formData.module_image}
                  onChange={(e) => setFormData(prev => ({ ...prev, module_image: e.target.value }))}
                  className={`w-full px-3 py-2 rounded-lg border ${
                    darkMode 
                      ? 'bg-gray-700 border-gray-600 text-white' 
                      : 'bg-white border-gray-300 text-gray-900'
                  }`}
                  placeholder="https://example.com/image.jpg"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setSelectedModule(null);
                  resetForm();
                }}
                className={`flex-1 px-4 py-2 rounded-lg border transition-colors ${
                  darkMode 
                    ? 'border-gray-600 text-gray-300 hover:bg-gray-700' 
                    : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                Cancel
              </button>
              <button
                onClick={handleEditModule}
                className="flex-1 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
              >
                Update Module
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CBTModules; 