import { useState, useEffect, useRef } from 'react';
import { 
  FaHeart, 
  FaBrain, 
  FaLeaf, 
  FaPlay, 
  FaUser, 
  FaBell, 
  FaCalendarAlt, 
  FaChartLine, 
  // FaMedal,
  FaFire,
  // FaStar,
  // FaHeadphones,
  FaBookOpen,
  FaGamepad,
  FaSmile,
  // FaMoon,
  // FaSun,
  // FaWind,
  // FaWater,
  // FaTree,
  // FaCloudSun,
  FaChevronRight,
  FaChevronLeft,
  // FaPlus,
  FaArrowUp,
  FaTasks,
  FaCheck,
  FaSignOutAlt,
  FaSpa,
} from 'react-icons/fa';

// Removed framer-motion imports since animations are disabled
import { supabase } from '../lib/supabase';
import { streakService } from '../lib/streakService';
import { useNavigate } from 'react-router-dom';
import { StreakPet } from './StreakPet';
import QuickRelaxation from './components/QuickRelaxation';
import BreathingExercise from './components/BreathingExercise';
import MoodTracker from './components/MoodTracker';
import AssessmentRecordsModal from './components/AssessmentRecordsModal';

// Today's Activities Component
const TodaysActivities = ({ navigate, userData }: { navigate: any, userData: any }) => {
  const [activities, setActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTodaysActivities = async () => {
      if (!userData?.id) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const today = new Date().toISOString().split('T')[0];
        
        // Only show real activities - no defaults
        const activityItems: any[] = [];

        // Fetch CBT modules assigned to this user (show in_progress and not_started)
        const { data: cbtModules, error: cbtError } = await supabase
          .from('cbt_module')
          .select('*')
          .eq('profile_id', userData.id)
          .in('module_status', ['in_progress', 'not_started'])
          .limit(3);

        console.log('CBT Modules Query:', { cbtModules, cbtError, userId: userData.id });

        // Add CBT modules if found
        if (cbtModules && cbtModules.length > 0) {
          cbtModules.forEach((module: any) => {
            activityItems.push({
              id: `cbt-${module.id}`,
              type: 'cbt',
              title: module.module_title || 'CBT Module',
              subtitle: module.module_status === 'in_progress' ? 'Continue your progress' : 'Start this module',
              status: module.module_status,
              icon: FaBrain,
              color: 'blue',
              bgColor: 'bg-blue-50',
              iconBg: 'bg-blue-100',
              iconColor: 'text-blue-600',
              action: () => navigate('/cbt-modules')
            });
          });
        }

        // Fetch todo items (active todos)
        const { data: todos, error: todoError } = await supabase
          .from('todo_items')
          .select('*')
          .eq('profile_id', userData.id)
          .in('status', ['in_progress', 'pending'])
          .limit(3);

        console.log('Todo Items Query:', { todos, todoError, userId: userData.id, today });

        // Add todo items if found for today
        if (todos && todos.length > 0) {
          todos.forEach((todo: any) => {
            activityItems.push({
              id: `todo-${todo.id}`,
              type: 'todo',
              title: todo.title || 'Task',
              subtitle: todo.description || 'Complete this task',
              status: 'pending',
              icon: FaTasks,
              color: 'green',
              bgColor: 'bg-green-50',
              iconBg: 'bg-green-100',
              iconColor: 'text-green-600',
              action: () => navigate('/todo-list')
            });
          });
        }

        // Check for anxiety videos assigned to this user
        const { data: anxietyVideos, error: videoError } = await supabase
          .from('anxiety_video')
          .select('*')
          .eq('profile_id', userData.id)
          .in('video_status', ['not_started', 'in_progress'])
          .limit(3);

        console.log('Anxiety Videos Query:', { anxietyVideos, videoError, userId: userData.id });

        // Add anxiety videos if found
        if (anxietyVideos && anxietyVideos.length > 0) {
          anxietyVideos.forEach((video: any) => {
            activityItems.push({
              id: `video-${video.id}`,
              type: 'video',
              title: video.video_title || 'Anxiety Video',
              subtitle: video.video_status === 'in_progress' ? 'Continue watching' : 'Watch helpful content',
              status: video.video_status,
              icon: FaPlay,
              color: 'red',
              bgColor: 'bg-red-50',
              iconBg: 'bg-red-100',
              iconColor: 'text-red-600',
              action: () => navigate('/anxiety-videos')
            });
          });
        }

        // Set activities (no shuffling, no defaults)
        console.log('Final Activity Items:', activityItems);
        setActivities(activityItems);
      } catch (error) {
        console.error('Error fetching activities:', error);
        // No default activities on error - show empty state
        setActivities([]);
      } finally {
        setLoading(false);
      }
    };

    fetchTodaysActivities();
  }, [userData, navigate]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return (
          <div className="flex items-center gap-1">
            <FaCheck className="text-green-500 text-xs" />
            <span className="text-xs font-medium text-green-600">Done</span>
          </div>
        );
      case 'in_progress':
        return (
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div>
            <span className="text-xs font-medium text-yellow-600">In Progress</span>
          </div>
        );
      case 'not_started':
      case 'available':
      case 'pending':
      default:
        return (
          <div className="flex items-center gap-1">
            <FaChevronRight className="text-gray-400 text-xs" />
            <span className="text-xs font-medium text-gray-500">Start</span>
          </div>
        );
    }
  };

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-lg text-gray-800 flex items-center gap-2">
          <FaCalendarAlt className="text-indigo-500" />
          Today's Activities
        </h3>
        <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
          {activities.length} {activities.length === 1 ? 'item' : 'items'}
        </span>
      </div>
      
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-xl p-4 shadow-md border border-gray-200 animate-pulse">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                </div>
                <div className="w-16 h-6 bg-gray-200 rounded"></div>
              </div>
            </div>
          ))}
        </div>
      ) : activities.length === 0 ? (
        <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-6 text-center border border-gray-200">
          <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-3">
            <FaCalendarAlt className="text-gray-400 text-2xl" />
          </div>
          <p className="text-gray-600 font-medium mb-1">No activities scheduled</p>
          <p className="text-gray-500 text-sm">Check back later or explore our wellness tools</p>
        </div>
      ) : (
        <div className="space-y-3">
          {activities.map((activity) => (
            <div
              key={activity.id}
              className={`bg-white rounded-xl p-4 shadow-md border border-gray-200 cursor-pointer transition-all duration-200 hover:shadow-lg hover:border-gray-300 ${activity.bgColor} hover:scale-[1.02]`}
              onClick={activity.action}
            >
              <div className="flex items-center gap-3">
                {/* Icon */}
                <div className={`w-10 h-10 sm:w-12 sm:h-12 ${activity.iconBg} rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm`}>
                  <activity.icon className={`${activity.iconColor} text-lg sm:text-xl`} />
                </div>
                
                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="font-semibold text-gray-800 text-sm sm:text-base truncate">
                      {activity.title}
                    </h4>
                    <div className="ml-2 flex-shrink-0">
                      {getStatusBadge(activity.status)}
                    </div>
                  </div>
                  <p className="text-gray-600 text-xs sm:text-sm truncate">
                    {activity.subtitle}
                  </p>
                  
                  {/* Activity Type Badge */}
                  <div className="mt-2 flex items-center gap-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      activity.type === 'cbt' ? 'bg-blue-100 text-blue-700' :
                      activity.type === 'video' ? 'bg-red-100 text-red-700' :
                      activity.type === 'todo' ? 'bg-green-100 text-green-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {activity.type === 'cbt' ? '🧠 CBT' :
                       activity.type === 'video' ? '🎥 Video' :
                       activity.type === 'todo' ? '✅ Task' : 'Activity'}
                    </span>
                    {activity.status === 'in_progress' && (
                      <span className="text-xs text-yellow-600 font-medium">• Continue where you left off</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      
    </div>
  );
};

// Mock user data - in a real app, this would come from your backend
const mockUserData = {
  name: "",
  totalPoints: 2450,
  level: 5,
  nextLevelPoints: 2800,
  recentAssessment: {
    score: 65,
    level: "Moderate",
    date: "Today",
    improvement: "+12%"
  },
};

type ProgressRingProps = {
  progress: number;
  size?: number;
};

const ProgressRing = ({ progress, size = 60 }: ProgressRingProps) => {

  // Determine color and icon based on progress (lower is better for anxiety)
  // Standardized anxiety level colors: Green (Minimal 0-24%), Blue (Mild 25-49%), Yellow (Moderate 50-74%), Red (Severe 75-100%)
  const getProgressInfo = () => {
    if (progress < 25) return { 
      color: "text-green-600", 
      bgColor: "bg-green-100", 
      icon: FaSmile,
      borderColor: "border-green-200"
    }; // Green - Minimal anxiety (0-24%)
    if (progress < 50) return { 
      color: "text-blue-600", 
      bgColor: "bg-blue-100", 
      icon: FaHeart,
      borderColor: "border-blue-200"
    }; // Blue - Mild anxiety (25-49%)
    if (progress < 75) return { 
      color: "text-yellow-600", 
      bgColor: "bg-yellow-100", 
      icon: FaBrain,
      borderColor: "border-yellow-200"
    }; // Yellow - Moderate anxiety (50-74%)
    return { 
      color: "text-red-600", 
      bgColor: "bg-red-100", 
      icon: FaHeart,
      borderColor: "border-red-200"
    }; // Red - Severe anxiety (75-100%)
  };

  const progressInfo = getProgressInfo();
  const IconComponent = progressInfo.icon;

  return (
    <div className="relative">
      <div 
        className={`rounded-full ${progressInfo.bgColor} ${progressInfo.borderColor} border-2 flex items-center justify-center relative`}
        style={{ width: size, height: size }}
      >
        <IconComponent className={`${progressInfo.color} text-lg`} />
      </div>
    </div>
  );
};


const getFireColor = (streak: number) => {
  if (streak >= 100) return 'text-yellow-400 drop-shadow-lg animate-pulse'; // Gold
  if (streak >= 60) return 'text-cyan-400 drop-shadow-lg animate-pulse'; // Cyan
  if (streak >= 50) return 'text-pink-500 drop-shadow-lg animate-pulse'; // Pink
  if (streak >= 30) return 'text-purple-500';
  if (streak >= 20) return 'text-blue-500';
  if (streak >= 10) return 'text-green-500';
  return 'text-orange-500';
};

const getFireBorderColor = (streak: number) => {
  if (streak >= 100) return 'border-yellow-400';
  if (streak >= 60) return 'border-cyan-400';
  if (streak >= 50) return 'border-pink-500';
  if (streak >= 30) return 'border-purple-500';
  if (streak >= 20) return 'border-blue-500';
  if (streak >= 10) return 'border-green-500';
  return 'border-orange-500';
};

// Add this new component for the main navigation carousel
const MainNavCarousel = ({ navigate }: { navigate: any }) => {
  const carouselRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const [activeIndex, setActiveIndex] = useState(0);

  const mainNavItems = [
    {
      id: 'cbt-modules',
      title: 'CBT Modules',
      subtitle: 'Learn coping strategies',
      icon: FaBookOpen,
      gradient: 'from-blue-500 to-indigo-600',
      bgGradient: 'from-blue-50 to-indigo-100',
      borderColor: 'border-blue-200',
      onClick: () => navigate('/cbt-modules'),
      tags: ['Interactive', 'Proven']
    },
    {
      id: 'anxiety-videos',
      title: 'Anxiety Videos',
      subtitle: 'Guided support content',
      icon: FaPlay,
      gradient: 'from-red-500 to-pink-600',
      bgGradient: 'from-red-50 to-pink-100',
      borderColor: 'border-red-200',
      onClick: () => navigate('/anxiety-videos'),
      tags: ['Video Guides', 'Expert Led']
    },
    {
      id: 'todo-list',
      title: 'To-Do List',
      subtitle: 'Track your anxiety tasks',
      icon: FaTasks,
      gradient: 'from-green-500 to-emerald-600',
      bgGradient: 'from-green-50 to-emerald-100',
      borderColor: 'border-green-200',
      onClick: () => navigate('/todo-list'),
      tags: ['Tasks', 'Progress']
    },
    {
      id: 'relaxation',
      title: 'Relaxation Tools',
      subtitle: 'Calm your mind & body',
      icon: FaLeaf,
      gradient: 'from-teal-500 to-green-600',
      bgGradient: 'from-teal-50 to-green-100',
      borderColor: 'border-teal-200',
      onClick: () => navigate('/relaxation'),
      tags: ['Meditation', 'Breathing']
    },
    {
      id: 'activities',
      title: 'Activities',
      subtitle: 'Fun wellness challenges',
      icon: FaGamepad,
      gradient: 'from-orange-500 to-amber-600',
      bgGradient: 'from-orange-50 to-amber-100',
      borderColor: 'border-orange-200',
      onClick: () => alert('Gamification - Coming Soon!'),
      tags: ['Coming Soon', 'Fun']
    }
  ];

  const checkScrollButtons = () => {
    if (carouselRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = carouselRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 1);
    }
  };

  const updateActiveIndex = () => {
    if (carouselRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = carouselRef.current;
      const maxScroll = scrollWidth - clientWidth;
      const scrollPercentage = scrollLeft / maxScroll;
      
      // Map to 4 positions: 0 (start), 1 (quarter), 2 (half), 3 (end)
      let currentIndex;
      if (scrollPercentage < 0.2) {
        currentIndex = 0;
      } else if (scrollPercentage < 0.5) {
        currentIndex = 1;
      } else if (scrollPercentage < 0.8) {
        currentIndex = 2;
      } else {
        currentIndex = 3;
      }
      
      setActiveIndex(currentIndex);
    }
  };

  const scrollCarousel = (direction: 'left' | 'right') => {
    if (!carouselRef.current) return;
    const newIndex = direction === 'right' ? Math.min(activeIndex + 1, 3) : Math.max(activeIndex - 1, 0);
    scrollToIndex(newIndex);
  };


  const scrollToIndex = (index: number) => {
    if (carouselRef.current) {
      const { scrollWidth, clientWidth } = carouselRef.current;
      const maxScroll = scrollWidth - clientWidth;
      
      let scrollLeft;
      if (index === 0) {
        scrollLeft = 0;
      } else if (index === 1) {
        scrollLeft = maxScroll * 0.33; // First third
      } else if (index === 2) {
        scrollLeft = maxScroll * 0.66; // Second third
      } else {
        scrollLeft = maxScroll; // End position
      }
      
      carouselRef.current.scrollTo({
        left: scrollLeft,
        behavior: 'smooth'
      });
    }
  };

  useEffect(() => {
    const carousel = carouselRef.current;
    if (carousel) {
      const handleScroll = () => {
        checkScrollButtons();
        updateActiveIndex();
      };

      carousel.addEventListener('scroll', handleScroll);
      handleScroll(); // Initial check
      
      return () => carousel.removeEventListener('scroll', handleScroll);
    }
  }, []);

  return (
    <div className="mb-6 w-full overflow-hidden">
      <div className="flex items-center gap-3 mb-4 px-1">
        <div className="flex items-center justify-center w-8 h-8 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-2xl shadow-lg">
          <FaSpa className="text-white text-lg" />
        </div>
        <div>
          <h2 className="font-bold text-xl bg-gradient-to-r from-gray-800 to-gray-800 bg-clip-text text-transparent">
            Your Wellness Tools
          </h2>
        </div>
      </div>
      
      <div className="relative w-full">
        {/* Left Scroll Button */}
        {canScrollLeft && (
          <button
            className="absolute left-1 top-1/2 -translate-y-1/2 z-10 w-8 h-8 sm:w-10 sm:h-10 bg-white/90 backdrop-blur-sm rounded-full shadow-lg border border-gray-200 flex items-center justify-center hover:bg-white transition-all duration-200"
            onClick={() => scrollCarousel('left')}
          >
            <FaChevronLeft className="text-gray-600 text-xs sm:text-sm" />
          </button>
        )}

        {/* Right Scroll Button */}
        {canScrollRight && (
          <button
            className="absolute right-1 top-1/2 -translate-y-1/2 z-10 w-8 h-8 sm:w-10 sm:h-10 bg-white/90 backdrop-blur-sm rounded-full shadow-lg border border-gray-200 flex items-center justify-center hover:bg-white transition-all duration-200"
            onClick={() => scrollCarousel('right')}
          >
            <FaChevronRight className="text-gray-600 text-xs sm:text-sm" />
          </button>
        )}

        {/* Carousel Container */}
        <div
          ref={carouselRef}
          className="flex gap-3 sm:gap-4 overflow-x-auto scrollbar-hide scroll-smooth px-2 py-2"
          style={{ 
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
            WebkitOverflowScrolling: 'touch'
          }}
        >
          {mainNavItems.map((item) => (
            <div
              key={item.id}
              className={`flex-shrink-0 w-56 sm:w-64 bg-gradient-to-r ${item.bgGradient} rounded-2xl p-4 sm:p-5 shadow-lg border ${item.borderColor} cursor-pointer group hover:shadow-xl transition-all duration-300 hover:-translate-y-2 hover:scale-105`}
              onClick={item.onClick}
            >
              <div className="flex items-center gap-3 sm:gap-4 mb-3">
                <div className={`w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-r ${item.gradient} rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                  <item.icon className="text-white text-lg sm:text-xl" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-gray-800 text-base sm:text-lg mb-1 truncate">{item.title}</h3>
                  <p className="text-gray-600 text-xs sm:text-sm truncate">{item.subtitle}</p>
                </div>
              </div>
              
              <div className="flex gap-2 flex-wrap">
                {item.tags.map((tag, tagIndex) => (
                  <span
                    key={tagIndex}
                    className={`text-xs px-2 py-1 rounded-full font-medium ${
                      item.id === 'cbt-modules' ? 'bg-blue-100 text-blue-800' :
                      item.id === 'anxiety-videos' ? 'bg-red-100 text-red-800' :
                      item.id === 'todo-list' ? 'bg-green-100 text-green-800' :
                      item.id === 'relaxation' ? 'bg-teal-100 text-teal-800' :
                      'bg-orange-100 text-orange-800'
                    }`}
                  >
                    {tag}
                  </span>
                ))}
              </div>
              
              <div className="mt-3 flex items-center justify-between">
                <div className="flex items-center gap-2 text-gray-500">
                  <div className="w-2 h-2 bg-current rounded-full opacity-60"></div>
                  <span className="text-xs">Tap to explore</span>
                </div>
                <FaChevronRight className={`text-gray-400 group-hover:text-gray-600 transition-colors text-sm group-hover:translate-x-1 transition-transform`} />
              </div>
            </div>
          ))}
        </div>
        
        {/* Enhanced Scroll Indicator Dots */}
        <div className="flex justify-center gap-2 sm:gap-3 mt-4">
          {[0, 1, 2, 3].map((index) => (
            <button
              key={index}
              className={`relative rounded-full transition-all duration-300 cursor-pointer hover:scale-110 ${
                activeIndex === index 
                  ? 'w-6 sm:w-8 h-2.5 sm:h-3 bg-[#800000]' 
                  : 'w-2.5 sm:w-3 h-2.5 sm:h-3 bg-gray-300 hover:bg-gray-400'
              }`}
              onClick={() => scrollToIndex(index)}
            >
              {/* Active indicator glow effect */}
              {activeIndex === index && (
                <div className="absolute inset-0 bg-[#800000] rounded-full opacity-30 blur-sm scale-150" />
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

const Dashboard = () => {
  // ...existing code...
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);

  const navigate = useNavigate();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [selectedTab, setSelectedTab] = useState('home');
  const [breathingActive, setBreathingActive] = useState(false);
  const [userData, setUserData] = useState<any>(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [recentAssessment, setRecentAssessment] = useState<any>(null);
  const [loadingAssessment, setLoadingAssessment] = useState(true);
  const [previousAssessment, setPreviousAssessment] = useState<any>(null);
  const [userStreak, setUserStreak] = useState<number>(0);
  const [loadingStreak, setLoadingStreak] = useState(true);
  const [streakIncrease] = useState(false);
  const prevStreakRef = useRef<number>(0);
  const [showAssessmentRecords, setShowAssessmentRecords] = useState(false);

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        if (!userData || !userData.id) return;
        const { data, error } = await supabase
          .from('appointments')
          .select('*')
          .eq('profile_id', userData.id)
          .in('status', ['Scheduled', 'In Progress'])
          .gte('appointment_date', new Date().toISOString().split('T')[0]);
        if (error) {
          console.error('Error fetching notifications:', error);
          setNotifications([]);
        } else {
          setNotifications(data || []);
        }
      } catch (err) {
        console.error('Unexpected error fetching notifications:', err);
        setNotifications([]);
      }
    };
    fetchNotifications();
  }, [userData]);

  const headerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const fetchUserData = async () => {
      setLoadingUser(true);
      try {
        console.log('Fetching fresh user data in Dashboard...');
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          setUserData(null);
          setLoadingUser(false);
          return;
        }
        const userId = session.user.id;
        
        // Force a fresh fetch by bypassing cache
        // (Supabase JS uses HTTP under the hood; we rely on server freshness here)
        
        // Add no-cache headers to force a fresh fetch
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', userId)
          .single();
          
        if (error) {
          console.error('Error fetching profile:', error);
          setUserData(null);
        } else {
          console.log('Fetched fresh profile data:', profile);
          // Block archived users from accessing the app
          if ((profile as any)?.role?.toLowerCase?.() === 'archived') {
            try {
              await supabase.auth.signOut();
            } catch (e) {
              console.error('Error signing out archived user:', e);
            }
            navigate('/');
            return;
          }
          setUserData(profile);
          // After fetching profile, fetch the student's assessments
          fetchStudentAssessments(profile.id);
          // Update the user streak whenever they view the dashboard
          fetchAndUpdateStreak(userId);
        }
      } catch (err) {
        console.error('Unexpected error fetching user data:', err);
        setUserData(null);
      } finally {
        setLoadingUser(false);
      }
    };
    
    // Call fetchUserData immediately
    fetchUserData();
    
    // Set up a listener for auth state changes
    const { data: authListener } = supabase.auth.onAuthStateChange(() => {
      console.log('Auth state changed, refreshing user data...');
      fetchUserData();
    });
    
    // Clean up the listener when component unmounts
    return () => {
      if (authListener && authListener.subscription) {
        authListener.subscription.unsubscribe();
      }
    };
  }, []);

  // Function to fetch and update user streak
  const fetchAndUpdateStreak = async (userId: string) => {
    setLoadingStreak(true);
    try {
      // Just get the current streak without updating it
      // The login process already handles streak updates
      const streak = await streakService.getUserStreak(userId);
      setUserStreak(streak);
      prevStreakRef.current = streak;
    } catch (err) {
      console.error('Error fetching streak:', err);
      setUserStreak(0);
      prevStreakRef.current = 0;
    } finally {
      setLoadingStreak(false);
    }
  };

  // Function to fetch student assessments
  const fetchStudentAssessments = async (profileId: number) => {
    setLoadingAssessment(true);
    try {
      // Get the two most recent assessments, ordered by creation date
      const { data: assessments, error } = await supabase
        .from('anxiety_assessments')
        .select('*')
        .eq('profile_id', profileId)
        .order('created_at', { ascending: false })
        .limit(2);
      
      if (error) {
        console.error('Error fetching assessments:', error);
        return;
      }
      
      if (assessments && assessments.length > 0) {
        // Set the most recent assessment
        setRecentAssessment(assessments[0]);
        
        // If there's a second assessment, use it to calculate improvement
        if (assessments.length > 1) {
          setPreviousAssessment(assessments[1]);
        }
      }
    } catch (err) {
      console.error('Unexpected error fetching assessments:', err);
    } finally {
      setLoadingAssessment(false);
    }
  };

  // Calculate improvement percentage between the two latest assessments
  const calculateImprovement = () => {
    if (!recentAssessment || !previousAssessment) return null;
    
    const currentScore = recentAssessment.percentage;
    const previousScore = previousAssessment.percentage;
    
    // Lower percentage is better for anxiety assessment
    const difference = previousScore - currentScore;
    const improvementPercentage = Math.round(difference);
    
    return {
      value: improvementPercentage,
      isPositive: improvementPercentage > 0  // Positive means anxiety level decreased (improvement)
    };
  };

  // Format the assessment date
  const formatAssessmentDate = (dateString: string) => {
    const assessmentDate = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (assessmentDate.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (assessmentDate.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return assessmentDate.toLocaleDateString();
    }
  };

  const getGreeting = () => {
    const hour = currentTime.getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 18) return "Good Afternoon";
    return "Good Evening";
  };



  // Function to handle navigation to assessment
  const goToAssessment = () => {
    navigate('/assessment');
  };

  // Function to handle navigation to profile
  const goToProfile = () => {
    navigate('/profile');
  };

  // State for logout confirmation modal
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  // Function to handle logout
  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      navigate('/');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  // Function to show logout confirmation
  const showLogoutConfirmation = () => {
    setShowLogoutModal(true);
  };

  // Function to confirm logout
  const confirmLogout = () => {
    setShowLogoutModal(false);
    handleLogout();
  };

  // Function to cancel logout
  const cancelLogout = () => {
    setShowLogoutModal(false);
  };

  // Function to scroll to top
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };


  // Inline notification preview (Facebook-style popover)
  const [activeNotification, setActiveNotification] = useState<any | null>(null);
  const openNotificationPopover = (appt: any) => setActiveNotification(appt);
  const closeNotificationPopover = () => setActiveNotification(null);

  return (
    <div className="min-h-screen bg-[#800000]/5 w-full" style={{ maxWidth: '100vw' }}>
      {/* Header */}
      <div 
        ref={headerRef}
        className="bg-[#800000] border-b border-white/10 sticky top-0 z-50 shadow-lg w-full backdrop-blur-sm"
      >
        
        <div className="relative px-3 sm:px-4 md:px-6 py-3 sm:py-4 w-full max-w-full">
          <div className="flex items-center justify-between w-full max-w-full">
            {/* Left: Greeting Section */}
            <div className="flex-1 min-w-0 max-w-[calc(100%-120px)] sm:max-w-[calc(100%-140px)]">
              <div className="flex items-center space-x-2 sm:space-x-3">
                {/* Simple Lotus Icon */}
                <div className="flex-shrink-0">
                  <img 
                    src="/lotus.png" 
                    alt="Lotus" 
                    className="h-10 w-10 sm:h-12 sm:w-12" 
                  />
                </div>
                
                {/* Greeting Text */}
                <div className="flex-1 min-w-0 ml-2 sm:ml-3">
                  <h1 
                    className="relative text-base sm:text-lg md:text-xl lg:text-2xl font-bold text-white"
                    style={{ 
                      textShadow: '0 2px 8px rgba(0,0,0,0.4), 0 0 30px rgba(255,255,255,0.15), 0 0 60px rgba(255,255,255,0.05)'
                    }}
                  >
                    {/* Text background */}
                    <div className="absolute inset-0 bg-gradient-to-r from-white/5 via-white/10 to-white/5 rounded-lg blur-sm -z-10" />
                    <span className="block">
                      {getGreeting()}
                    </span>
                    <span className="block text-sm sm:text-base md:text-lg lg:text-xl font-medium text-white/90 truncate">
                      {loadingUser ? (
                        <span className="inline-flex items-center">
                          <span className="w-3 h-3 sm:w-4 sm:h-4 bg-white/30 rounded-full animate-pulse mr-1"></span>
                          Loading...
                        </span>
                      ) : (
                        `${(userData?.full_name || userData?.name || mockUserData.name || 'User').split(' ')[0]}!`
                      )}
                    </span>
                  </h1>
                  
                  {/* Time indicator - now visible on small screens with larger text */}
                  <p className="hidden sm:block text-xs sm:text-sm md:text-base text-white/80 font-medium mt-1 truncate">
                    {currentTime.toLocaleDateString('en-US', { 
                      weekday: 'long', 
                      month: 'short', 
                      day: 'numeric' 
                    })}
                  </p>
                </div>
              </div>
            </div>

            {/* Right: Action Buttons */}
            <div className="flex items-center space-x-2 flex-shrink-0">
              {/* Notification Button */}
              <button 
                className="relative bg-white/10 hover:bg-white/20 rounded-full transition-colors w-10 h-10 flex items-center justify-center border border-white/20"
                onClick={() => {
                  if (notifications && notifications.length > 0) {
                    openNotificationPopover(notifications[0]);
                  } else {
                    setShowNotifications((prev) => !prev);
                  }
                }}
                aria-label="Show notifications"
              >
                <FaBell className="text-white text-base" />
                {notifications.length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full min-w-[16px] h-[16px] flex items-center justify-center font-medium">
                    {notifications.length > 9 ? '9+' : notifications.length}
                  </span>
                )}
              </button>

              {/* Logout Button */}
              <button 
                className="bg-white/10 hover:bg-white/20 rounded-full transition-colors w-10 h-10 flex items-center justify-center border border-white/20"
                onClick={showLogoutConfirmation}
                title="Sign Out"
              >
                <FaSignOutAlt className="text-white text-base" />
              </button>
            </div>
          </div>

          {/* Notification Panel */}
          {showNotifications && (
            <div className="absolute right-3 sm:right-4 md:right-6 top-full mt-2 bg-white/95 backdrop-blur-md border border-gray-200/50 rounded-2xl shadow-2xl z-50 w-[calc(100vw-24px)] sm:w-80 md:w-96 max-w-md">
              <div className="p-4 sm:p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-[#800000] text-lg flex items-center">
                    <FaBell className="mr-2" /> 
                    Notifications
                  </h3>
                  <button
                    className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
                    onClick={() => setShowNotifications(false)}
                  >
                    <span className="text-gray-400 text-xl">×</span>
                  </button>
                </div>
                
                {notifications.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                      <FaBell className="text-gray-400 text-xl" />
                    </div>
                    <p className="text-gray-500 text-sm">No upcoming appointments.</p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-64 overflow-y-auto">
                    {notifications.map((appt) => (
                      <div 
                        key={appt.id} 
                        className="cursor-pointer bg-gradient-to-r from-[#800000]/5 to-[#800000]/10 rounded-xl p-3 border border-[#800000]/10 hover:border-[#800000]/20 transition-all duration-200"
                        onClick={() => openNotificationPopover(appt)}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <span className="font-semibold text-[#800000] text-sm">Appointment Scheduled</span>
                              <span className="text-[10px] text-gray-500 ml-2">{new Date(appt.appointment_date).toLocaleDateString()}</span>
                            </div>
                            <div className="text-xs text-gray-700 mt-1">
                              <div className="flex items-center">
                                <FaCalendarAlt className="mr-1 text-[#800000]" />
                                {appt.appointment_time} • Status: {appt.status}
                              </div>
                            </div>
                            {appt.notes && (
                              <div className="text-xs text-gray-600 mt-2 p-2 bg-white/60 rounded-lg">
                                Notes: {appt.notes}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Notification Modal - Positioned outside header for proper layering */}
      {activeNotification && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-[9998]"
            onClick={closeNotificationPopover}
          />
          
          {/* Modal positioned below notification button - Fully responsive */}
          <div 
            className="fixed right-2 sm:right-3 md:right-4 lg:right-6 top-14 sm:top-16 md:top-16 bg-white rounded-xl sm:rounded-2xl shadow-2xl border border-gray-200 w-[calc(100vw-16px)] xs:w-[calc(100vw-20px)] sm:w-80 md:w-96 lg:w-[400px] max-w-[95vw] sm:max-w-md overflow-hidden z-[9999]"
            onClick={(e) => e.stopPropagation()}
          >
              {/* Header - Mobile responsive */}
              <div className="bg-gradient-to-r from-[#800000] to-[#a00000] p-3 sm:p-4 text-white">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
                      <FaCalendarAlt className="text-white text-sm sm:text-lg" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-bold text-base sm:text-lg truncate">Appointment Details</h3>
                      <p className="text-white/80 text-xs sm:text-sm truncate">Your scheduled appointment</p>
                    </div>
                  </div>
                  <button 
                    onClick={closeNotificationPopover}
                    className="w-7 h-7 sm:w-8 sm:h-8 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition-colors flex-shrink-0 ml-2"
                  >
                    <span className="text-white text-base sm:text-lg">×</span>
                  </button>
                </div>
              </div>

              {/* Content - Mobile responsive */}
              <div className="p-3 sm:p-4 md:p-6 space-y-3 sm:space-y-4">
                {/* Date & Time Section */}
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg sm:rounded-xl p-3 sm:p-4 border border-blue-200">
                  <h4 className="font-semibold text-blue-800 mb-2 sm:mb-3 flex items-center text-sm sm:text-base">
                    <FaCalendarAlt className="mr-1 sm:mr-2 text-xs sm:text-sm" />
                    Date & Time
                  </h4>
                  <div className="space-y-2">
                    <div className="flex items-start sm:items-center justify-between gap-2">
                      <span className="text-gray-600 font-medium text-xs sm:text-sm flex-shrink-0">Date:</span>
                      <span className="font-semibold text-gray-900 text-xs sm:text-sm text-right">
                        {new Date(activeNotification.appointment_date).toLocaleDateString('en-US', {
                          weekday: 'short',
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        })}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-gray-600 font-medium text-xs sm:text-sm flex-shrink-0">Time:</span>
                      <span className="font-semibold text-gray-900 text-xs sm:text-sm">{activeNotification.appointment_time}</span>
                    </div>
                  </div>
                </div>

                {/* Status Section */}
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg sm:rounded-xl p-3 sm:p-4 border border-green-200">
                  <h4 className="font-semibold text-green-800 mb-2 flex items-center text-sm sm:text-base">
                    <div className="w-3 h-3 sm:w-4 sm:h-4 bg-green-500 rounded-full mr-1 sm:mr-2"></div>
                    Status
                  </h4>
                  <div className="flex items-start sm:items-center justify-between gap-2">
                    <span className="text-gray-600 font-medium text-xs sm:text-sm flex-shrink-0">Current Status:</span>
                    <span className={`px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-semibold ${
                      activeNotification.status === 'Scheduled' ? 'bg-blue-100 text-blue-800' :
                      activeNotification.status === 'In Progress' ? 'bg-yellow-100 text-yellow-800' :
                      activeNotification.status === 'Completed' ? 'bg-green-100 text-green-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {activeNotification.status}
                    </span>
                  </div>
                </div>

                {/* Notes Section */}
                {activeNotification.notes && (
                  <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg sm:rounded-xl p-3 sm:p-4 border border-purple-200">
                    <h4 className="font-semibold text-purple-800 mb-2 flex items-center text-sm sm:text-base">
                      <FaBell className="mr-1 sm:mr-2 text-xs sm:text-sm" />
                      Additional Notes
                    </h4>
                    <div className="bg-white/60 rounded-lg p-2 sm:p-3 border border-purple-100">
                      <p className="text-gray-700 leading-relaxed text-xs sm:text-sm">{activeNotification.notes}</p>
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="pt-1 sm:pt-2 flex gap-2 sm:gap-3">
                  <button
                    onClick={closeNotificationPopover}
                    className="flex-1 bg-gradient-to-r from-[#800000] to-[#a00000] hover:from-[#660000] hover:to-[#800000] text-white font-semibold py-2.5 sm:py-3 px-3 sm:px-4 rounded-lg sm:rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl text-sm sm:text-base"
                  >
                    Got it
                  </button>
                </div>
              </div>
          </div>
        </>
      )}

      {/* Logout Confirmation Modal */}
      {showLogoutModal && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9998]"
            onClick={cancelLogout}
          />
          
          {/* Modal */}
          <div className="fixed inset-0 flex items-center justify-center z-[9999] p-4">
            <div 
              className="bg-white rounded-2xl shadow-2xl border border-gray-200 w-full max-w-sm overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="bg-gradient-to-r from-[#800000] to-[#a00000] p-6 text-white">
                  <div className="flex items-center justify-center">
                    <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center mb-2">
                      <FaSignOutAlt className="text-white text-xl" />
                    </div>
                  </div>
                  <h3 className="text-xl font-bold text-center">Sign Out</h3>
                  <p className="text-white/80 text-sm text-center mt-1">Confirm your action</p>
                </div>

                {/* Content */}
                <div className="p-6">
                  <div className="text-center mb-6">
                    <p className="text-gray-700 text-base leading-relaxed">
                      Are you sure you want to sign out of your account?
                    </p>
                    <p className="text-gray-500 text-sm mt-2">
                      You'll need to log in again to access your wellness dashboard.
                    </p>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-3">
                    <button
                      onClick={cancelLogout}
                      className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-3 px-4 rounded-xl transition-all duration-200 border border-gray-200"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={confirmLogout}
                      className="flex-1 bg-gradient-to-r from-[#800000] to-[#a00000] hover:from-[#660000] hover:to-[#800000] text-white font-semibold py-3 px-4 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl"
                    >
                      Sign Out
                    </button>
                  </div>
                </div>
            </div>
          </div>
        </>
      )}

      {/* Scroll To Top Button */}
        <button
          onClick={scrollToTop}
          className="fixed bottom-20 sm:bottom-24 right-3 sm:right-4 z-40 w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-r from-[#800000] to-[#a00000] hover:from-[#660000] hover:to-[#800000] text-white rounded-full shadow-2xl flex items-center justify-center transition-all duration-300 hover:shadow-3xl border-2 border-white/20 hover:scale-110 hover:-translate-y-1"
        >
          <FaArrowUp className="text-lg sm:text-xl" />
        </button>

      {/* Main Content */}
      <div className="w-full max-w-full px-3 sm:px-4 py-4 sm:py-6 pb-20 overflow-x-hidden">
        {/* Main Navigation Carousel */}
        <MainNavCarousel navigate={navigate} />
        
        {/* Stats Cards */}
        <div className="grid grid-cols-2 gap-2 sm:gap-3 mb-6 w-full">
          {/* Day Streak Card */}
          <div 
            className={`bg-white rounded-xl sm:rounded-2xl p-2 sm:p-3 shadow-lg border-2 w-full ${getFireBorderColor(userStreak)}`}
          >
            <div className="flex items-center justify-between mb-1 sm:mb-2">
              <div>
                <FaFire className={`${getFireColor(userStreak)} text-lg sm:text-xl`} title={
                  userStreak >= 100 ? '🔥 100+ Day Streak! Legendary!' :
                  userStreak >= 60 ? '🔥 60+ Day Streak! Incredible!' :
                  userStreak >= 50 ? '🔥 50+ Day Streak! Amazing!' :
                  userStreak >= 30 ? '🔥 30+ Day Streak! Awesome!' :
                  userStreak >= 20 ? '🔥 20+ Day Streak! Great job!' :
                  userStreak >= 10 ? '🔥 10+ Day Streak! Keep going!' :
                  '🔥 Keep your streak alive!'
                } />
              </div>
              {loadingStreak ? (
                <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full border-2 border-gray-300 border-t-orange-500 animate-spin"></div>
              ) : (
                <span 
                  className={`text-xl sm:text-2xl font-bold relative ${getFireColor(userStreak)}`}
                >
                  {userStreak}
                  {streakIncrease && (
                    <span
                      className="absolute -top-3 sm:-top-4 left-1/2 -translate-x-1/2 text-green-500 text-sm sm:text-base font-bold drop-shadow"
                    >
                      +1
                    </span>
                  )}
                </span>
              )}
            </div>
            <p className={`text-xs sm:text-sm font-bold mb-1 ${getFireColor(userStreak)}`}>Day Streak</p>
            <div className="flex flex-col items-center mt-1 mb-1 sm:mt-2 sm:mb-2">
              <StreakPet streak={userStreak} className="animate-bounce-slow" showLabel={false} />
            </div>
            <div className="mt-1 sm:mt-2 flex items-center gap-1 justify-center">
              <FaArrowUp className={`text-xs ${getFireColor(userStreak)}`} />
              <span className={`text-xs font-medium ${getFireColor(userStreak)} text-center leading-tight`}>
                {userStreak > 0 ? `${userStreak} days!` : 'Start today!'}
              </span>
            </div>
          </div>

          {/* Recent Assessment Compact Card */}
          <div 
            onClick={() => recentAssessment && setShowAssessmentRecords(true)}
            className={`relative overflow-hidden rounded-xl sm:rounded-2xl p-2 sm:p-3 shadow-lg border-2 w-full ${
              loadingAssessment ? 'bg-gradient-to-br from-gray-50 to-gray-100 border-gray-300' :
              !recentAssessment ? 'bg-gradient-to-br from-[#800000]/10 to-[#800000]/20 border-[#800000]/30' :
              recentAssessment.percentage < 25 ? 'bg-gradient-to-br from-green-50 to-emerald-100 border-green-400' :
              recentAssessment.percentage < 50 ? 'bg-gradient-to-br from-blue-50 to-blue-100 border-blue-400' :
              recentAssessment.percentage < 75 ? 'bg-gradient-to-br from-yellow-50 to-orange-100 border-yellow-400' :
              'bg-gradient-to-br from-red-50 to-red-100 border-red-400'
            } ${recentAssessment ? 'cursor-pointer hover:scale-105 transition-transform duration-200' : ''}`}
          >
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-10">
              <div className={`w-full h-full ${
                loadingAssessment ? 'bg-gray-200' :
                !recentAssessment ? 'bg-[#800000]' :
                recentAssessment.percentage < 25 ? 'bg-green-500' :
                recentAssessment.percentage < 50 ? 'bg-blue-500' :
                recentAssessment.percentage < 75 ? 'bg-yellow-500' :
                'bg-red-500'
              }`} style={{
                backgroundImage: 'radial-gradient(circle at 20% 80%, currentColor 15%, transparent 16%), radial-gradient(circle at 80% 20%, currentColor 15%, transparent 16%), radial-gradient(circle at 40% 40%, currentColor 15%, transparent 16%)'
              }}></div>
            </div>

            <div className="relative z-10">
              <div className="flex items-center justify-between mb-2 sm:mb-3">
                {/* Icon with background */}
                <div
                  className={`relative w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl flex items-center justify-center shadow-lg ${
                    loadingAssessment ? 'bg-gradient-to-r from-gray-400 to-gray-500' :
                    !recentAssessment ? 'bg-gradient-to-r from-[#800000] to-[#a00000]' :
                    recentAssessment.percentage < 25 ? 'bg-gradient-to-r from-green-500 to-emerald-600' :
                    recentAssessment.percentage < 50 ? 'bg-gradient-to-r from-blue-500 to-blue-600' :
                    recentAssessment.percentage < 75 ? 'bg-gradient-to-r from-yellow-500 to-orange-600' :
                    'bg-gradient-to-r from-red-500 to-red-600'
                  }`}
                >
                  <FaChartLine className="text-white text-base sm:text-lg drop-shadow-sm" />
                </div>
                
                {/* Progress Ring or Loading */}
                {loadingAssessment ? (
                  <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full border-2 border-gray-300 border-t-[#800000] animate-spin"></div>
                ) : recentAssessment ? (
                  <div 
                    className="flex items-center gap-1 sm:gap-2"
                  >
                    <div className="relative">
                      <ProgressRing progress={recentAssessment.percentage} size={35} />
                    </div>
                  </div>
                ) : (
                  <div 
                    className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-r from-[#800000] to-[#a00000] rounded-lg sm:rounded-xl flex items-center justify-center shadow-lg"
                  >
                    <FaBrain className="text-white text-xs sm:text-sm" />
                  </div>
                )}
              </div>
              
              {/* Content */}
              {loadingAssessment ? (
                <>
                  <p className="text-xs sm:text-sm font-bold text-gray-700 mb-1">Assessment</p>
                  <p className="text-xs text-gray-500">Loading...</p>
                  <div className="mt-1 sm:mt-2 flex gap-1">
                    <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                </>
              ) : recentAssessment ? (
                <>
                  <div className="flex items-center gap-1 sm:gap-2 mb-1 sm:mb-2">
                    <p className={`text-xs sm:text-sm font-semibold ${
                      recentAssessment.percentage < 25 ? 'text-green-800' :
                      recentAssessment.percentage < 50 ? 'text-blue-800' :
                      recentAssessment.percentage < 75 ? 'text-yellow-800' :
                      'text-red-800'
                    }`}>
                      {recentAssessment.anxiety_level}
                    </p>
                    {/* Status Badge */}
                    <span className={`px-1.5 py-0.5 sm:px-2 sm:py-1 rounded-full text-xs font-bold border ${
                      recentAssessment.percentage < 25 ? 'bg-green-100 text-green-800 border-green-200' :
                      recentAssessment.percentage < 50 ? 'bg-blue-100 text-blue-800 border-blue-200' :
                      recentAssessment.percentage < 75 ? 'bg-yellow-100 text-yellow-800 border-yellow-200' :
                      'bg-red-100 text-red-800 border-red-200'
                    }`}>
                      {recentAssessment.percentage}%
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1 sm:gap-2 min-w-0 flex-1">
                      <FaCalendarAlt className={`text-xs flex-shrink-0 ${
                        recentAssessment.percentage < 25 ? 'text-green-600' :
                        recentAssessment.percentage < 50 ? 'text-blue-600' :
                        recentAssessment.percentage < 75 ? 'text-yellow-600' :
                        'text-red-600'
                      }`} />
                      <span className="text-xs font-medium text-gray-600 truncate">
                        {formatAssessmentDate(recentAssessment.created_at)}
                      </span>
                    </div>
                    
                    {calculateImprovement() && (
                      <span 
                        className={`font-bold text-xs flex items-center gap-0.5 px-1.5 py-0.5 sm:px-2 sm:py-1 rounded-full flex-shrink-0 ${
                          calculateImprovement()!.isPositive 
                            ? 'bg-green-100 text-green-700 border border-green-300' 
                            : 'bg-red-100 text-red-700 border border-red-300'
                        }`}
                      >
                        {calculateImprovement()!.isPositive ? <FaArrowUp className="text-xs" /> : <FaArrowUp className="text-xs rotate-180" />}
                        {calculateImprovement()!.isPositive ? '+' : ''}{calculateImprovement()!.value}%
                      </span>
                    )}
                  </div>
                </>
              ) : (
                <>
                  <p className="text-xs sm:text-sm font-bold text-[#800000] mb-1">Assessment</p>
                  <p className="text-xs text-gray-600 mb-2 sm:mb-3 leading-tight">Start your wellness journey</p>
                  <button 
                    onClick={goToAssessment}
                    className="w-full bg-gradient-to-r from-[#800000] to-[#a00000] text-white text-xs px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg hover:from-[#660000] hover:to-[#800000] transition-all duration-200 font-medium shadow-md hover:shadow-lg flex items-center justify-center gap-1 sm:gap-2 hover:scale-105"
                  >
                    <FaChartLine className="text-xs" />
                    <span className="truncate">Take Assessment</span>
                  </button>
                </>
              )}
            </div>
          </div>
        </div>



        {/* Breathing Exercise */}
        <div className="mb-6" data-section="breathing-exercise">
          <BreathingExercise 
            breathingActive={breathingActive}
            setBreathingActive={setBreathingActive}
          />
        </div>

        {/* Quick Relaxation Tools */}
        <div className="mb-6" data-relaxation-tools>
          <QuickRelaxation />
        </div>

        {/* Today's Activities - Dynamic Content */}
        <div data-section="todays-activities">
          <TodaysActivities navigate={navigate} userData={userData} />
        </div>


        {/* Functional Mood Tracker */}
        <MoodTracker userData={userData} />
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-gray-200/50 shadow-2xl z-50">
        <div className="flex justify-around py-1.5 sm:py-2 px-2 w-full max-w-full">
          {[
            { id: 'home', icon: FaHeart, label: 'Home', color: 'text-pink-500', action: () => {
              setSelectedTab('home');
              scrollToTop();
            }},
            { id: 'brain', icon: FaBrain, label: 'Assessment', color: 'text-[#800000]', action: goToAssessment },
            { id: 'breathing', icon: FaLeaf, label: 'Breathing', color: 'text-green-500', action: () => {
              setSelectedTab('breathing');
              // Scroll to breathing exercise section
              const breathingSection = document.querySelector('[data-section="breathing-exercise"]');
              if (breathingSection) {
                breathingSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }
            }},
            { id: 'activities', icon: FaCalendarAlt, label: 'Activities', color: 'text-indigo-500', action: () => {
              setSelectedTab('activities');
              // Scroll to Today's Activities section
              const activitiesSection = document.querySelector('[data-section="todays-activities"]');
              if (activitiesSection) {
                activitiesSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }
            }},
            { id: 'user', icon: FaUser, label: 'Profile', color: 'text-gray-500', action: goToProfile }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={tab.action}
              className={`relative flex flex-col items-center justify-center py-2 sm:py-3 px-2 sm:px-3 rounded-xl sm:rounded-2xl transition-all duration-300 min-w-0 flex-1 hover:scale-105 ${
                selectedTab === tab.id 
                  ? 'bg-gradient-to-t from-[#800000]/10 to-[#800000]/5 shadow-lg' 
                  : 'hover:bg-gray-50'
              }`}
            >
              <tab.icon className={`text-base sm:text-lg ${selectedTab === tab.id ? tab.color : 'text-gray-400'}`} />
              <span className={`text-xs mt-0.5 sm:mt-1 truncate ${selectedTab === tab.id ? tab.color : 'text-gray-400'}`}>
                {tab.label}
              </span>
              {selectedTab === tab.id && (
                <div className="absolute -bottom-1 w-1.5 h-1.5 rounded-full bg-[#800000]" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Assessment Records Modal */}
      <AssessmentRecordsModal
        isOpen={showAssessmentRecords}
        onClose={() => setShowAssessmentRecords(false)}
        userId={userData?.id || ''}
      />
    </div>
  );
};

export default Dashboard;