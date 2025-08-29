import { useState, useEffect } from 'react';
import { FaBrain, FaPlus, FaEdit, FaTrash, FaCheck, FaPlay, FaSearch, FaTrophy, FaBookOpen, FaClock, FaTimes, FaSpinner } from 'react-icons/fa';
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

  // New: image upload state
  const [newImageFile, setNewImageFile] = useState<File | null>(null);
  const [editImageFile, setEditImageFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState<boolean>(false);

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
        text: 'Failed to load CBT modules and users',
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

  // New: helper to upload image to Supabase Storage and return public URL
  const uploadModuleImage = async (file: File, profileId: number): Promise<string> => {
    const fileExt = file.name.split('.').pop() || 'jpg';
    const sanitizedExt = fileExt.toLowerCase().replace(/[^a-z0-9]/g, '') || 'jpg';
    const fileName = `${Date.now()}_${Math.random().toString(36).slice(2)}.${sanitizedExt}`;
    const filePath = `${profileId}/${fileName}`;

    const { error: uploadError } = await supabase
      .storage
      .from('cbt-modules')
      .upload(filePath, file, { upsert: false, contentType: file.type });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      throw new Error(uploadError.message || 'Failed to upload image');
    }

    const { data } = supabase
      .storage
      .from('cbt-modules')
      .getPublicUrl(filePath);

    if (!data?.publicUrl) {
      throw new Error('Could not get public URL for uploaded image');
    }

    return data.publicUrl;
  };

  const handleAddModule = async () => {
    if (!formData.profile_id || !formData.module_title || !formData.module_description) {
      Swal.fire({
        icon: 'warning',
        title: 'Missing Information',
        text: 'Please fill in all required fields',
        confirmButtonColor: '#800000'
      });
      return;
    }

    try {
      let uploadedUrl = formData.module_image;
      if (newImageFile) {
        setIsUploading(true);
        uploadedUrl = await uploadModuleImage(newImageFile, formData.profile_id);
      }

      const newModule = await cbtModuleService.createModule({
        ...formData,
        module_image: uploadedUrl || undefined
      });
      setModules(prev => [newModule, ...prev]);
      setShowAddModal(false);
      resetForm();
      setNewImageFile(null);
      Swal.fire({
        icon: 'success',
        title: 'Success!',
        text: 'CBT module created successfully',
        timer: 2000,
        showConfirmButton: false
      });
    } catch (error: any) {
      console.error('Error creating module:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error?.message || 'Failed to create CBT module',
        confirmButtonColor: '#800000'
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleEditModule = async () => {
    if (!selectedModule || !formData.module_title || !formData.module_description) {
      Swal.fire({
        icon: 'warning',
        title: 'Missing Information',
        text: 'Please fill in all required fields',
        confirmButtonColor: '#800000'
      });
      return;
    }

    try {
      let uploadedUrl = formData.module_image;
      if (editImageFile) {
        setIsUploading(true);
        uploadedUrl = await uploadModuleImage(editImageFile, formData.profile_id);
      }

      const updatedModule = await cbtModuleService.updateModule({
        id: selectedModule.id,
        ...formData,
        module_image: uploadedUrl || undefined
      });
      setModules(prev => prev.map(m => m.id === selectedModule.id ? updatedModule : m));
      setShowEditModal(false);
      setSelectedModule(null);
      resetForm();
      setEditImageFile(null);
      Swal.fire({
        icon: 'success',
        title: 'Success!',
        text: 'CBT module updated successfully',
        timer: 2000,
        showConfirmButton: false
      });
    } catch (error: any) {
      console.error('Error updating module:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error?.message || 'Failed to update CBT module',
        confirmButtonColor: '#800000'
      });
    } finally {
      setIsUploading(false);
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
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#6b7280'
    });

    if (result.isConfirmed) {
      try {
        await cbtModuleService.deleteModule(module.id);
        setModules(prev => prev.filter(m => m.id !== module.id));
        Swal.fire({
          icon: 'success',
          title: 'Deleted!',
          text: 'CBT module deleted successfully',
          timer: 2000,
          showConfirmButton: false
        });
      } catch (error) {
        console.error('Error deleting module:', error);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Failed to delete CBT module',
          confirmButtonColor: '#800000'
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
        text: 'Failed to update module status',
        confirmButtonColor: '#800000'
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
    setEditImageFile(null);
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
      case 'in_progress': return <FaPlay className="text-xs" />;
      case 'completed': return <FaCheck className="text-xs" />;
      default: return <FaBookOpen className="text-xs" />;
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

  function getUserName(profileId: number) {
    const user = users.find(u => u.id === profileId);
    return user ? user.full_name : 'Unknown User';
  }

  const filteredAndSortedModules = modules
    .filter(module => {
      if (filterStatus !== 'all' && module.module_status !== filterStatus) return false;
      if (selectedUserId && module.profile_id !== selectedUserId) return false;
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

  const getProgressStats = () => {
    const total = modules.length;
    const completed = modules.filter(m => m.module_status === 'completed').length;
    const inProgress = modules.filter(m => m.module_status === 'in_progress').length;
    
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
              Loading CBT modules...
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
          <div className={`p-3 rounded-xl ${darkMode ? 'bg-green-600/20' : 'bg-green-100'} mr-4`}>
            <FaBrain className={`text-2xl ${darkMode ? 'text-green-400' : 'text-green-600'}`} />
          </div>
          <div>
            <h2 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              CBT Modules
            </h2>
            <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Manage cognitive behavioral therapy modules for students
            </p>
          </div>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center px-4 py-2.5 bg-[#800000] hover:bg-[#b56576] text-white rounded-lg font-medium transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
        >
          <FaPlus className="mr-2" />
          Add Module
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className={`p-4 rounded-xl border-2 ${darkMode ? 'bg-gray-700/50 border-blue-500/20' : 'bg-blue-50 border-blue-200'} transition-all duration-200 hover:shadow-lg`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm font-medium ${darkMode ? 'text-blue-400' : 'text-blue-600'}`}>
                Total Modules
              </p>
              <p className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-blue-900'}`}>
                {stats.total}
              </p>
            </div>
            <FaBookOpen className={`text-2xl ${darkMode ? 'text-blue-400' : 'text-blue-500'}`} />
          </div>
        </div>
        
        <div className={`p-4 rounded-xl border-2 ${darkMode ? 'bg-gray-700/50 border-amber-500/20' : 'bg-amber-50 border-amber-200'} transition-all duration-200 hover:shadow-lg`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm font-medium ${darkMode ? 'text-amber-400' : 'text-amber-600'}`}>
                In Progress
              </p>
              <p className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-amber-900'}`}>
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
                placeholder="Search modules, descriptions, or users..."
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
            Showing {filteredAndSortedModules.length} of {modules.length} modules
          </span>
        </div>
      </div>

      {/* Modules Grid */}
      {filteredAndSortedModules.length === 0 ? (
        <div className={`text-center py-12 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
          <FaBrain className="text-6xl mx-auto mb-4 opacity-30" />
          <h3 className="text-xl font-semibold mb-2">No modules found</h3>
          <p>Try adjusting your search or filters, or add a new module.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {filteredAndSortedModules.map((module) => (
            <div
              key={module.id}
              className={`rounded-lg border p-4 transition-all duration-300 hover:shadow-lg transform hover:-translate-y-1 ${
                darkMode 
                  ? 'bg-gray-700/50 border-gray-600 hover:border-gray-500' 
                  : 'bg-white border-gray-200 hover:border-gray-300 hover:shadow-xl'
              }`}
            >
              {/* Module Image */}
              {module.module_image ? (
                <div className="mb-3 relative overflow-hidden rounded-md">
                  <img
                    src={module.module_image}
                    alt={module.module_title}
                    className="w-full h-24 object-cover transition-transform duration-300 hover:scale-110"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                </div>
              ) : (
                <div className={`mb-3 h-24 rounded-md flex items-center justify-center ${
                  darkMode ? 'bg-gray-600/50' : 'bg-gray-100'
                }`}>
                  <FaBrain className={`text-xl ${darkMode ? 'text-gray-400' : 'text-gray-400'} opacity-50`} />
                </div>
              )}

              {/* Module Content */}
              <div className="mb-3">
                <h3 className={`font-semibold text-sm mb-1 line-clamp-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  {module.module_title}
                </h3>
                <p className={`text-xs line-clamp-2 mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                  {module.module_description}
                </p>
                
                <div className="flex items-center justify-between mb-3">
                  <span className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    <span className="font-medium">{getUserName(module.profile_id)}</span>
                  </span>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(module.module_status)}`}>
                    {getStatusIcon(module.module_status)}
                    <span className="ml-1 capitalize">{module.module_status.replace('_', ' ')}</span>
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-1.5">
                <div className="flex gap-1.5">
                  <button
                    onClick={() => openEditModal(module)}
                    className="flex-1 flex items-center justify-center px-2 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-xs font-medium transition-colors"
                  >
                    <FaEdit className="mr-1" />
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeleteModule(module)}
                    className="flex-1 flex items-center justify-center px-2 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-md text-xs font-medium transition-colors"
                  >
                    <FaTrash className="mr-1" />
                    Delete
                  </button>
                </div>
                
                {/* Status Change Buttons */}
                <div className="flex gap-1.5">
                  {module.module_status !== 'in_progress' && (
                    <button
                      onClick={() => handleStatusChange(module, 'in_progress')}
                      className="flex-1 px-2 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-md text-xs font-medium transition-colors"
                    >
                      <FaPlay className="inline mr-1" />
                      In Progress
                    </button>
                  )}
                  {module.module_status !== 'completed' && (
                    <button
                      onClick={() => handleStatusChange(module, 'completed')}
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

      {/* Add Module Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-2xl w-full max-w-md max-h-[80vh] overflow-y-auto`}>
            <div className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  Add New CBT Module
                </h3>
                <button
                  onClick={() => {
                    setShowAddModal(false);
                    resetForm();
                    setNewImageFile(null);
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
                    Module Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.module_title}
                    onChange={(e) => setFormData(prev => ({ ...prev, module_title: e.target.value }))}
                    className={`w-full px-3 py-2 rounded-lg border transition-colors ${
                      darkMode 
                        ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-[#800000]' 
                        : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-[#800000]'
                    } focus:outline-none focus:ring-2 focus:ring-[#800000]/20`}
                    placeholder="Enter module title"
                  />
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Description <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={formData.module_description}
                    onChange={(e) => setFormData(prev => ({ ...prev, module_description: e.target.value }))}
                    rows={3}
                    className={`w-full px-3 py-2 rounded-lg border transition-colors resize-none ${
                      darkMode 
                        ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-[#800000]' 
                        : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-[#800000]'
                    } focus:outline-none focus:ring-2 focus:ring-[#800000]/20`}
                    placeholder="Enter module description"
                  />
                </div>

                {/* New: Image upload input with preview */}
                <div>
                  <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Upload Image (optional)
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0] || null;
                      setNewImageFile(file);
                    }}
                    className={`w-full px-3 py-2 rounded-lg border transition-colors ${
                      darkMode 
                        ? 'bg-gray-700 border-gray-600 text-white focus:border-[#800000]' 
                        : 'bg-white border-gray-300 text-gray-900 focus:border-[#800000]'
                    } focus:outline-none focus:ring-2 focus:ring-[#800000]/20`}
                  />
                  {newImageFile && (
                    <div className="mt-2">
                      <img
                        src={URL.createObjectURL(newImageFile)}
                        alt="Preview"
                        className="w-full h-24 object-cover rounded-lg border border-gray-200"
                      />
                      <button
                        type="button"
                        onClick={() => setNewImageFile(null)}
                        className={`mt-1 px-2 py-1 text-xs rounded-lg border ${darkMode ? 'border-gray-600 text-gray-300 hover:bg-gray-700' : 'border-gray-300 text-gray-700 hover:bg-gray-50'}`}
                      >
                        Remove Image
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
                    setNewImageFile(null);
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
                  onClick={handleAddModule}
                  disabled={isUploading}
                  className={`flex-1 px-4 py-2 rounded-lg transition-colors font-medium text-white ${isUploading ? 'bg-gray-400 cursor-not-allowed' : 'bg-[#800000] hover:bg-[#b56576]'} `}
                >
                  {isUploading ? 'Uploading...' : 'Add Module'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Module Modal */}
      {showEditModal && selectedModule && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-2xl w-full max-w-md max-h-[80vh] overflow-y-auto`}>
            <div className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  Edit CBT Module
                </h3>
                <button
                  onClick={() => {
                    setShowEditModal(false);
                    setSelectedModule(null);
                    resetForm();
                    setEditImageFile(null);
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
                    Module Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.module_title}
                    onChange={(e) => setFormData(prev => ({ ...prev, module_title: e.target.value }))}
                    className={`w-full px-3 py-2 rounded-lg border transition-colors ${
                      darkMode 
                        ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-[#800000]' 
                        : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-[#800000]'
                    } focus:outline-none focus:ring-2 focus:ring-[#800000]/20`}
                    placeholder="Enter module title"
                  />
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Description <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={formData.module_description}
                    onChange={(e) => setFormData(prev => ({ ...prev, module_description: e.target.value }))}
                    rows={3}
                    className={`w-full px-3 py-2 rounded-lg border transition-colors resize-none ${
                      darkMode 
                        ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-[#800000]' 
                        : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-[#800000]'
                    } focus:outline-none focus:ring-2 focus:ring-[#800000]/20`}
                    placeholder="Enter module description"
                  />
                </div>

                {/* New: Image upload input with preview and current image */}
                <div>
                  <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Module Image
                  </label>
                  {formData.module_image && !editImageFile && (
                    <div className="mb-2">
                      <img
                        src={formData.module_image}
                        alt="Current"
                        className="w-full h-24 object-cover rounded-lg border border-gray-200"
                      />
                    </div>
                  )}
                  {editImageFile && (
                    <div className="mb-2">
                      <img
                        src={URL.createObjectURL(editImageFile)}
                        alt="Preview"
                        className="w-full h-24 object-cover rounded-lg border border-gray-200"
                      />
                    </div>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0] || null;
                      setEditImageFile(file);
                    }}
                    className={`w-full px-3 py-2 rounded-lg border transition-colors ${
                      darkMode 
                        ? 'bg-gray-700 border-gray-600 text-white focus:border-[#800000]' 
                        : 'bg-white border-gray-300 text-gray-900 focus:border-[#800000]'
                    } focus:outline-none focus:ring-2 focus:ring-[#800000]/20`}
                  />
                  {editImageFile && (
                    <button
                      type="button"
                      onClick={() => setEditImageFile(null)}
                      className={`mt-1 px-2 py-1 text-xs rounded-lg border ${darkMode ? 'border-gray-600 text-gray-300 hover:bg-gray-700' : 'border-gray-300 text-gray-700 hover:bg-gray-50'}`}
                    >
                      Remove Selected Image
                    </button>
                  )}
                </div>
              </div>

              <div className="flex gap-3 mt-4">
                <button
                  onClick={() => {
                    setShowEditModal(false);
                    setSelectedModule(null);
                    resetForm();
                    setEditImageFile(null);
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
                  onClick={handleEditModule}
                  disabled={isUploading}
                  className={`flex-1 px-4 py-2 rounded-lg transition-colors font-medium text-white ${isUploading ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'} `}
                >
                  {isUploading ? 'Uploading...' : 'Update Module'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CBTModules; 