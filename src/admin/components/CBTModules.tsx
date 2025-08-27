import React, { useState, useEffect } from 'react';
import { FaBrain, FaPlus, FaEdit, FaTrash, FaCheck, FaPlay, FaSort, FaSortUp, FaSortDown, FaFilter, FaSearch, FaEye, FaTrophy, FaBookOpen, FaArrowLeft } from 'react-icons/fa';
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
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
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

  // Sorting and filtering logic
  const handleSort = (field: typeof sortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const getSortIcon = (field: typeof sortField) => {
    if (sortField !== field) return <FaSort className="text-gray-400" />;
    return sortDirection === 'asc' ? <FaSortUp className="text-blue-500" /> : <FaSortDown className="text-blue-500" />;
  };

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
      
      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
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

      {/* Progress Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className={`${darkMode ? 'bg-blue-700' : 'bg-blue-100'} rounded-xl p-4 text-center border ${darkMode ? 'border-blue-600' : 'border-blue-500'}`}>
          <div className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-blue-900'}`}>{stats.total}</div>
          <div className={`text-m ${darkMode ? 'text-blue-400' : 'font-bold text-blue-600'}`}>Total Modules</div>
        </div>
        <div className={`${darkMode ? 'bg-yellow-700' : 'bg-orange-100'} rounded-xl p-4 text-center border ${darkMode ? 'border-yellow-600' : 'border-yellow-500'}`}>
        <div className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-yellow-900'}`}>{stats.inProgress}</div>
          <div className={`text-m ${darkMode ? 'text-yellow-400' : 'font-bold text-yellow-600'}`}>In Progress</div>
        </div>
        <div className={`${darkMode ? 'bg-green-700' : 'bg-green-100'} rounded-xl p-4 text-center border ${darkMode ? 'border-green-600' : 'border-green-500'}`}>
        <div className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-green-900'}`}>{stats.completed}</div>
          <div className={`text-m ${darkMode ? 'text-green-400' : 'font-bold text-green-600'}`}>Completed</div>
        </div>
      </div>

      {/* Enhanced Filters and Search */}
      <div className={`rounded-xl p-4 mb-6 ${
        darkMode ? 'bg-gray-700/50' : 'bg-gray-50'
      }`}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <FaFilter className={`${darkMode ? 'text-gray-300' : 'text-gray-600'}`} />
            <h3 className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-800'}`}>Filters & Search</h3>
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`p-2 rounded-lg transition-all duration-200 ${
              showFilters 
                ? `${darkMode ? 'bg-blue-600' : 'bg-blue-500'} text-white` 
                : `${darkMode ? 'bg-gray-600' : 'bg-gray-200'} ${darkMode ? 'text-gray-300' : 'text-gray-600'}`
            }`}
          >
            <FaFilter className="text-sm" />
          </button>
        </div>
        
        {showFilters && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Search */}
            <div>
              <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Search
              </label>
              <div className="relative">
                <FaSearch className={`absolute left-3 top-1/2 transform -translate-y-1/2 ${darkMode ? 'text-gray-400' : 'text-gray-400'} text-sm`} />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search modules..."
                  className={`w-full pl-10 pr-4 py-2 rounded-lg border transition-colors ${
                    darkMode 
                      ? 'bg-gray-600 border-gray-500 text-white placeholder-gray-400 focus:border-blue-400' 
                      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-blue-500'
                  } focus:outline-none focus:ring-2 focus:ring-blue-500/20`}
                />
              </div>
            </div>

            {/* Status Filter */}
            <div>
              <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Status
              </label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className={`w-full px-3 py-2 rounded-lg border transition-colors ${
                  darkMode 
                    ? 'bg-gray-600 border-gray-500 text-white focus:border-blue-400' 
                    : 'bg-white border-gray-300 text-gray-900 focus:border-blue-500'
                } focus:outline-none focus:ring-2 focus:ring-blue-500/20`}
              >
                <option value="all">All Status</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
              </select>
            </div>

            {/* User Filter */}
            <div>
              <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                User
              </label>
              <select
                value={selectedUserId || ''}
                onChange={(e) => setSelectedUserId(e.target.value ? Number(e.target.value) : null)}
                className={`w-full px-3 py-2 rounded-lg border transition-colors ${
                  darkMode 
                    ? 'bg-gray-600 border-gray-500 text-white focus:border-blue-400' 
                    : 'bg-white border-gray-300 text-gray-900 focus:border-blue-500'
                } focus:outline-none focus:ring-2 focus:ring-blue-500/20`}
              >
                <option value="">All Users</option>
                {users.map(user => (
                  <option key={user.id} value={user.id}>{user.full_name}</option>
                ))}
              </select>
            </div>

            {/* Sort */}
            <div>
              <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Sort By
              </label>
              <select
                value={sortField}
                onChange={(e) => setSortField(e.target.value as typeof sortField)}
                className={`w-full px-3 py-2 rounded-lg border transition-colors ${
                  darkMode 
                    ? 'bg-gray-600 border-gray-500 text-white focus:border-blue-400' 
                    : 'bg-white border-gray-300 text-gray-900 focus:border-blue-500'
                } focus:outline-none focus:ring-2 focus:ring-blue-500/20`}
              >
                <option value="created_at">Date Created</option>
                <option value="title">Title</option>
                <option value="status">Status</option>
                <option value="user">User</option>
              </select>
            </div>
          </div>
        )}

        {/* Sort Direction Toggle */}
        <div className="flex items-center justify-between mt-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')}
              className={`flex items-center gap-2 px-3 py-1 rounded-lg transition-colors ${
                darkMode 
                  ? 'bg-gray-600 hover:bg-gray-500 text-white' 
                  : 'bg-white hover:bg-gray-50 text-gray-700 border border-gray-300'
              }`}
            >
              {getSortIcon(sortField)}
              <span className="text-sm">
                {sortDirection === 'asc' ? 'Ascending' : 'Descending'}
              </span>
            </button>
          </div>
          
          <div className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
            Showing {filteredAndSortedModules.length} of {modules.length} modules
          </div>
        </div>
      </div>

      {/* Modules Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {filteredAndSortedModules.map((module) => (
          <div
            key={module.id}
            className={`rounded-lg border p-4 transition-all hover:shadow-lg ${
              darkMode 
                ? 'bg-gray-700 border-gray-600 hover:border-gray-500' 
                : 'bg-white border-gray-200 hover:border-gray-300'
            }`}
          >
            {/* Module Image */}
            {module.module_image && (
              <div className="mb-4">
                <img
                  src={module.module_image}
                  alt={module.module_title}
                  className="w-full h-32 object-cover rounded-lg"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
              </div>
            )}

            {/* Module Content */}
            <div className="mb-4">
              <div className="mb-2">
                <span className={`text-xs font-medium ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Title:</span>
                <h3 className={`font-semibold text-base line-clamp-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  {module.module_title}
                </h3>
              </div>
              <div className="mb-3">
                <span className={`text-xs font-medium ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Description:</span>
                <p className={`text-sm line-clamp-3 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                  {module.module_description}
                </p>
              </div>
              <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                Assigned to: {getUserName(module.profile_id)}
              </p>
            </div>

            {/* Status Badge */}
            <div className="flex items-center justify-between mb-4">
              <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium border ${getStatusColor(module.module_status)}`}>
                {getStatusIcon(module.module_status)}
                <span className="ml-2 capitalize font-semibold">{module.module_status.replace('_', ' ')}</span>
              </span>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2">
              <button
                onClick={() => openEditModal(module)}
                className={`flex-1 flex items-center justify-center px-3 py-2 rounded-lg text-sm transition-all duration-200 transform hover:scale-105 active:scale-95 ${
                  darkMode 
                    ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                    : 'bg-blue-500 hover:bg-blue-600 text-white'
                }`}
              >
                <FaEdit className="mr-1" />
                Edit
              </button>
              <button
                onClick={() => handleDeleteModule(module)}
                className={`flex-1 flex items-center justify-center px-3 py-2 rounded-lg text-sm transition-all duration-200 transform hover:scale-105 active:scale-95 ${
                  darkMode 
                    ? 'bg-red-600 hover:bg-red-700 text-white' 
                    : 'bg-red-500 hover:bg-red-600 text-white'
                }`}
              >
                <FaTrash className="mr-1" />
                Delete
              </button>
            </div>

            {/* Status Change Buttons */}
            <div className="flex gap-2 mt-3">
              {module.module_status !== 'in_progress' && (
                <button
                  onClick={() => handleStatusChange(module, 'in_progress')}
                  className="flex-1 px-3 py-2 text-xs bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-lg font-medium transition-all duration-200 transform hover:scale-105 active:scale-95 shadow-md hover:shadow-lg"
                >
                  <FaPlay className="inline mr-1" />
                  Start
                </button>
              )}
              {module.module_status !== 'completed' && (
                <button
                  onClick={() => handleStatusChange(module, 'completed')}
                  className="flex-1 px-3 py-2 text-xs bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white rounded-lg font-medium transition-all duration-200 transform hover:scale-105 active:scale-95 shadow-md hover:shadow-lg"
                >
                  <FaCheck className="inline mr-1" />
                  Complete
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