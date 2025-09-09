import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { 
  FaHandshake, 
  FaUserMd, 
  FaPlus,
  FaSearch,
  FaFilter,
  FaTrash,
  FaInfoCircle,
  FaClock,
  FaCheck,
  FaDownload,
  FaTimes,
  FaUpload,
  FaPaperclip,
  FaExclamationTriangle,
  FaChartLine,
  FaStickyNote
} from 'react-icons/fa';

interface Student {
  id: string;
  full_name: string;
  email: string;
}

interface Referral {
  id: string;
  student_id: string;
  student_name: string;
  psychiatrist_name: string;
  psychiatrist_email: string;
  psychiatrist_phone?: string;
  referral_reason: string;
  urgency_level: string;
  referral_status: string;
  created_at: string;
  email_sent: boolean;
  student_progress_summary?: string;
  additional_notes?: string;
  attachments?: AttachedFile[];
}

interface AttachedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  content?: string;
  url?: string;
  file?: File;
}

interface ReferralProps {
  darkMode: boolean;
}

const Referral = ({ darkMode }: ReferralProps) => {
  const [students, setStudents] = useState<Student[]>([]);
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, setLoading] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [alert, setAlert] = useState<{type: 'success' | 'error' | 'info', message: string} | null>(null);
  const [selectedReferral, setSelectedReferral] = useState<Referral | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    psychiatrist_name: '',
    psychiatrist_email: '',
    psychiatrist_phone: '',
    referral_reason: '',
    urgency_level: 'medium'
  });

  // File attachment state
  const [attachedFiles, setAttachedFiles] = useState<AttachedFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  
  // Edit mode state
  const [isEditing, setIsEditing] = useState(false);
  const [editFormData, setEditFormData] = useState({
    psychiatrist_name: '',
    psychiatrist_email: '',
    psychiatrist_phone: '',
    referral_reason: '',
    urgency_level: 'medium',
    student_progress_summary: '',
    additional_notes: ''
  });



  const handleReferralClick = (referral: Referral) => {
    setSelectedReferral(referral);
    setShowDetailModal(true);
  };

  const closeDetailModal = () => {
    setSelectedReferral(null);
    setShowDetailModal(false);
    setIsEditing(false);
  };


  // Edit functions
  const startEditing = () => {
    if (selectedReferral) {
      setEditFormData({
        psychiatrist_name: selectedReferral.psychiatrist_name,
        psychiatrist_email: selectedReferral.psychiatrist_email,
        psychiatrist_phone: selectedReferral.psychiatrist_phone || '',
        referral_reason: selectedReferral.referral_reason,
        urgency_level: selectedReferral.urgency_level,
        student_progress_summary: selectedReferral.student_progress_summary || '',
        additional_notes: selectedReferral.additional_notes || ''
      });
      setIsEditing(true);
    }
  };

  const cancelEditing = () => {
    setIsEditing(false);
    setEditFormData({
      psychiatrist_name: '',
      psychiatrist_email: '',
      psychiatrist_phone: '',
      referral_reason: '',
      urgency_level: 'medium',
      student_progress_summary: '',
      additional_notes: ''
    });
  };

  const saveEdit = async () => {
    if (!selectedReferral) return;
    
    setLoading(true);
    try {
      const { error } = await supabase
        .from('referrals')
        .update(editFormData)
        .eq('id', selectedReferral.id);

      if (error) throw error;

      setAlert({type: 'success', message: 'Referral updated successfully!'});
      setIsEditing(false);
      fetchReferrals();
      
      // Update the selected referral with new data
      setSelectedReferral({
        ...selectedReferral,
        ...editFormData
      });
      
      setTimeout(() => setAlert(null), 4000);
    } catch (error) {
      console.error('Error updating referral:', error);
      setAlert({type: 'error', message: 'Failed to update referral. Please try again.'});
      setTimeout(() => setAlert(null), 5000);
    } finally {
      setLoading(false);
    }
  };



  useEffect(() => {
    fetchStudents();
    fetchReferrals();
  }, []);

  const fetchStudents = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .in('role', ['student', 'user'])
        .neq('role', 'admin')
        .neq('role', 'guidance')
        .order('full_name');

      if (error) throw error;
      setStudents(data || []);
    } catch (error) {
      console.error('Error fetching students:', error);
    }
  };

  const fetchReferrals = async () => {
    try {
      const { data, error } = await supabase
        .from('referrals')
        .select(`
          *,
          student:profiles!referrals_student_id_fkey(full_name),
          referred_by_profile:profiles!referrals_referred_by_fkey(full_name)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      const formattedReferrals = data?.map(referral => ({
        ...referral,
        student_name: referral.student?.full_name || 'Unknown Student',
        attachments: referral.uploaded_files ? JSON.parse(referral.uploaded_files) : []
      })) || [];
      
      setReferrals(formattedReferrals);
    } catch (error) {
      console.error('Error fetching referrals:', error);
      setReferrals([]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent) return;

    setLoading(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      
      // First check if referrals table exists
      const { error: tableCheckError } = await supabase
        .from('referrals')
        .select('id')
        .limit(1);
      
      if (tableCheckError) {
        if (tableCheckError.message.includes('relation "referrals" does not exist')) {
          setAlert({type: 'error', message: 'Referrals table not found. Please run the database migration first.'});
        setTimeout(() => setAlert(null), 5000);
          setLoading(false);
          return;
        }
        throw tableCheckError;
      }
      
      // Get the profile ID for the current user (not the auth user ID)
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', userData.user?.id)
        .single();
      
      if (profileError) {
        console.error('Error getting profile:', profileError);
        throw new Error('Failed to get user profile');
      }
      
      console.log('Inserting referral with data:', {
        student_id: selectedStudent,
        referred_by: profileData.id,
        ...formData
      });
      
      const { error } = await supabase
        .from('referrals')
        .insert([{
          student_id: selectedStudent,
          referred_by: profileData.id,
          ...formData,
          uploaded_files: attachedFiles.length > 0 ? JSON.stringify(await Promise.all(attachedFiles.map(async (file) => {
            const base64 = await new Promise<string>((resolve) => {
              const reader = new FileReader();
              reader.onload = () => resolve(reader.result as string);
              reader.readAsDataURL(file.file as File);
            });
            return {
              id: file.id,
              name: file.name,
              size: file.size,
              type: file.type,
              content: base64
            };
          }))) : null
        }])
        .select();

      if (error) {
        console.error('Database insert error:', error);
        throw error;
      }

      setAlert({type: 'success', message: 'Referral created successfully!'});

      // Reset form
      setFormData({
        psychiatrist_name: '',
        psychiatrist_email: '',
        psychiatrist_phone: '',
        referral_reason: '',
        urgency_level: 'medium'
      });
      setSelectedStudent('');
      setAttachedFiles([]);
      
      // Close modal first
      setShowCreateForm(false);
      
      // Wait a bit for the modal to close, then refresh referrals
      setTimeout(() => {
        fetchReferrals();
      }, 100);
      
      setTimeout(() => setAlert(null), 4000);
      
    } catch (error) {
      console.error('Error creating referral:', error);
      setAlert({type: 'error', message: 'Failed to create referral. Please try again.'});
      setTimeout(() => setAlert(null), 5000);
    } finally {
      setLoading(false);
    }
  };







  const deleteReferral = async (referralId: string) => {
    try {
      const { error } = await supabase
        .from('referrals')
        .delete()
        .eq('id', referralId);

      if (error) throw error;

      fetchReferrals();
      setDeleteConfirm(null);
      
      setAlert({type: 'success', message: 'Referral deleted successfully!'});
      setTimeout(() => setAlert(null), 3000);
    } catch (error) {
      console.error('Error deleting referral:', error);
      setAlert({type: 'error', message: 'Failed to delete referral. Please try again.'});
      setTimeout(() => setAlert(null), 5000);
    }
  };



  const filteredReferrals = referrals.filter(referral => {
    const matchesSearch = referral.student_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         referral.psychiatrist_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || referral.referral_status === statusFilter;
    return matchesSearch && matchesStatus;
  });


  const getUrgencyBadgeColor = (urgency: string) => {
    switch (urgency) {
      case 'critical': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getUrgencyIcon = (urgency: string) => {
    switch (urgency) {
      case 'critical': return '🚨';
      case 'high': return '⚠️';
      case 'medium': return '📋';
      case 'low': return '✅';
      default: return '📋';
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'sent': return 'bg-red-100 text-red-800';
      case 'acknowledged': return 'bg-red-100 text-red-800';
      case 'accepted': return 'bg-emerald-100 text-emerald-800';
      case 'declined': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleStatusChange = async (referral: Referral, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('referrals')
        .update({ referral_status: newStatus })
        .eq('id', referral.id);

      if (error) throw error;

      fetchReferrals();
      setAlert({type: 'success', message: `Referral marked as ${newStatus}!`});
      setTimeout(() => setAlert(null), 3000);
    } catch (error) {
      console.error('Error updating referral status:', error);
      setAlert({type: 'error', message: 'Failed to update referral status.'});
      setTimeout(() => setAlert(null), 5000);
    }
  };

  // File handling functions
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    addFiles(files);
  };

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (event: React.DragEvent) => {
    event.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    setIsDragging(false);
    const files = Array.from(event.dataTransfer.files);
    addFiles(files);
  };

  const addFiles = (files: File[]) => {
    const newFiles: AttachedFile[] = files.map(file => ({
      id: Math.random().toString(36).substr(2, 9),
      name: file.name,
      size: file.size,
      type: file.type,
      file: file
    }));
    setAttachedFiles(prev => [...prev, ...newFiles]);
  };

  const removeFile = (fileId: string) => {
    setAttachedFiles(prev => prev.filter(file => file.id !== fileId));
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith('image/')) return '🖼️';
    if (fileType.includes('pdf')) return '📄';
    if (fileType.includes('word') || fileType.includes('document')) return '📝';
    if (fileType.includes('excel') || fileType.includes('spreadsheet')) return '📊';
    if (fileType.includes('text')) return '📃';
    return '📎';
  };

  return (
    <div className={`${darkMode ? 'bg-gray-800' : 'bg-gray-100'} rounded-xl shadow-lg p-6`}>
      {/* Header */}
      <div className={`${darkMode ? 'bg-gradient-to-r from-gray-800 to-gray-900' : 'bg-gradient-to-r from-white to-gray-50'} rounded-2xl shadow-xl p-6 mb-6 backdrop-blur-sm`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className="bg-gradient-to-r from-red-700 to-red-900 p-3 rounded-xl mr-4">
              <FaHandshake className="text-2xl text-white" />
            </div>
            <div>
              <h1 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                Psychiatric Referral System
              </h1>
              <p className={`${darkMode ? 'text-gray-300' : 'text-gray-600'} mt-1`}>
                Refer students to licensed psychiatrists when guidance interventions are insufficient
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowCreateForm(true)}
            className="bg-gradient-to-r from-red-700 to-red-900 text-white px-6 py-3 rounded-xl hover:scale-105 transform transition-all duration-200 shadow-lg flex items-center gap-2"
          >
            <FaPlus /> New Referral
          </button>
        </div>
      </div>

      {/* Search and Filter Bar */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <FaSearch className={`absolute left-3 top-1/2 transform -translate-y-1/2 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
            <input
              type="text"
              placeholder="Search referrals..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`w-full pl-9 pr-4 py-2 text-sm border rounded-xl ${
                darkMode 
                  ? 'bg-gray-700/50 border-gray-600 text-white placeholder-gray-400' 
                  : 'bg-white border-gray-300 placeholder-gray-500'
              } focus:ring-2 focus:ring-red-800 focus:border-transparent focus:outline-none transition-all duration-200`}
            />
          </div>
          <div className="relative">
            <FaFilter className={`absolute left-3 top-1/2 transform -translate-y-1/2 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className={`pl-10 pr-8 py-2 text-sm border rounded-xl ${darkMode ? 'bg-gray-700/50 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'} focus:ring-2 focus:ring-red-800 focus:border-transparent focus:outline-none`}
            >
              <option value="all">All Status</option>
              <option value="pending">📋 Pending</option>
              <option value="sent">📧 Sent</option>
              <option value="acknowledged">👁️ Acknowledged</option>
              <option value="accepted">✅ Accepted</option>
              <option value="declined">❌ Declined</option>
              <option value="completed">🎯 Completed</option>
            </select>
          </div>
      </div>

      {/* Referrals Grid */}
      {filteredReferrals.length === 0 ? (
        <div className={`text-center py-12 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
          <FaHandshake className="text-6xl mx-auto mb-4 opacity-30" />
          <h3 className="text-xl font-semibold mb-2">No referrals found</h3>
          <p>Try adjusting your search or filters, or add a new referral.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
          {filteredReferrals.map((referral) => (
            <div
              key={referral.id}
              onClick={() => handleReferralClick(referral)}
              className={`group relative p-4 rounded-xl border transition-all duration-200 hover:shadow-lg hover:-translate-y-1 overflow-hidden cursor-pointer ${
                darkMode 
                  ? 'bg-gray-700/50 border-gray-600 hover:bg-gray-700' 
                  : 'bg-white border-gray-200 hover:shadow-xl'
              }`}
            >
              <div className="flex items-start mb-3">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <div className={`p-2 rounded-lg ${darkMode ? 'bg-red-500/10' : 'bg-red-50'}`}>
                    <FaHandshake className={`text-sm ${darkMode ? 'text-red-400 group-hover:text-red-300' : 'text-red-700 group-hover:text-red-800'}`} />
                  </div>
                  <h3 className={`font-semibold text-sm leading-tight truncate transition-colors ${
                    darkMode ? 'text-white group-hover:text-white' : 'text-gray-900 group-hover:text-black'
                  }`}>
                    {referral.student_name}
                  </h3>
                </div>
              </div>

              <p className={`text-xs leading-relaxed mb-3 line-clamp-2 transition-colors ${
                darkMode ? 'text-gray-300 group-hover:text-white' : 'text-gray-600 group-hover:text-black'
              }`}>
                Referred to: {referral.psychiatrist_name}
              </p>

              <p className={`text-xs leading-relaxed mb-3 line-clamp-3 transition-colors ${
                darkMode ? 'text-gray-300 group-hover:text-white' : 'text-gray-600 group-hover:text-black'
              }`}>
                {referral.referral_reason}
              </p>

              <div className="flex items-center justify-between mb-3">
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium transition-colors ${getUrgencyBadgeColor(referral.urgency_level)} group-hover:bg-opacity-100`}>
                  {getUrgencyIcon(referral.urgency_level)}
                  <span className="ml-1 capitalize">{referral.urgency_level}</span>
                </span>
              </div>

              <div className="space-y-2 pt-3 border-t border-gray-200/50">
                <div className="flex items-center gap-2 text-xs">
                  <FaInfoCircle className="text-xs text-gray-500" />
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusBadgeColor(referral.referral_status)}`}>
                    {referral.referral_status.replace('_', ' ').charAt(0).toUpperCase() + referral.referral_status.replace('_', ' ').slice(1)}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <FaClock className="text-xs" />
                  <span className={`transition-colors ${
                    darkMode ? 'group-hover:text-white' : 'group-hover:text-black'
                  }`}>Created: {new Date(referral.created_at).toLocaleDateString()}</span>
                </div>
                {referral.attachments && referral.attachments.length > 0 && (
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <FaPaperclip className="text-xs" />
                    <span className={`transition-colors ${
                      darkMode ? 'group-hover:text-white' : 'group-hover:text-black'
                    }`}>{referral.attachments.length} file{referral.attachments.length !== 1 ? 's' : ''} attached</span>
                  </div>
                )}
              </div>

              <div className="absolute top-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setDeleteConfirm(referral.id);
                  }}
                  className={`p-1.5 rounded-lg text-xs transition-colors ${
                    darkMode 
                      ? 'text-red-400 hover:bg-red-900/50 hover:text-red-300' 
                      : 'text-red-600 hover:bg-red-50 hover:text-red-700'
                  }`}
                  title="Delete referral"
                >
                  <FaTrash />
                </button>
              </div>

              <div className="flex gap-1.5 mt-3">
                {referral.referral_status !== 'completed' && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleStatusChange(referral, 'completed');
                    }}
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

      {/* Create Referral Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className={`${darkMode ? 'bg-gradient-to-br from-gray-800/95 via-gray-900/95 to-gray-800/95' : 'bg-gradient-to-br from-white/95 via-gray-50/95 to-white/95'} rounded-3xl shadow-3xl p-8 w-full max-w-3xl max-h-[90vh] overflow-y-auto border ${darkMode ? 'border-gray-700/50' : 'border-gray-200/50'} backdrop-blur-xl animate-slideUp`}>
            <div className="flex items-center justify-between mb-6">
              <h2 className={`text-2xl font-bold bg-gradient-to-r from-red-700 to-red-900 bg-clip-text text-transparent`}>
                Create New Referral
              </h2>
              <button
                onClick={() => setShowCreateForm(false)}
                className={`${darkMode ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'} text-2xl`}
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Student Selection */}
              <div>
                <label className={`block text-sm font-semibold mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  Select Student *
                </label>
                <select
                  value={selectedStudent}
                  onChange={(e) => setSelectedStudent(e.target.value)}
                  required
                  className={`w-full px-4 py-3 rounded-xl border ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'} focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                >
                  <option value="">Choose a student...</option>
                  {students.map((student) => (
                    <option key={student.id} value={student.id}>
                      {student.full_name} ({student.email})
                    </option>
                  ))}
                </select>
              </div>

              {/* Psychiatrist Information */}
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className={`block text-sm font-semibold mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    Psychiatrist Name *
                  </label>
                  <input
                    type="text"
                    value={formData.psychiatrist_name}
                    onChange={(e) => setFormData({...formData, psychiatrist_name: e.target.value})}
                    required
                    className={`w-full px-4 py-3 rounded-xl border ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'} focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                    placeholder="Dr. Jane Smith"
                  />
                </div>
                <div>
                  <label className={`block text-sm font-semibold mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    Psychiatrist Email *
                  </label>
                  <input
                    type="email"
                    value={formData.psychiatrist_email}
                    onChange={(e) => setFormData({...formData, psychiatrist_email: e.target.value})}
                    required
                    className={`w-full px-4 py-3 rounded-xl border ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'} focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                    placeholder="dr.smith@clinic.com"
                  />
                </div>
              </div>

              <div>
                <label className={`block text-sm font-semibold mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  Psychiatrist Phone
                </label>
                <input
                  type="tel"
                  value={formData.psychiatrist_phone}
                  onChange={(e) => setFormData({...formData, psychiatrist_phone: e.target.value})}
                  className={`w-full px-4 py-3 rounded-xl border ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'} focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                  placeholder="+1 (555) 123-4567"
                />
              </div>

              {/* Referral Details */}
              <div>
                <label className={`block text-sm font-semibold mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  Urgency Level *
                </label>
                <select
                  value={formData.urgency_level}
                  onChange={(e) => setFormData({...formData, urgency_level: e.target.value})}
                  required
                  className={`w-full px-4 py-3 rounded-xl border ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'} focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                >
                  <option value="low">🟢 Low - Routine referral</option>
                  <option value="medium">🟡 Medium - Moderate concern</option>
                  <option value="high">🟠 High - Urgent attention needed</option>
                  <option value="critical">🔴 Critical - Immediate intervention required</option>
                </select>
              </div>

              <div>
                <label className={`block text-sm font-semibold mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  Referral Reason *
                </label>
                <textarea
                  value={formData.referral_reason}
                  onChange={(e) => setFormData({...formData, referral_reason: e.target.value})}
                  required
                  rows={3}
                  className={`w-full px-4 py-3 rounded-xl border ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'} focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                  placeholder="Describe why this student needs psychiatric evaluation..."
                />
              </div>

              {/* File Attachments Section */}
              <div>
                <label className={`block text-sm font-semibold mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  Attach Supporting Documents
                </label>
                <div
                  className={`border-2 border-dashed rounded-xl p-6 transition-all duration-200 ${
                    isDragging
                      ? darkMode
                        ? 'border-red-400 bg-red-900/20'
                        : 'border-red-400 bg-red-50'
                      : darkMode
                      ? 'border-gray-600 hover:border-gray-500'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                >
                  <div className="text-center">
                    <FaUpload className={`mx-auto text-3xl mb-3 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                    <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'} mb-2`}>
                      Drag and drop files here, or
                    </p>
                    <label className="cursor-pointer">
                      <span className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:scale-105 transform transition-all duration-200 inline-block">
                        Browse Files
                      </span>
                      <input
                        type="file"
                        multiple
                        onChange={handleFileSelect}
                        className="hidden"
                        accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.txt"
                      />
                    </label>
                    <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'} mt-2`}>
                      Supported: PDF, DOC, DOCX, JPG, PNG, TXT (Max 10MB each)
                    </p>
                  </div>
                </div>

                {/* Attached Files List */}
                {attachedFiles.length > 0 && (
                  <div className="mt-4 space-y-2">
                    <h4 className={`text-sm font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                      Attached Files ({attachedFiles.length})
                    </h4>
                    {attachedFiles.map((file) => (
                      <div
                        key={file.id}
                        className={`flex items-center justify-between p-3 rounded-lg border ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'}`}
                      >
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <span className="text-lg">{getFileIcon(file.type)}</span>
                          <div className="flex-1 min-w-0">
                            <p className={`text-sm font-medium truncate ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                              {file.name}
                            </p>
                            <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                              {formatFileSize(file.size)}
                            </p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeFile(file.id)}
                          className={`p-1 rounded-lg transition-colors ${darkMode ? 'text-red-400 hover:bg-red-900/50' : 'text-red-600 hover:bg-red-50'}`}
                        >
                          <FaTimes className="text-sm" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>



              {/* Form Actions */}
              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  className={`flex-1 px-6 py-3 rounded-xl border ${darkMode ? 'border-gray-600 text-gray-300 hover:bg-gray-700' : 'border-gray-300 text-gray-700 hover:bg-gray-50'} transition-all duration-200`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className={`flex-1 bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-3 rounded-xl hover:scale-105 transform transition-all duration-200 shadow-lg ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {loading ? 'Creating...' : 'Create Referral'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className={`${darkMode ? 'bg-gradient-to-br from-gray-800 via-gray-900 to-gray-800' : 'bg-gradient-to-br from-white via-gray-50 to-white'} rounded-3xl shadow-3xl p-8 w-full max-w-md border ${darkMode ? 'border-gray-700/50' : 'border-gray-200/50'} backdrop-blur-lg`}>
            <div className="text-center">
              <div className="bg-gradient-to-br from-red-500 to-red-600 p-4 rounded-2xl mx-auto w-fit mb-6">
                <FaTrash className="text-3xl text-white" />
              </div>
              <h3 className={`text-2xl font-bold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                Delete Referral
              </h3>
              <p className={`${darkMode ? 'text-gray-300' : 'text-gray-600'} mb-8`}>
                Are you sure you want to delete this referral? This action cannot be undone.
              </p>
              <div className="flex gap-4">
                <button
                  onClick={() => setDeleteConfirm(null)}
                  className={`flex-1 px-6 py-3 rounded-2xl border ${darkMode ? 'border-gray-600 text-gray-300 hover:bg-gray-700' : 'border-gray-300 text-gray-700 hover:bg-gray-50'} transition-all duration-200 font-semibold`}
                >
                  Cancel
                </button>
                <button
                  onClick={() => deleteReferral(deleteConfirm)}
                  className="flex-1 bg-gradient-to-r from-red-500 to-red-600 text-white px-6 py-3 rounded-2xl hover:scale-105 hover:shadow-xl transform transition-all duration-300 shadow-lg font-semibold"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Custom Alert System */}
      {alert && (
        <div className="fixed top-4 right-4 z-[60] animate-slideDown">
          <div className={`${
            alert.type === 'success' ? 'bg-gradient-to-r from-green-500 to-emerald-600' :
            alert.type === 'error' ? 'bg-gradient-to-r from-red-500 to-red-600' :
            'bg-gradient-to-r from-blue-500 to-indigo-600'
          } text-white px-6 py-4 rounded-2xl shadow-2xl backdrop-blur-lg border border-white/20 max-w-md`}>
            <div className="flex items-center gap-3">
              <div className="flex-shrink-0">
                {alert.type === 'success' && <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center">✓</div>}
                {alert.type === 'error' && <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center">✕</div>}
                {alert.type === 'info' && <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center">i</div>}
              </div>
              <p className="font-semibold text-sm">{alert.message}</p>
              <button
                onClick={() => setAlert(null)}
                className="ml-auto text-white/80 hover:text-white transition-colors"
              >
                ×
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Referral Detail Modal */}
      {showDetailModal && selectedReferral && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className={`${darkMode ? 'bg-gradient-to-br from-gray-800/95 via-gray-900/95 to-gray-800/95' : 'bg-gradient-to-br from-white/95 via-gray-50/95 to-white/95'} rounded-3xl shadow-3xl w-full max-w-6xl max-h-[90vh] overflow-y-auto border ${darkMode ? 'border-gray-700/50' : 'border-gray-200/50'} backdrop-blur-xl animate-slideUp`}>
            {/* Header */}
            <div className="flex items-center justify-between p-8 border-b border-gray-200/20">
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-xl ${darkMode ? 'bg-red-600/20' : 'bg-red-100'}`}>
                  <FaUserMd className={`text-2xl ${darkMode ? 'text-red-400' : 'text-red-700'}`} />
                </div>
                <div>
                  <h2 className={`text-2xl font-bold bg-gradient-to-r from-red-700 to-red-900 bg-clip-text text-transparent`}>
                    Referral Details
                  </h2>
                  <p className={`${darkMode ? 'text-gray-300' : 'text-gray-600'} mt-1`}>
                    {selectedReferral.student_name} → Dr. {selectedReferral.psychiatrist_name}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {!isEditing ? (
                  <button
                    onClick={startEditing}
                    className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-red-700 to-red-900 text-white rounded-lg hover:scale-105 transform transition-all duration-200 text-sm font-medium"
                  >
                    <FaInfoCircle className="text-sm" />
                    Edit
                  </button>
                ) : (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={saveEdit}
                      disabled={loading}
                      className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg hover:scale-105 transform transition-all duration-200 text-sm font-medium disabled:opacity-50"
                    >
                      <FaCheck className="text-sm" />
                      {loading ? 'Saving...' : 'Save'}
                    </button>
                    <button
                      onClick={cancelEditing}
                      className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-gray-500 to-gray-600 text-white rounded-lg hover:scale-105 transform transition-all duration-200 text-sm font-medium"
                    >
                      <FaTimes className="text-sm" />
                      Cancel
                    </button>
                  </div>
                )}
                <button
                  onClick={closeDetailModal}
                  className={`${darkMode ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'} text-2xl hover:scale-110 transition-all duration-200`}
                >
                  ×
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-6">
              {/* Status Badges */}
              <div className="flex flex-wrap gap-3">
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                  selectedReferral.urgency_level === 'critical' ? 'bg-red-100 text-red-800' :
                  selectedReferral.urgency_level === 'high' ? 'bg-orange-100 text-orange-800' :
                  selectedReferral.urgency_level === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-green-100 text-green-800'
                }`}>
                  {getUrgencyIcon(selectedReferral.urgency_level)} {selectedReferral.urgency_level.charAt(0).toUpperCase() + selectedReferral.urgency_level.slice(1)} Priority
                </span>
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusBadgeColor(selectedReferral.referral_status)}`}>
                  {selectedReferral.referral_status.replace('_', ' ').charAt(0).toUpperCase() + selectedReferral.referral_status.replace('_', ' ').slice(1)}
                </span>
                {selectedReferral.email_sent && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-emerald-100 text-emerald-800">
                    ✅ Email Sent
                  </span>
                )}
              </div>

              {/* Information Grid */}
              <div className="grid md:grid-cols-2 gap-6">
                {/* Student Information */}
                <div className={`${darkMode ? 'bg-gray-800/50' : 'bg-white/80'} rounded-2xl p-6 border ${darkMode ? 'border-gray-700/50' : 'border-gray-200/50'} backdrop-blur-sm`}>
                  <div className="flex items-center gap-3 mb-4">
                    <div className={`p-2 rounded-lg ${darkMode ? 'bg-red-600/20' : 'bg-red-100'}`}>
                      <span className="text-lg">👤</span>
                    </div>
                    <h3 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                      Student Information
                    </h3>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <label className={`block text-sm font-medium ${darkMode ? 'text-gray-400' : 'text-gray-600'} mb-1`}>
                        Student Name
                      </label>
                      <p className={`text-base font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                        {selectedReferral.student_name}
                      </p>
                    </div>
                    <div>
                      <label className={`block text-sm font-medium ${darkMode ? 'text-gray-400' : 'text-gray-600'} mb-1`}>
                        Referral Date
                      </label>
                      <p className={`text-base ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        {new Date(selectedReferral.created_at).toLocaleDateString('en-US', { 
                          year: 'numeric', 
                          month: 'long', 
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Psychiatrist Information */}
                <div className={`${darkMode ? 'bg-gray-800/50' : 'bg-white/80'} rounded-2xl p-6 border ${darkMode ? 'border-gray-700/50' : 'border-gray-200/50'} backdrop-blur-sm`}>
                  <div className="flex items-center gap-3 mb-4">
                    <div className={`p-2 rounded-lg ${darkMode ? 'bg-purple-600/20' : 'bg-purple-100'}`}>
                      <FaUserMd className={`text-lg ${darkMode ? 'text-purple-400' : 'text-purple-600'}`} />
                    </div>
                    <h3 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                      Psychiatrist Information
                    </h3>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <label className={`block text-sm font-medium ${darkMode ? 'text-gray-400' : 'text-gray-600'} mb-1`}>
                        Name
                      </label>
                      {isEditing ? (
                        <input
                          type="text"
                          value={editFormData.psychiatrist_name}
                          onChange={(e) => setEditFormData({...editFormData, psychiatrist_name: e.target.value})}
                          className={`w-full px-3 py-2 rounded-lg border ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'} focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                        />
                      ) : (
                        <p className={`text-base font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                          Dr. {selectedReferral.psychiatrist_name}
                        </p>
                      )}
                    </div>
                    <div>
                      <label className={`block text-sm font-medium ${darkMode ? 'text-gray-400' : 'text-gray-600'} mb-1`}>
                        Email
                      </label>
                      {isEditing ? (
                        <input
                          type="email"
                          value={editFormData.psychiatrist_email}
                          onChange={(e) => setEditFormData({...editFormData, psychiatrist_email: e.target.value})}
                          className={`w-full px-3 py-2 rounded-lg border ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'} focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                        />
                      ) : (
                        <p className={`text-base ${darkMode ? 'text-gray-300' : 'text-gray-700'} break-all`}>
                          {selectedReferral.psychiatrist_email}
                        </p>
                      )}
                    </div>
                    <div>
                      <label className={`block text-sm font-medium ${darkMode ? 'text-gray-400' : 'text-gray-600'} mb-1`}>
                        Phone
                      </label>
                      {isEditing ? (
                        <input
                          type="tel"
                          value={editFormData.psychiatrist_phone}
                          onChange={(e) => setEditFormData({...editFormData, psychiatrist_phone: e.target.value})}
                          className={`w-full px-3 py-2 rounded-lg border ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'} focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                          placeholder="Optional"
                        />
                      ) : (
                        <p className={`text-base ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                          {selectedReferral.psychiatrist_phone || 'Not provided'}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Referral Details */}
              <div className={`${darkMode ? 'bg-gray-800/50' : 'bg-white/80'} rounded-2xl p-6 border ${darkMode ? 'border-gray-700/50' : 'border-gray-200/50'} backdrop-blur-sm`}>
                <div className="flex items-center gap-3 mb-4">
                  <div className={`p-2 rounded-lg ${darkMode ? 'bg-red-600/20' : 'bg-red-100'}`}>
                    <FaExclamationTriangle className={`text-lg ${darkMode ? 'text-red-400' : 'text-red-600'}`} />
                  </div>
                  <h3 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    Referral Reason & Urgency
                  </h3>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className={`block text-sm font-medium ${darkMode ? 'text-gray-400' : 'text-gray-600'} mb-2`}>
                      Urgency Level
                    </label>
                    {isEditing ? (
                      <select
                        value={editFormData.urgency_level}
                        onChange={(e) => setEditFormData({...editFormData, urgency_level: e.target.value})}
                        className={`w-full px-3 py-2 rounded-lg border ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'} focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                      >
                        <option value="low">🟢 Low - Routine referral</option>
                        <option value="medium">🟡 Medium - Moderate concern</option>
                        <option value="high">🟠 High - Urgent attention needed</option>
                        <option value="critical">🔴 Critical - Immediate intervention required</option>
                      </select>
                    ) : (
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                        selectedReferral.urgency_level === 'critical' ? 'bg-red-100 text-red-800' :
                        selectedReferral.urgency_level === 'high' ? 'bg-orange-100 text-orange-800' :
                        selectedReferral.urgency_level === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {getUrgencyIcon(selectedReferral.urgency_level)} {selectedReferral.urgency_level.charAt(0).toUpperCase() + selectedReferral.urgency_level.slice(1)} Priority
                      </span>
                    )}
                  </div>
                  <div>
                    <label className={`block text-sm font-medium ${darkMode ? 'text-gray-400' : 'text-gray-600'} mb-2`}>
                      Reason for Referral
                    </label>
                    {isEditing ? (
                      <textarea
                        value={editFormData.referral_reason}
                        onChange={(e) => setEditFormData({...editFormData, referral_reason: e.target.value})}
                        rows={4}
                        className={`w-full px-3 py-2 rounded-lg border ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'} focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                      />
                    ) : (
                      <p className={`text-base leading-relaxed ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        {selectedReferral.referral_reason}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Progress Summary - Always show in edit mode */}
              {(selectedReferral.student_progress_summary || isEditing) && (
                <div className={`${darkMode ? 'bg-gray-800/50' : 'bg-white/80'} rounded-2xl p-6 border ${darkMode ? 'border-gray-700/50' : 'border-gray-200/50'} backdrop-blur-sm`}>
                  <div className="flex items-center gap-3 mb-4">
                    <div className={`p-2 rounded-lg ${darkMode ? 'bg-red-600/20' : 'bg-red-100'}`}>
                      <FaChartLine className={`text-lg ${darkMode ? 'text-red-400' : 'text-red-700'}`} />
                    </div>
                    <h3 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                      Student Progress Summary
                    </h3>
                  </div>
                  {isEditing ? (
                    <textarea
                      value={editFormData.student_progress_summary}
                      onChange={(e) => setEditFormData({...editFormData, student_progress_summary: e.target.value})}
                      rows={3}
                      placeholder="Describe the student's progress and intervention attempts..."
                      className={`w-full px-3 py-2 rounded-lg border ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'} focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                    />
                  ) : (
                    <p className={`text-base leading-relaxed ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      {selectedReferral.student_progress_summary || 'No progress summary provided'}
                    </p>
                  )}
                </div>
              )}

              {/* Additional Notes - Always show in edit mode */}
              {(selectedReferral.additional_notes || isEditing) && (
                <div className={`${darkMode ? 'bg-gray-800/50' : 'bg-white/80'} rounded-2xl p-6 border ${darkMode ? 'border-gray-700/50' : 'border-gray-200/50'} backdrop-blur-sm`}>
                  <div className="flex items-center gap-3 mb-4">
                    <div className={`p-2 rounded-lg ${darkMode ? 'bg-yellow-600/20' : 'bg-yellow-100'}`}>
                      <FaStickyNote className={`text-lg ${darkMode ? 'text-yellow-400' : 'text-yellow-600'}`} />
                    </div>
                    <h3 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                      Additional Notes
                    </h3>
                  </div>
                  {isEditing ? (
                    <textarea
                      value={editFormData.additional_notes}
                      onChange={(e) => setEditFormData({...editFormData, additional_notes: e.target.value})}
                      rows={3}
                      placeholder="Any additional notes or observations..."
                      className={`w-full px-3 py-2 rounded-lg border ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'} focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                    />
                  ) : (
                    <p className={`text-base leading-relaxed ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      {selectedReferral.additional_notes || 'No additional notes provided'}
                    </p>
                  )}
                </div>
              )}


              {/* Attached Files */}
              {selectedReferral.attachments && selectedReferral.attachments.length > 0 && (
                <div className={`${darkMode ? 'bg-gray-800/50' : 'bg-white/80'} rounded-2xl p-6 border ${darkMode ? 'border-gray-700/50' : 'border-gray-200/50'} backdrop-blur-sm`}>
                  <div className="flex items-center gap-3 mb-4">
                    <div className={`p-2 rounded-lg ${darkMode ? 'bg-green-600/20' : 'bg-green-100'}`}>
                      <FaPaperclip className={`text-lg ${darkMode ? 'text-green-400' : 'text-green-600'}`} />
                    </div>
                    <h3 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                      Attached Files ({selectedReferral.attachments.length})
                    </h3>
                  </div>
                  <div className="space-y-3">
                    {selectedReferral.attachments.map((file) => (
                      <div
                        key={file.id}
                        className={`${darkMode ? 'bg-gray-700/30' : 'bg-gray-50'} rounded-lg p-4 border ${darkMode ? 'border-gray-600/30' : 'border-gray-200'} hover:shadow-md transition-all duration-200`}
                      >
                        <div className="flex items-center gap-4">
                          <div className="text-3xl">{getFileIcon(file.type)}</div>
                          <div className="flex-1 min-w-0">
                            <h4 className={`font-semibold truncate ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                              {file.name}
                            </h4>
                            <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                              {formatFileSize(file.size)}
                            </p>
                          </div>
                          <div className="flex gap-2">
                            {file.file && file.file instanceof File ? (
                              <button
                                onClick={() => {
                                  const url = URL.createObjectURL(file.file as File);
                                  const a = document.createElement('a');
                                  a.href = url;
                                  a.download = file.name;
                                  document.body.appendChild(a);
                                  a.click();
                                  document.body.removeChild(a);
                                  URL.revokeObjectURL(url);
                                }}
                                className={`p-2 rounded-lg transition-colors ${darkMode ? 'text-red-400 hover:bg-red-900/50' : 'text-red-800 hover:bg-red-100'}`}
                                title="Download file"
                              >
                                <FaDownload />
                              </button>
                            ) : file.url ? (
                              <a
                                href={file.url}
                                download={file.name}
                                className={`p-2 rounded-lg transition-colors ${darkMode ? 'text-red-400 hover:bg-red-900/50' : 'text-red-800 hover:bg-red-100'}`}
                                title="Download file"
                              >
                                <FaDownload />
                              </a>
                            ) : file.content ? (
                              <button
                                onClick={() => {
                                  // Convert base64 back to blob and download
                                  if (file.content) {
                                    const byteCharacters = atob(file.content.split(',')[1]);
                                    const byteNumbers = new Array(byteCharacters.length);
                                    for (let i = 0; i < byteCharacters.length; i++) {
                                      byteNumbers[i] = byteCharacters.charCodeAt(i);
                                    }
                                    const byteArray = new Uint8Array(byteNumbers);
                                    const blob = new Blob([byteArray], { type: file.type });
                                    const url = URL.createObjectURL(blob);
                                    const a = document.createElement('a');
                                    a.href = url;
                                    a.download = file.name;
                                    document.body.appendChild(a);
                                    a.click();
                                    document.body.removeChild(a);
                                    URL.revokeObjectURL(url);
                                  }
                                }}
                                className={`p-2 rounded-lg transition-colors ${darkMode ? 'text-red-400 hover:bg-red-900/50' : 'text-red-800 hover:bg-red-100'}`}
                                title="Download file"
                              >
                                <FaDownload />
                              </button>
                            ) : (
                              <div className="flex flex-col items-center gap-2">
                                <span className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'} italic text-center`}>
                                  File uploaded before content storage was enabled
                                </span>
                                <button
                                  onClick={() => {
                                    setAlert({type: 'info', message: 'This file was uploaded before full content storage. Please re-upload the file in a new referral for download capability.'});
                                    setTimeout(() => setAlert(null), 5000);
                                  }}
                                  className={`px-3 py-1 text-xs rounded-lg transition-colors ${darkMode ? 'text-red-400 hover:bg-red-900/50 border border-red-400/30' : 'text-red-800 hover:bg-red-100 border border-red-200'}`}
                                  title="Get info about this file"
                                >
                                  More Info
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}


            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Referral;