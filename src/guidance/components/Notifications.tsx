import { useState, useEffect, useRef } from 'react';
import { supabase } from '../../lib/supabase';
import { FaUserPlus, FaSignInAlt, FaTimes, FaBell, FaBellSlash, FaArchive, FaUndo, FaCalendarPlus, FaCheckCircle, FaExclamationTriangle } from 'react-icons/fa';
import Swal from 'sweetalert2';
import { soundService } from '../../lib/soundService';

type Notification = {
  id: string;
  type: 'registration' | 'login' | 'archive' | 'unarchive' | 'schedule' | 'verified' | 'unverified';
  user: {
    email: string;
    full_name: string;
  };
  timestamp: string;
  read: boolean;
};

type NotificationsProps = {
  darkMode: boolean;
};

const STORAGE_KEY = 'guidance_notifications';

export default function Notifications({ darkMode }: NotificationsProps) {
  const [notifications, setNotifications] = useState<Notification[]>(() => {
    // Load notifications from localStorage on initial render
    const savedNotifications = localStorage.getItem(STORAGE_KEY);
    return savedNotifications ? JSON.parse(savedNotifications) : [];
  });
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const lastLoginTimes = useRef<Map<string, string>>(new Map());

  // Save notifications to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(notifications));
  }, [notifications]);

  useEffect(() => {
    let profilesSubscription: any = null;
    let appointmentsSubscription: any = null;

    const setupSubscription = async () => {
      try {
        console.log('🔔 [GUIDANCE] Setting up notification subscriptions...');
        
        // Create a unique channel name to avoid conflicts
        const channelName = `guidance_notifications_${Math.random().toString(36).substr(2, 9)}`;
        console.log('🔔 [GUIDANCE] Channel name:', channelName);
        
        profilesSubscription = supabase
          .channel(channelName)
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'profiles'
            },
            async (payload: any) => {
              console.log('📡 [GUIDANCE] Raw payload received:', payload);
              
              // Type guard to ensure payload has the expected structure
              if (!payload.new || typeof payload.new !== 'object') {
                console.log('⚠️ [GUIDANCE] Invalid payload structure:', payload);
                return;
              }

              console.log('📡 [GUIDANCE] Profiles change detected:', {
                eventType: payload.eventType,
                userId: payload.new.user_id,
                email: payload.new.email,
                role: payload.new.role,
                lastSignIn: payload.new.last_sign_in,
                oldLastSignIn: payload.old?.last_sign_in
              });

              if (payload.eventType === 'INSERT') {
                // New registration - only notify for non-admin users
                if (payload.new.role !== 'admin' && payload.new.role !== 'guidance') {
                  console.log('✅ [GUIDANCE] New registration detected:', payload.new.email);
                  const newNotification: Notification = {
                    id: `reg_${payload.new.id}_${Date.now()}`,
                    type: 'registration',
                    user: {
                      email: payload.new.email,
                      full_name: payload.new.full_name || 'New Student'
                    },
                    timestamp: new Date().toISOString(),
                    read: false
                  };
                  setNotifications(prev => [newNotification, ...prev]);
                  showNotificationToast('New Registration', `${newNotification.user.full_name} has registered!`);
                  // Play registration sound
                  soundService.playRegistrationSound();
                }
              } else if (payload.eventType === 'UPDATE') {
                // Check for role changes (archive/unarchive)
                const newRole = (payload.new.role || '').toLowerCase();
                const oldRole = (payload.old?.role || '').toLowerCase();
                
                if (newRole === 'archived' && oldRole !== 'archived') {
                  // Student archived
                  const currentTime = new Date().toISOString();
                  const archiveNotification: Notification = {
                    id: `archive_${payload.new.user_id}_${Date.now()}`,
                    type: 'archive',
                    user: {
                      email: payload.new.email,
                      full_name: payload.new.full_name || 'Student'
                    },
                    timestamp: currentTime,
                    read: false
                  };
                  setNotifications(prev => [archiveNotification, ...prev]);
                  showNotificationToast('Student Archived', `${payload.new.full_name || 'Student'} has been archived`);
                  soundService.playArchiveSound();
                  return;
                } else if (oldRole === 'archived' && newRole !== 'archived') {
                  // Student unarchived
                  const currentTime = new Date().toISOString();
                  const unarchiveNotification: Notification = {
                    id: `unarchive_${payload.new.user_id}_${Date.now()}`,
                    type: 'unarchive',
                    user: {
                      email: payload.new.email,
                      full_name: payload.new.full_name || 'Student'
                    },
                    timestamp: currentTime,
                    read: false
                  };
                  setNotifications(prev => [unarchiveNotification, ...prev]);
                  showNotificationToast('Student Restored', `${payload.new.full_name || 'Student'} has been restored`);
                  soundService.playUnarchiveSound();
                  return;
                }

                // Check for verification status changes
                const newVerified = payload.new.is_verified;
                const oldVerified = payload.old?.is_verified;
                
                if (newVerified === true && oldVerified !== true) {
                  // Student verified
                  const currentTime = new Date().toISOString();
                  const verifiedNotification: Notification = {
                    id: `verified_${payload.new.user_id}_${Date.now()}`,
                    type: 'verified',
                    user: {
                      email: payload.new.email,
                      full_name: payload.new.full_name || 'Student'
                    },
                    timestamp: currentTime,
                    read: false
                  };
                  setNotifications(prev => [verifiedNotification, ...prev]);
                  showNotificationToast('Student Verified', `${payload.new.full_name || 'Student'} has been verified`);
                  soundService.playVerifiedSound();
                  return;
                } else if (newVerified === false && oldVerified === true) {
                  // Student unverified
                  const currentTime = new Date().toISOString();
                  const unverifiedNotification: Notification = {
                    id: `unverified_${payload.new.user_id}_${Date.now()}`,
                    type: 'unverified',
                    user: {
                      email: payload.new.email,
                      full_name: payload.new.full_name || 'Student'
                    },
                    timestamp: currentTime,
                    read: false
                  };
                  setNotifications(prev => [unverifiedNotification, ...prev]);
                  showNotificationToast('Student Unverified', `${payload.new.full_name || 'Student'} verification removed`);
                  soundService.playUnverifiedSound();
                  return;
                }

                // Check if this is a login event (last_sign_in changed)
                const userId = payload.new.user_id;
                const newLastSignIn = payload.new.last_sign_in;
                const oldLastSignIn = payload.old?.last_sign_in;
                
                console.log('🔐 [GUIDANCE] Checking login conditions:', {
                  userId,
                  email: payload.new.email,
                  role: payload.new.role,
                  newLastSignIn,
                  oldLastSignIn,
                  hasLastSignInChanged: newLastSignIn !== oldLastSignIn,
                  isNotAdmin: payload.new.role !== 'admin',
                  isNotGuidance: payload.new.role !== 'guidance'
                });
                
                // Only process if last_sign_in actually changed and user is student
                if (newLastSignIn && 
                    newLastSignIn !== oldLastSignIn && 
                    payload.new.role === 'student') {
                  
                  console.log('🔐 [GUIDANCE] Student login detected:', {
                    userId,
                    email: payload.new.email,
                    newLastSignIn,
                    oldLastSignIn
                  });

                  const currentTime = new Date().toISOString();
                  const lastLoginTime = lastLoginTimes.current.get(userId);
                  
                  // Check if it's been more than 30 seconds since last notification (reduced from 2 minutes)
                  const timeSinceLastNotification = lastLoginTime ? 
                    new Date(currentTime).getTime() - new Date(lastLoginTime).getTime() : 
                    Infinity;
                  
                  const shouldNotify = timeSinceLastNotification > 30000; // 30 seconds
                  
                  console.log('🔐 [GUIDANCE] Login notification check:', {
                    shouldNotify,
                    timeSinceLastNotification,
                    lastLoginTime
                  });
                  
                  if (shouldNotify) {
                    console.log('✅ [GUIDANCE] Sending login notification!');
                    lastLoginTimes.current.set(userId, currentTime);
                    
                    const newNotification: Notification = {
                      id: `login_${userId}_${Date.now()}`,
                      type: 'login',
                      user: {
                        email: payload.new.email,
                        full_name: payload.new.full_name || 'Student'
                      },
                      timestamp: currentTime,
                      read: false
                    };
                    setNotifications(prev => [newNotification, ...prev]);
                    showLoginAlert(newNotification.user.full_name, newNotification.user.email);
                    showNotificationToast('Student Login', `${newNotification.user.full_name} has logged in!`);
                    // Play login sound
                    soundService.playLoginSound();
                  } else {
                    console.log('⏭️ [GUIDANCE] Skipping notification - too recent or duplicate');
                  }
                }
              }
            }
          )
          .subscribe((status: any) => {
            console.log('🔔 [GUIDANCE] Subscription status:', status);
            if (status === 'SUBSCRIBED') {
              console.log('✅ [GUIDANCE] Successfully subscribed to profile changes!');
            } else if (status === 'CHANNEL_ERROR') {
              console.error('❌ [GUIDANCE] Channel subscription error!');
            }
          });

        // Set up appointments subscription for schedule notifications
        appointmentsSubscription = supabase
          .channel(`guidance_appointments_${Math.random().toString(36).substr(2, 9)}`)
          .on(
            'postgres_changes',
            {
              event: 'INSERT',
              schema: 'public',
              table: 'appointments'
            },
            async (payload: any) => {
              console.log('📅 [GUIDANCE] New appointment scheduled:', payload);
              
              if (payload.new) {
                const currentTime = new Date().toISOString();
                
                // Try to get student info from different possible field names
                const studentEmail = payload.new.student_email || payload.new.email || 'Unknown';
                const studentName = payload.new.student_name || payload.new.full_name || payload.new.name || 'Student';
                const appointmentDate = payload.new.appointment_date || payload.new.date || 'Unknown date';
                
                const scheduleNotification: Notification = {
                  id: `schedule_${payload.new.id}_${Date.now()}`,
                  type: 'schedule',
                  user: {
                    email: studentEmail,
                    full_name: studentName
                  },
                  timestamp: currentTime,
                  read: false
                };
                
                setNotifications(prev => [scheduleNotification, ...prev]);
                showNotificationToast('New Appointment', `Appointment scheduled for ${studentName} on ${appointmentDate}`);
                soundService.playScheduleSound();
                
                console.log('✅ [GUIDANCE] Schedule notification created and sound played');
              }
            }
          )
          .subscribe();

        console.log('✅ Notification subscriptions set up successfully');
      } catch (error) {
        console.error('❌ Error setting up notification subscriptions:', error);
      }
    };

    setupSubscription();

    // Close dropdown when clicking outside
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      if (profilesSubscription) {
        console.log('🔔 Cleaning up profiles subscription');
        profilesSubscription.unsubscribe();
      }
      if (appointmentsSubscription) {
        console.log('🔔 Cleaning up appointments subscription');
        appointmentsSubscription.unsubscribe();
      }
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const showNotificationToast = (title: string, text: string) => {
    console.log('🔔 Showing notification toast:', { title, text });
    Swal.mixin({
      toast: true,
      position: 'top-end',
      showConfirmButton: false,
      timer: 3000,
      timerProgressBar: true,
      background: darkMode ? '#1f2937' : '#f8fafc',
      color: darkMode ? '#f3f4f6' : '#111827',
      customClass: {
        popup: `shadow-none border ${darkMode ? 'border-gray-700' : 'border-gray-200'}`,
        title: 'text-sm font-medium',
        htmlContainer: 'text-xs',
        timerProgressBar: 'bg-gradient-to-r from-blue-400 to-purple-500'
      }
    }).fire({
      icon: 'info',
      title,
      text
    });
  };

  const showLoginAlert = (studentName: string, studentEmail: string) => {
    console.log('🔔 Showing student login alert:', { studentName, studentEmail });
    Swal.fire({
      title: '🎓 Student Login Alert',
      html: `
        <div class="text-center space-y-4">
          <div class="inline-flex items-center justify-center w-16 h-16 ${darkMode ? 'bg-blue-900/20' : 'bg-blue-100'} rounded-full mb-3">
            <svg class="w-8 h-8 ${darkMode ? 'text-blue-400' : 'text-blue-600'}" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <div class="${darkMode ? 'bg-gray-700' : 'bg-gray-50'} rounded-xl p-4 border ${darkMode ? 'border-gray-600' : 'border-gray-200'}">
            <h3 class="text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-800'} mb-2">${studentName}</h3>
            <p class="text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'} mb-3">${studentEmail}</p>
            <div class="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${darkMode ? 'bg-green-900 text-green-300' : 'bg-green-100 text-green-800'}">
              <div class="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
              Currently Online
            </div>
          </div>
          <p class="text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}">This student has just logged into the system.</p>
        </div>
      `,
      confirmButtonText: 'Got it!',
      confirmButtonColor: '#3b82f6',
      background: darkMode ? '#1f2937' : '#ffffff',
      color: darkMode ? '#f3f4f6' : '#111827',
      customClass: {
        popup: `rounded-2xl shadow-2xl border-2 ${darkMode ? 'border-blue-600/30' : 'border-blue-200'} max-w-md`,
        title: `text-xl font-bold ${darkMode ? 'text-blue-400' : 'text-blue-600'} mb-4`,
        htmlContainer: `${darkMode ? 'text-gray-200' : 'text-gray-700'}`,
        confirmButton: 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold py-2.5 px-6 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105'
      },
      showClass: {
        popup: 'animate__animated animate__fadeInDown animate__faster'
      },
      hideClass: {
        popup: 'animate__animated animate__fadeOutUp animate__faster'
      },
      // Prevent body scrollbar compensation
      scrollbarPadding: false,
      didOpen: () => {
        // Prevent body from getting padding-right but keep scrolling enabled
        document.body.style.paddingRight = '0px !important';
      },
      didClose: () => {
        // Restore body styles
        document.body.style.paddingRight = '';
      }
    });
  };

  const handleRemoveNotification = (id: string) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id));
  };

  const handleClearAll = () => {
    setNotifications([]);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`relative p-2 rounded-full ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'} transition-colors`}
        aria-label="Notifications"
      >
        {notifications.length > 0 ? (
          <FaBell className={`w-5 h-5 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`} />
        ) : (
          <FaBellSlash className={`w-5 h-5 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`} />
        )}
        {notifications.length > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
            {notifications.length}
          </span>
        )}
      </button>

      {isOpen && (
        <div className={`absolute right-0 mt-2 w-80 rounded-lg shadow-lg ${darkMode ? 'bg-gray-800' : 'bg-white'} border ${darkMode ? 'border-gray-700' : 'border-gray-200'} z-[9999]`}>
          <div className="p-3 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
            <h3 className={`text-sm font-semibold ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>
              Notifications
            </h3>
            {notifications.length > 0 && (
              <button
                onClick={handleClearAll}
                className={`text-xs ${darkMode ? 'text-gray-400 hover:text-gray-300' : 'text-gray-500 hover:text-gray-700'}`}
              >
                Clear all
              </button>
            )}
          </div>
          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className={`p-4 text-center ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                No notifications
              </div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-3 border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'} hover:${darkMode ? 'bg-gray-700/50' : 'bg-gray-50'} transition-colors ${
                    !notification.read ? (darkMode ? 'bg-gray-700/50' : 'bg-blue-50/50') : ''
                  }`}
                >
                  <div className="flex items-start">
                    <div className={`p-2 rounded-full mr-3 ${
                      notification.type === 'registration' 
                        ? (darkMode ? 'bg-green-900' : 'bg-green-100')
                        : notification.type === 'login'
                          ? (darkMode ? 'bg-blue-900' : 'bg-blue-100')
                          : notification.type === 'archive'
                            ? (darkMode ? 'bg-red-900' : 'bg-red-100')
                            : notification.type === 'unarchive'
                              ? (darkMode ? 'bg-emerald-900' : 'bg-emerald-100')
                              : notification.type === 'schedule'
                                ? (darkMode ? 'bg-purple-900' : 'bg-purple-100')
                                : notification.type === 'verified'
                                  ? (darkMode ? 'bg-cyan-900' : 'bg-cyan-100')
                                  : (darkMode ? 'bg-orange-900' : 'bg-orange-100')
                    }`}>
                      {notification.type === 'registration' ? (
                        <FaUserPlus className={darkMode ? 'text-green-300' : 'text-green-600'} />
                      ) : notification.type === 'login' ? (
                        <FaSignInAlt className={darkMode ? 'text-blue-300' : 'text-blue-600'} />
                      ) : notification.type === 'archive' ? (
                        <FaArchive className={darkMode ? 'text-red-300' : 'text-red-600'} />
                      ) : notification.type === 'unarchive' ? (
                        <FaUndo className={darkMode ? 'text-emerald-300' : 'text-emerald-600'} />
                      ) : notification.type === 'schedule' ? (
                        <FaCalendarPlus className={darkMode ? 'text-purple-300' : 'text-purple-600'} />
                      ) : notification.type === 'verified' ? (
                        <FaCheckCircle className={darkMode ? 'text-cyan-300' : 'text-cyan-600'} />
                      ) : (
                        <FaExclamationTriangle className={darkMode ? 'text-orange-300' : 'text-orange-600'} />
                      )}
                    </div>
                    <div className="flex-1">
                      <p className={`text-sm font-medium ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                        {notification.type === 'registration' 
                          ? 'New Registration' 
                          : notification.type === 'login' 
                            ? 'Student Login'
                            : notification.type === 'archive'
                              ? 'Student Archived'
                              : notification.type === 'unarchive'
                                ? 'Student Restored'
                                : notification.type === 'schedule'
                                  ? 'New Appointment'
                                  : notification.type === 'verified'
                                    ? 'Student Verified'
                                    : 'Student Unverified'}
                      </p>
                      <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        {notification.user.full_name} ({notification.user.email})
                      </p>
                      <p className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'} mt-1`}>
                        {new Date(notification.timestamp).toLocaleString()}
                      </p>
                    </div>
                    <button
                      onClick={() => handleRemoveNotification(notification.id)}
                      className={`ml-2 p-1 rounded-full ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'} transition-colors`}
                      aria-label="Remove notification"
                    >
                      <FaTimes className={`w-3 h-3 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
} 