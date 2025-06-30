import { useState, useEffect, useRef } from 'react';
import { supabase } from '../../lib/supabase';
import { FaUserPlus, FaSignInAlt, FaTimes, FaBell, FaBellSlash } from 'react-icons/fa';
import Swal from 'sweetalert2';

type Notification = {
  id: string;
  type: 'registration' | 'login';
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

const STORAGE_KEY = 'admin_notifications';

export default function Notifications({ darkMode }: NotificationsProps) {
  const [notifications, setNotifications] = useState<Notification[]>(() => {
    // Load notifications from localStorage on initial render
    const savedNotifications = localStorage.getItem(STORAGE_KEY);
    return savedNotifications ? JSON.parse(savedNotifications) : [];
  });
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Save notifications to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(notifications));
  }, [notifications]);

  useEffect(() => {
    let profilesSubscription: any = null;

    const setupSubscription = async () => {
      try {
        profilesSubscription = supabase
          .channel('profiles_changes')
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'profiles'
            },
            async (payload) => {
              if (payload.eventType === 'INSERT') {
                // New registration
                const newNotification: Notification = {
                  id: payload.new.id,
                  type: 'registration',
                  user: {
                    email: payload.new.email,
                    full_name: payload.new.full_name
                  },
                  timestamp: new Date().toISOString(),
                  read: false
                };
                setNotifications(prev => [newNotification, ...prev]);
                showNotificationToast('New Registration', `${payload.new.full_name} has registered!`);
              } else if (payload.eventType === 'UPDATE' && payload.new.last_sign_in !== payload.old.last_sign_in) {
                // User login
                const newNotification: Notification = {
                  id: payload.new.id,
                  type: 'login',
                  user: {
                    email: payload.new.email,
                    full_name: payload.new.full_name
                  },
                  timestamp: new Date().toISOString(),
                  read: false
                };
                setNotifications(prev => [newNotification, ...prev]);
                showNotificationToast('User Login', `${payload.new.full_name} has logged in!`);
              }
            }
          )
          .subscribe();
      } catch (error) {
        console.error('Error setting up Supabase subscription:', error);
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
        profilesSubscription.unsubscribe();
      }
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const showNotificationToast = (title: string, text: string) => {
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
                        ? darkMode ? 'bg-green-900' : 'bg-green-100'
                        : darkMode ? 'bg-blue-900' : 'bg-blue-100'
                    }`}>
                      {notification.type === 'registration' ? (
                        <FaUserPlus className={darkMode ? 'text-green-300' : 'text-green-600'} />
                      ) : (
                        <FaSignInAlt className={darkMode ? 'text-blue-300' : 'text-blue-600'} />
                      )}
                    </div>
                    <div className="flex-1">
                      <p className={`text-sm font-medium ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                        {notification.type === 'registration' ? 'New Registration' : 'User Login'}
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