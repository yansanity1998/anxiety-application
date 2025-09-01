import { useState, useEffect, useRef } from 'react';
import { supabase } from '../../lib/supabase';
import { FaUserPlus, FaSignInAlt, FaTimes, FaBell, FaBellSlash, FaArchive } from 'react-icons/fa';
import Swal from 'sweetalert2';

type Notification = {
  id: string;
  type: 'registration' | 'login' | 'archive';
  user: {
    email: string;
    full_name: string;
    role?: string;
  };
  timestamp: string;
  read: boolean;
};

type NotificationsProps = {
  darkMode: boolean;
};

const STORAGE_KEY = 'admin_notifications';

export default function Notifications({ darkMode }: NotificationsProps) {
  const [notifications, setNotifications] = useState<Notification[]>(() => {
    // Load notifications from localStorage on initial render
    const savedNotifications = localStorage.getItem(STORAGE_KEY);
    return savedNotifications ? JSON.parse(savedNotifications) : [];
  });
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const lastLoginTimes = useRef<Map<string, string>>(new Map());
  const lastSignInValues = useRef<Map<string, string>>(new Map());

  // Save notifications to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(notifications));
  }, [notifications]);

  useEffect(() => {
    let profilesSubscription: any = null;

    const setupSubscription = async () => {
      try {
        console.log('🔔 Setting up notification subscriptions...');
        
        profilesSubscription = supabase
          .channel('profiles_changes')
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'profiles'
            },
            async (payload: any) => {
              // Type guard to ensure payload has the expected structure
              if (!payload.new || typeof payload.new !== 'object') {
                console.log('⚠️ Invalid payload structure:', payload);
                return;
              }

              console.log('📡 Profiles change detected:', {
                eventType: payload.eventType,
                userId: payload.new.user_id,
                email: payload.new.email,
                role: payload.new.role,
                lastSignIn: payload.new.last_sign_in,
                oldLastSignIn: payload.old?.last_sign_in
              });

              if (payload.eventType === 'INSERT') {
                // New registration - only notify for non-admin users
                if (payload.new.role !== 'admin') {
                  console.log('✅ New registration detected:', payload.new.email);
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
                }
              } else if (payload.eventType === 'UPDATE') {
                // First, check if this is an archive event (role changed to archived)
                const newRole = (payload.new.role || '').toLowerCase();
                const oldRole = (payload.old?.role || '').toLowerCase();
                if (newRole === 'archived' && oldRole !== 'archived') {
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
                  showNotificationToast('Student Archived', 'This student is archive');
                  return;
                }

                // Check if this is a login event (last_sign_in changed)
                const userId = payload.new.user_id;
                const newLastSignIn = payload.new.last_sign_in;
                const oldLastSignIn = payload.old?.last_sign_in;
                
                // Only process if last_sign_in actually changed and user is not admin
                if (newLastSignIn && 
                    newLastSignIn !== oldLastSignIn && 
                    payload.new.role !== 'admin') {
                  
                  console.log('🔐 Potential login detected:', {
                    userId,
                    email: payload.new.email,
                    newLastSignIn,
                    oldLastSignIn
                  });

                  const currentTime = new Date().toISOString();
                  const lastLoginTime = lastLoginTimes.current.get(userId);
                  const lastSignInValue = lastSignInValues.current.get(userId);
                  
                  // Check if this is a real login (not just a dashboard visit)
                  // Real login: last_sign_in value is significantly different (more than 1 minute)
                  // Dashboard visit: last_sign_in value is very close to previous value
                  const isRealLogin = !lastSignInValue || 
                    Math.abs(new Date(newLastSignIn).getTime() - new Date(lastSignInValue).getTime()) > 60000; // 1 minute
                  
                  // Also check if it's been more than 2 minutes since last notification
                  const timeSinceLastNotification = lastLoginTime ? 
                    new Date(currentTime).getTime() - new Date(lastLoginTime).getTime() : 
                    Infinity;
                  
                  const shouldNotify = isRealLogin && timeSinceLastNotification > 120000; // 2 minutes
                  
                  if (shouldNotify) {
                    console.log('✅ Real login confirmed, sending notification');
                    lastLoginTimes.current.set(userId, currentTime);
                    lastSignInValues.current.set(userId, newLastSignIn);
                    
                    const newNotification: Notification = {
                      id: `login_${userId}_${Date.now()}`,
                      type: 'login',
                      user: {
                        email: payload.new.email,
                        full_name: payload.new.full_name || 'Student',
                        role: payload.new.role
                      },
                      timestamp: currentTime,
                      read: false
                    };
                    setNotifications(prev => [newNotification, ...prev]);
                    const loginType = payload.new.role === 'guidance' ? 'Guidance Login' : 'Student Login';
                    showNotificationToast(loginType, `${newNotification.user.full_name} has logged in!`);
                  } else {
                    console.log('⏭️ Skipping notification - likely dashboard visit or too recent');
                  }
                }
              }
            }
          )
          .subscribe((status: any) => {
            console.log('🔔 Subscription status:', status);
          });

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
        console.log('🔔 Cleaning up notification subscriptions');
        profilesSubscription.unsubscribe();
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
        <div className={`absolute right-0 mt-2 w-80 rounded-lg shadow-lg ${darkMode ? 'bg-gray-800' : 'bg-white'} border ${darkMode ? 'border-gray-700' : 'border-gray-200'} z-50`}>
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
                          : (darkMode ? 'bg-red-900' : 'bg-red-100')
                    }`}>
                      {notification.type === 'registration' ? (
                        <FaUserPlus className={darkMode ? 'text-green-300' : 'text-green-600'} />
                      ) : notification.type === 'login' ? (
                        <FaSignInAlt className={darkMode ? 'text-blue-300' : 'text-blue-600'} />
                      ) : (
                        <FaArchive className={darkMode ? 'text-red-300' : 'text-red-600'} />
                      )}
                    </div>
                    <div className="flex-1">
                      <p className={`text-sm font-medium ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                        {notification.type === 'registration' 
                          ? 'New Registration' 
                          : notification.type === 'login' 
                            ? (notification.user.role === 'guidance' ? 'Guidance Login' : 'Student Login')
                            : 'Student Archived'}
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