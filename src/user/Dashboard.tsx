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
  FaGem,
  FaFire,
  // FaStar,
  FaCheck,
  FaLock,
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
  FaArrowUp
} from 'react-icons/fa';
import { motion, AnimatePresence, useInView, useScroll, useTransform } from 'framer-motion';
import type { Variants } from 'framer-motion';
import { supabase } from '../lib/supabase';
import { streakService } from '../lib/streakService';
import { useNavigate } from 'react-router-dom';
import { StreakPet } from './StreakPet';

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

type QuickActionProps = {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  color: string;
  onClick: () => void;
  locked?: boolean;
};

const QuickAction = ({ icon, title, subtitle, color, onClick, locked = false }: QuickActionProps) => (
  <motion.div 
    className={`relative bg-white rounded-2xl p-4 shadow-lg border-2 transition-all duration-300 ${
      locked 
        ? 'border-gray-200 opacity-50' 
        : `border-${color}-200 hover:border-${color}-300 hover:shadow-xl hover:scale-105 active:scale-95 cursor-pointer`
    }`}
    onClick={!locked ? onClick : undefined}
    whileHover={!locked ? { scale: 1.05 } : {}}
    whileTap={!locked ? { scale: 0.95 } : {}}
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.3 }}
  >
    {locked && (
      <div className="absolute top-2 right-2">
        <FaLock className="text-gray-400 text-sm" />
      </div>
    )}
    <div className={`text-2xl mb-2 ${locked ? 'text-gray-400' : `text-${color}-500`}`}>
      {icon}
    </div>
    <h3 className={`font-semibold text-sm ${locked ? 'text-gray-400' : 'text-gray-800'}`}>
      {title}
    </h3>
    <p className="text-xs text-gray-500 mt-1">{subtitle}</p>
  </motion.div>
);

type ProgressRingProps = {
  progress: number;
  size?: number;
  strokeWidth?: number;
};

const ProgressRing = ({ progress, size = 60, strokeWidth = 4 }: ProgressRingProps) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  // Determine color based on progress (lower is better for anxiety)
  const getGradientColors = () => {
    if (progress < 25) return { start: "#10B981", end: "#34D399" }; // Green - Low anxiety
    if (progress < 50) return { start: "#3B82F6", end: "#60A5FA" }; // Blue - Mild anxiety
    if (progress < 75) return { start: "#F59E0B", end: "#FBBF24" }; // Yellow - Moderate anxiety
    return { start: "#EF4444", end: "#F87171" }; // Red - High anxiety
  };

  const colors = getGradientColors();

  return (
    <motion.div 
      className="relative"
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, delay: 0.2 }}
    >
      <svg width={size} height={size} className="transform -rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#e5e7eb"
          strokeWidth={strokeWidth}
          fill="none"
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={`url(#gradient-${progress})`}
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset }}
          transition={{ duration: 1, ease: "easeOut" }}
        />
        <defs>
          <linearGradient id={`gradient-${progress}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={colors.start} />
            <stop offset="100%" stopColor={colors.end} />
          </linearGradient>
        </defs>
      </svg>
      <motion.div 
        className="absolute inset-0 flex items-center justify-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
      >
        <span className="text-xs font-bold text-gray-700">{Math.round(progress)}%</span>
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
  const ref = useRef(null);
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
      id: 'relaxation',
      title: 'Relaxation',
      subtitle: 'Breathing & meditation',
      icon: FaLeaf,
      gradient: 'from-green-500 to-emerald-600',
      bgGradient: 'from-green-50 to-emerald-100',
      borderColor: 'border-green-200',
      onClick: () => alert('Relaxation Tools - Opening!'),
      tags: ['Mindfulness', 'Calming']
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
      const { scrollLeft, clientWidth } = carouselRef.current;
      const cardWidth = 280; // Width of one card plus gap (264px + 16px gap)
      const currentIndex = Math.round(scrollLeft / cardWidth);
      setActiveIndex(Math.min(currentIndex, mainNavItems.length - 1));
    }
  };

  const scrollCarousel = (direction: 'left' | 'right') => {
    if (carouselRef.current) {
      const scrollAmount = 280; // Width of one card plus gap
      const newScrollLeft = carouselRef.current.scrollLeft + (direction === 'right' ? scrollAmount : -scrollAmount);
      carouselRef.current.scrollTo({
        left: newScrollLeft,
        behavior: 'smooth'
      });
    }
  };

  const scrollToIndex = (index: number) => {
    if (carouselRef.current) {
      const cardWidth = 280; // Width of one card plus gap
      const scrollLeft = index * cardWidth;
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
    <div className="mb-6">
      <motion.h2 
        className="font-bold text-xl text-gray-800 mb-4 px-1"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        🎯 Your Wellness Tools
      </motion.h2>
      
      <div className="relative">
        {/* Left Scroll Button */}
        <AnimatePresence>
          {canScrollLeft && (
            <motion.button
              className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 bg-white/90 backdrop-blur-sm rounded-full shadow-lg border border-gray-200 flex items-center justify-center hover:bg-white transition-all duration-200"
              onClick={() => scrollCarousel('left')}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <FaChevronLeft className="text-gray-600 text-sm" />
            </motion.button>
          )}
        </AnimatePresence>

        {/* Right Scroll Button */}
        <AnimatePresence>
          {canScrollRight && (
            <motion.button
              className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 bg-white/90 backdrop-blur-sm rounded-full shadow-lg border border-gray-200 flex items-center justify-center hover:bg-white transition-all duration-200"
              onClick={() => scrollCarousel('right')}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <FaChevronRight className="text-gray-600 text-sm" />
            </motion.button>
          )}
        </AnimatePresence>

        {/* Carousel Container */}
        <div
          ref={carouselRef}
          className="flex gap-4 overflow-x-auto scrollbar-hide scroll-smooth px-2 py-2"
        >
          {mainNavItems.map((item, index) => (
            <motion.div
              key={item.id}
              className={`flex-shrink-0 w-64 bg-gradient-to-r ${item.bgGradient} rounded-2xl p-5 shadow-lg border ${item.borderColor} cursor-pointer group hover:shadow-xl transition-all duration-300`}
              onClick={item.onClick}
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: index * 0.1 }}
              whileHover={{ y: -8, scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="flex items-center gap-4 mb-3">
                <div className={`w-14 h-14 bg-gradient-to-r ${item.gradient} rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                  <item.icon className="text-white text-xl" />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-gray-800 text-lg mb-1">{item.title}</h3>
                  <p className="text-gray-600 text-sm">{item.subtitle}</p>
                </div>
              </div>
              
              <div className="flex gap-2 flex-wrap">
                {item.tags.map((tag, tagIndex) => (
                  <span
                    key={tagIndex}
                    className={`text-xs px-2 py-1 rounded-full font-medium ${
                      item.id === 'cbt-modules' ? 'bg-blue-100 text-blue-800' :
                      item.id === 'anxiety-videos' ? 'bg-red-100 text-red-800' :
                      item.id === 'relaxation' ? 'bg-green-100 text-green-800' :
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
        <div className="flex justify-center gap-3 mt-4">
          {mainNavItems.map((_, index) => (
            <motion.button
              key={index}
              className={`relative rounded-full transition-all duration-300 cursor-pointer ${
                activeIndex === index 
                  ? 'w-8 h-3 bg-[#800000]' 
                  : 'w-3 h-3 bg-gray-300 hover:bg-gray-400'
              }`}
              onClick={() => scrollToIndex(index)}
              whileHover={{ scale: 1.2 }}
              whileTap={{ scale: 0.9 }}
              initial={false}
              animate={{
                width: activeIndex === index ? 32 : 12,
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
  const headerRef = useRef(null);
  const { scrollY } = useScroll();
  const headerOpacity = useTransform(scrollY, [0, 100], [1, 0.8]);
  const headerScale = useTransform(scrollY, [0, 100], [1, 0.98]);
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

  const getMotivationalQuote = () => {
    const quotes = [
      "You are stronger than you think 💪",
      "Every small step counts 🌟",
      "Breathe in peace, breathe out stress 🌸",
      "Progress, not perfection 🎯",
      "You've got this! 💙"
    ];
    return quotes[Math.floor(Math.random() * quotes.length)];
  };

  const BreathingExercise = () => {
    const [phase, setPhase] = useState('inhale');
    const [count, setCount] = useState(4);

    useEffect(() => {
      if (!breathingActive) return;

      const timer = setInterval(() => {
        setCount(prev => {
          if (prev === 1) {
            setPhase(current => {
              if (current === 'inhale') return 'hold';
              if (current === 'hold') return 'exhale';
              return 'inhale';
            });
            return 4;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }, [breathingActive, phase]);

    return (
      <motion.div 
        className="bg-[#800000]/5 rounded-2xl p-6 text-center"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h3 className="font-semibold text-gray-800 mb-4">Breathing Exercise</h3>
        
        <AnimatePresence mode="wait">
          {!breathingActive ? (
            <motion.button
              key="start-button"
              onClick={() => setBreathingActive(true)}
              className="bg-[#800000] hover:bg-[#660000] text-white px-6 py-3 rounded-xl font-medium hover:shadow-lg transition-all duration-200"
              whileHover={{ scale: 1.05, boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)" }}
              whileTap={{ scale: 0.95 }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              Start Breathing Exercise
            </motion.button>
          ) : (
            <motion.div 
              key="breathing-exercise"
              className="space-y-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <motion.div 
                className={`w-20 h-20 mx-auto rounded-full ${
                  phase === 'inhale' ? 'bg-blue-400' :
                  phase === 'hold' ? 'bg-purple-400' :
                  'bg-green-400'
                }`}
                animate={{
                  scale: phase === 'inhale' ? 1.3 : phase === 'hold' ? 1.3 : 0.8,
                }}
                transition={{ duration: 3, ease: "easeInOut" }}
              ></motion.div>
              
              <motion.div 
                className="text-lg font-semibold capitalize text-gray-800"
                key={`${phase}-${count}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.2 }}
              >
                {phase} {count}
              </motion.div>
              
              <p className="text-sm text-gray-600">
                {phase === 'inhale' ? 'Breathe in slowly...' :
                 phase === 'hold' ? 'Hold your breath...' :
                 'Breathe out gently...'}
              </p>
              
              <motion.button
                onClick={() => setBreathingActive(false)}
                className="text-gray-500 text-sm hover:text-gray-700 transition-colors"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Stop Exercise
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>
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

  return (
    <div className="min-h-screen bg-[#800000]/5">
      {/* Header with scroll effect */}
      <motion.div 
        ref={headerRef}
        className="bg-gradient-to-r from-[#4a0e0e] to-[#660000] backdrop-blur-sm border-b border-[#800000]/30 sticky top-0 z-10 shadow-lg"
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
        style={{ 
          opacity: headerOpacity,
          scale: headerScale
        }}
      >
        <div className="px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-white drop-shadow-md">
                {getGreeting()}, {loadingUser ? '...' : userData?.full_name || userData?.name || mockUserData.name}! 👋
              </h1>
              <p className="text-sm text-white/80">{getMotivationalQuote()}</p>
            </div>
            <div className="flex items-center gap-3">
              <motion.button 
                className="relative p-2 bg-white/20 backdrop-blur-sm rounded-full border border-white/30"
                whileTap={{ scale: 0.9 }}
                whileHover={{ scale: 1.1, backgroundColor: "rgba(255,255,255,0.3)" }}
                onClick={() => setShowNotifications((prev) => !prev)}
                aria-label="Show notifications"
              >
                <FaBell className="text-white" />
                {notifications.length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-400 text-white text-xs rounded-full px-1.5 py-0.5 font-bold animate-pulse shadow-lg">
                    {notifications.length}
                  </span>
                )}
              </motion.button>
              {/* Notification dropdown/modal */}
              {showNotifications && (
                <div className="absolute right-4 top-14 bg-white border border-gray-200 rounded-xl shadow-lg z-50 w-80">
                  <div className="p-4">
                    <h3 className="font-bold text-[#800000] mb-2 text-lg flex items-center">
                      <FaBell className="mr-2" /> Notifications
                    </h3>
                    {notifications.length === 0 ? (
                      <p className="text-gray-500 text-sm">No upcoming appointments.</p>
                    ) : (
                      <ul className="space-y-3">
                        {notifications.map((appt) => (
                          <li key={appt.id} className="bg-[#800000]/5 rounded-lg p-3 border border-[#800000]/10">
                            <div className="flex items-center justify-between">
                              <div>
                                <span className="font-semibold text-[#800000]">Appointment Scheduled</span>
                                <div className="text-xs text-gray-700 mt-1">
                                  {new Date(appt.appointment_date).toLocaleDateString()} at {appt.appointment_time}
                                </div>
                                <div className="text-xs text-gray-500">Status: {appt.status}</div>
                              </div>
                              <FaCalendarAlt className="text-[#800000] text-lg" />
                            </div>
                            {appt.notes && (
                              <div className="text-xs text-gray-600 mt-2">Notes: {appt.notes}</div>
                            )}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                  <div className="border-t px-4 py-2 text-right">
                    <button
                      className="text-[#800000] font-semibold hover:underline text-sm"
                      onClick={() => setShowNotifications(false)}
                    >Close</button>
                  </div>
                </div>
              )}
              <motion.div 
                className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center cursor-pointer border border-white/30"
                whileHover={{ scale: 1.1, rotate: 5, backgroundColor: "rgba(255,255,255,0.3)" }}
                whileTap={{ scale: 0.9 }}
                onClick={goToProfile}
              >
                <FaUser className="text-white text-sm" />
              </motion.div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Main Content */}
      <div className="px-4 py-6 pb-20">
        {/* Main Navigation Carousel */}
        <MainNavCarousel navigate={navigate} />
        
        {/* Stats Cards */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          {/* Day Streak Card */}
          <motion.div 
            className={`bg-white rounded-2xl p-4 shadow-lg border-2 ${getFireBorderColor(userStreak)}`}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
            whileHover={{ y: -5, boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)" }}
          >
            <div className="flex items-center justify-between mb-2">
              <motion.div
                animate={{ rotate: [0, 10, 0, -10, 0] }}
                transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
              >
                <FaFire className={`${getFireColor(userStreak)} text-xl`} title={
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
                <div className="w-6 h-6 rounded-full border-2 border-gray-300 border-t-orange-500 animate-spin"></div>
              ) : (
                <motion.span 
                  className={`text-2xl font-bold relative ${getFireColor(userStreak)}`}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 260, damping: 20, delay: 0.2 }}
                >
                  {userStreak}
                  {streakIncrease && (
                    <motion.span
                      className="absolute -top-4 left-1/2 -translate-x-1/2 text-green-500 text-base font-bold drop-shadow"
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
            <p className={`text-sm font-bold mb-1 ${getFireColor(userStreak)}`}>Day Streak</p>
            <div className="flex flex-col items-center mt-2 mb-2">
              <StreakPet streak={userStreak} className="animate-bounce-slow" showLabel={false} />
            </div>
            <div className="mt-2 flex items-center gap-1 justify-center">
              <FaArrowUp className={`text-xs ${getFireColor(userStreak)}`} />
              <span className={`text-xs font-medium ${getFireColor(userStreak)}`}>
                {userStreak > 0 ? `${userStreak} days and counting!` : 'Start your streak today!'}
              </span>
            </div>
          </motion.div>

          {/* Recent Assessment Compact Card */}
          <motion.div 
            className={`relative overflow-hidden rounded-2xl p-4 shadow-lg border-2 ${
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
              <div className="flex items-center justify-between mb-3">
                {/* Icon with animated background */}
                <motion.div
                  className={`relative w-12 h-12 rounded-xl flex items-center justify-center shadow-lg ${
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
                  <FaChartLine className="text-white text-lg drop-shadow-sm" />
                  {/* Pulse effect */}
                  <div className={`absolute inset-0 rounded-xl ${
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
                  <div className="w-8 h-8 rounded-full border-2 border-gray-300 border-t-[#800000] animate-spin"></div>
                ) : recentAssessment ? (
                  <motion.div 
                    className="flex items-center gap-2"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 260, damping: 20, delay: 0.3 }}
                  >
                    <div className="relative">
                      <ProgressRing progress={recentAssessment.percentage} size={45} strokeWidth={4} />
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
                    className="w-10 h-10 bg-gradient-to-r from-[#800000] to-[#a00000] rounded-xl flex items-center justify-center shadow-lg"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 260, damping: 20, delay: 0.3 }}
                  >
                    <FaBrain className="text-white text-sm" />
                  </motion.div>
                )}
              </div>
              
              {/* Content */}
              {loadingAssessment ? (
                <>
                  <p className="text-sm font-bold text-gray-700 mb-1">Assessment</p>
                  <p className="text-xs text-gray-500">Loading your data...</p>
                  <div className="mt-2 flex gap-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                </>
              ) : recentAssessment ? (
                <>
                  <div className="flex items-center gap-2 mb-2">
                    <p className={`text-lg font-black ${
                      recentAssessment.percentage < 25 ? 'text-green-700' :
                      recentAssessment.percentage < 50 ? 'text-blue-700' :
                      recentAssessment.percentage < 75 ? 'text-yellow-700' :
                      'text-red-700'
                    }`}>
                      {recentAssessment.anxiety_level}
                    </p>
                    {/* Status Badge */}
                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                      recentAssessment.percentage < 25 ? 'bg-green-200 text-green-800' :
                      recentAssessment.percentage < 50 ? 'bg-blue-200 text-blue-800' :
                      recentAssessment.percentage < 75 ? 'bg-yellow-200 text-yellow-800' :
                      'bg-red-200 text-red-800'
                    }`}>
                      {recentAssessment.percentage}%
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <FaCalendarAlt className={`text-xs ${
                        recentAssessment.percentage < 25 ? 'text-green-600' :
                        recentAssessment.percentage < 50 ? 'text-blue-600' :
                        recentAssessment.percentage < 75 ? 'text-yellow-600' :
                        'text-red-600'
                      }`} />
                      <span className="text-xs font-medium text-gray-600">
                        {formatAssessmentDate(recentAssessment.created_at)}
                      </span>
                    </div>
                    
                    {calculateImprovement() && (
                      <motion.span 
                        className={`font-bold text-xs flex items-center gap-1 px-2 py-1 rounded-full ${
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
                  <p className="text-sm font-bold text-[#800000] mb-1">Assessment</p>
                  <p className="text-xs text-gray-600 mb-3">Start your wellness journey</p>
                  <motion.button 
                    onClick={goToAssessment}
                    className="w-full bg-gradient-to-r from-[#800000] to-[#a00000] text-white text-xs px-3 py-2 rounded-lg hover:from-[#660000] hover:to-[#800000] transition-all duration-200 font-medium shadow-md hover:shadow-lg flex items-center justify-center gap-2"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <FaChartLine className="text-xs" />
                    Take Assessment
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

        {/* Daily Activities with scroll reveal */}
        <ScrollReveal delay={0.3}>
          <div className="mb-6">
            <motion.h3 
              className="font-semibold text-gray-800 mb-4 flex items-center gap-2"
            >
              <FaCalendarAlt className="text-green-500" />
              Today's Activities
            </motion.h3>
            
            <div className="space-y-3">
              <motion.div 
                className="bg-white rounded-xl p-4 shadow-md border border-gray-200 flex items-center justify-between"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: 0.2 }}
                whileHover={{ x: 5, backgroundColor: "#f9fafb" }}
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                    <FaCheck className="text-green-600 text-sm" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-800 text-sm">Morning Meditation</p>
                    <p className="text-xs text-gray-500">5 minutes completed</p>
                  </div>
                </div>
                <FaSmile className="text-green-500" />
              </motion.div>

              <motion.div 
                className="bg-white rounded-xl p-4 shadow-md border border-gray-200 flex items-center justify-between"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: 0.3 }}
                whileHover={{ x: 5, backgroundColor: "#f9fafb" }}
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-[#800000]/10 rounded-full flex items-center justify-center">
                    <FaPlay className="text-[#800000] text-sm" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-800 text-sm">Anxiety Video</p>
                    <p className="text-xs text-gray-500">Watch "Managing Daily Stress"</p>
                  </div>
                </div>
                <FaChevronRight className="text-gray-400" />
              </motion.div>

              <motion.div 
                className="bg-white rounded-xl p-4 shadow-md border border-gray-200 flex items-center justify-between"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: 0.4 }}
                whileHover={{ x: 5, backgroundColor: "#f9fafb" }}
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-[#800000]/10 rounded-full flex items-center justify-center">
                    <FaBrain className="text-[#800000] text-sm" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-800 text-sm">CBT Exercise</p>
                    <p className="text-xs text-gray-500">Thought challenging worksheet</p>
                  </div>
                </div>
                <FaChevronRight className="text-gray-400" />
              </motion.div>
            </div>
          </div>
        </ScrollReveal>

        {/* Achievements with scroll reveal */}
        <ScrollReveal delay={0.4} direction="left">
          <div className="mb-6">
            <motion.h3 
              className="font-semibold text-gray-800 mb-4 flex items-center gap-2"
            >
              <FaTrophy className="text-yellow-500" />
              Achievements
            </motion.h3>
            
            <div className="grid grid-cols-4 gap-3">
              {mockUserData.achievements.map((achievement, index) => (
                <motion.div
                  key={achievement.id}
                  className={`bg-white rounded-xl p-3 shadow-md border-2 text-center ${
                    achievement.unlocked 
                      ? 'border-yellow-200 bg-gradient-to-br from-yellow-50 to-orange-50' 
                      : 'border-gray-200 opacity-50'
                  }`}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3, delay: 0.1 * index }}
                  whileHover={achievement.unlocked ? { y: -5, scale: 1.05 } : {}}
                >
                  <div className="text-2xl mb-1">{achievement.icon}</div>
                  <p className="text-xs font-medium text-gray-700">{achievement.name}</p>
                  {achievement.unlocked && (
                    <FaCheck className="text-green-500 text-xs mx-auto mt-1" />
                  )}
                </motion.div>
              ))}
            </div>
          </div>
        </ScrollReveal>

        {/* Mood Tracker */}
        <ScrollReveal delay={0.5} direction="right">
          <motion.div 
            className="bg-[#800000]/5 rounded-2xl p-4 border-2 border-[#800000]/30"
            whileInView={{ 
              boxShadow: ["0px 0px 0px rgba(0,0,0,0)", "0px 10px 20px rgba(0,0,0,0.1)", "0px 0px 0px rgba(0,0,0,0)"]
            }}
            transition={{ duration: 2, repeat: Infinity, repeatType: "reverse" }}
          >
            <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
              <FaHeart className="text-pink-500" />
              How are you feeling right now?
            </h3>
            
            <div className="flex justify-between">
              {['😢', '😟', '😐', '😊', '😄'].map((emoji, index) => (
                <motion.button
                  key={index}
                  className="w-12 h-12 text-2xl bg-white rounded-full shadow-md hover:shadow-lg hover:scale-110 transition-all duration-200 border-2 border-transparent hover:border-pink-300"
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
          className="fixed bottom-20 right-4 bg-[#800000] text-white p-3 rounded-full shadow-lg cursor-pointer z-10"
          onClick={scrollToTop}
          style={{
            opacity: scrollButtonOpacity,
            scale: scrollButtonScale,
          }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          <FaArrowUp />
        </motion.div>
      </div>

      {/* Bottom Navigation */}
      <motion.div 
        className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-sm border-t border-gray-200"
        initial={{ y: 50 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.5 }}
        style={{
          opacity: useTransform(scrollY, [0, 300], [1, 0.9])
        }}
      >
        <div className="flex justify-around py-2">
          {[
            { id: 'home', icon: FaHeart, label: 'Home', color: 'text-pink-500', action: () => setSelectedTab('home') },
            { id: 'brain', icon: FaBrain, label: 'Assessment', color: 'text-[#800000]', action: goToAssessment },
            { id: 'leaf', icon: FaLeaf, label: 'Relax', color: 'text-green-500', action: () => setSelectedTab('leaf') },
            { id: 'chart', icon: FaChartLine, label: 'Progress', color: 'text-[#800000]', action: () => setSelectedTab('chart') },
            { id: 'user', icon: FaUser, label: 'Profile', color: 'text-gray-500', action: goToProfile }
          ].map((tab) => (
            <motion.button
              key={tab.id}
              className={`flex flex-col items-center py-2 px-3 rounded-lg transition-all duration-200 ${
                selectedTab === tab.id ? 'bg-[#800000]/10 transform scale-105' : ''
              }`}
              onClick={tab.action}
              whileHover={{ y: -3 }}
              whileTap={{ scale: 0.9 }}
            >
              <tab.icon className={`text-lg ${selectedTab === tab.id ? tab.color : 'text-gray-400'}`} />
              <span className={`text-xs mt-1 ${selectedTab === tab.id ? tab.color : 'text-gray-400'}`}>
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