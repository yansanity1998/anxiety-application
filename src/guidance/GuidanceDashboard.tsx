import { useState, useEffect, useContext } from 'react';
import { supabase } from '../lib/supabase';
import { FaSearch, FaUser, FaEnvelope, FaCalendarAlt, FaSignOutAlt, FaChartLine, FaClipboardList, FaChevronRight, FaMoon, FaSun, FaSync } from 'react-icons/fa';
import { FaArchive, FaBoxOpen } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import GuidanceCharts from './components/GuidanceCharts';
import Footer from './components/Footer';
import Notifications from './components/Notifications';
import LoadingSpinner from './components/LoadingSpinner';
import { ThemeContext } from '../App';
import GuidanceNavbar from './components/GuidanceNavbar';
import { archiveUser, unarchiveUser, isArchived } from './services/archiveService';
import { createAppointment, getAllAppointments } from '../lib/appointmentService';
import CBTModules from './components/CBTModules';
import AnxietyVideos from './components/AnxietyVideos';
import TodoList from './components/TodoList';
import Referral from './components/Referral';
import Schedule from './components/Schedule';
import Records from './components/Records';
import { realtimeService } from '../lib/realtimeService';

type UserProfile = {
  id: string;
  profile_id: number;
  email: string;
  created_at: string;
  full_name: string;
  role: string;
  last_sign_in: string;
  age?: number;
  gender?: string;
  school?: string;
  course?: string;
  year_level?: number;
  phone_number?: string;
  guardian_name?: string;
  guardian_phone_number?: string;
  address?: string;
  id_number?: string;
  streak?: number;
  last_activity_date?: string;
  is_verified?: boolean;
};

type Assessment = {
  id: string;
  profile_id: number;
  total_score: number;
  percentage: number;
  anxiety_level: string;
  answers: number[];
  created_at: string;
  updated_at: string;
};

// Helper function to get the latest assessment for a user
const getLatestAssessment = (userAssessments: Assessment[]): Assessment | null => {
  if (!userAssessments || userAssessments.length === 0) {
    return null;
  }
  
  // Group assessments by day and get the latest for each day
  const assessmentsByDay = userAssessments.reduce((dayGroups, assessment) => {
    const dateKey = new Date(assessment.created_at).toISOString().split('T')[0];
    if (!dayGroups[dateKey]) {
      dayGroups[dateKey] = [];
    }
    dayGroups[dateKey].push(assessment);
    return dayGroups;
  }, {} as { [key: string]: Assessment[] });

  // Get the latest assessment for each day
  const latestAssessmentsPerDay = Object.values(assessmentsByDay).map(dayAssessments => 
    [...dayAssessments].sort((a, b) =>
      new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
    )[0]
  );

  // Return the most recent assessment overall
  return [...latestAssessmentsPerDay].sort((a, b) =>
    new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
  )[0];
};

const getAnxietyLevelColor = (level: string) => {
  switch (level.toLowerCase()) {
    case 'minimal':
      return {
        text: 'text-green-600',
        bg: 'bg-green-50',
        border: 'border-green-200',
        button: 'bg-green-50 hover:bg-green-100 text-green-700',
        darkModeButton: 'bg-green-900 hover:bg-green-800 text-green-300'
      };
    case 'mild':
      return {
        text: 'text-blue-600',
        bg: 'bg-blue-50',
        border: 'border-blue-200',
        button: 'bg-blue-50 hover:bg-blue-100 text-blue-700',
        darkModeButton: 'bg-blue-900 hover:bg-blue-800 text-blue-300'
      };
    case 'moderate':
      return {
        text: 'text-yellow-600',
        bg: 'bg-yellow-50',
        border: 'border-yellow-200',
        button: 'bg-yellow-50 hover:bg-yellow-100 text-yellow-700',
        darkModeButton: 'bg-yellow-900 hover:bg-yellow-800 text-yellow-300'
      };  
    case 'severe':
      return {
        text: 'text-red-600',
        bg: 'bg-red-50',
        border: 'border-red-200',
        button: 'bg-red-50 hover:bg-red-100 text-red-700',
        darkModeButton: 'bg-red-900 hover:bg-red-800 text-red-300'
      };
    default:
      return {
        text: 'text-gray-600',
        bg: 'bg-gray-50',
        border: 'border-gray-200',
        button: 'bg-gray-50 hover:bg-gray-100 text-gray-700',
        darkModeButton: 'bg-gray-800 hover:bg-gray-700 text-gray-300'
      };
  }
};

// Helper function to format date in user-friendly format
const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  const options: Intl.DateTimeFormatOptions = { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  };
  return date.toLocaleDateString('en-US', options);
};

// Mark users as NEW if registered within the last N days
const NEW_USER_DAYS = 1;
const isNewlyRegistered = (createdAt?: string) => {
  if (!createdAt) return false;
  const created = new Date(createdAt).getTime();
  const now = Date.now();
  const diffDays = (now - created) / (1000 * 60 * 60 * 24);
  return diffDays <= NEW_USER_DAYS;
};

export default function GuidanceDashboard() {
  const { darkMode, toggleDarkMode } = useContext(ThemeContext);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [assessments, setAssessments] = useState<{ [key: string]: Assessment[] }>({});
  const [appointments, setAppointments] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);

  const [yearFilter, setYearFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [activeView, setActiveViewState] = useState(() => {
    return localStorage.getItem('guidanceActiveView') || 'dashboard';
  });
  const navigate = useNavigate();

  // Persist activeView to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('guidanceActiveView', activeView);
  }, [activeView]);

  // Custom setter to update both state and localStorage
  const setActiveView = (view: string) => {
    setActiveViewState(view);
    localStorage.setItem('guidanceActiveView', view);
  };

  const Toast = Swal.mixin({
    toast: true,
    position: 'top',
    showConfirmButton: false,
    timer: 1000,
    timerProgressBar: true,
    width: '260px',
    padding: '1rem',
    background: darkMode ? '#1f2937' : '#f8fafc',
    color: darkMode ? '#f3f4f6' : '#111827',
    backdrop: false,
    customClass: {
      popup: `shadow-none border ${darkMode ? 'border-gray-700' : 'border-gray-200'}`,
      title: 'text-sm font-medium',
      htmlContainer: 'text-xs',
      timerProgressBar: 'bg-[#800000]'
    },
    didOpen: (toast) => {
      toast.addEventListener('mouseenter', Swal.stopTimer)
      toast.addEventListener('mouseleave', Swal.resumeTimer)
    }
  });

  const Modal = Swal.mixin({
    background: darkMode ? '#1f2937' : '#f8fafc',
    color: darkMode ? '#f3f4f6' : '#111827',
    backdrop: 'rgba(0, 0, 0, 0.4)',
    width: '370px',
    customClass: {
      container: 'text-sm',
      popup: `rounded-2xl shadow-xl border ${darkMode ? 'border-gray-700' : 'border-gray-200'}`,
      title: 'text-lg font-bold text-[#800000]',
      htmlContainer: `text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'} max-h-96 overflow-y-auto`,
      confirmButton: 'bg-[#800000] hover:bg-[#660000] text-white font-medium py-2 px-4 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl',
      cancelButton: `${darkMode ? 'bg-gray-700 border-gray-600 text-gray-200 hover:bg-gray-600' : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'} border font-medium py-2 px-4 rounded-xl transition-all duration-200 shadow`
    },
    allowOutsideClick: false,
    allowEscapeKey: true,
    allowEnterKey: true,
    stopKeydownPropagation: true,
    scrollbarPadding: false,
    heightAuto: true,
    didOpen: () => {
      document.body.style.overflow = 'hidden';
      document.body.style.paddingRight = '0px';
    },
    didClose: () => {
      document.body.style.overflow = '';
      document.body.style.paddingRight = '';
    }
  });

  useEffect(() => {
    fetchCurrentUser();
    fetchUsers();
    
    // Set up real-time subscriptions
    const unsubscribe = realtimeService.subscribe((payload) => {
      console.log('🔄 Guidance Dashboard: Profile update received', payload);
      
      if (payload.eventType === 'UPDATE' || payload.table === 'profiles') {
        const updatedProfile = payload.new;
        
        if (updatedProfile) {
          // Update the users state with the new profile data
          setUsers(prevUsers => {
            return prevUsers.map(user => {
              if (user.profile_id === updatedProfile.id || user.id === updatedProfile.user_id) {
                return {
                  ...user,
                  ...updatedProfile,
                  id: updatedProfile.user_id || user.id,
                  profile_id: updatedProfile.id || user.profile_id
                };
              }
              return user;
            });
          });
          
          // Show toast notification for real-time update
          Toast.fire({
            icon: 'info',
            iconColor: '#3b82f6',
            title: 'Profile Updated',
            text: `${updatedProfile.full_name || 'User'} profile updated`,
          });
        }
      }
    });
    
    // Cleanup subscription on unmount
    return () => {
      unsubscribe();
    };
  }, []);

  const fetchCurrentUser = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', session.user.id)
          .single();
        
        if (profile) {
          setCurrentUser({
            ...profile,
            id: profile.user_id,
            profile_id: profile.id
          });
        }
      }
    } catch (error) {
      console.error('Error fetching current user:', error);
    }
  };

  const fetchUsers = async () => {
    try {
      console.log('🔍 Fetching users...');
      setIsLoading(true);
      
      // Fetch all users (guidance can see all profiles)
      const { data: usersData, error: usersError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (usersError) {
        console.error('⚠️ Error fetching users:', usersError);
        throw usersError;
      }

      console.log('✅ Successfully fetched users:', usersData?.length || 0);
      
      // Transform users data
      const transformedUsers = usersData?.map(user => ({
        ...user,
        profile_id: user.id, // Ensure profile_id is set
        role: user.role || 'student' // Default role if not set
      })) || [];

      setUsers(transformedUsers);

      console.log('🔍 Fetching assessments...');
      const { data: assessmentsData, error: assessmentsError } = await supabase
        .from('anxiety_assessments')
        .select('*')
        .order('created_at', { ascending: false });

      let assessmentsByUser: { [key: string]: Assessment[] } = {};
      if (assessmentsError) {
        console.error('⚠️ Error fetching assessments:', assessmentsError);
        console.log('   Continuing without assessments data');
        setAssessments({});
      } else {
        console.log('✅ Successfully fetched assessments:', assessmentsData?.length || 0);
        
        // Group assessments by user
        if (assessmentsData) {
          assessmentsByUser = assessmentsData.reduce((acc, assessment) => {
            if (!acc[assessment.profile_id]) {
              acc[assessment.profile_id] = [];
            }
            acc[assessment.profile_id].push(assessment);
            return acc;
          }, {} as { [key: string]: Assessment[] });

          // Sort assessments by date for each user
          Object.keys(assessmentsByUser).forEach(profileId => {
            assessmentsByUser[profileId].sort((a: Assessment, b: Assessment) => 
              new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
            );
          });

          setAssessments(assessmentsByUser);
        }
      }

      // Fetch appointments
      console.log('🔍 Fetching appointments...');
      try {
        const appointmentsData = await getAllAppointments();
        setAppointments(appointmentsData);
        console.log('✅ Successfully fetched appointments:', appointmentsData?.length || 0);
      } catch (appointmentsError) {
        console.error('⚠️ Error fetching appointments:', appointmentsError);
        console.log('   Continuing without appointments data');
        setAppointments([]);
      }

      console.log('🎉 Fetch completed successfully!');
      console.log('   Total users:', transformedUsers.length);
      console.log('   Users with assessments:', assessmentsData ? Object.keys(assessmentsByUser).length : 0);
      console.log('   Total appointments:', appointments?.length || 0);

    } catch (error) {
      console.error('❌ Error in fetchUsers:', error);
      
      // Show detailed error message
      let errorMessage = 'Failed to fetch user data';
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      
      console.error('   Full error:', error);
      
      await Toast.fire({
        icon: 'error',
        iconColor: '#ef4444',
        title: 'Error',
        text: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Filter users based on search term and year filter, excluding archived
  const filteredUsers = users
    .filter(user => !isArchived(user.role))
    .filter(user => {
      const matchesSearch = user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           user.school?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           user.course?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesYear = yearFilter === 'all' || user.year_level?.toString() === yearFilter;
      
      return matchesSearch && matchesYear;
    });

  // Sort: normal users by recent sign-in, then guidance, then admin, then archived
  const sortedUsers = [...filteredUsers].sort((a, b) => {
    const getPriority = (u: UserProfile) => {
      if (isArchived(u.role)) return 3; // archived last
      if (u.role === 'admin') return 2; // admin at the very bottom (before archived)
      if (u.role === 'guidance') return 1; // guidance just before admin
      return 0; // regular users first
    };

    const pa = getPriority(a);
    const pb = getPriority(b);
    if (pa !== pb) return pa - pb;

    const aSignIn = a.last_sign_in ? new Date(a.last_sign_in).getTime() : 0;
    const bSignIn = b.last_sign_in ? new Date(b.last_sign_in).getTime() : 0;
    if (aSignIn !== bSignIn) return bSignIn - aSignIn;

    // fallback to created_at desc
    const aCreated = a.created_at ? new Date(a.created_at).getTime() : 0;
    const bCreated = b.created_at ? new Date(b.created_at).getTime() : 0;
    return bCreated - aCreated;
  });

  // Get active users (non-archived)
  const activeUsers = users.filter(user => !isArchived(user.role));
  
  // Get archived users
  const archivedUsers = users.filter(user => isArchived(user.role));

  // Pagination
  const ITEMS_PER_PAGE = 10;
  const totalPages = Math.ceil(sortedUsers.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const currentUsers = sortedUsers.slice(startIndex, endIndex);

  // Clamp current page if data size changes (e.g., after archiving)
  useEffect(() => {
    const maxPage = Math.max(1, Math.ceil(sortedUsers.length / ITEMS_PER_PAGE));
    if (currentPage > maxPage) {
      setCurrentPage(maxPage);
    }
  }, [sortedUsers.length, ITEMS_PER_PAGE]);


  const handleSignOut = async () => {
    const result = await Modal.fire({
      title: 'Sign Out',
      html: `
        <div class="text-center space-y-3">
          <div class="${darkMode ? 'bg-gray-700' : 'bg-white/80'} backdrop-blur-sm rounded-xl p-4 border ${darkMode ? 'border-gray-600' : 'border-red-200'}">
            <p class="${darkMode ? 'text-gray-300' : 'text-gray-600'}">Are you sure you want to sign out?</p>
          </div>
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: 'Sign Out',
      confirmButtonColor: '#ef4444',
      cancelButtonText: 'Cancel',
      focusCancel: true,
      customClass: {
        popup: 'text-center', 
        htmlContainer: 'text-center', 
        confirmButton: 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-medium py-2 px-4 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl',
        cancelButton: `${darkMode ? 'bg-gray-700 border-gray-600 text-gray-200 hover:bg-gray-600' : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'} border font-medium py-2 px-4 rounded-xl transition-all duration-200 shadow`
      }
    });
  
    if (result.isConfirmed) {
      try {
        await supabase.auth.signOut();
        navigate('/');
      } catch (error) {
        console.error('Error signing out:', error);
        await Toast.fire({
          icon: 'error',
          iconColor: '#ef4444',
          title: 'Error',
          text: 'Failed to sign out',
        });
      }
    }
  };

  const handleArchiveUser = async (user: UserProfile) => {
    try {
      const result = await Modal.fire({
        title: 'Archive Student',
        html: `
          <div class="text-left space-y-3">
            <div class="${darkMode ? 'bg-rose-900' : 'bg-white/80'} backdrop-blur-sm rounded-xl p-4 border ${darkMode ? 'border-gray-600' : 'border-[#800000]/30'}">
              <p class="${darkMode ? 'text-gray-300' : 'text-gray-600'}">Are you sure you want to archive this student?</p>
              <div class="mt-2 p-2 ${darkMode ? 'bg-gray-600' : 'bg-gray-50'} rounded-lg border ${darkMode ? 'border-gray-500' : 'border-gray-200'}">
                <p class="text-xs ${darkMode ? 'text-gray-200' : 'text-gray-800'}"><strong>Name:</strong> ${user.full_name || 'No name'}</p>
                <p class="text-xs ${darkMode ? 'text-gray-300' : 'text-gray-600'}"><strong>Email:</strong> ${user.email}</p>
              </div>
              <p class="${darkMode ? 'text-gray-400' : 'text-gray-500'} text-xs mt-2">Archiving will prevent access while keeping data intact.</p>
            </div>
          </div>
        `,
        showCancelButton: true,
        confirmButtonText: 'Archive',
        confirmButtonColor: '#800000',
        cancelButtonText: 'Cancel',
        focusCancel: true
      });

      if (result.isConfirmed) {
        console.log('📦 Archiving user:', user.id, 'profile:', user.profile_id);
        await archiveUser(user.profile_id);

        // Update local state (mutate role to archived)
        setUsers(prev => prev.map(u => u.profile_id === user.profile_id ? { ...u, role: 'archived' } : u));

        await Toast.fire({
          icon: 'success',
          iconColor: '#22c55e',
          title: 'Archived',
          text: 'Student archived successfully',
        });
      }
    } catch (error) {
      console.error('❌ Error archiving user:', error);
      let errorMessage = 'Failed to archive user';
      if (error instanceof Error) errorMessage = error.message;
      await Toast.fire({
        icon: 'error',
        iconColor: '#ef4444',
        title: 'Error',
        text: errorMessage,
      });
    }
  };

  // Set up global edit functions
  useEffect(() => {
    (window as any).editPersonalInfo = (profileId: string) => {
      const user = users.find(u => u.profile_id.toString() === profileId);
      if (user) {
        handleEditUser(user, 'personal');
      }
    };

    (window as any).editAcademicInfo = (profileId: string) => {
      const user = users.find(u => u.profile_id.toString() === profileId);
      if (user) {
        handleEditUser(user, 'academic');
      }
    };

    (window as any).editGuardianInfo = (profileId: string) => {
      const user = users.find(u => u.profile_id.toString() === profileId);
      if (user) {
        handleEditUser(user, 'guardian');
      }
    };
  }, [users]);

  
  // Handler for scheduling a guidance visit
  const handleSchedule = async (user: UserProfile) => {
    try {
      // Get existing appointments for context (but don't block scheduling)
      const existingAppointments = appointments.filter(app => app.profile_id === user.profile_id);
      const activeAppointments = existingAppointments.filter(app => 
        app.status !== 'Canceled' && app.status !== 'Completed'
      );

      const now = new Date();

      const { value: formValues } = await Swal.fire({
        title: 'Schedule New Appointment',
        html: `
          <div class="space-y-4">
            <!-- User Info Header -->
            <div class="text-center mb-3">
              <div class="inline-flex items-center justify-center w-12 h-12 ${darkMode ? 'bg-[#800000]/20' : 'bg-[#800000]/10'} rounded-full mb-2">
                <svg class="w-6 h-6 ${darkMode ? 'text-[#800000]' : 'text-[#800000]'}" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 class="text-base font-semibold ${darkMode ? 'text-white' : 'text-gray-800'} mb-1">Schedule for ${user.full_name || user.email}</h3>
              <p class="text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}">Add a new appointment (multiple appointments allowed)</p>
            </div>

            <!-- Existing Appointments Info -->
            ${activeAppointments.length > 0 ? `
            <div class="mb-4 p-3 ${darkMode ? 'bg-blue-900/20 border-blue-600/30' : 'bg-blue-50 border-blue-200'} border rounded-lg">
              <div class="flex items-center mb-2">
                <svg class="w-4 h-4 mr-2 ${darkMode ? 'text-blue-400' : 'text-blue-600'}" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <h4 class="text-xs font-semibold ${darkMode ? 'text-blue-400' : 'text-blue-700'}">Existing Active Appointments (${activeAppointments.length})</h4>
              </div>
              <div class="space-y-1.5">
                ${activeAppointments.map(apt => `
                  <div class="flex items-center justify-between p-2 ${darkMode ? 'bg-blue-800/30' : 'bg-white'} rounded-md border ${darkMode ? 'border-blue-600/20' : 'border-blue-200'} shadow-sm">
                    <div class="flex items-center">
                      <div class="w-1.5 h-1.5 ${darkMode ? 'bg-blue-400' : 'bg-blue-600'} rounded-full mr-2"></div>
                      <span class="text-xs font-medium ${darkMode ? 'text-blue-200' : 'text-blue-800'}">${formatDate(apt.appointment_date)}</span>
                    </div>
                    <div class="flex items-center gap-2">
                      <span class="text-xs ${darkMode ? 'text-blue-300' : 'text-blue-600'}">${apt.appointment_time}</span>
                      <span class="text-xs px-2 py-0.5 rounded-full ${darkMode ? 'bg-blue-700 text-blue-200' : 'bg-blue-100 text-blue-700'}">${apt.status}</span>
                    </div>
                  </div>
                `).join('')}
              </div>
            </div>
            ` : ''}

            <!-- Date Selection -->
            <div class="space-y-2">
              <label class="block text-xs font-medium ${darkMode ? 'text-gray-200' : 'text-gray-700'} mb-1">
                <svg class="inline w-3 h-3 mr-1 ${darkMode ? 'text-[#800000]' : 'text-[#800000]'}" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Appointment Date
              </label>
              <div class="relative">
                <input 
                  type="date" 
                  id="schedule-date" 
                  min="${now.toISOString().split('T')[0]}"
                  class="w-full p-2.5 border-2 rounded-lg ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-200 text-gray-900'} focus:ring-2 focus:ring-[#800000]/20 focus:border-[#800000] transition-all duration-200 text-sm font-medium shadow-sm hover:shadow-md" 
                />
                <div class="absolute inset-y-0 right-0 flex items-center pr-3">
                  <button 
                    type="button"
                    onclick="document.getElementById('schedule-date').showPicker()"
                    class="p-1.5 ${darkMode ? 'bg-gray-600 hover:bg-gray-500' : 'bg-gray-100 hover:bg-gray-200'} rounded-md transition-all duration-200 cursor-pointer border ${darkMode ? 'border-gray-500' : 'border-gray-300'}"
                    title="Click to open calendar"
                  >
                    <svg class="w-5 h-5 ${darkMode ? 'text-white' : 'text-[#800000]'}" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>

            <!-- Time Selection -->
            <div class="space-y-2">
              <label class="block text-xs font-medium ${darkMode ? 'text-gray-200' : 'text-gray-700'} mb-1">
                <svg class="inline w-3 h-3 mr-1 ${darkMode ? 'text-[#800000]' : 'text-[#800000]'}" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Appointment Time
              </label>
              <div class="relative">
                <input 
                  type="time" 
                  id="schedule-time" 
                  class="w-full p-2.5 border-2 rounded-lg ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-200 text-gray-900'} focus:ring-2 focus:ring-[#800000]/20 focus:border-[#800000] transition-all duration-200 text-sm font-medium shadow-sm hover:shadow-md" 
                />
                <div class="absolute inset-y-0 right-0 flex items-center pr-3">
                  <button 
                    type="button"
                    onclick="document.getElementById('schedule-time').showPicker()"
                    class="p-1.5 ${darkMode ? 'bg-gray-600 hover:bg-gray-500' : 'bg-gray-100 hover:bg-gray-200'} rounded-md transition-all duration-200 cursor-pointer border ${darkMode ? 'border-gray-500' : 'border-gray-300'}"
                    title="Click to open time picker"
                  >
                    <svg class="w-5 h-5 ${darkMode ? 'text-white' : 'text-[#800000]'}" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>

            <!-- Notes -->
            <div class="space-y-2">
              <label class="block text-xs font-medium ${darkMode ? 'text-gray-200' : 'text-gray-700'} mb-1">
                <svg class="inline w-3 h-3 mr-1 ${darkMode ? 'text-[#800000]' : 'text-[#800000]'}" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Notes (Optional)
              </label>
              <textarea 
                id="schedule-notes" 
                class="w-full p-2.5 border-2 rounded-lg ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-200 text-gray-900'} focus:ring-2 focus:ring-[#800000]/20 focus:border-[#800000] transition-all duration-200 text-sm font-medium shadow-sm hover:shadow-md" 
                rows="2"
                placeholder="Add any notes or special instructions for this appointment..."
              ></textarea>
            </div>

            <!-- Help Text -->
            <div class="text-center">
              <p class="text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}">
                <svg class="inline w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                You can schedule multiple appointments for the same student
              </p>
            </div>
          </div>
        `,
        showCancelButton: true,
        confirmButtonText: 'Schedule Appointment',
        confirmButtonColor: '#800000',
        cancelButtonText: 'Cancel',
        focusConfirm: false,
        preConfirm: () => {
          const date = (document.getElementById('schedule-date') as HTMLInputElement)?.value;
          const time = (document.getElementById('schedule-time') as HTMLInputElement)?.value;
          const notes = (document.getElementById('schedule-notes') as HTMLTextAreaElement)?.value;
          if (!date || !time) {
            Swal.showValidationMessage('Please select both date and time');
            return false;
          }
          return { date, time, notes };
        },
        width: '400px',
        customClass: {
          popup: `rounded-xl shadow-xl border-2 ${darkMode ? 'border-[#800000] bg-gray-900' : 'border-[#800000] bg-white'}`,
          title: `text-lg font-bold ${darkMode ? 'text-[#800000]' : 'text-[#800000]'} mb-3`,
          htmlContainer: `${darkMode ? 'text-gray-200' : 'text-gray-700'}`,
          confirmButton: 'bg-[#800000] hover:bg-[#660000] text-white font-semibold py-2.5 px-5 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105',
          cancelButton: `${darkMode ? 'bg-gray-700 border-gray-600 text-gray-200 hover:bg-gray-600' : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'} border-2 font-semibold py-2.5 px-5 rounded-lg transition-all duration-200 shadow hover:shadow-md`,
          icon: 'hidden'
        }
      });

      if (formValues) {
        try {
          // Save appointment to database
          await createAppointment({
            profile_id: user.profile_id,
            student_name: user.full_name || user.email,
            student_email: user.email,
            appointment_date: formValues.date,
            appointment_time: formValues.time,
            status: 'Scheduled',
            notes: formValues.notes || `Scheduled by guidance counselor for guidance visit`
          });

          await Toast.fire({
            icon: 'success',
            iconColor: '#2563eb',
            title: 'Scheduled',
            text: `Guidance visit scheduled for ${formValues.date} at ${formValues.time}`,
          });

          // Refresh appointments
          await fetchUsers();
        } catch (error) {
          console.error('Error creating appointment:', error);
          let errorMessage = 'Failed to schedule appointment. Please try again.';
          if (error instanceof Error) {
            errorMessage = error.message;
          }
          await Toast.fire({
            icon: 'error',
            iconColor: '#ef4444',
            title: 'Error',
            text: errorMessage,
          });
        }
      }
    } catch (error) {
      console.error('❌ Error scheduling:', error);
      let errorMessage = 'Failed to schedule appointment';
      if (error instanceof Error) errorMessage = error.message;
      await Toast.fire({
        icon: 'error',
        iconColor: '#ef4444',
        title: 'Error',
        text: errorMessage,
      });
    }
  };

  const handleEditUser = async (user: UserProfile, section: 'personal' | 'academic' | 'guardian') => {
    try {
      let title = '';
      let fields: { name: string; label: string; type: string; value: any }[] = [];
      
      if (section === 'personal') {
        title = 'Edit Personal Information';
        fields = [
          { name: 'full_name', label: 'Full Name', type: 'text', value: user.full_name || '' },
          { name: 'age', label: 'Age', type: 'number', value: user.age || '' },
          { name: 'gender', label: 'Gender', type: 'select', value: user.gender || '' },
          { name: 'phone_number', label: 'Phone Number', type: 'tel', value: user.phone_number || '' },
          { name: 'address', label: 'Address', type: 'textarea', value: user.address || '' }
        ];
      } else if (section === 'academic') {
        title = 'Edit Academic Information';
        fields = [
          { name: 'school', label: 'School', type: 'text', value: user.school || '' },
          { name: 'course', label: 'Course', type: 'text', value: user.course || '' },
          { name: 'year_level', label: 'Year Level', type: 'select', value: user.year_level || '' },
          { name: 'id_number', label: 'ID Number', type: 'text', value: user.id_number || '' }
        ];
      } else if (section === 'guardian') {
        title = 'Edit Guardian Information';
        fields = [
          { name: 'guardian_name', label: 'Guardian Name', type: 'text', value: user.guardian_name || '' },
          { name: 'guardian_phone_number', label: 'Guardian Phone', type: 'tel', value: user.guardian_phone_number || '' }
        ];
      }

      const { value: formValues } = await Swal.fire({
        title,
        html: `
          <div class="space-y-3">
            <div class="text-center mb-3">
              <p class="text-xs ${darkMode ? 'text-gray-300' : 'text-gray-600'}">Editing: <strong class="${darkMode ? 'text-white' : 'text-gray-800'}">${user.full_name || user.email}</strong></p>
            </div>
            ${fields.map(field => `
              <div class="text-left">
                <label class="block text-xs font-medium ${darkMode ? 'text-gray-200' : 'text-gray-700'} mb-1">${field.label}</label>
                ${field.type === 'select' && field.name === 'gender' ? `
                  <select id="${field.name}" class="w-full p-2 border rounded-md ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'} focus:ring-2 focus:ring-[#800000] focus:border-[#800000] transition-colors text-sm">
                    <option value="">Select Gender</option>
                    <option value="Male" ${field.value === 'Male' ? 'selected' : ''}>Male</option>
                    <option value="Female" ${field.value === 'Female' ? 'selected' : ''}>Female</option>
                    <option value="Other" ${field.value === 'Other' ? 'selected' : ''}>Other</option>
                  </select>
                ` : field.type === 'select' && field.name === 'year_level' ? `
                  <select id="${field.name}" class="w-full p-2 border rounded-md ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'} focus:ring-2 focus:ring-[#800000] focus:border-[#800000] transition-colors text-sm">
                    <option value="">Select Year Level</option>
                    <option value="1" ${field.value === 1 ? 'selected' : ''}>1st Year</option>
                    <option value="2" ${field.value === 2 ? 'selected' : ''}>2nd Year</option>
                    <option value="3" ${field.value === 3 ? 'selected' : ''}>3rd Year</option>
                    <option value="4" ${field.value === 4 ? 'selected' : ''}>4th Year</option>
                  </select>
                ` : field.type === 'textarea' ? `
                  <textarea id="${field.name}" class="w-full p-2 border rounded-md ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'} focus:ring-2 focus:ring-[#800000] focus:border-[#800000] transition-colors text-sm" rows="2" placeholder="Enter ${field.label.toLowerCase()}">${field.value}</textarea>
                ` : `
                  <input type="${field.type}" id="${field.name}" value="${field.value}" class="w-full p-2 border rounded-md ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'} focus:ring-2 focus:ring-[#800000] focus:border-[#800000] transition-colors text-sm" placeholder="Enter ${field.label.toLowerCase()}">
                `}
              </div>
            `).join('')}
            <div class="text-center mt-3">
              <p class="text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}">All fields are optional</p>
            </div>
          </div>
        `,
        showCancelButton: true,
        confirmButtonText: 'Save Changes',
        confirmButtonColor: '#800000',
        cancelButtonText: 'Cancel',
        focusConfirm: false,
        preConfirm: () => {
          const formData: any = {};
          fields.forEach(field => {
            const element = document.getElementById(field.name) as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;
            if (element) {
              formData[field.name] = field.type === 'number' ? parseInt(element.value) || null : element.value;
            }
          });
          return formData;
        },
        width: '400px',
        customClass: {
          popup: `rounded-xl shadow-xl border ${darkMode ? 'border-gray-600 bg-gray-800' : 'border-gray-200 bg-white'}`,
          title: `text-lg font-bold ${darkMode ? 'text-white' : 'text-gray-900'} mb-3`,
          htmlContainer: `${darkMode ? 'text-gray-200' : 'text-gray-700'}`,
          confirmButton: 'bg-[#800000] hover:bg-[#660000] text-white font-medium py-2 px-5 rounded-lg transition-colors shadow-lg hover:shadow-xl',
          cancelButton: `${darkMode ? 'bg-gray-700 border-gray-600 text-gray-200 hover:bg-gray-600' : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'} border font-medium py-2 px-5 rounded-lg transition-colors shadow`
        }
      });

      if (formValues) {
        console.log('📝 Updating user:', user.profile_id, 'section:', section, 'data:', formValues);
        
        const { error } = await supabase
          .from('profiles')
          .update(formValues)
          .eq('id', user.profile_id);

        if (error) {
          throw new Error(`Failed to update user: ${error.message}`);
        }

        // Update local state
        setUsers(prev => prev.map(u => 
          u.profile_id === user.profile_id 
            ? { ...u, ...formValues }
            : u
        ));

        await Toast.fire({
          icon: 'success',
          iconColor: '#22c55e',
          title: 'Updated',
          text: `${title} updated successfully`,
        }); 
        
        console.log('🎉 User updated successfully');
      }
    } catch (error) {
      console.error('❌ Error updating user:', error);
      
      let errorMessage = 'Failed to update user';
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      
      await Toast.fire({
        icon: 'error',
        iconColor: '#ef4444',
        title: 'Error',
        text: errorMessage,
      });
    }
  };

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
      {/* Header */}
      <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border-b shadow-sm`}>
        <div className="max-w-10xl mx-auto px-6 sm:px-12 lg:px-16">
          <div className="flex justify-between items-center py-6">
                          <div className="flex items-center space-x-3">
              <button 
                onClick={() => setActiveView('dashboard')}
                className={`rounded-full transition-all duration-200 hover:scale-105 p-1 ${
                  darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
                }`}
                title="Go to Dashboard"
              >
                <img src="/spc-guidance.png" alt="Guidance Service Center" className="h-15 w-15 object-contain" />
              </button>
              <div>
                <h1 className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-red-900'}`}>
                  {currentUser?.full_name ? `${currentUser.full_name.split(' ')[0]} Dashboard` : 'Guidance Dashboard'}
                </h1>
                <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-red-900'}`}>
                  Student Counseling & Support Management
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={toggleDarkMode}
                className={`p-1.5 rounded-full ${darkMode ? 'bg-gray-700 text-yellow-300 hover:bg-gray-600' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
              >
                {darkMode ? <FaSun /> : <FaMoon />}
              </button>
                              <div className="relative">
                  <Notifications darkMode={darkMode} />
                </div>
              <button
                onClick={handleSignOut}
                className="flex items-center gap-1 px-2 py-1.5 bg-red-900 text-white rounded-md hover:bg-red-700 transition-colors hover:cursor-pointer text-xs"
              >
                <FaSignOutAlt />
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </div>
      
      <GuidanceNavbar activeView={activeView} setActiveView={setActiveView} darkMode={darkMode} archivedUsersCount={archivedUsers.length} />

      <div className="max-w-10xl mx-auto px-6 sm:px-12 lg:px-16 py-8">
        {activeView === 'dashboard' && (
          <div className="w-full">
            <GuidanceCharts users={users} assessments={assessments} appointments={appointments} darkMode={darkMode} compact={true} />
          </div>
        )}

        {activeView === 'users' && (
          <>
            {/* Student count summary card - restored to original size, keep icon */}
            <div className={`mb-4 flex items-center ${darkMode ? 'bg-gray-700' : 'bg-[#800000]/5'} rounded-lg px-4 py-3 border ${darkMode ? 'border-gray-600' : 'border-[#800000]/30'} w-fit`}> 
              <FaUser className={`mr-2 text-xl ${darkMode ? 'text-[#f3f4f6]' : 'text-[#800000]'}`} />
              <span className={`font-semibold text-base ${darkMode ? 'text-[#f3f4f6]' : 'text-[#800000]'}`}>Active Students:</span>
              <span className={`ml-2 text-lg font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{activeUsers.filter(u => u.role === 'student').length}</span>
            </div>
            <div className="mb-3">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <input
                    type="text"
                    placeholder="Search students by email or name..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className={`w-full pl-8 pr-2 py-1.5 border ${darkMode ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-400 focus:ring-[#800000] focus:border-[#800000]' : 'border-gray-200 focus:ring-2 focus:ring-[#800000]'} rounded-md focus:outline-none text-xs`}
                  />
                  <FaSearch className={`absolute left-2 top-2.5 ${darkMode ? 'text-gray-400' : 'text-gray-400'} text-xs`} />
                </div>
                <select
                  value={yearFilter}
                  onChange={(e) => setYearFilter(e.target.value)}
                  aria-label="Filter by year level"
                  className={`px-2 py-1.5 border rounded-md text-xs focus:outline-none ${darkMode ? 'bg-gray-800 border-gray-700 text-white focus:ring-[#800000] focus:border-[#800000]' : 'bg-white border-gray-200 text-gray-700 focus:ring-2 focus:ring-[#800000]'}`}
                >
                  <option value="all">All Years</option>
                  <option value="1">1st Year</option>
                  <option value="2">2nd Year</option>
                  <option value="3">3rd Year</option>
                  <option value="4">4th Year</option>
                </select>
                <button
                  onClick={fetchUsers}
                  disabled={isLoading}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors flex items-center gap-1 ${
                    isLoading
                      ? `${darkMode ? 'bg-gray-700 text-gray-400' : 'bg-gray-200 text-gray-400'} cursor-not-allowed`
                      : `${darkMode ? 'bg-[#800000] hover:bg-[#660000] text-white' : 'bg-[#800000] hover:bg-[#660000] text-white'}`
                  }`}
                >
                  <FaSync className={`text-xs ${isLoading ? 'animate-spin' : ''}`} />
                  Refresh
                </button>
              </div>
            </div>

            <div className={`rounded-md shadow overflow-x-auto ${darkMode ? 'bg-gray-800' : 'bg-white'} w-full`}>
              <div className="overflow-x-auto w-full">
                <table className={`min-w-full divide-y ${darkMode ? 'divide-gray-700' : 'divide-gray-200'} w-full text-xs`}>
                  <thead className="bg-[#800000]">
                    <tr>
                      <th className="px-4 py-3 text-center text-xs font-bold uppercase tracking-wider text-white">Users</th>
                      <th className="px-4 py-3 text-center text-xs font-bold uppercase tracking-wider text-white">Email</th>
                      <th className="px-4 py-3 text-center text-xs font-bold uppercase tracking-wider text-white">Verified</th>
                      <th className="px-4 py-3 text-center text-xs font-bold uppercase tracking-wider text-white">Role</th>
                      <th className="px-4 py-3 text-center text-xs font-bold uppercase tracking-wider text-white">Registration Info</th>
                      <th className="px-4 py-3 text-center text-xs font-bold uppercase tracking-wider text-white">Latest Assessment</th>
                      <th className="px-4 py-3 text-center text-xs font-bold uppercase tracking-wider text-white">Joined</th>
                      <th className="px-4 py-3 text-center text-xs font-bold uppercase tracking-wider text-white">Last Sign In</th>
                      <th className="px-4 py-3 text-center text-xs font-bold uppercase tracking-wider text-white">Actions</th>
                    </tr>
                  </thead>
                  <tbody className={`divide-y ${darkMode ? 'divide-gray-700 bg-gray-800' : 'divide-gray-200 bg-white'}`}>
                                         {isLoading ? (
                       <tr>
                         <td colSpan={8} className={`px-4 py-3 text-center ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                           <div className="flex items-center justify-center space-x-2">
                             <div className={`w-4 h-4 rounded-full border-2 ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}></div>
                             <div className={`w-4 h-4 rounded-full border-2 border-t-blue-500 border-r-purple-500 animate-spin`}></div>
                             <span>Loading data...</span>
                           </div>
                         </td>
                       </tr>
                     ) : currentUsers.length === 0 ? (
                       <tr>
                         <td colSpan={8} className={`px-4 py-3 text-center ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                           No users found
                         </td>
                       </tr>
                     ) : (
                      currentUsers.map((user) => (
                        <tr key={user.id} className={darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50'}>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-8 w-8">
                                <div className={`h-8 w-8 rounded-full flex items-center justify-center ${
                                  user.role === 'admin'
                                    ? 'bg-red-200'
                                    : user.gender?.toLowerCase() === 'male' 
                                    ? 'bg-blue-100' 
                                    : user.gender?.toLowerCase() === 'female'
                                    ? 'bg-pink-100'
                                    : 'bg-orange-100'
                                }`}>
                                  <FaUser className={`${
                                    user.role === 'admin'
                                      ? 'text-red-700'
                                      : user.gender?.toLowerCase() === 'male'
                                      ? 'text-blue-500'
                                      : user.gender?.toLowerCase() === 'female'
                                      ? 'text-pink-500'
                                      : 'text-orange-500'
                                  }`} />
                                </div>
                              </div>
                              <div className="ml-3">
                                <div className="flex items-center gap-2">
                                  <div className={`text-xs font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                                    {user.full_name || 'No name'}
                                  </div>
                                  {isNewlyRegistered(user.created_at) && !isArchived(user.role) && (
                                    <span
                                      className={`px-2 py-0.5 text-[10px] font-semibold rounded-full border inline-flex items-center gap-1 ${
                                        darkMode
                                          ? 'bg-green-900/40 border-green-700 text-green-300'
                                          : 'bg-green-50 border-green-200 text-green-700'
                                      }`}
                                      title="Just registered"
                                    >
                                      <span className={`w-1.5 h-1.5 rounded-full ${darkMode ? 'bg-green-400' : 'bg-green-500'} animate-pulse`}></span>
                                      NEW
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div className={`flex items-center text-xs ${darkMode ? 'text-gray-200' : 'text-gray-900'}`}>
                              <FaEnvelope className={`mr-2 ${darkMode ? 'text-gray-400' : 'text-gray-400'}`} />
                              {user.email}
                            </div>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span className={`px-2 py-0.5 inline-flex text-[10px] leading-5 font-semibold rounded-full ${
                              (user as any).is_verified ? (darkMode ? 'bg-green-900/40 text-green-300 border border-green-700' : 'bg-green-50 text-green-700 border border-green-200') : (darkMode ? 'bg-yellow-900/40 text-yellow-300 border border-yellow-700' : 'bg-yellow-50 text-yellow-700 border border-yellow-200')
                            }`}>
                              {(user as any).is_verified ? 'Verified' : 'Pending'}
                            </span>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              user.role === 'admin' || user.role === 'guidance'
                                ? 'bg-purple-100 text-purple-800'
                                : 'bg-green-100 text-green-800'
                            }`}>
                              {user.role}
                            </span>
                          </td>
                                                     <td className="px-4 py-3">
                             <div className={`text-xs ${darkMode ? 'text-gray-200' : 'text-gray-900'}`}>
                               <div className="flex items-center">
                                 <FaClipboardList className={`mr-2 ${darkMode ? 'text-gray-400' : 'text-gray-400'}`} />
                                 <button
                                   onClick={() => {
                                     Modal.fire({
                                       title: 'Registration Details',
                                       html: `
                                         <div class="text-left space-y-2">
                                           <div class="${darkMode ? 'bg-gray-700' : 'bg-white'} rounded-xl p-2 border ${darkMode ? 'border-gray-600' : 'border-gray-200'} shadow-sm">
                                             <h3 class="text-sm font-semibold ${darkMode ? 'text-gray-200' : 'text-gray-800'} mb-1 flex items-center justify-between">
                                               <div class="flex items-center">
                                                 <div class="${darkMode ? 'bg-gray-600' : 'bg-[#800000]/10'} p-1 rounded-lg mr-2">
                                                   <svg class="w-4 h-4 ${darkMode ? 'text-gray-300' : 'text-[#800000]'}" fill="currentColor" viewBox="0 0 20 20">
                                                     <path fill-rule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clip-rule="evenodd" />
                                                   </svg>
                                                 </div>
                                                 Personal Information
                                               </div>
                                               <button onclick="window.editPersonalInfo && window.editPersonalInfo('${user.profile_id}')" class="p-1 rounded-full ${darkMode ? 'hover:bg-gray-600' : 'hover:bg-gray-100'} transition-colors" title="Edit Personal Information">
                                                 <svg class="w-4 h-4 ${darkMode ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-[#800000]'}" fill="currentColor" viewBox="0 0 20 20">
                                                   <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                                                 </svg>
                                               </button>
                                             </h3>
                                             <div class="space-y-1">
                                               <div class="flex items-center group">
                                                 <label class="text-xs font-medium ${darkMode ? 'text-gray-400' : 'text-gray-600'} w-20">Full Name</label>
                                                 <div class="flex-1 ml-2 p-1 ${darkMode ? 'bg-gray-600' : 'bg-gray-50'} rounded-lg">
                                                   <p class="text-xs ${darkMode ? 'text-gray-200' : 'text-gray-800'}">${user.full_name || 'Not provided'}</p>
                                                 </div>
                                               </div>
                                               <div class="flex items-center group">
                                                 <label class="text-xs font-medium ${darkMode ? 'text-gray-400' : 'text-gray-600'} w-20">Email</label>
                                                 <div class="flex-1 ml-2 p-1 ${darkMode ? 'bg-gray-600' : 'bg-gray-50'} rounded-lg">
                                                   <p class="text-xs ${darkMode ? 'text-gray-200' : 'text-gray-800'}">${user.email}</p>
                                                 </div>
                                               </div>
                                               <div class="flex items-center group">
                                                 <label class="text-xs font-medium ${darkMode ? 'text-gray-400' : 'text-gray-600'} w-20">Age</label>
                                                 <div class="flex-1 ml-2 p-1 ${darkMode ? 'bg-gray-600' : 'bg-gray-50'} rounded-lg">
                                                   <p class="text-xs ${darkMode ? 'text-gray-200' : 'text-gray-800'}">${user.age || 'Not provided'}</p>
                                                 </div>
                                               </div>
                                               <div class="flex items-center group">
                                                 <label class="text-xs font-medium ${darkMode ? 'text-gray-400' : 'text-gray-600'} w-20">Gender</label>
                                                 <div class="flex-1 ml-2 p-1 ${darkMode ? 'bg-gray-600' : 'bg-gray-50'} rounded-lg">
                                                   <p class="text-xs ${darkMode ? 'text-gray-200' : 'text-gray-800'}">${user.gender || 'Not provided'}</p>
                                                 </div>
                                               </div>
                                               <div class="flex items-center group">
                                                 <label class="text-xs font-medium ${darkMode ? 'text-gray-400' : 'text-gray-600'} w-20">Phone</label>
                                                 <div class="flex-1 ml-2 p-1 ${darkMode ? 'bg-gray-600' : 'bg-gray-50'} rounded-lg">
                                                   <p class="text-xs ${darkMode ? 'text-gray-200' : 'text-gray-800'}">${user.phone_number || 'Not provided'}</p>
                                                 </div>
                                               </div>
                                               <div class="flex items-center group">
                                                 <label class="text-xs font-medium ${darkMode ? 'text-gray-400' : 'text-gray-600'} w-20">Address</label>
                                                 <div class="flex-1 ml-2 p-1 ${darkMode ? 'bg-gray-600' : 'bg-gray-50'} rounded-lg">
                                                   <p class="text-xs ${darkMode ? 'text-gray-200' : 'text-gray-800'}">${user.address || 'Not provided'}</p>
                                                 </div>
                                               </div>
                                             </div>
                                           </div>
                                           <div class="${darkMode ? 'bg-gray-700' : 'bg-white'} rounded-xl p-2 border ${darkMode ? 'border-gray-600' : 'border-gray-200'} shadow-sm">
                                             <h3 class="text-sm font-semibold ${darkMode ? 'text-gray-200' : 'text-gray-800'} mb-1 flex items-center justify-between">
                                               <div class="flex items-center">
                                                 <div class="${darkMode ? 'bg-gray-600' : 'bg-[#800000]/10'} p-1 rounded-lg mr-2">
                                                   <svg class="w-4 h-4 ${darkMode ? 'text-gray-300' : 'text-[#800000]'}" fill="currentColor" viewBox="0 0 20 20">
                                                     <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                                                     <path fill-rule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clip-rule="evenodd" />
                                                   </svg>
                                                 </div>
                                                 Academic Information
                                               </div>
                                               <button onclick="window.editAcademicInfo && window.editAcademicInfo('${user.profile_id}')" class="p-1 rounded-full ${darkMode ? 'hover:bg-gray-600' : 'hover:bg-gray-100'} transition-colors" title="Edit Academic Information">
                                                 <svg class="w-4 h-4 ${darkMode ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-[#800000]'}" fill="currentColor" viewBox="0 0 20 20">
                                                   <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                                                 </svg>
                                               </button>
                                             </h3>
                                             <div class="space-y-1">
                                               <div class="flex items-center group">
                                                 <label class="text-xs font-medium ${darkMode ? 'text-gray-400' : 'text-gray-600'} w-20">School</label>
                                                 <div class="flex-1 ml-2 p-1 ${darkMode ? 'bg-gray-600' : 'bg-gray-50'} rounded-lg">
                                                   <p class="text-xs ${darkMode ? 'text-gray-200' : 'text-gray-800'}">${user.school || 'Not provided'}</p>
                                                 </div>
                                               </div>
                                               <div class="flex items-center group">
                                                 <label class="text-xs font-medium ${darkMode ? 'text-gray-400' : 'text-gray-600'} w-20">Course</label>
                                                 <div class="flex-1 ml-2 p-1 ${darkMode ? 'bg-gray-600' : 'bg-gray-50'} rounded-lg">
                                                   <p class="text-xs ${darkMode ? 'text-gray-200' : 'text-gray-800'}">${user.course || 'Not provided'}</p>
                                                 </div>
                                               </div>
                                               <div class="flex items-center group">
                                                 <label class="text-xs font-medium ${darkMode ? 'text-gray-400' : 'text-gray-600'} w-20">Year Level</label>
                                                 <div class="flex-1 ml-2 p-1 ${darkMode ? 'bg-gray-600' : 'bg-gray-50'} rounded-lg">
                                                   <p class="text-xs ${darkMode ? 'text-gray-200' : 'text-gray-800'}">${user.year_level || 'Not provided'}</p>
                                                 </div>
                                               </div>
                                               <div class="flex items-center group">
                                                 <label class="text-xs font-medium ${darkMode ? 'text-gray-400' : 'text-gray-600'} w-20">ID Number</label>
                                                 <div class="flex-1 ml-2 p-1 ${darkMode ? 'bg-gray-600' : 'bg-gray-50'} rounded-lg">
                                                   <p class="text-xs ${darkMode ? 'text-gray-200' : 'text-gray-800'}">${user.id_number || 'Not provided'}</p>
                                                 </div>
                                               </div>
                                             </div>
                                           </div>
                                           <div class="${darkMode ? 'bg-gray-700' : 'bg-white'} rounded-xl p-2 border ${darkMode ? 'border-gray-600' : 'border-gray-200'} shadow-sm">
                                             <h3 class="text-sm font-semibold ${darkMode ? 'text-gray-200' : 'text-gray-800'} mb-1 flex items-center justify-between">
                                               <div class="flex items-center">
                                                 <div class="${darkMode ? 'bg-gray-600' : 'bg-[#800000]/10'} p-1 rounded-lg mr-2">
                                                   <svg class="w-4 h-4 ${darkMode ? 'text-gray-300' : 'text-[#800000]'}" fill="currentColor" viewBox="0 0 20 20">
                                                     <path fill-rule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clip-rule="evenodd" />
                                                   </svg>
                                                 </div>
                                                 Guardian Information
                                               </div>
                                               <button onclick="window.editGuardianInfo && window.editGuardianInfo('${user.profile_id}')" class="p-1 rounded-full ${darkMode ? 'hover:bg-gray-600' : 'hover:bg-gray-100'} transition-colors" title="Edit Guardian Information">
                                                 <svg class="w-4 h-4 ${darkMode ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-[#800000]'}" fill="currentColor" viewBox="0 0 20 20">
                                                   <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                                                 </svg>
                                               </button>
                                             </h3>
                                             <div class="space-y-1">
                                               <div class="flex items-center group">
                                                 <label class="text-xs font-medium ${darkMode ? 'text-gray-400' : 'text-gray-600'} w-20">Guardian Name</label>
                                                 <div class="flex-1 ml-2 p-1 ${darkMode ? 'bg-gray-600' : 'bg-gray-50'} rounded-lg">
                                                   <p class="text-xs ${darkMode ? 'text-gray-200' : 'text-gray-800'}">${user.guardian_name || 'Not provided'}</p>
                                                 </div>
                                               </div>
                                               <div class="flex items-center group">
                                                 <label class="text-xs font-medium ${darkMode ? 'text-gray-400' : 'text-gray-600'} w-20">Guardian Phone</label>
                                                 <div class="flex-1 ml-2 p-1 ${darkMode ? 'bg-gray-600' : 'bg-gray-50'} rounded-lg">
                                                   <p class="text-xs ${darkMode ? 'text-gray-200' : 'text-gray-800'}">${user.guardian_phone_number || 'Not provided'}</p>
                                                 </div>
                                               </div>
                                             </div>
                                           </div>
                                         </div>
                                       `,
                                       width: '370px',
                                       customClass: {
                                         popup: 'rounded-lg shadow-lg border border-gray-200',
                                         title: 'text-base font-bold text-gray-900'
                                       },
                                       showConfirmButton: true,
                                       confirmButtonText: 'Close',
                                       showCancelButton: false,
                                     });
                                   }}
                                   className={`${darkMode ? 'text-[#f3f4f6] hover:text-white' : 'text-[#800000] hover:text-[#660000]'} text-xs font-medium flex items-center`}
                                 >
                                   View Registration Details
                                   <FaChevronRight className="ml-1 text-xs" />
                                 </button>
                               </div>
                             </div>
                           </td>
                                                     <td className="px-4 py-3">
                             <div className={`text-xs ${darkMode ? 'text-gray-200' : 'text-gray-900'}`}>
                               <div className="flex items-center">
                                 <FaChartLine className={`mr-2 ${darkMode ? 'text-gray-400' : 'text-gray-400'}`} />
                                 <button
                                   onClick={() => {
                                     if (assessments[user.profile_id] && assessments[user.profile_id].length > 0) {
                                       const latestAssessment = getLatestAssessment(assessments[user.profile_id]);
                                       if (latestAssessment) {
                                         const anxietyLevel = latestAssessment.anxiety_level;
                                         const colors = getAnxietyLevelColor(anxietyLevel);
                                         Modal.fire({
                                           title: 'Assessment Details',
                                           html: `
                                             <div class="text-left space-y-2">
                                               <div class="${darkMode ? 'bg-gray-700' : 'bg-white/80'} rounded-xl p-3 border ${darkMode ? 'border-gray-600' : colors.border}">
                                                 <div class="flex items-center justify-between mb-2">
                                                   <p class="mb-1"><strong class="${darkMode ? 'text-gray-200' : 'text-gray-800'}">Anxiety Level:</strong></p>
                                                   <span class="px-2 py-0.5 rounded-full ${darkMode ? 'bg-gray-600' : colors.bg} ${colors.text} font-medium text-xs">
                                                     ${anxietyLevel}
                                                   </span>
                                                 </div>
                                                 <p class="mb-1 text-xs"><strong class="${darkMode ? 'text-gray-200' : 'text-gray-800'}">Total Score:</strong> <span class="${darkMode ? 'text-gray-300' : 'text-gray-600'}">${latestAssessment.total_score}</span></p>
                                                 <p class="mb-1 text-xs"><strong class="${darkMode ? 'text-gray-200' : 'text-gray-800'}">Percentage:</strong> <span class="${darkMode ? 'text-gray-300' : 'text-gray-600'}">${latestAssessment.percentage}%</span></p>
                                                 <p class="mb-1 text-xs"><strong class="${darkMode ? 'text-gray-200' : 'text-gray-800'}">Date:</strong> <span class="${darkMode ? 'text-gray-300' : 'text-gray-600'}">${new Date(latestAssessment.created_at).toLocaleString()}</span></p>
                                               </div>
                                               <div class="${darkMode ? 'bg-gray-700' : 'bg-white/80'} rounded-xl p-3 border ${darkMode ? 'border-gray-600' : 'border-gray-200'}">
                                                 <p class="mb-1 font-medium ${darkMode ? 'text-gray-200' : 'text-gray-800'} text-xs">Answers:</p>
                                                 <div class="text-xs space-y-1">
                                                   ${latestAssessment.answers.map((answer, index) => `
                                                     <div class="flex items-center justify-between py-0.5 px-2 rounded-lg ${darkMode ? 'bg-gray-600' : 'bg-gray-50'}">
                                                       <span class="${darkMode ? 'text-gray-300' : 'text-gray-700'}">Q${index + 1}</span>
                                                       <span class="font-medium text-xs ${
                                                         answer === 0 ? 'text-green-600' :
                                                         answer === 1 ? 'text-green-500' :
                                                         answer === 2 ? 'text-yellow-500' :
                                                         answer === 3 ? 'text-orange-500' :
                                                         'text-red-500'
                                                       }">
                                                         ${answer === 0 ? 'Never' : 
                                                           answer === 1 ? 'Rarely' : 
                                                           answer === 2 ? 'Sometimes' : 
                                                           answer === 3 ? 'Often' : 'Very Often'}
                                                       </span>
                                                     </div>
                                                   `).join('')}
                                                 </div>
                                               </div>
                                             </div>
                                           `,
                                           width: '370px',
                                           customClass: {
                                             popup: 'rounded-lg shadow-lg border border-gray-200',
                                             title: 'text-base font-bold text-gray-900',
                                             confirmButton: 'bg-[#800000] hover:bg-[#660000] text-white font-medium py-2 px-4 rounded-lg transition-colors'
                                           },
                                           showConfirmButton: true,
                                           confirmButtonText: 'Close',
                                           showCancelButton: false,
                                         });
                                       } else {
                                         Modal.fire({
                                           title: 'Assessment Details',
                                           html: `
                                             <div class="text-left space-y-2">
                                               <div class="${darkMode ? 'bg-gray-700' : 'bg-white/80'} rounded-xl p-3 border ${darkMode ? 'border-gray-600' : 'border-gray-200'}">
                                                 <p class="${darkMode ? 'text-gray-300' : 'text-gray-600'} text-center text-xs">No assessments available for this user yet.</p>
                                               </div>
                                             </div>
                                           `,
                                           width: '370px',
                                           customClass: {
                                             popup: 'rounded-lg shadow-lg border border-gray-200',
                                             title: 'text-base font-bold text-gray-900',
                                             confirmButton: 'bg-[#800000] hover:bg-[#660000] text-white font-medium py-2 px-4 rounded-lg transition-colors'
                                           },
                                           showConfirmButton: true,
                                           confirmButtonText: 'Close',
                                           showCancelButton: false,
                                         });
                                       }
                                     } else {
                                       Modal.fire({
                                         title: 'Assessment Details',
                                         html: `
                                           <div class="text-left space-y-2">
                                             <div class="${darkMode ? 'bg-gray-700' : 'bg-white/80'} rounded-xl p-3 border ${darkMode ? 'border-gray-600' : 'border-gray-200'}">
                                               <p class="${darkMode ? 'text-gray-300' : 'text-gray-600'} text-center text-xs">No assessments available for this user yet.</p>
                                             </div>
                                           </div>
                                         `,
                                         width: '370px',
                                         customClass: {
                                           popup: 'rounded-lg shadow-lg border border-gray-200',
                                           title: 'text-base font-bold text-gray-900'
                                         },
                                         showConfirmButton: true,
                                         confirmButtonText: 'Close',
                                         showCancelButton: false,
                                       });
                                     }
                                   }}
                                   className={`text-xs font-medium flex items-center px-3 py-1.5 rounded-lg transition-colors ${
                                     assessments[user.profile_id] && assessments[user.profile_id].length > 0
                                       ? (() => {
                                           const latestAssessment = getLatestAssessment(assessments[user.profile_id]);
                                           if (latestAssessment) {
                                             const colors = getAnxietyLevelColor(latestAssessment.anxiety_level);
                                             return darkMode
                                               ? `${colors.darkModeButton}`
                                               : `${colors.button}`;
                                           }
                                           return darkMode
                                           ? 'bg-gray-700 hover:bg-gray-600 text-gray-200'
                                             : 'bg-gray-50 hover:bg-gray-100 text-gray-700';
                                         })()
                                       : (darkMode
                                           ? 'bg-gray-700 hover:bg-gray-600 text-gray-200'
                                           : 'bg-gray-50 hover:bg-gray-100 text-gray-700')
                                   }`}
                                 >
                                   {assessments[user.profile_id] && assessments[user.profile_id].length > 0 ? (
                                     <>
                                       {(() => {
                                         const latestAssessment = getLatestAssessment(assessments[user.profile_id]);
                                         if (latestAssessment) {
                                           return `${latestAssessment.anxiety_level || 'Unknown'} Anxiety`;
                                         }
                                         return 'Unknown Anxiety';
                                       })()}
                                       <FaChevronRight className="ml-1 text-xs" />
                                     </>
                                   ) : (
                                     <>
                                       No Assessment Yet
                                       <FaChevronRight className="ml-1 text-xs" />
                                     </>
                                   )}
                                 </button>
                               </div>
                             </div>
                           </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div className={`flex items-center text-xs ${darkMode ? 'text-gray-300' : 'text-gray-500'}`}>
                              <FaCalendarAlt className={`mr-2 ${darkMode ? 'text-gray-400' : 'text-gray-400'}`} />
                              {formatDate(user.created_at)}
                            </div>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div className={`flex items-center text-xs ${darkMode ? 'text-gray-300' : 'text-gray-500'}`}>
                              <FaCalendarAlt className={`mr-2 ${darkMode ? 'text-gray-400' : 'text-gray-400'}`} />
                              {user.last_sign_in 
                                ? formatDate(user.last_sign_in)
                                : 'Never'}
                            </div>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div className="flex items-center justify-center space-x-2">
                              <button
                                onClick={() => handleArchiveUser(user)}
                                className={`p-2 rounded-full transition-colors ${darkMode ? 'bg-gray-700 hover:bg-gray-600 text-[#f3f4f6]' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'}`}
                                aria-label="Archive user"
                                title={`Archive ${user.full_name || ''}`.trim()}
                              >
                                <FaArchive className={darkMode ? 'text-white' : 'text-[#800000]'} />
                              </button>
                              {/* Verify/Unverify Button */}
                              <button
                                onClick={async () => {
                                  try {
                                    const next = !(user as any).is_verified;
                                    const { error } = await supabase
                                      .from('profiles')
                                      .update({ is_verified: next })
                                      .eq('id', user.profile_id);
                                    if (error) throw error;
                                    setUsers(prev => prev.map(u => u.profile_id === user.profile_id ? { ...u, is_verified: next } : u));
                                    
                                    // Modern alert for verify/unverify
                                    const alertDiv = document.createElement('div');
                                    alertDiv.className = 'fixed top-4 right-4 z-50 bg-white border-l-4 border-emerald-500 rounded-lg shadow-lg p-4 max-w-sm transform transition-all duration-300 ease-in-out';
                                    alertDiv.innerHTML = `
                                      <div class="flex items-center">
                                        <div class="flex-shrink-0">
                                          <svg class="h-5 w-5 text-emerald-400" fill="currentColor" viewBox="0 0 20 20">
                                            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
                                          </svg>
                                        </div>
                                        <div class="ml-3">
                                          <p class="text-sm font-medium text-gray-900">${next ? 'User Verified' : 'Verification Removed'}</p>
                                          <p class="text-xs text-gray-500 mt-1">${next ? 'User can now access the system' : 'User access has been restricted'}</p>
                                        </div>
                                        <div class="ml-auto pl-3">
                                          <div class="-mx-1.5 -my-1.5">
                                            <button type="button" class="inline-flex bg-white rounded-md p-1.5 text-gray-400 hover:text-gray-500 focus:outline-none" onclick="this.closest('div').remove()">
                                              <span class="sr-only">Dismiss</span>
                                              <svg class="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                                                <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"/>
                                              </svg>
                                            </button>
                                          </div>
                                        </div>
                                      </div>
                                    `;
                                    document.body.appendChild(alertDiv);
                                    setTimeout(() => alertDiv.remove(), 3000);
                                  } catch (e) {
                                    // Modern error alert
                                    const alertDiv = document.createElement('div');
                                    alertDiv.className = 'fixed top-4 right-4 z-50 bg-white border-l-4 border-red-500 rounded-lg shadow-lg p-4 max-w-sm transform transition-all duration-300 ease-in-out';
                                    alertDiv.innerHTML = `
                                      <div class="flex items-center">
                                        <div class="flex-shrink-0">
                                          <svg class="h-5 w-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                                            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"/>
                                          </svg>
                                        </div>
                                        <div class="ml-3">
                                          <p class="text-sm font-medium text-gray-900">Error</p>
                                          <p class="text-xs text-gray-500 mt-1">${e instanceof Error ? e.message : 'Failed to update verification'}</p>
                                        </div>
                                        <div class="ml-auto pl-3">
                                          <div class="-mx-1.5 -my-1.5">
                                            <button type="button" class="inline-flex bg-white rounded-md p-1.5 text-gray-400 hover:text-gray-500 focus:outline-none" onclick="this.closest('div').remove()">
                                              <span class="sr-only">Dismiss</span>
                                              <svg class="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                                                <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"/>
                                              </svg>
                                            </button>
                                          </div>
                                        </div>
                                      </div>
                                    `;
                                    document.body.appendChild(alertDiv);
                                    setTimeout(() => alertDiv.remove(), 3000);
                                  }
                                }}
                                className={`p-2 rounded-full transition-colors ${darkMode ? 'bg-gray-700 hover:bg-gray-600 text-[#f3f4f6]' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'}`}
                                aria-label={(user as any).is_verified ? 'Unverify user' : 'Verify user'}
                                title={`${(user as any).is_verified ? 'Unverify' : 'Verify'} ${user.full_name || ''}`.trim()}
                              >
                                {(user as any).is_verified ? (
                                  <svg className="w-4 h-4 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                                  </svg>
                                ) : (
                                  <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                  </svg>
                                )}
                              </button>
                              {/* Schedule Button */}
                              <button
                                onClick={() => handleSchedule(user)}
                                className={`p-2 rounded-full transition-colors ${darkMode ? 'bg-blue-900 hover:bg-blue-800 text-blue-300' : 'bg-blue-50 hover:bg-blue-100 text-blue-700'}`}
                                aria-label="Schedule guidance visit"
                                title={`Schedule visit for ${user.full_name || user.email}`.trim()}
                              >
                                <FaCalendarAlt className={darkMode ? 'text-blue-300' : 'text-blue-700'} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className={`mt-4 flex items-center justify-between ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                <div className="text-xs">
                  Showing {startIndex + 1} to {Math.min(endIndex, sortedUsers.length)} of {sortedUsers.length} users
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors flex items-center gap-1 ${
                      currentPage === 1
                        ? `${darkMode ? 'bg-gray-700 text-gray-400' : 'bg-gray-200 text-gray-400'} cursor-not-allowed`
                        : `${darkMode ? 'bg-[#800000] hover:bg-[#660000] text-white' : 'bg-[#800000] hover:bg-[#660000] text-white'}`
                    }`}
                  >
                    Previous
                  </button>
                  <span className="text-xs px-2">
                    Page {currentPage} of {totalPages}
                  </span>
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors flex items-center gap-1 ${
                      currentPage === totalPages
                        ? `${darkMode ? 'bg-gray-700 text-gray-400' : 'bg-gray-200 text-gray-400'} cursor-not-allowed`
                        : `${darkMode ? 'bg-[#800000] hover:bg-[#660000] text-white' : 'bg-[#800000] hover:bg-[#660000] text-white'}`
                    }`}
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}

        {activeView === 'archived' && (
          <>
            <div className={`mb-4 flex items-center ${darkMode ? 'bg-gray-700' : 'bg-[#800000]/5'} rounded-lg px-4 py-3 border ${darkMode ? 'border-gray-600' : 'border-[#800000]/30'} w-fit`}>
              <FaArchive className={`mr-2 text-xl ${darkMode ? 'text-[#f3f4f6]' : 'text-[#800000]'}`} />
              <span className={`font-semibold text-base ${darkMode ? 'text-[#f3f4f6]' : 'text-[#800000]'}`}>Archived Users:</span>
              <span className={`ml-2 text-lg font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{archivedUsers.length}</span>
            </div>
            <div className={`rounded-md shadow overflow-x-auto ${darkMode ? 'bg-gray-800' : 'bg-white'} w-full`}>
              <div className="overflow-x-auto w-full">
                <table className={`min-w-full divide-y ${darkMode ? 'divide-gray-700' : 'divide-gray-200'} w-full text-xs`}>
                  <thead className="bg-[#800000]">
                    <tr>
                      <th className="px-4 py-3 text-center text-xs font-bold uppercase tracking-wider text-white">Users</th>
                      <th className="px-4 py-3 text-center text-xs font-bold uppercase tracking-wider text-white">Email</th>
                      <th className="px-4 py-3 text-center text-xs font-bold uppercase tracking-wider text-white">Status</th>
                      <th className="px-4 py-3 text-center text-xs font-bold uppercase tracking-wider text-white">Joined</th>
                      <th className="px-4 py-3 text-center text-xs font-bold uppercase tracking-wider text-white">Last Sign In</th>
                      <th className="px-4 py-3 text-center text-xs font-bold uppercase tracking-wider text-white">Actions</th>
                    </tr>
                  </thead>
                  <tbody className={`divide-y ${darkMode ? 'divide-gray-700 bg-gray-800' : 'divide-gray-200 bg-white'}`}>
                                         {archivedUsers.length === 0 ? (
                       <tr>
                         <td colSpan={6} className={`px-4 py-3 text-center ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                           No archived users
                         </td>
                       </tr>
                     ) : (
                       archivedUsers.map((user) => (
                         <tr key={user.id} className={darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50'}>
                           <td className="px-4 py-3 whitespace-nowrap">
                             <div className="flex items-center">
                               <div className="flex-shrink-0 h-8 w-8">
                                 <div className={`h-8 w-8 rounded-full flex items-center justify-center bg-gray-200`}>
                                   <FaUser className={`text-gray-500`} />
                                 </div>
                               </div>
                               <div className="ml-3">
                                 <div className="flex items-center gap-2">
                                   <div className={`text-xs font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                                     {user.full_name || 'No name'}
                                   </div>
                                   {isNewlyRegistered(user.created_at) && (
                                     <span
                                       className={`px-2 py-0.5 text-[10px] font-semibold rounded-full border inline-flex items-center gap-1 ${
                                         darkMode
                                           ? 'bg-green-900/40 border-green-700 text-green-300'
                                           : 'bg-green-50 border-green-200 text-green-700'
                                       }`}
                                       title="Just registered"
                                     >
                                       <span className={`w-1.5 h-1.5 rounded-full ${darkMode ? 'bg-green-400' : 'bg-green-500'} animate-pulse`}></span>
                                       NEW
                                     </span>
                                   )}
                                 </div>
                               </div>
                             </div>
                           </td>
                           <td className="px-4 py-3 whitespace-nowrap">
                             <div className={`flex items-center text-xs ${darkMode ? 'text-gray-200' : 'text-gray-900'}`}>
                               <FaEnvelope className={`mr-2 ${darkMode ? 'text-gray-400' : 'text-gray-400'}`} />
                               {user.email}
                             </div>
                           </td>
                           <td className="px-4 py-3 whitespace-nowrap">
                             <span className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-[#800000]/10 text-[#800000]">Archived</span>
                           </td>
                           <td className="px-4 py-3 whitespace-nowrap">
                             <div className={`flex items-center text-xs ${darkMode ? 'text-gray-300' : 'text-gray-500'}`}>
                               <FaCalendarAlt className={`mr-2 ${darkMode ? 'text-gray-400' : 'text-gray-400'}`} />
                               {formatDate(user.created_at)}
                             </div>
                           </td>
                           <td className="px-4 py-3 whitespace-nowrap">
                                                            <div className={`flex items-center text-xs ${darkMode ? 'text-gray-300' : 'text-gray-500'}`}>
                                 <FaCalendarAlt className={`mr-2 ${darkMode ? 'text-gray-400' : 'text-gray-400'}`} />
                                 {user.last_sign_in 
                                   ? formatDate(user.last_sign_in)
                                   : 'Never'}
                               </div>
                           </td>
                           <td className="px-4 py-3 whitespace-nowrap">
                             <div className="flex items-center justify-center">
                               <button
                                 onClick={async () => {
                                   try {
                                     await unarchiveUser(user.profile_id);
                                     setUsers(prev => prev.map(u => u.profile_id === user.profile_id ? { ...u, role: 'student' } : u));
                                     await Toast.fire({ icon: 'success', iconColor: '#22c55e', title: 'Unarchived', text: 'User unarchived successfully' });
                                   } catch (e) {
                                     await Toast.fire({ icon: 'error', iconColor: '#ef4444', title: 'Error', text: e instanceof Error ? e.message : 'Failed to unarchive' });
                                   }
                                 }}
                                 className={`p-2 rounded-full transition-colors ${darkMode ? 'bg-gray-700 hover:bg-gray-600 text-[#f3f4f6]' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'}`}
                                 aria-label="Unarchive user"
                                 title={`Unarchive ${user.full_name || ''}`.trim()}
                               >
                                 <FaBoxOpen className="text-[#800000]" />
                               </button>
                             </div>
                           </td>
                         </tr>
                       ))
                     )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {activeView === 'cbt-modules' && <CBTModules darkMode={darkMode} />}
        {activeView === 'anxiety-videos' && <AnxietyVideos darkMode={darkMode} />}
                    {(activeView === 'todo-list' || activeView === 'relaxation-tools') && <TodoList darkMode={darkMode} />}
        {activeView === 'referral' && <Referral darkMode={darkMode} />}
        {activeView === 'schedule' && <Schedule darkMode={darkMode} />}
        {activeView === 'records' && <Records darkMode={darkMode} />}
      </div>
      <Footer darkMode={darkMode} />
    </div>
  );
} 