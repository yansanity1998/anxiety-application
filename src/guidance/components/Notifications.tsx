import { useState, useEffect, useRef } from 'react';
import { supabase } from '../../lib/supabase';
import { FaUserPlus, FaSignInAlt, FaBell, FaBellSlash, FaArchive } from 'react-icons/fa';
import Swal from 'sweetalert2';

type Notification = {
  id: string;
  type: 'registration' | 'login' | 'archive';
  user: {
    email: string;
    full_name: string;
  };
  timestamp: string;
  read: boolean;
};``

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
                  showNotificationToast('Student Archived', `${archiveNotification.user.full_name} has been archived!`);
                } else if (payload.new.last_sign_in && payload.old?.last_sign_in) {
                  // Check for login activity (last_sign_in changed)
                  const newLastSignIn = payload.new.last_sign_in;
                  const oldLastSignIn = payload.old.last_sign_in;
                  
                  // Only notify if it's a different login time and not an admin
                  if (payload.new.role !== 'admin' && newLastSignIn !== oldLastSignIn) {
                    const userId = payload.new.user_id;
                    const lastLoginTime = lastLoginTimes.current.get(userId);
                    
                    if (lastLoginTime !== newLastSignIn) {
                      lastLoginTimes.current.set(userId, newLastSignIn);
                      
                      const loginNotification: Notification = {
                        id: `login_${userId}_${Date.now()}`,
                        type: 'login',
                        user: {
                          email: payload.new.email,
                          full_name: payload.new.full_name || 'Student'
                        },
                        timestamp: new Date().toISOString(),
                        read: false
                      };
                      setNotifications(prev => [loginNotification, ...prev]);
                      showNotificationToast('Student Login', `${loginNotification.user.full_name} has logged in!`);
                    }
                  }
                }
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

    return () => {
      if (profilesSubscription) {
        console.log('🔌 Cleaning up notification subscriptions...');
        supabase.removeChannel(profilesSubscription);
      }
    };
  }, []);

  const showNotificationToast = (title: string, message: string) => {
    Swal.fire({
      title,
      text: message,
      icon: 'info',
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
        htmlContainer: 'text-xs'
      }
    });
  };

  const markAsRead = (notificationId: string) => {
    setNotifications(prev => 
      prev.map(notification => 
        notification.id === notificationId 
          ? { ...notification, read: true }
          : notification
      )
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(notification => ({ ...notification, read: true })));
  };

  const clearAllNotifications = () => {
    setNotifications([]);
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'registration':
        return <FaUserPlus className="text-green-500" />;
      case 'login':
        return <FaSignInAlt className="text-blue-500" />;
      case 'archive':
        return <FaArchive className="text-red-500" />;
      default:
        return <FaBell className="text-gray-500" />;
    }
  };

  const getNotificationText = (type: string, userName: string) => {
    switch (type) {
      case 'registration':
        return `${userName} has registered`;
      case 'login':
        return `${userName} has logged in`;
      case 'archive':
        return `${userName} has been archived`;
      default:
        return 'New notification';
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`relative p-2 rounded-lg transition-colors ${
          darkMode 
            ? 'bg-gray-700 hover:bg-gray-600 text-gray-300' 
            : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
        }`}
        aria-label="Notifications"
      >
        {unreadCount > 0 ? (
          <FaBell className="text-lg" />
        ) : (
          <FaBellSlash className="text-lg" />
        )}
        {unreadCount > 0 && (
          <span className={`absolute -top-1 -right-1 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 rounded-full ${
            unreadCount > 9 ? 'bg-red-600' : 'bg-red-500'
          }`}>
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className={`absolute right-0 mt-2 w-80 rounded-lg shadow-lg border z-50 ${
          darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
        }`}>
          <div className={`p-4 border-b ${
            darkMode ? 'border-gray-700' : 'border-gray-200'
          }`}>
            <div className="flex items-center justify-between">
              <h3 className={`text-lg font-semibold ${
                darkMode ? 'text-white' : 'text-gray-900'
              }`}>
                Notifications
              </h3>
              <div className="flex space-x-2">
                <button
                  onClick={markAllAsRead}
                  className={`text-xs px-2 py-1 rounded ${
                    darkMode 
                      ? 'bg-gray-700 hover:bg-gray-600 text-gray-300' 
                      : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
                  }`}
                >
                  Mark All Read
                </button>
                <button
                  onClick={clearAllNotifications}
                  className={`text-xs px-2 py-1 rounded ${
                    darkMode 
                      ? 'bg-red-700 hover:bg-red-600 text-white' 
                      : 'bg-red-100 hover:bg-red-200 text-red-700'
                  }`}
                >
                  Clear All
                </button>
              </div>
            </div>
          </div>

          <div className={`max-h-96 overflow-y-auto ${
            darkMode ? 'bg-gray-800' : 'bg-white'
          }`}>
            {notifications.length === 0 ? (
              <div className={`p-4 text-center ${
                darkMode ? 'text-gray-400' : 'text-gray-500'
              }`}>
                No notifications
              </div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-4 border-b cursor-pointer transition-colors ${
                    darkMode 
                      ? 'border-gray-700 hover:bg-gray-700' 
                      : 'border-gray-200 hover:bg-gray-50'
                  } ${!notification.read ? 'bg-blue-50 dark:bg-blue-900/20' : ''}`}
                  onClick={() => markAsRead(notification.id)}
                >
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 mt-1">
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium ${
                        darkMode ? 'text-white' : 'text-gray-900'
                      }`}>
                        {getNotificationText(notification.type, notification.user.full_name)}
                      </p>
                      <p className={`text-xs ${
                        darkMode ? 'text-gray-400' : 'text-gray-500'
                      }`}>
                        {notification.user.email}
                      </p>
                      <p className={`text-xs ${
                        darkMode ? 'text-gray-500' : 'text-gray-400'
                      }`}>
                        {new Date(notification.timestamp).toLocaleString()}
                      </p>
                    </div>
                    {!notification.read && (
                      <div className="flex-shrink-0">
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      </div>
                    )}
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