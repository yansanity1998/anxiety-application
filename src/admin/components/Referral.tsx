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
  FaCheck
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
  const [initialLoading, setInitialLoading] = useState(true);
  const [dataCache, setDataCache] = useState<{students: Student[], referrals: Referral[], timestamp: number} | null>(null);
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



  const handleReferralClick = (referral: Referral) => {
    setSelectedReferral(referral);
    setShowDetailModal(true);
  };

  const closeDetailModal = () => {
    setSelectedReferral(null);
    setShowDetailModal(false);
  };



  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    setInitialLoading(true);
    try {
      // Check if we have recent cached data (less than 5 minutes old)
      if (dataCache && Date.now() - dataCache.timestamp < 5 * 60 * 1000) {
        setStudents(dataCache.students);
        setReferrals(dataCache.referrals);
        setInitialLoading(false);
        return;
      }

      // Fetch both data sets in parallel for better performance
      await Promise.all([fetchStudents(), fetchReferrals()]);
    } catch (error) {
      console.error('Error loading initial data:', error);
    } finally {
      setInitialLoading(false);
    }
  };

  const fetchStudents = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, email, role')
        .in('role', ['student', 'user'])
        .neq('role', 'admin')
        .neq('role', 'guidance')
        .order('full_name');

      if (error) throw error;
      const studentsData = data || [];
      setStudents(studentsData);
      
      // Update cache
      setDataCache(prev => ({
        students: studentsData,
        referrals: prev?.referrals || [],
        timestamp: Date.now()
      }));
    } catch (error) {
      console.error('Error fetching students:', error);
    }
  };

  const fetchReferrals = async () => {
    try {
      const { data, error } = await supabase
        .from('referrals')
        .select(`
          id, student_id, student_name, psychiatrist_name, psychiatrist_email,
          psychiatrist_phone, referral_reason, urgency_level, referral_status,
          created_at, email_sent,
          student:profiles!referrals_student_id_fkey(full_name)
        `)
        .order('created_at', { ascending: false })
        .limit(100); // Limit initial load for better performance

      if (error) {
        console.error('Error fetching referrals:', error);
        // If table doesn't exist, set empty array
        if (error.message.includes('relation "referrals" does not exist')) {
          setReferrals([]);
          return;
        }
        throw error;
      }
      
      const formattedReferrals = data?.map(referral => ({
        ...referral,
        student_name: (referral.student as any)?.full_name || referral.student_name || 'Unknown Student'
      })) || [];
      
      setReferrals(formattedReferrals);
      
      // Update cache
      setDataCache(prev => ({
        students: prev?.students || [],
        referrals: formattedReferrals,
        timestamp: Date.now()
      }));
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
          ...formData
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

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'critical': return 'from-red-500 to-red-600';
      case 'high': return 'from-orange-500 to-orange-600';
      case 'medium': return 'from-yellow-500 to-yellow-600';
      case 'low': return 'from-green-500 to-green-600';
      default: return 'from-gray-500 to-gray-600';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'from-yellow-500 to-yellow-600';
      case 'sent': return 'from-blue-500 to-blue-600';
      case 'acknowledged': return 'from-indigo-500 to-indigo-600';
      case 'accepted': return 'from-green-500 to-green-600';
      case 'declined': return 'from-red-500 to-red-600';
      case 'completed': return 'from-emerald-500 to-emerald-600';
      default: return 'from-gray-500 to-gray-600';
    }
  };

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

  return (
    <div className={`min-h-screen p-6 ${darkMode ? 'bg-gradient-to-br from-gray-900 to-gray-800' : 'bg-gradient-to-br from-gray-50 to-white'}`}>
      {/* Header */}
      <div className={`${darkMode ? 'bg-gradient-to-r from-gray-800 to-gray-900' : 'bg-gradient-to-r from-white to-gray-50'} rounded-2xl shadow-xl p-6 mb-6 backdrop-blur-sm`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-3 rounded-xl mr-4">
              <FaHandshake className="text-2xl text-white" />
            </div>
            <div>
              <h1 className={`text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent`}>
                Psychiatric Referral System
              </h1>
              <p className={`${darkMode ? 'text-gray-300' : 'text-gray-600'} mt-1`}>
                Refer students to licensed psychiatrists when guidance interventions are insufficient
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowCreateForm(true)}
            className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-3 rounded-xl hover:scale-105 transform transition-all duration-200 shadow-lg flex items-center gap-2"
          >
            <FaPlus /> New Referral
          </button>
        </div>
      </div>

      {/* Search and Filter Bar */}
      <div className={`${darkMode ? 'bg-gradient-to-r from-gray-800 to-gray-900' : 'bg-gradient-to-r from-white to-gray-50'} rounded-2xl shadow-xl p-6 mb-6 backdrop-blur-sm`}>
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <FaSearch className={`absolute left-3 top-1/2 transform -translate-y-1/2 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
            <input
              type="text"
              placeholder="Search by student name or psychiatrist..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`w-full pl-10 pr-4 py-3 rounded-xl border ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'} focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
            />
          </div>
          <div className="relative">
            <FaFilter className={`absolute left-3 top-1/2 transform -translate-y-1/2 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className={`pl-10 pr-8 py-3 rounded-xl border ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'} focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
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
      </div>

      {/* Referrals Grid */}
      {initialLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
          {[...Array(8)].map((_, index) => (
            <div
              key={index}
              className={`p-4 rounded-xl border animate-pulse ${
                darkMode 
                  ? 'bg-gray-700/30 border-gray-600/30' 
                  : 'bg-gray-100/50 border-gray-200/30'
              }`}
            >
              {/* Header skeleton */}
              <div className="flex items-start mb-3">
                <div className="flex items-center gap-2 flex-1">
                  <div className={`p-2 rounded-lg ${darkMode ? 'bg-gray-600' : 'bg-gray-300'}`}></div>
                  <div className={`h-4 rounded flex-1 ${darkMode ? 'bg-gray-600' : 'bg-gray-300'}`}></div>
                </div>
              </div>
              
              {/* Content skeleton */}
              <div className="space-y-2 mb-3">
                <div className={`h-3 rounded ${darkMode ? 'bg-gray-600' : 'bg-gray-300'}`}></div>
                <div className={`h-3 rounded ${darkMode ? 'bg-gray-600' : 'bg-gray-300'}`} style={{width: '80%'}}></div>
              </div>
              
              <div className="space-y-2 mb-3">
                <div className={`h-3 rounded ${darkMode ? 'bg-gray-600' : 'bg-gray-300'}`}></div>
                <div className={`h-3 rounded ${darkMode ? 'bg-gray-600' : 'bg-gray-300'}`} style={{width: '70%'}}></div>
                <div className={`h-3 rounded ${darkMode ? 'bg-gray-600' : 'bg-gray-300'}`} style={{width: '60%'}}></div>
              </div>
              
              {/* Footer skeleton */}
              <div className="flex items-center justify-between mb-3">
                <div className={`h-6 rounded-full ${darkMode ? 'bg-gray-600' : 'bg-gray-300'}`} style={{width: '60px'}}></div>
              </div>
              
              <div className="space-y-2 pt-3 border-t border-gray-200/50">
                <div className={`h-3 rounded ${darkMode ? 'bg-gray-600' : 'bg-gray-300'}`} style={{width: '50%'}}></div>
                <div className={`h-3 rounded ${darkMode ? 'bg-gray-600' : 'bg-gray-300'}`} style={{width: '60%'}}></div>
              </div>
            </div>
          ))}
        </div>
      ) : filteredReferrals.length === 0 ? (
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
                  <div className={`p-2 rounded-lg ${darkMode ? 'bg-blue-500/10' : 'bg-blue-50'}`}>
                    <FaHandshake className={`text-sm ${darkMode ? 'text-blue-400 group-hover:text-blue-300' : 'text-blue-500 group-hover:text-blue-600'}`} />
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
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <FaInfoCircle className="text-xs" />
                  <span className={`truncate font-bold transition-colors ${
                    darkMode ? 'group-hover:text-white' : 'group-hover:text-black'
                  }`}>{referral.referral_status.replace('_', ' ')}</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <FaClock className="text-xs" />
                  <span className={`transition-colors ${
                    darkMode ? 'group-hover:text-white' : 'group-hover:text-black'
                  }`}>Created: {new Date(referral.created_at).toLocaleDateString()}</span>
                </div>
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
          <div className={`${darkMode ? 'bg-gradient-to-br from-gray-800/95 via-gray-900/95 to-gray-800/95' : 'bg-gradient-to-br from-white/95 via-gray-50/95 to-white/95'} rounded-3xl shadow-3xl p-8 w-full max-w-5xl max-h-[90vh] overflow-y-auto border ${darkMode ? 'border-gray-700/50' : 'border-gray-200/50'} backdrop-blur-xl animate-slideUp`}>
            <div className="flex items-center justify-between mb-6">
              <h2 className={`text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent`}>
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
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className={`${darkMode ? 'bg-gradient-to-br from-gray-800 to-gray-900' : 'bg-gradient-to-br from-white to-gray-50'} rounded-3xl shadow-3xl w-full max-w-5xl max-h-[90vh] overflow-y-auto border ${darkMode ? 'border-gray-700/50' : 'border-gray-200/50'} backdrop-blur-xl animate-slideUp`}>
            {/* Modern Header with Glass Morphism */}
            <div className={`sticky top-0 z-10 ${darkMode ? 'bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600' : 'bg-gradient-to-r from-blue-500 via-indigo-600 to-purple-600'} p-8 rounded-t-3xl backdrop-blur-sm`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-6">
                  <div className="bg-white/20 p-4 rounded-2xl backdrop-blur-sm shadow-xl">
                    <FaUserMd className="text-white text-3xl" />
                  </div>
                  <div>
                    <h2 className="text-3xl font-bold text-white mb-2">
                      Referral Details
                    </h2>
                    <p className="text-blue-100 text-lg font-medium">
                      {selectedReferral.student_name} → Dr. {selectedReferral.psychiatrist_name}
                    </p>
                  </div>
                </div>
                <button
                  onClick={closeDetailModal}
                  className="text-white hover:bg-white/20 p-4 rounded-2xl transition-all duration-300 hover:scale-110 shadow-lg backdrop-blur-sm"
                >
                  <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Modal Content with Enhanced Spacing */}
            <div className="p-8 space-y-8">
              {/* Modern Status Badges */}
              <div className="flex flex-wrap gap-4">
                <div className={`px-6 py-4 rounded-2xl text-base font-bold text-white bg-gradient-to-r ${getUrgencyColor(selectedReferral.urgency_level)} shadow-xl backdrop-blur-sm transform hover:scale-105 transition-all duration-300`}>
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{getUrgencyIcon(selectedReferral.urgency_level)}</span>
                    <span>{selectedReferral.urgency_level.toUpperCase()} URGENCY</span>
                  </div>
                </div>
                <div className={`px-6 py-4 rounded-2xl text-base font-bold text-white bg-gradient-to-r ${getStatusColor(selectedReferral.referral_status)} shadow-xl backdrop-blur-sm transform hover:scale-105 transition-all duration-300`}>
                  <div className="flex items-center gap-3">
                    <span className="text-xl">📋</span>
                    <span>{selectedReferral.referral_status.toUpperCase().replace('_', ' ')}</span>
                  </div>
                </div>
                {selectedReferral.email_sent && (
                  <div className="px-6 py-4 rounded-2xl text-base font-bold text-white bg-gradient-to-r from-emerald-500 to-green-600 shadow-xl backdrop-blur-sm transform hover:scale-105 transition-all duration-300">
                    <div className="flex items-center gap-3">
                      <span className="text-xl">✅</span>
                      <span>EMAIL SENT</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Student Information Card */}
              <div className={`${darkMode ? 'bg-gradient-to-br from-gray-700/50 to-gray-800/50' : 'bg-gradient-to-br from-gray-50/80 to-white/80'} rounded-3xl p-8 backdrop-blur-sm border ${darkMode ? 'border-gray-600/30' : 'border-gray-200/30'} shadow-2xl hover:shadow-3xl transition-all duration-300`}>
                <div className="flex items-center gap-4 mb-8">
                  <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-3 rounded-xl">
                    <span className="text-2xl">👤</span>
                  </div>
                  <h3 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    Student Information
                  </h3>
                </div>
                <div className="grid md:grid-cols-2 gap-8">
                  <div className={`${darkMode ? 'bg-gray-800/30' : 'bg-white/60'} rounded-2xl p-6 border ${darkMode ? 'border-gray-600/20' : 'border-gray-200/30'}`}>
                    <label className={`block text-sm font-bold ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-3 uppercase tracking-wider`}>
                      Student Name
                    </label>
                    <p className={`text-xl font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                      {selectedReferral.student_name}
                    </p>
                  </div>
                  <div className={`${darkMode ? 'bg-gray-800/30' : 'bg-white/60'} rounded-2xl p-6 border ${darkMode ? 'border-gray-600/20' : 'border-gray-200/30'}`}>
                    <label className={`block text-sm font-bold ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-3 uppercase tracking-wider`}>
                      Referral Date
                    </label>
                    <p className={`text-xl font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
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

              {/* Psychiatrist Information Card */}
              <div className={`${darkMode ? 'bg-gradient-to-br from-gray-700/50 to-gray-800/50' : 'bg-gradient-to-br from-gray-50/80 to-white/80'} rounded-3xl p-8 backdrop-blur-sm border ${darkMode ? 'border-gray-600/30' : 'border-gray-200/30'} shadow-2xl hover:shadow-3xl transition-all duration-300`}>
                <div className="flex items-center gap-4 mb-8">
                  <div className="bg-gradient-to-r from-purple-500 to-indigo-600 p-3 rounded-xl">
                    <span className="text-2xl">👨‍⚕️</span>
                  </div>
                  <h3 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
                    Psychiatrist Information
                  </h3>
                </div>
                <div className="grid md:grid-cols-2 gap-8">
                  <div className={`${darkMode ? 'bg-gray-800/30' : 'bg-white/60'} rounded-2xl p-6 border ${darkMode ? 'border-gray-600/20' : 'border-gray-200/30'}`}>
                    <label className={`block text-sm font-bold ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-3 uppercase tracking-wider`}>
                      Name
                    </label>
                    <p className={`text-xl font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                      Dr. {selectedReferral.psychiatrist_name}
                    </p>
                  </div>
                  <div className={`${darkMode ? 'bg-gray-800/30' : 'bg-white/60'} rounded-2xl p-6 border ${darkMode ? 'border-gray-600/20' : 'border-gray-200/30'}`}>
                    <label className={`block text-sm font-bold ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-3 uppercase tracking-wider`}>
                      Email
                    </label>
                    <p className={`text-xl font-semibold ${darkMode ? 'text-white' : 'text-gray-900'} break-all`}>
                      {selectedReferral.psychiatrist_email}
                    </p>
                  </div>
                  {selectedReferral.psychiatrist_phone && (
                    <div className={`${darkMode ? 'bg-gray-800/30' : 'bg-white/60'} rounded-2xl p-6 border ${darkMode ? 'border-gray-600/20' : 'border-gray-200/30'} md:col-span-2`}>
                      <label className={`block text-sm font-bold ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-3 uppercase tracking-wider`}>
                        Phone
                      </label>
                      <p className={`text-xl font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                        {selectedReferral.psychiatrist_phone}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Referral Reason Card */}
              <div className={`${darkMode ? 'bg-gradient-to-br from-gray-700/50 to-gray-800/50' : 'bg-gradient-to-br from-gray-50/80 to-white/80'} rounded-3xl p-8 backdrop-blur-sm border ${darkMode ? 'border-gray-600/30' : 'border-gray-200/30'} shadow-2xl hover:shadow-3xl transition-all duration-300`}>
                <div className="flex items-center gap-4 mb-8">
                  <div className="bg-gradient-to-r from-red-500 to-orange-600 p-3 rounded-xl">
                    <span className="text-2xl">📝</span>
                  </div>
                  <h3 className="text-2xl font-bold bg-gradient-to-r from-red-600 to-orange-600 bg-clip-text text-transparent">
                    Referral Reason
                  </h3>
                </div>
                <div className={`${darkMode ? 'bg-gray-800/50' : 'bg-white/70'} rounded-2xl p-8 border ${darkMode ? 'border-gray-600/20' : 'border-gray-200/30'} shadow-inner`}>
                  <p className={`text-lg leading-relaxed ${darkMode ? 'text-gray-200' : 'text-gray-800'} font-medium`}>
                    {selectedReferral.referral_reason}
                  </p>
                </div>
              </div>


            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Referral;