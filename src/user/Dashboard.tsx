import React, { useState, useEffect, useRef } from 'react';
import { 
  FaHeart, 
  FaBrain, 
  FaLeaf, 
  FaPlay, 
  FaTrophy, 
  FaUser, 
  FaBell, 
  FaCalendarAlt, 
  FaChartLine, 
  // FaMedal,
  FaFire,
  // FaStar,
  FaCheck,
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
  FaCheckCircle,
  FaHome,
  FaTasks
} from 'react-icons/fa';

import { motion, AnimatePresence, useInView, useScroll, useTransform } from 'framer-motion';
import type { Variants } from 'framer-motion';
import { supabase } from '../lib/supabase';
import { streakService } from '../lib/streakService';
import { useNavigate } from 'react-router-dom';
import { StreakPet } from './StreakPet';
import QuickRelaxation from './components/QuickRelaxation';

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
  achievements: [
    { id: 1, name: "First Steps", icon: "🌱", unlocked: true },
    { id: 2, name: "Weekly Warrior", icon: "🔥", unlocked: true },
    { id: 3, name: "Mindful Master", icon: "🧘‍♀️", unlocked: false },
    { id: 4, name: "Calm Collector", icon: "☮️", unlocked: false }
  ]
};

type ProgressRingProps = {
  progress: number;
  size?: number;
};

const ProgressRing = ({ progress, size = 60 }: ProgressRingProps) => {

  // Determine color and icon based on progress (lower is better for anxiety)
  const getProgressInfo = () => {
    if (progress < 25) return { 
      color: "text-green-500", 
      bgColor: "bg-green-100", 
      icon: FaSmile,
      borderColor: "border-green-300"
    }; // Green - Low anxiety
    if (progress < 50) return { 
      color: "text-blue-500", 
      bgColor: "bg-blue-100", 
      icon: FaHeart,
      borderColor: "border-blue-300"
    }; // Blue - Mild anxiety
    if (progress < 75) return { 
      color: "text-yellow-500", 
      bgColor: "bg-yellow-100", 
      icon: FaBrain,
      borderColor: "border-yellow-300"
    }; // Yellow - Moderate anxiety
    return { 
      color: "text-red-500", 
      bgColor: "bg-red-100", 
      icon: FaHeart,
      borderColor: "border-red-300"
    }; // Red - High anxiety
  };

  const progressInfo = getProgressInfo();
  const IconComponent = progressInfo.icon;

  return (
    <motion.div 
      className="relative"
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, delay: 0.2 }}
    >
      <motion.div 
        className={`rounded-full ${progressInfo.bgColor} ${progressInfo.borderColor} border-2 flex items-center justify-center relative`}
        style={{ width: size, height: size }}
        initial={{ opacity: 0, rotate: -180 }}
        animate={{ opacity: 1, rotate: 0 }}
        transition={{ duration: 1, ease: "easeOut" }}
      >
        <IconComponent className={`${progressInfo.color} text-lg`} />
      </motion.div>
    </motion.div>
  );
};

// Add this new component for scroll-triggered animations
interface ScrollRevealProps {
  children: React.ReactNode;
  delay?: number;
  direction?: "up" | "down" | "left" | "right";
}

const ScrollReveal = ({ children, delay = 0, direction = "up" }: ScrollRevealProps) => {
  const ref = useRef<HTMLDivElement | null>(null);
  const isInView = useInView(ref, { once: true, amount: 0.3 });
  
  const variants: Variants = {
    hidden: {
      opacity: 0,
      y: direction === "up" ? 50 : direction === "down" ? -50 : 0,
      x: direction === "left" ? 50 : direction === "right" ? -50 : 0,
    },
    visible: {
      opacity: 1,
      y: 0,
      x: 0,
      transition: {
        duration: 0.6,
        delay: delay,
        ease: [0.22, 1, 0.36, 1]
      }
    }
  };

  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={isInView ? "visible" : "hidden"}
      variants={variants}
    >
      {children}
    </motion.div>
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
      <motion.h2 
        className="font-bold text-xl text-gray-800 mb-4 px-1"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        🎯 Your Wellness Tools
      </motion.h2>
      
      <div className="relative w-full">
        {/* Left Scroll Button */}
        <AnimatePresence>
          {canScrollLeft && (
            <motion.button
              className="absolute left-1 top-1/2 -translate-y-1/2 z-10 w-8 h-8 sm:w-10 sm:h-10 bg-white/90 backdrop-blur-sm rounded-full shadow-lg border border-gray-200 flex items-center justify-center hover:bg-white transition-all duration-200"
              onClick={() => scrollCarousel('left')}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <FaChevronLeft className="text-gray-600 text-xs sm:text-sm" />
            </motion.button>
          )}
        </AnimatePresence>

        {/* Right Scroll Button */}
        <AnimatePresence>
          {canScrollRight && (
            <motion.button
              className="absolute right-1 top-1/2 -translate-y-1/2 z-10 w-8 h-8 sm:w-10 sm:h-10 bg-white/90 backdrop-blur-sm rounded-full shadow-lg border border-gray-200 flex items-center justify-center hover:bg-white transition-all duration-200"
              onClick={() => scrollCarousel('right')}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <FaChevronRight className="text-gray-600 text-xs sm:text-sm" />
            </motion.button>
          )}
        </AnimatePresence>

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
          {mainNavItems.map((item, index) => (
            <motion.div
              key={item.id}
              className={`flex-shrink-0 w-56 sm:w-64 bg-gradient-to-r ${item.bgGradient} rounded-2xl p-4 sm:p-5 shadow-lg border ${item.borderColor} cursor-pointer group hover:shadow-xl transition-all duration-300`}
              onClick={item.onClick}
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: index * 0.1 }}
              whileHover={{ y: -8, scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
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
            </motion.div>
          ))}
        </div>
        
        {/* Enhanced Scroll Indicator Dots */}
        <div className="flex justify-center gap-2 sm:gap-3 mt-4">
          {[0, 1, 2, 3].map((index) => (
            <motion.button
              key={index}
              className={`relative rounded-full transition-all duration-300 cursor-pointer ${
                activeIndex === index 
                  ? 'w-6 sm:w-8 h-2.5 sm:h-3 bg-[#800000]' 
                  : 'w-2.5 sm:w-3 h-2.5 sm:h-3 bg-gray-300 hover:bg-gray-400'
              }`}
              onClick={() => scrollToIndex(index)}
              whileHover={{ scale: 1.2 }}
              whileTap={{ scale: 0.9 }}
              initial={false}
              animate={{
                width: activeIndex === index ? (window.innerWidth > 640 ? 32 : 24) : (window.innerWidth > 640 ? 12 : 10),
                backgroundColor: activeIndex === index ? '#800000' : '#d1d5db'
              }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
            >
              {/* Active indicator glow effect */}
              {activeIndex === index && (
                <motion.div
                  className="absolute inset-0 bg-[#800000] rounded-full opacity-30 blur-sm"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1.5 }}
                  transition={{ duration: 0.3 }}
                />
              )}
            </motion.button>
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

  // Add these refs for scroll effects
  const headerRef = useRef<HTMLDivElement | null>(null);
  const { scrollY } = useScroll();
  const scrollButtonOpacity = useTransform(scrollY, [100, 300], [0, 1]);
  const scrollButtonScale = useTransform(scrollY, [100, 300], [0.6, 1]);

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


  const BreathingExercise = () => {
    const [phase, setPhase] = useState('inhale');
    const [count, setCount] = useState(4);
    const [sessionCount, setSessionCount] = useState(0);

    useEffect(() => {
      if (!breathingActive) return;

      const timer = setInterval(() => {
        setCount(prev => {
          if (prev === 1) {
            setPhase(current => {
              if (current === 'inhale') return 'hold';
              if (current === 'hold') return 'exhale';
              if (current === 'exhale') {
                setSessionCount(c => c + 1);
              }
              return 'inhale';
            });
            return 4;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }, [breathingActive, phase]);

    const getPhaseConfig = () => {
      switch (phase) {
        case 'inhale':
          return {
            gradient: 'from-blue-500 to-cyan-500',
            bgGradient: 'from-blue-50 to-cyan-100',
            borderColor: 'border-blue-200',
            icon: '🫁',
            instruction: 'Breathe in slowly through your nose',
            color: 'text-blue-700'
          };
        case 'hold':
          return {
            gradient: 'from-purple-500 to-indigo-500',
            bgGradient: 'from-purple-50 to-indigo-100',
            borderColor: 'border-purple-200',
            icon: '⏸️',
            instruction: 'Hold your breath gently',
            color: 'text-purple-700'
          };
        case 'exhale':
          return {
            gradient: 'from-green-500 to-emerald-500',
            bgGradient: 'from-green-50 to-emerald-100',
            borderColor: 'border-green-200',
            icon: '🌬️',
            instruction: 'Breathe out slowly through your mouth',
            color: 'text-green-700'
          };
        default:
          return {
            gradient: 'from-blue-500 to-cyan-500',
            bgGradient: 'from-blue-50 to-cyan-100',
            borderColor: 'border-blue-200',
            icon: '🫁',
            instruction: 'Breathe in slowly through your nose',
            color: 'text-blue-700'
          };
      }
    };

    const phaseConfig = getPhaseConfig();

    return (
      <motion.div 
        className={`relative overflow-hidden rounded-2xl p-6 shadow-lg border-2 ${
          breathingActive ? `bg-gradient-to-br ${phaseConfig.bgGradient} ${phaseConfig.borderColor}` : 
          'bg-gradient-to-br from-[#800000]/10 to-[#800000]/20 border-[#800000]/30'
        }`}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        whileHover={{ y: -5, boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)" }}
      >
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className={`w-full h-full ${
            breathingActive ? phaseConfig.color.replace('text-', 'bg-').replace('-700', '-500') : 'bg-[#800000]'
          }`} style={{
            backgroundImage: 'radial-gradient(circle at 20% 80%, currentColor 15%, transparent 16%), radial-gradient(circle at 80% 20%, currentColor 15%, transparent 16%), radial-gradient(circle at 40% 40%, currentColor 15%, transparent 16%)'
          }}></div>
        </div>

        <div className="relative z-10">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <motion.div
                className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-lg ${
                  breathingActive ? `bg-gradient-to-r ${phaseConfig.gradient}` : 'bg-gradient-to-r from-[#800000] to-[#a00000]'
                }`}
                animate={{ 
                  y: [0, -3, 0],
                  rotate: [0, 5, 0]
                }}
                transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
              >
                <FaLeaf className="text-white text-lg drop-shadow-sm" />
              </motion.div>
              <div>
                <h3 className="font-bold text-gray-800 text-lg">Breathing Exercise</h3>
                <p className="text-xs text-gray-600">
                  {breathingActive ? `Session: ${sessionCount + 1} cycles` : 'Find your calm'}
                </p>
              </div>
            </div>
            
            {breathingActive && (
              <motion.div 
                className={`px-3 py-1 rounded-full text-xs font-bold ${phaseConfig.bgGradient} ${phaseConfig.borderColor} border`}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 260, damping: 20 }}
              >
                <span className={phaseConfig.color}>{sessionCount} cycles</span>
              </motion.div>
            )}
          </div>
        
          <AnimatePresence mode="wait">
            {!breathingActive ? (
              <motion.div
                key="start-section"
                className="text-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <div className="mb-6">
                  <div className="text-4xl mb-3">🧘‍♀️</div>
                  <p className="text-gray-600 text-sm mb-4 leading-relaxed">
                    Take a moment to center yourself with the 4-4-4 breathing technique.
                    This exercise helps reduce anxiety and promote relaxation.
                  </p>
                </div>
                
                <motion.button
                  onClick={() => {
                    setBreathingActive(true);
                    setSessionCount(0);
                  }}
                  className="w-full bg-gradient-to-r from-[#800000] to-[#a00000] hover:from-[#660000] hover:to-[#800000] text-white px-6 py-4 rounded-xl font-medium shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center gap-3"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <FaPlay className="text-sm" />
                  Start Breathing Session
                </motion.button>
              </motion.div>
            ) : (
              <motion.div 
                key="breathing-session"
                className="text-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                {/* Breathing Circle */}
                <div className="relative mb-6">
                  <motion.div 
                    className={`w-32 h-32 mx-auto rounded-full bg-gradient-to-r ${phaseConfig.gradient} shadow-2xl flex items-center justify-center relative overflow-hidden`}
                    animate={{
                      scale: phase === 'inhale' ? 1.2 : phase === 'hold' ? 1.2 : 0.9,
                    }}
                    transition={{ duration: 4, ease: "easeInOut" }}
                  >
                    {/* Pulse effect */}
                    <div className={`absolute inset-0 rounded-full bg-gradient-to-r ${phaseConfig.gradient} animate-ping opacity-20`}></div>
                    
                    {/* Inner content */}
                    <div className="relative z-10 text-center">
                      <div className="text-2xl mb-1">{phaseConfig.icon}</div>
                      <motion.div 
                        className="text-2xl font-bold text-white drop-shadow-lg"
                        key={`${phase}-${count}`}
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ duration: 0.3 }}
                      >
                        {count}
                      </motion.div>
                    </div>
                  </motion.div>
                  
                  {/* Glow effect */}
                  <div className={`absolute inset-0 w-32 h-32 mx-auto rounded-full bg-gradient-to-r ${phaseConfig.gradient} blur-xl opacity-30 -z-10`}></div>
                </div>
                
                {/* Phase Information */}
                <motion.div 
                  className="mb-6"
                  key={phase}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4 }}
                >
                  <h4 className={`text-xl font-bold capitalize mb-2 ${phaseConfig.color}`}>
                    {phase}
                  </h4>
                  <p className="text-gray-600 text-sm leading-relaxed">
                    {phaseConfig.instruction}
                  </p>
                </motion.div>
                
                {/* Controls */}
                <div className="flex gap-3 justify-center">
                  <motion.button
                    onClick={() => {
                      setBreathingActive(false);
                      setPhase('inhale');
                      setCount(4);
                    }}
                    className="px-4 py-2 bg-white/80 hover:bg-white text-gray-700 rounded-lg text-sm font-medium transition-all duration-200 shadow-md hover:shadow-lg flex items-center gap-2"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <FaHome className="text-xs" />
                    End Session
                  </motion.button>
                  
                  {sessionCount >= 3 && (
                    <motion.div
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="px-4 py-2 bg-green-100 text-green-700 rounded-lg text-sm font-medium flex items-center gap-2"
                    >
                      <FaCheckCircle className="text-xs" />
                      Great job!
                    </motion.div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    );
  };

  // Function to handle navigation to assessment
  const goToAssessment = () => {
    navigate('/assessment');
  };

  // Function to handle navigation to profile
  const goToProfile = () => {
    navigate('/profile');
  };

  // Add this function for scrolling to top
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Inline notification preview (Facebook-style popover)
  const [activeNotification, setActiveNotification] = useState<any | null>(null);
  const openNotificationPopover = (appt: any) => setActiveNotification(appt);
  const closeNotificationPopover = () => setActiveNotification(null);

  return (
    <div className="min-h-screen bg-[#800000]/5 w-full overflow-x-hidden" style={{ maxWidth: '100vw' }}>
      {/* Header with scroll effect */}
      <motion.div 
        ref={headerRef}
        className="relative bg-gradient-to-br from-[#4a0e0e] via-[#660000] to-[#800000] backdrop-blur-md border-b border-white/10 sticky top-0 z-50 shadow-2xl overflow-hidden w-full"
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        
        {/* Animated Background Layers */}
        <div className="absolute inset-0">
          {/* Primary gradient overlay */}
          <motion.div 
            className="absolute inset-0 bg-gradient-to-r from-purple-900/20 via-transparent to-pink-900/20"
            animate={{ 
              background: [
                'linear-gradient(to right, rgba(88, 28, 135, 0.2), transparent, rgba(157, 23, 77, 0.2))',
                'linear-gradient(to right, rgba(157, 23, 77, 0.2), transparent, rgba(88, 28, 135, 0.2))',
                'linear-gradient(to right, rgba(88, 28, 135, 0.2), transparent, rgba(157, 23, 77, 0.2))'
              ]
            }}
            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          />
          
          {/* Floating geometric shapes */}
          <motion.div 
            className="absolute top-2 left-4 w-16 h-16 bg-white/5 rounded-full blur-sm"
            animate={{ 
              y: [0, -10, 0],
              scale: [1, 1.1, 1],
              opacity: [0.3, 0.5, 0.3]
            }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div 
            className="absolute top-6 right-8 w-8 h-8 bg-white/10 rounded-lg rotate-45"
            animate={{ 
              rotate: [45, 135, 45],
              scale: [1, 1.2, 1]
            }}
            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div 
            className="absolute bottom-2 left-1/3 w-12 h-12 bg-gradient-to-br from-white/5 to-white/10 rounded-full"
            animate={{ 
              x: [0, 20, 0],
              opacity: [0.2, 0.4, 0.2]
            }}
            transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
          />
          
          {/* Dynamic mesh gradient */}
          <div className="absolute inset-0 opacity-20">
            <motion.div 
              className="w-full h-full"
              style={{
                background: 'radial-gradient(circle at 20% 30%, rgba(255,255,255,0.1) 0%, transparent 50%), radial-gradient(circle at 80% 70%, rgba(255,255,255,0.05) 0%, transparent 50%)',
              }}
              animate={{
                background: [
                  'radial-gradient(circle at 20% 30%, rgba(255,255,255,0.1) 0%, transparent 50%), radial-gradient(circle at 80% 70%, rgba(255,255,255,0.05) 0%, transparent 50%)',
                  'radial-gradient(circle at 60% 20%, rgba(255,255,255,0.1) 0%, transparent 50%), radial-gradient(circle at 40% 80%, rgba(255,255,255,0.05) 0%, transparent 50%)',
                  'radial-gradient(circle at 20% 30%, rgba(255,255,255,0.1) 0%, transparent 50%), radial-gradient(circle at 80% 70%, rgba(255,255,255,0.05) 0%, transparent 50%)'
                ]
              }}
              transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
            />
          </div>
          
          {/* Subtle pattern overlay */}
          <div className="absolute inset-0 opacity-[0.03]">
            <div className="w-full h-full bg-white" style={{
              backgroundImage: `
                radial-gradient(circle at 25% 25%, white 1px, transparent 1px),
                radial-gradient(circle at 75% 75%, white 1px, transparent 1px),
                linear-gradient(45deg, transparent 48%, white 49%, white 51%, transparent 52%)
              `,
              backgroundSize: '24px 24px, 24px 24px, 48px 48px'
            }}></div>
          </div>
          
          {/* Top highlight line */}
          <motion.div 
            className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent"
            animate={{ opacity: [0.3, 0.6, 0.3] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          />
        </div>
        
        <div className="relative px-3 sm:px-4 md:px-6 py-3 sm:py-4 w-full max-w-full">
          <div className="flex items-center justify-between w-full max-w-full">
            {/* Left: Greeting Section */}
            <div className="flex-1 min-w-0 max-w-[calc(100%-120px)] sm:max-w-[calc(100%-140px)]">
              <div className="flex items-center space-x-2 sm:space-x-3">
                                  {/* Enhanced Lotus Icon with Multiple Effects */}
                  <motion.div
                    className="relative flex-shrink-0"
                    animate={{ 
                      rotate: [0, 5, 0, -5, 0],
                      y: [0, -2, 0, -1, 0]
                    }}
                    transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
                  >
                    {/* Outer glow ring */}
                    <motion.div 
                      className="absolute inset-0 w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 lg:w-18 lg:h-18 bg-gradient-to-r from-pink-400/30 via-purple-400/30 to-cyan-400/30 rounded-full blur-lg -z-20"
                      animate={{ 
                        scale: [1, 1.2, 1],
                        opacity: [0.3, 0.6, 0.3]
                      }}
                      transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                    />
                    
                    {/* Inner glow */}
                    <motion.div 
                      className="absolute inset-0 w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 lg:w-16 lg:h-16 bg-white/30 rounded-full blur-md -z-10"
                      animate={{ 
                        scale: [1, 1.1, 1],
                        opacity: [0.4, 0.7, 0.4]
                      }}
                      transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                    />
                    
                    {/* Sparkle effects */}
                    <motion.div 
                      className="absolute -top-0.5 -right-0.5 sm:-top-1 sm:-right-1 w-2 h-2 sm:w-2.5 sm:h-2.5 bg-white/60 rounded-full"
                      animate={{ 
                        scale: [0, 1, 0],
                        opacity: [0, 1, 0]
                      }}
                      transition={{ duration: 2, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
                    />
                    <motion.div 
                      className="absolute -bottom-0.5 -left-0.5 sm:-bottom-1 sm:-left-1 w-1.5 h-1.5 sm:w-2 sm:h-2 bg-cyan-300/60 rounded-full"
                      animate={{ 
                        scale: [0, 1, 0],
                        opacity: [0, 1, 0]
                      }}
                      transition={{ duration: 2, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                    />
                    
                    {/* Main lotus image */}
                    <motion.img 
                      src="/lotus.png" 
                      alt="Lotus" 
                      className="relative z-10 h-10 w-10 sm:h-12 sm:w-12 md:h-14 md:w-14 lg:h-16 lg:w-16 drop-shadow-2xl filter brightness-125 contrast-110" 
                      animate={{ 
                        filter: [
                          'brightness(125%) contrast(110%) saturate(120%)',
                          'brightness(135%) contrast(120%) saturate(130%)',
                          'brightness(125%) contrast(110%) saturate(120%)'
                        ]
                      }}
                      transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                    />
                  </motion.div>
                
                {/* Enhanced Greeting Text */}
                <div className="flex-1 min-w-0 ml-2 sm:ml-3">
                  <motion.h1 
                    className="relative text-base sm:text-lg md:text-xl lg:text-2xl font-bold text-white"
                    style={{ 
                      textShadow: '0 2px 8px rgba(0,0,0,0.4), 0 0 30px rgba(255,255,255,0.15), 0 0 60px rgba(255,255,255,0.05)'
                    }}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2, duration: 0.6 }}
                  >
                    {/* Animated text background */}
                    <motion.div 
                      className="absolute inset-0 bg-gradient-to-r from-white/5 via-white/10 to-white/5 rounded-lg blur-sm -z-10"
                      animate={{ 
                        opacity: [0, 0.3, 0],
                        scale: [0.95, 1.05, 0.95]
                      }}
                      transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                    />
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
                  </motion.h1>
                  
                  {/* Time indicator - now visible on small screens with larger text */}
                  <motion.p 
                    className="hidden sm:block text-xs sm:text-sm md:text-base text-white/80 font-medium mt-1 truncate"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4, duration: 0.6 }}
                  >
                    {currentTime.toLocaleDateString('en-US', { 
                      weekday: 'long', 
                      month: 'short', 
                      day: 'numeric' 
                    })}
                  </motion.p>
                </div>
              </div>
            </div>

            {/* Right: Enhanced Action Buttons */}
            <div className="flex items-center space-x-1.5 sm:space-x-2 flex-shrink-0">
              {/* Enhanced Notification Button */}
              <motion.button 
                className="relative group p-1.5 sm:p-2 bg-gradient-to-br from-white/15 via-white/20 to-white/15 hover:from-white/25 hover:via-white/30 hover:to-white/25 backdrop-blur-sm rounded-lg sm:rounded-xl border border-white/30 shadow-lg hover:shadow-2xl transition-all duration-300"
                whileTap={{ scale: 0.95 }}
                whileHover={{ scale: 1.05, y: -2 }}
                onClick={() => {
                                     if (notifications && notifications.length > 0) {
                     openNotificationPopover(notifications[0]);
                   } else {
                     setShowNotifications((prev) => !prev);
                   }
                }}
                aria-label="Show notifications"
              >
                {/* Button glow effect */}
                <motion.div 
                  className="absolute inset-0 bg-gradient-to-br from-cyan-400/20 to-purple-400/20 rounded-lg sm:rounded-xl blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                  animate={{ 
                    scale: [1, 1.1, 1],
                  }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                />
                
                <motion.div
                  animate={{ 
                    rotate: [0, 15, 0, -15, 0]
                  }}
                  transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                >
                  <FaBell className="relative z-10 text-white text-xs sm:text-sm drop-shadow-lg" />
                </motion.div>
                
                {notifications.length > 0 && (
                  <motion.span 
                    className="absolute -top-0.5 -right-0.5 sm:-top-1 sm:-right-1 bg-gradient-to-r from-red-400 via-red-500 to-pink-500 text-white text-xs rounded-full min-w-[16px] h-[16px] sm:min-w-[18px] sm:h-[18px] flex items-center justify-center font-bold shadow-xl border-2 border-white/30"
                    initial={{ scale: 0 }}
                    animate={{ 
                      scale: 1,
                      boxShadow: [
                        '0 0 0 0 rgba(239, 68, 68, 0.7)',
                        '0 0 0 10px rgba(239, 68, 68, 0)',
                        '0 0 0 0 rgba(239, 68, 68, 0)'
                      ]
                    }}
                    transition={{ 
                      scale: { type: "spring", stiffness: 300, damping: 20 },
                      boxShadow: { duration: 2, repeat: Infinity, ease: "easeInOut" }
                    }}
                  >
                    {notifications.length > 9 ? '9+' : notifications.length}
                  </motion.span>
                )}
              </motion.button>

              {/* Enhanced Profile Button */}
              <motion.div 
                className="relative group w-8 h-8 sm:w-9 sm:h-9 bg-gradient-to-br from-white/15 via-white/20 to-white/15 hover:from-white/25 hover:via-white/30 hover:to-white/25 backdrop-blur-sm rounded-lg sm:rounded-xl flex items-center justify-center cursor-pointer border border-white/30 shadow-lg hover:shadow-2xl transition-all duration-300"
                whileHover={{ scale: 1.05, rotate: 5, y: -2 }}
                whileTap={{ scale: 0.95 }}
                onClick={goToProfile}
              >
                {/* Profile button glow */}
                <motion.div 
                  className="absolute inset-0 bg-gradient-to-br from-blue-400/20 to-purple-400/20 rounded-lg sm:rounded-xl blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                  animate={{ 
                    scale: [1, 1.05, 1],
                  }}
                  transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                />
                
                {/* Animated border */}
                <motion.div 
                  className="absolute inset-0 rounded-lg sm:rounded-xl border border-white/20"
                  animate={{ 
                    borderColor: [
                      'rgba(255,255,255,0.2)',
                      'rgba(255,255,255,0.4)',
                      'rgba(255,255,255,0.2)'
                    ]
                  }}
                  transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                />
                
                <FaUser className="relative z-10 text-white text-xs sm:text-sm drop-shadow-lg" />
              </motion.div>
            </div>
          </div>

          {/* Enhanced Notification Panel */}
          {showNotifications && (
            <motion.div 
              className="absolute right-3 sm:right-4 md:right-6 top-full mt-2 bg-white/95 backdrop-blur-md border border-gray-200/50 rounded-2xl shadow-2xl z-50 w-[calc(100vw-24px)] sm:w-80 md:w-96 max-w-md"
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
            >
              <div className="p-4 sm:p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-[#800000] text-lg flex items-center">
                    <FaBell className="mr-2" /> 
                    Notifications
                  </h3>
                  <motion.button
                    className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
                    onClick={() => setShowNotifications(false)}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <span className="text-gray-400 text-xl">×</span>
                  </motion.button>
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
                    {notifications.map((appt, index) => (
                      <motion.div 
                        key={appt.id} 
                        className="cursor-pointer bg-gradient-to-r from-[#800000]/5 to-[#800000]/10 rounded-xl p-3 border border-[#800000]/10 hover:border-[#800000]/20 transition-all duration-200"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
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
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </div>
      </motion.div>

      {/* Enhanced Notification Modal - Positioned outside header for proper layering */}
      <AnimatePresence>
        {activeNotification && (
          <>
            {/* Backdrop */}
            <motion.div 
              className="fixed inset-0 bg-black/20 backdrop-blur-sm z-[9998]"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeNotificationPopover}
            />
            
            {/* Modal positioned below notification button - Fully responsive */}
            <motion.div 
              className="fixed right-2 sm:right-3 md:right-4 lg:right-6 top-14 sm:top-16 md:top-16 bg-white rounded-xl sm:rounded-2xl shadow-2xl border border-gray-200 w-[calc(100vw-16px)] xs:w-[calc(100vw-20px)] sm:w-80 md:w-96 lg:w-[400px] max-w-[95vw] sm:max-w-md overflow-hidden z-[9999]"
              initial={{ scale: 0.9, opacity: 0, y: -10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: -10 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
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
                  <motion.button 
                    onClick={closeNotificationPopover}
                    className="w-7 h-7 sm:w-8 sm:h-8 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition-colors flex-shrink-0 ml-2"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <span className="text-white text-base sm:text-lg">×</span>
                  </motion.button>
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
                  <motion.button
                    onClick={closeNotificationPopover}
                    className="flex-1 bg-gradient-to-r from-[#800000] to-[#a00000] hover:from-[#660000] hover:to-[#800000] text-white font-semibold py-2.5 sm:py-3 px-3 sm:px-4 rounded-lg sm:rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl text-sm sm:text-base"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    Got it
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className="w-full max-w-full px-3 sm:px-4 py-4 sm:py-6 pb-20 overflow-x-hidden">
        {/* Main Navigation Carousel */}
        <MainNavCarousel navigate={navigate} />
        
        {/* Stats Cards */}
        <div className="grid grid-cols-2 gap-2 sm:gap-3 mb-6 w-full">
          {/* Day Streak Card */}
          <motion.div 
            className={`bg-white rounded-xl sm:rounded-2xl p-2 sm:p-3 shadow-lg border-2 w-full ${getFireBorderColor(userStreak)}`}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
            whileHover={{ y: -5, boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)" }}
          >
            <div className="flex items-center justify-between mb-1 sm:mb-2">
              <motion.div
                animate={{ rotate: [0, 10, 0, -10, 0] }}
                transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
              >
                <FaFire className={`${getFireColor(userStreak)} text-lg sm:text-xl`} title={
                  userStreak >= 100 ? '🔥 100+ Day Streak! Legendary!' :
                  userStreak >= 60 ? '🔥 60+ Day Streak! Incredible!' :
                  userStreak >= 50 ? '🔥 50+ Day Streak! Amazing!' :
                  userStreak >= 30 ? '🔥 30+ Day Streak! Awesome!' :
                  userStreak >= 20 ? '🔥 20+ Day Streak! Great job!' :
                  userStreak >= 10 ? '🔥 10+ Day Streak! Keep going!' :
                  '🔥 Keep your streak alive!'
                } />
              </motion.div>
              {loadingStreak ? (
                <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full border-2 border-gray-300 border-t-orange-500 animate-spin"></div>
              ) : (
                <motion.span 
                  className={`text-xl sm:text-2xl font-bold relative ${getFireColor(userStreak)}`}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 260, damping: 20, delay: 0.2 }}
                >
                  {userStreak}
                  {streakIncrease && (
                    <motion.span
                      className="absolute -top-3 sm:-top-4 left-1/2 -translate-x-1/2 text-green-500 text-sm sm:text-base font-bold drop-shadow"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: -10 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.8 }}
                    >
                      +1
                    </motion.span>
                  )}
                </motion.span>
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
          </motion.div>

          {/* Recent Assessment Compact Card */}
          <motion.div 
            className={`relative overflow-hidden rounded-xl sm:rounded-2xl p-2 sm:p-3 shadow-lg border-2 w-full ${
              loadingAssessment ? 'bg-gradient-to-br from-gray-50 to-gray-100 border-gray-300' :
              !recentAssessment ? 'bg-gradient-to-br from-[#800000]/10 to-[#800000]/20 border-[#800000]/30' :
              recentAssessment.percentage < 25 ? 'bg-gradient-to-br from-green-50 to-emerald-100 border-green-400' :
              recentAssessment.percentage < 50 ? 'bg-gradient-to-br from-blue-50 to-blue-100 border-blue-400' :
              recentAssessment.percentage < 75 ? 'bg-gradient-to-br from-yellow-50 to-orange-100 border-yellow-400' :
              'bg-gradient-to-br from-red-50 to-red-100 border-red-400'
            }`}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
            whileHover={{ y: -5, boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)" }}
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
                {/* Icon with animated background */}
                <motion.div
                  className={`relative w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl flex items-center justify-center shadow-lg ${
                    loadingAssessment ? 'bg-gradient-to-r from-gray-400 to-gray-500' :
                    !recentAssessment ? 'bg-gradient-to-r from-[#800000] to-[#a00000]' :
                    recentAssessment.percentage < 25 ? 'bg-gradient-to-r from-green-500 to-emerald-600' :
                    recentAssessment.percentage < 50 ? 'bg-gradient-to-r from-blue-500 to-blue-600' :
                    recentAssessment.percentage < 75 ? 'bg-gradient-to-r from-yellow-500 to-orange-600' :
                    'bg-gradient-to-r from-red-500 to-red-600'
                  }`}
                  animate={{ 
                    y: [0, -3, 0],
                    rotate: [0, 5, 0]
                  }}
                  transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
                >
                  <FaChartLine className="text-white text-base sm:text-lg drop-shadow-sm" />
                  {/* Pulse effect */}
                  <div className={`absolute inset-0 rounded-lg sm:rounded-xl ${
                    loadingAssessment ? 'bg-gray-400' :
                    !recentAssessment ? 'bg-[#800000]' :
                    recentAssessment.percentage < 25 ? 'bg-green-500' :
                    recentAssessment.percentage < 50 ? 'bg-blue-500' :
                    recentAssessment.percentage < 75 ? 'bg-yellow-500' :
                    'bg-red-500'
                  } animate-pulse opacity-30`}></div>
                </motion.div>
                
                {/* Progress Ring or Loading */}
                {loadingAssessment ? (
                  <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full border-2 border-gray-300 border-t-[#800000] animate-spin"></div>
                ) : recentAssessment ? (
                  <motion.div 
                    className="flex items-center gap-1 sm:gap-2"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 260, damping: 20, delay: 0.3 }}
                  >
                    <div className="relative">
                      <ProgressRing progress={recentAssessment.percentage} size={35} />
                      {/* Glow effect */}
                      <div className={`absolute inset-0 rounded-full blur-md opacity-20 ${
                        recentAssessment.percentage < 25 ? 'bg-green-400' :
                        recentAssessment.percentage < 50 ? 'bg-blue-400' :
                        recentAssessment.percentage < 75 ? 'bg-yellow-400' :
                        'bg-red-400'
                      }`}></div>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div 
                    className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-r from-[#800000] to-[#a00000] rounded-lg sm:rounded-xl flex items-center justify-center shadow-lg"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 260, damping: 20, delay: 0.3 }}
                  >
                    <FaBrain className="text-white text-xs sm:text-sm" />
                  </motion.div>
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
                    <p className={`text-sm sm:text-base font-black leading-tight ${
                      recentAssessment.percentage < 25 ? 'text-green-700' :
                      recentAssessment.percentage < 50 ? 'text-blue-700' :
                      recentAssessment.percentage < 75 ? 'text-yellow-700' :
                      'text-red-700'
                    }`}>
                      {recentAssessment.anxiety_level}
                    </p>
                    {/* Status Badge */}
                    <span className={`px-1.5 py-0.5 sm:px-2 sm:py-1 rounded-full text-xs font-bold ${
                      recentAssessment.percentage < 25 ? 'bg-green-200 text-green-800' :
                      recentAssessment.percentage < 50 ? 'bg-blue-200 text-blue-800' :
                      recentAssessment.percentage < 75 ? 'bg-yellow-200 text-yellow-800' :
                      'bg-red-200 text-red-800'
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
                      <motion.span 
                        className={`font-bold text-xs flex items-center gap-0.5 px-1.5 py-0.5 sm:px-2 sm:py-1 rounded-full flex-shrink-0 ${
                          calculateImprovement()!.isPositive 
                            ? 'bg-green-100 text-green-700 border border-green-300' 
                            : 'bg-red-100 text-red-700 border border-red-300'
                        }`}
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.5, type: "spring" }}
                      >
                        {calculateImprovement()!.isPositive ? <FaArrowUp className="text-xs" /> : <FaArrowUp className="text-xs rotate-180" />}
                        {calculateImprovement()!.isPositive ? '+' : ''}{calculateImprovement()!.value}%
                      </motion.span>
                    )}
                  </div>
                </>
              ) : (
                <>
                  <p className="text-xs sm:text-sm font-bold text-[#800000] mb-1">Assessment</p>
                  <p className="text-xs text-gray-600 mb-2 sm:mb-3 leading-tight">Start your wellness journey</p>
                  <motion.button 
                    onClick={goToAssessment}
                    className="w-full bg-gradient-to-r from-[#800000] to-[#a00000] text-white text-xs px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg hover:from-[#660000] hover:to-[#800000] transition-all duration-200 font-medium shadow-md hover:shadow-lg flex items-center justify-center gap-1 sm:gap-2"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <FaChartLine className="text-xs" />
                    <span className="truncate">Take Assessment</span>
                  </motion.button>
                </>
              )}
            </div>
          </motion.div>
        </div>



        {/* Breathing Exercise with scroll reveal */}
        <ScrollReveal delay={0.2} direction="right">
          <div className="mb-6">
            <BreathingExercise />
          </div>
        </ScrollReveal>

        {/* Quick Relaxation Tools with scroll reveal */}
        <ScrollReveal delay={0.3} direction="left">
          <div className="mb-6" data-relaxation-tools>
            <QuickRelaxation />
          </div>
        </ScrollReveal>

        {/* Daily Activities with scroll reveal */}
        <ScrollReveal delay={0.4}>
          <div className="mb-6">
            <motion.h3 
              className="font-semibold text-gray-800 mb-4 flex items-center gap-2"
            >
              <FaCalendarAlt className="text-green-500" />
              Today's Activities
            </motion.h3>
            
            <div className="space-y-3 w-full">
              <motion.div 
                className="bg-white rounded-xl p-3 sm:p-4 shadow-md border border-gray-200 flex items-center justify-between w-full"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: 0.2 }}
                whileHover={{ x: 5, backgroundColor: "#f9fafb" }}
              >
                <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                  <div className="w-7 h-7 sm:w-8 sm:h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <FaCheck className="text-green-600 text-xs sm:text-sm" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-gray-800 text-sm truncate">Morning Meditation</p>
                    <p className="text-xs text-gray-500 truncate">5 minutes completed</p>
                  </div>
                </div>
                <FaSmile className="text-green-500" />
              </motion.div>

              <motion.div 
                className="bg-white rounded-xl p-3 sm:p-4 shadow-md border border-gray-200 flex items-center justify-between w-full"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: 0.3 }}
                whileHover={{ x: 5, backgroundColor: "#f9fafb" }}
              >
                <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                  <div className="w-7 h-7 sm:w-8 sm:h-8 bg-[#800000]/10 rounded-full flex items-center justify-center flex-shrink-0">
                    <FaPlay className="text-[#800000] text-xs sm:text-sm" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-gray-800 text-sm truncate">Anxiety Video</p>
                    <p className="text-xs text-gray-500 truncate">Watch "Managing Daily Stress"</p>
                  </div>
                </div>
                <FaChevronRight className="text-gray-400 flex-shrink-0" />
              </motion.div>

              <motion.div 
                className="bg-white rounded-xl p-3 sm:p-4 shadow-md border border-gray-200 flex items-center justify-between w-full"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: 0.4 }}
                whileHover={{ x: 5, backgroundColor: "#f9fafb" }}
              >
                <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                  <div className="w-7 h-7 sm:w-8 sm:h-8 bg-[#800000]/10 rounded-full flex items-center justify-center flex-shrink-0">
                    <FaBrain className="text-[#800000] text-xs sm:text-sm" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-gray-800 text-sm truncate">CBT Exercise</p>
                    <p className="text-xs text-gray-500 truncate">Thought challenging worksheet</p>
                  </div>
                </div>
                <FaChevronRight className="text-gray-400 flex-shrink-0" />
              </motion.div>
            </div>
          </div>
        </ScrollReveal>

        {/* Achievements with scroll reveal */}
        <ScrollReveal delay={0.5} direction="left">
          <div className="mb-6">
            <motion.h3 
              className="font-semibold text-gray-800 mb-4 flex items-center gap-2"
            >
              <FaTrophy className="text-yellow-500" />
              Achievements
            </motion.h3>
            
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 w-full">
              {mockUserData.achievements.map((achievement, index) => (
                <motion.div
                  key={achievement.id}
                  className={`bg-white rounded-xl p-2 sm:p-3 shadow-md border-2 text-center w-full ${
                    achievement.unlocked 
                      ? 'border-yellow-200 bg-gradient-to-br from-yellow-50 to-orange-50' 
                      : 'border-gray-200 opacity-50'
                  }`}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3, delay: 0.1 * index }}
                  whileHover={achievement.unlocked ? { y: -5, scale: 1.05 } : {}}
                >
                  <div className="text-xl sm:text-2xl mb-1">{achievement.icon}</div>
                  <p className="text-xs font-medium text-gray-700 leading-tight">{achievement.name}</p>
                  {achievement.unlocked && (
                    <FaCheck className="text-green-500 text-xs mx-auto mt-1" />
                  )}
                </motion.div>
              ))}
            </div>
          </div>
        </ScrollReveal>

        {/* Mood Tracker */}
        <ScrollReveal delay={0.6} direction="right">
          <motion.div 
            className="bg-[#800000]/5 rounded-2xl p-3 sm:p-4 border-2 border-[#800000]/30 w-full"
            whileInView={{ 
              boxShadow: ["0px 0px 0px rgba(0,0,0,0)", "0px 10px 20px rgba(0,0,0,0.1)", "0px 0px 0px rgba(0,0,0,0)"]
            }}
            transition={{ duration: 2, repeat: Infinity, repeatType: "reverse" }}
          >
            <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2 text-sm sm:text-base">
              <FaHeart className="text-pink-500 flex-shrink-0" />
              <span className="truncate">How are you feeling right now?</span>
            </h3>
            
            <div className="flex justify-between gap-1 sm:gap-2 w-full">
              {['😢', '😟', '😐', '😊', '😄'].map((emoji, index) => (
                <motion.button
                  key={index}
                  className="w-10 h-10 sm:w-12 sm:h-12 text-xl sm:text-2xl bg-white rounded-full shadow-md hover:shadow-lg hover:scale-110 transition-all duration-200 border-2 border-transparent hover:border-pink-300 flex-shrink-0"
                  onClick={() => alert(`Mood recorded: ${emoji}`)}
                  whileHover={{ scale: 1.15, rotate: 5 }}
                  whileTap={{ scale: 0.95 }}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 * index }}
                >
                  {emoji}
                </motion.button>
              ))}
            </div>
          </motion.div>
        </ScrollReveal>

        {/* Scroll-up button */}
        <motion.div
          className="fixed bottom-16 sm:bottom-20 right-3 sm:right-4 bg-[#800000] text-white p-2.5 sm:p-3 rounded-full shadow-lg cursor-pointer z-10"
          onClick={scrollToTop}
          style={{
            opacity: scrollButtonOpacity,
            scale: scrollButtonScale,
          }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          <FaArrowUp className="text-sm sm:text-base" />
        </motion.div>
      </div>

      {/* Bottom Navigation */}
      <motion.div 
        className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-sm border-t border-gray-200 z-50 w-full"
        initial={{ y: 50 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex justify-around py-1.5 sm:py-2 px-2 w-full max-w-full">
          {[
            { id: 'home', icon: FaHeart, label: 'Home', color: 'text-pink-500', action: () => setSelectedTab('home') },
            { id: 'brain', icon: FaBrain, label: 'Assessment', color: 'text-[#800000]', action: goToAssessment },
            { id: 'leaf', icon: FaLeaf, label: 'Relax', color: 'text-green-500', action: () => setSelectedTab('leaf') },
            { id: 'chart', icon: FaChartLine, label: 'Progress', color: 'text-[#800000]', action: () => setSelectedTab('chart') },
            { id: 'user', icon: FaUser, label: 'Profile', color: 'text-gray-500', action: goToProfile }
          ].map((tab) => (
            <motion.button
              key={tab.id}
              className={`flex flex-col items-center py-1.5 sm:py-2 px-1 sm:px-2 rounded-lg transition-all duration-200 min-w-0 flex-1 ${
                selectedTab === tab.id ? 'bg-[#800000]/10 transform scale-105' : ''
              }`}
              onClick={tab.action}
              whileHover={{ y: -3 }}
              whileTap={{ scale: 0.9 }}
            >
              <tab.icon className={`text-base sm:text-lg ${selectedTab === tab.id ? tab.color : 'text-gray-400'}`} />
              <span className={`text-xs mt-0.5 sm:mt-1 truncate ${selectedTab === tab.id ? tab.color : 'text-gray-400'}`}>
                {tab.label}
              </span>
              {selectedTab === tab.id && (
                <motion.div
                  className="absolute -bottom-1 w-1.5 h-1.5 rounded-full bg-[#800000]"
                  layoutId="activeTabIndicator"
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />
              )}
            </motion.button>
          ))}
        </div>
      </motion.div>
    </div>
  );
};

export default Dashboard;