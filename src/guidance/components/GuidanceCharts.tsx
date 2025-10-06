import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
} from 'chart.js';
import { Pie, Bar, Line } from 'react-chartjs-2';
import { useState, useMemo, useEffect, useRef } from 'react';
import { FaChevronLeft, FaChevronRight, FaInfoCircle, FaCalendarAlt, FaUsers, FaHeart, FaChartLine, FaCircle, FaCalendarCheck, FaExclamationTriangle } from 'react-icons/fa';
import 'chart.js/auto';

ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement
);

// Enhanced scroll animation hook with better performance and easing
const useScrollAnimation = (delay: number = 0) => {
  const [isVisible, setIsVisible] = useState(false);
  const [hasAnimated, setHasAnimated] = useState(false);
  const elementRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated) {
          // Clear any existing timeout
          if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
          }
          
          timeoutRef.current = setTimeout(() => {
            setIsVisible(true);
            setHasAnimated(true);
          }, delay);
        }
      },
      {
        threshold: 0.05,
        rootMargin: '100px 0px -50px 0px'
      }
    );

    const currentElement = elementRef.current;
    if (currentElement) {
      observer.observe(currentElement);
    }

    return () => {
      if (currentElement) {
        observer.unobserve(currentElement);
      }
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [delay, hasAnimated]);

  return { elementRef, isVisible };
};

// Enhanced animated wrapper component with more animation types and smoother transitions
const AnimatedChartContainer = ({ 
  children, 
  delay = 0, 
  className = '',
  animationType = 'fadeInUp'
}: { 
  children: React.ReactNode; 
  delay?: number; 
  className?: string;
  animationType?: 'fadeInUp' | 'fadeInLeft' | 'fadeInRight' | 'fadeInScale' | 'fadeInDown' | 'slideInUp' | 'bounceIn' | 'zoomIn';
}) => {
  const { elementRef, isVisible } = useScrollAnimation(delay);

  const getAnimationClasses = () => {
    const baseClasses = 'transition-all duration-1000 ease-[cubic-bezier(0.25,0.46,0.45,0.94)]';
    
    if (!isVisible) {
      switch (animationType) {
        case 'fadeInLeft':
          return `${baseClasses} opacity-0 -translate-x-12 blur-sm`;
        case 'fadeInRight':
          return `${baseClasses} opacity-0 translate-x-12 blur-sm`;
        case 'fadeInDown':
          return `${baseClasses} opacity-0 -translate-y-12 blur-sm`;
        case 'fadeInScale':
          return `${baseClasses} opacity-0 scale-90 blur-sm`;
        case 'slideInUp':
          return `${baseClasses} opacity-0 translate-y-16 scale-95`;
        case 'bounceIn':
          return `${baseClasses} opacity-0 scale-75 rotate-3`;
        case 'zoomIn':
          return `${baseClasses} opacity-0 scale-50 blur-sm`;
        case 'fadeInUp':
        default:
          return `${baseClasses} opacity-0 translate-y-12 blur-sm`;
      }
    }
    
    return `${baseClasses} opacity-100 translate-y-0 translate-x-0 scale-100 blur-none rotate-0`;
  };

  return (
    <div 
      ref={elementRef}
      className={`${getAnimationClasses()} ${className}`}
      style={{
        willChange: isVisible ? 'auto' : 'transform, opacity, filter'
      }}
    >
      {children}
    </div>
  );
};

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

type Appointment = {
  id: number;
  student_name: string;
  student_email: string;
  appointment_date: string;
  appointment_time: string;
  status: string;
  notes?: string;
};

interface GuidanceChartsProps {
  users: UserProfile[];
  assessments: { [key: string]: Assessment[] };
  appointments?: Appointment[];
  darkMode?: boolean;
  compact?: boolean;
}

// Calendar component
const AppointmentCalendar = ({ appointments, darkMode }: { appointments?: Appointment[], darkMode: boolean }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showModal, setShowModal] = useState(false);
  
  // Helper to get local date string in YYYY-MM-DD format
  const getLocalDateString = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Get appointments count for a specific date (using local date)
  const getAppointmentsForDate = (date: Date) => {
    if (!appointments) return [];
    const dateString = getLocalDateString(date);
    return appointments.filter(app => app.appointment_date === dateString);
  };

  // Get current month's calendar days
  const getCalendarDays = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());
    
    const days = [];
    const currentDay = new Date(startDate);
    
    while (currentDay <= lastDay || currentDay.getDay() !== 0) {
      days.push(new Date(currentDay));
      currentDay.setDate(currentDay.getDate() + 1);
    }
    
    return days;
  };

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const goToPreviousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const calendarDays = getCalendarDays();
  const today = new Date();
  const isToday = (date: Date) => {
    return date.toDateString() === today.toDateString();
  };

  const isCurrentMonth = (date: Date) => {
    return date.getMonth() === currentDate.getMonth();
  };

  return (
    <div className={`p-4 rounded-2xl shadow-xl border-0 ${darkMode ? 'bg-gradient-to-br from-gray-800 to-gray-900' : 'bg-gradient-to-br from-white to-gray-50'} backdrop-blur-sm`}>
      {/* Calendar Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <div className={`w-3 h-3 rounded-full ${darkMode ? 'bg-indigo-400' : 'bg-indigo-500'}`}></div>
          <h3 className={`text-lg font-bold bg-gradient-to-r ${darkMode ? 'from-indigo-400 to-purple-400' : 'from-indigo-600 to-purple-600'} bg-clip-text text-transparent`}>
            {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
          </h3>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={goToPreviousMonth}
            className={`p-2 rounded-xl transition-all duration-300 transform hover:scale-110 hover:-translate-x-0.5 active:scale-95 ${darkMode ? 'bg-gray-700/50 hover:bg-gray-600/70 text-gray-300 hover:text-white hover:shadow-lg' : 'bg-gray-100/80 hover:bg-gray-200 text-gray-600 hover:text-gray-800 hover:shadow-md'} backdrop-blur-sm hover:backdrop-blur-md`}
          >
            <FaChevronLeft className="w-3 h-3 transition-transform duration-200 group-hover:-translate-x-0.5" />
          </button>
          <button
            onClick={goToToday}
            className={`px-4 py-2 text-xs font-semibold rounded-xl transition-all duration-300 transform hover:scale-110 hover:-translate-y-0.5 active:scale-95 bg-gradient-to-r ${darkMode ? 'from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500' : 'from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600'} text-white shadow-lg hover:shadow-2xl hover:shadow-indigo-500/25`}
          >
            Today
          </button>
          <button
            onClick={goToNextMonth}
            className={`p-2 rounded-xl transition-all duration-300 transform hover:scale-110 hover:translate-x-0.5 active:scale-95 ${darkMode ? 'bg-gray-700/50 hover:bg-gray-600/70 text-gray-300 hover:text-white hover:shadow-lg' : 'bg-gray-100/80 hover:bg-gray-200 text-gray-600 hover:text-gray-800 hover:shadow-md'} backdrop-blur-sm hover:backdrop-blur-md`}
          >
            <FaChevronRight className="w-3 h-3 transition-transform duration-200 group-hover:translate-x-0.5" />
          </button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-2">
        {/* Day Headers */}
        {dayNames.map(day => (
          <div
            key={day}
            className={`p-2 text-center text-xs font-bold ${darkMode ? 'text-indigo-400' : 'text-indigo-600'} uppercase tracking-wider`}
          >
            {day}
          </div>
        ))}
        
        {/* Calendar Days */}
        {calendarDays.map((date, index) => {
          const appointmentsForDay = getAppointmentsForDate(date);
          const appointmentCount = appointmentsForDay.length;
          const hasAppointments = appointmentCount > 0;
          return (
            <div
              key={index}
              className={`relative p-2 min-h-[48px] rounded-xl transition-all duration-300 cursor-pointer transform hover:scale-110 hover:-translate-y-1 active:scale-95 ${
                darkMode 
                  ? 'bg-gray-700/30 hover:bg-gray-600/50 border border-gray-600/30' 
                  : 'bg-white/60 hover:bg-white/80 border border-gray-200/50 shadow-sm hover:shadow-md'
              } ${
                !isCurrentMonth(date) 
                  ? darkMode ? 'text-gray-500 opacity-50' : 'text-gray-400 opacity-60'
                  : ''
              } ${
                hasAppointments ? 'ring-2 ring-indigo-500/20 hover:ring-indigo-500/40 hover:shadow-lg hover:shadow-indigo-500/10' : 'hover:shadow-md'
              } backdrop-blur-sm hover:backdrop-blur-md`}
              onClick={() => {
                if (hasAppointments) {
                  setSelectedDate(date);
                  setShowModal(true);
                }
              }}
              title={hasAppointments ? `View appointments for ${getLocalDateString(date)}` : undefined}
            >
              {/* Date Number */}
              <div className={`text-sm font-bold flex items-center justify-center ${
                isToday(date) 
                  ? 'text-white bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full w-7 h-7 mx-auto mb-1 shadow-lg'
                  : darkMode ? 'text-gray-200' : 'text-gray-700'
              }`}>
                {date.getDate()}
              </div>
              {/* Appointment Count */}
              {hasAppointments && (
                <div className="absolute -bottom-1 -right-1">
                  <div className={`flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold shadow-lg border-2 transition-all duration-300 hover:scale-125 ${
                    appointmentCount >= 5 
                      ? 'bg-gradient-to-r from-red-500 to-red-600 text-white border-red-300' 
                      : appointmentCount >= 3 
                        ? 'bg-gradient-to-r from-yellow-500 to-orange-500 text-white border-yellow-300' 
                        : 'bg-gradient-to-r from-green-500 to-emerald-500 text-white border-green-300'
                  } animate-pulse hover:animate-bounce`}>
                    {appointmentCount}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Legend */}
      {showModal && selectedDate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-md bg-black/20 p-4 animate-in fade-in duration-300">
          <div className={`rounded-2xl shadow-2xl border w-full max-w-md max-h-[80vh] flex flex-col transition-all duration-300 transform animate-in zoom-in-95 slide-in-from-bottom-4 ${darkMode ? 'bg-gray-900 text-white border-gray-700' : 'bg-white text-gray-900 border-gray-200'}`}>
            {/* Modal Header */}
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
              <h3 className="text-lg font-bold text-center">
                Appointments for <span className={`${darkMode ? 'text-indigo-400' : 'text-indigo-600'}`}>{getLocalDateString(selectedDate)}</span>
              </h3>
              <div className={`text-sm text-center mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                {getAppointmentsForDate(selectedDate).length} appointment{getAppointmentsForDate(selectedDate).length !== 1 ? 's' : ''}
              </div>
            </div>
            
            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-4">
              <ul className="space-y-3">
                {getAppointmentsForDate(selectedDate).map((app, idx) => {
                  const getStatusColors = (status: string) => {
                    switch(status) {
                      case 'Completed':
                        return {
                          border: 'border-green-300 dark:border-green-600',
                          bg: 'bg-green-50/80 dark:bg-green-900/20',
                          badge: 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300',
                          indicator: 'bg-green-500'
                        };
                      case 'Canceled':
                        return {
                          border: 'border-red-300 dark:border-red-600',
                          bg: 'bg-red-50/80 dark:bg-red-900/20',
                          badge: 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300',
                          indicator: 'bg-red-500'
                        };
                      case 'In Progress':
                      case 'in progress':
                      case 'In-Progress':
                      case 'Progress':
                        return {
                          border: 'border-yellow-300 dark:border-yellow-600',
                          bg: 'bg-yellow-50/80 dark:bg-yellow-900/20',
                          badge: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/50 dark:text-yellow-300',
                          indicator: 'bg-yellow-500'
                        };
                      case 'Scheduled':
                      case 'Pending':
                      case 'Confirmed':
                        return {
                          border: 'border-blue-300 dark:border-blue-600',
                          bg: 'bg-blue-50/80 dark:bg-blue-900/20',
                          badge: 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300',
                          indicator: 'bg-blue-500'
                        };
                      default:
                        return {
                          border: 'border-gray-300 dark:border-gray-600',
                          bg: 'bg-gray-50/80 dark:bg-gray-900/20',
                          badge: 'bg-gray-100 text-gray-700 dark:bg-gray-900/50 dark:text-gray-300',
                          indicator: 'bg-gray-500'
                        };
                    }
                  };
                  const colors = getStatusColors(app.status);
                  
                  return (
                  <li key={app.id || idx} className={`p-3 rounded-xl border-2 transition-all hover:shadow-md relative ${colors.bg} ${colors.border} hover:shadow-lg`}> 
                    {/* Status indicator line */}
                    <div className={`absolute left-0 top-0 bottom-0 w-1 rounded-l-xl ${colors.indicator}`}></div>
                    <div className="flex items-start justify-between mb-2">
                      <div className="font-semibold text-[#800000] text-sm">{app.student_name}</div>
                      <div className={`px-3 py-1 rounded-full text-xs font-semibold shadow-sm ${colors.badge}`}>
                        {app.status}
                      </div>
                    </div>
                    <div className={`text-xs mb-2 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{app.student_email}</div>
                    <div className="flex items-center gap-4 text-xs">
                      <div className="flex items-center gap-1">
                        <span className={`font-medium ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Time:</span> 
                        <span className={`font-semibold px-2 py-1 rounded-md ${darkMode ? 'bg-indigo-900/30 text-indigo-400' : 'bg-indigo-100 text-indigo-700'}`}>{app.appointment_time}</span>
                      </div>
                    </div>
                    {app.notes && (
                      <div className={`mt-2 p-2 rounded-lg text-xs ${darkMode ? 'bg-gray-700/50 text-gray-300' : 'bg-gray-100 text-gray-700'}`}>
                        <span className="font-medium">Notes:</span> {app.notes}
                      </div>
                    )}
                  </li>
                  );
                })}
              </ul>
            </div>
            
            {/* Modal Footer */}
            <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex-shrink-0">
            <button
                className="w-full py-3 rounded-xl font-semibold transition-all duration-300 transform hover:scale-110 hover:-translate-y-0.5 active:scale-95 bg-gradient-to-r from-[#800000] to-[#660000] text-white shadow-lg hover:shadow-2xl hover:shadow-red-900/25"
  onClick={() => setShowModal(false)}
>
      Close
            </button>

            </div>
          </div>
        </div>
      )}
      <div className="flex items-center justify-center mt-4 space-x-4 text-xs">
        <div className="flex items-center space-x-2 px-3 py-1 rounded-full bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-500/30 transition-all duration-300 hover:scale-105 hover:shadow-md">
          <FaCircle className={`w-3 h-3 ${darkMode ? 'text-green-400' : 'text-green-500'} shadow-sm transition-transform duration-200 hover:scale-110`} />
          <span className={`font-medium ${darkMode ? 'text-green-300' : 'text-green-700'}`}>1-2 appointments</span>
        </div>
        <div className="flex items-center space-x-2 px-3 py-1 rounded-full bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-500/30 transition-all duration-300 hover:scale-105 hover:shadow-md">
          <FaCalendarCheck className={`w-3 h-3 ${darkMode ? 'text-yellow-400' : 'text-yellow-500'} shadow-sm transition-transform duration-200 hover:scale-110`} />
          <span className={`font-medium ${darkMode ? 'text-yellow-300' : 'text-yellow-700'}`}>3-4 appointments</span>
        </div>
        <div className="flex items-center space-x-2 px-3 py-1 rounded-full bg-gradient-to-r from-red-500/20 to-red-600/20 border border-red-500/30 transition-all duration-300 hover:scale-105 hover:shadow-md">
          <FaExclamationTriangle className={`w-3 h-3 ${darkMode ? 'text-red-400' : 'text-red-500'} shadow-sm transition-transform duration-200 hover:scale-110`} />
          <span className={`font-medium ${darkMode ? 'text-red-300' : 'text-red-700'}`}>5+ appointments</span>
        </div>
      </div>
    </div>
  );
};

export default function GuidanceCharts(props: GuidanceChartsProps) {
  const {
    users,
    assessments,
    appointments,
    darkMode = false,
    // compact = false,
  } = props;

    const [timeRange, setTimeRange] = useState('daily');
    const [currentPage, setCurrentPage] = useState(0);

  // Reset when time range changes (will jump to last page via effect)
  const handleTimeRangeChange = (newTimeRange: string) => {
    setTimeRange(newTimeRange);
      setCurrentPage(0);
  };

  const getLocalDateKey = (dateInput: string | Date) => {
    const dateObj = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
    return dateObj.getFullYear() + '-' +
      String(dateObj.getMonth() + 1).padStart(2, '0') + '-' +
      String(dateObj.getDate()).padStart(2, '0');
  };

  const formatDateLabel = (dateKey: string, timeRange: string) => {
    if (timeRange === 'daily') {
      const date = new Date(dateKey + 'T00:00:00');
      const dayOfWeek = date.toLocaleDateString('en-US', { weekday: 'short' });
      const month = date.toLocaleDateString('en-US', { month: 'short' });
      const day = date.getDate();
      const year = date.getFullYear();
      return `${dayOfWeek} (${month}, ${day}, ${year})`;
    } else if (timeRange === 'weekly') {
      const date = new Date(dateKey + 'T00:00:00');
      const month = date.toLocaleDateString('en-US', { month: 'short' });
      const day = date.getDate();
      const year = date.getFullYear();
      return `(${month}, ${day}, ${year})`;
    } else { // monthly
      const [year, month] = dateKey.split('-');
      const monthName = new Date(parseInt(year), parseInt(month) - 1).toLocaleDateString('en-US', { month: 'long' });
      return `(${monthName}, ${year})`;
    }
  };

  const genderDistributionData = useMemo(() => {
    const genderCounts = users.reduce((acc, user) => {
      const gender = user.gender?.toLowerCase() || 'not specified';
      acc[gender] = (acc[gender] || 0) + 1;
      return acc;
    }, {} as { [key: string]: number });

    // Sort the keys to ensure consistent color assignment
    const sortedKeys = Object.keys(genderCounts).sort();
    const sortedData = sortedKeys.map(key => genderCounts[key]);

    return {
      labels: sortedKeys.map(g => g.charAt(0).toUpperCase() + g.slice(1)),
      datasets: [{
        data: sortedData,
        backgroundColor: sortedKeys.map(gender => {
          if (gender === 'male') return 'rgba(59, 130, 246, 0.8)';  // Blue for Male
          if (gender === 'female') return 'rgba(236, 72, 153, 0.8)';  // Pink for Female
          return 'rgba(255, 206, 86, 0.8)';  // Yellow for Not Specified
        }),
        borderColor: sortedKeys.map(gender => {
          if (gender === 'male') return 'rgba(59, 130, 246, 1)';
          if (gender === 'female') return 'rgba(236, 72, 153, 1)';
          return 'rgba(255, 206, 86, 1)';
        }),
        borderWidth: 1,
      }],
    };
  }, [users]);

  const anxietyLevelDistributionData = useMemo(() => {
    const anxietyCounts = Object.values(assessments).reduce((acc, userAssessments) => {
      if (userAssessments.length > 0) {
        // Group assessments by day and get the latest for each day
        const assessmentsByDay = userAssessments.reduce((dayGroups, assessment) => {
          const dateKey = getLocalDateKey(assessment.created_at);
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

        // Use the most recent assessment overall for the distribution
        const latestAssessment = [...latestAssessmentsPerDay].sort((a, b) =>
          new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
        )[0];
        
        const level = latestAssessment.anxiety_level.toLowerCase();
        acc[level] = (acc[level] || 0) + 1;
      }
      return acc;
    }, {} as { [key: string]: number });

    // Define custom order for anxiety levels
    const levelOrder = ['minimal', 'mild', 'moderate', 'severe'];
    const sortedKeys = levelOrder.filter(level => anxietyCounts[level] !== undefined);
    const sortedData = sortedKeys.map(key => anxietyCounts[key]);

    return {
      labels: sortedKeys.map(l => l.charAt(0).toUpperCase() + l.slice(1)),
      datasets: [{
        data: sortedData,
        backgroundColor: sortedKeys.map(level => {
          switch (level.toLowerCase()) {
            case 'minimal':
              return 'rgba(34, 197, 94, 0.8)';  // Green
            case 'mild':
              return 'rgba(59, 130, 246, 0.8)';  // Blue
            case 'moderate':
              return 'rgba(234, 179, 8, 0.8)';   // Yellow
            case 'severe':
              return 'rgba(239, 68, 68, 0.8)';   // Red
            default:
              return 'rgba(156, 163, 175, 0.8)'; // Gray
          }
        }),
        borderColor: sortedKeys.map(level => {
          switch (level.toLowerCase()) {
            case 'minimal':
              return 'rgba(34, 197, 94, 1)';  // Green
            case 'mild':
              return 'rgba(59, 130, 246, 1)';  // Blue
            case 'moderate':
              return 'rgba(234, 179, 8, 1)';   // Yellow
            case 'severe':
              return 'rgba(239, 68, 68, 1)';   // Red
            default:
              return 'rgba(156, 163, 175, 1)'; // Gray
          }
        }),
        borderWidth: 1,
      }],
    };
  }, [assessments]);

  const { labels: anxietyLabels, datasets: anxietyDatasets, totalPages, averagePercentageData } = useMemo(() => {
    const latestAssessments = Object.values(assessments)
      .map(userAssessments => {
        if (userAssessments.length > 0) {
          // Group assessments by day and get the latest for each day
          const assessmentsByDay = userAssessments.reduce((dayGroups, assessment) => {
            const dateKey = getLocalDateKey(assessment.created_at);
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

          // Return all latest assessments per day
          return latestAssessmentsPerDay;
        }
        return [];
      })
      .flat()
      .filter((assessment): assessment is Assessment => assessment !== null);

    const dateToKey = (date: Date) => {
      if (timeRange === 'daily') {
        return getLocalDateKey(date);
      } else if (timeRange === 'weekly') {
        const d = new Date(date);
        const day = d.getDay();
        const diff = d.getDate() - day + (day === 0 ? -6 : 1);
        const monday = new Date(d.setDate(diff));
        monday.setHours(0, 0, 0, 0);
        return getLocalDateKey(monday);
      } else { // monthly
        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      }
    };

    const counts = latestAssessments.reduce((acc, assessment) => {
      const date = new Date(assessment.created_at);
      const key = dateToKey(date);
      if (!acc[key]) {
        acc[key] = { minimal: 0, mild: 0, moderate: 0, severe: 0, sumPercentage: 0, numAssessments: 0 };
      }
      const level = assessment.anxiety_level.toLowerCase();
      if (level === 'minimal' || level === 'mild' || level === 'moderate' || level === 'severe') {
        acc[key][level]++;
      }
      acc[key].sumPercentage += assessment.percentage || 0;
      acc[key].numAssessments += 1;
      return acc;
    }, {} as Record<string, { minimal: number; mild: number; moderate: number; severe: number; sumPercentage: number; numAssessments: number }>);

    const sortedKeys = Object.keys(counts).sort();
    
    // Pagination logic - show only 7 items per page
    const ITEMS_PER_PAGE = 7;
    const totalPages = Math.ceil(sortedKeys.length / ITEMS_PER_PAGE);
    const startIndex = currentPage * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    const currentKeys = sortedKeys.slice(startIndex, endIndex);
    
    const labels = currentKeys.map(key => formatDateLabel(key, timeRange));
    const anxietyLevels: Array<'minimal' | 'mild' | 'moderate' | 'severe'> = ['minimal', 'mild', 'moderate', 'severe'];

    const levelColors: Record<'minimal' | 'mild' | 'moderate' | 'severe', string> = {
      minimal: 'rgba(34, 197, 94, 1)',
      mild: 'rgba(59, 130, 246, 1)',
      moderate: 'rgba(234, 179, 8, 1)',
      severe: 'rgba(239, 68, 68, 1)',
    };

    const datasets = anxietyLevels.map(level => ({
      label: level.charAt(0).toUpperCase() + level.slice(1),
      data: currentKeys.map(key => counts[key][level]),
      borderColor: levelColors[level],
      backgroundColor: levelColors[level].replace('1)', '0.8)'),
      borderWidth: 1,
    }));

    const averagePercentageData = currentKeys.map(key => {
      const entry = counts[key];
      return entry.numAssessments > 0 ? Number((entry.sumPercentage / entry.numAssessments).toFixed(1)) : 0;
    });

return { labels, datasets, totalPages, averagePercentageData };
}, [assessments, timeRange, currentPage]);

// Ensure we always show the latest page by default (e.g., after login/logout)
useEffect(() => {
  if (totalPages && totalPages > 0) {
    setCurrentPage(totalPages - 1);
  } else {
    setCurrentPage(0);
  }
}, [totalPages, timeRange]);

return (
    <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6 w-full px-0 md:px-0`}>
      {/* Appointment Calendar */}
      <AnimatedChartContainer delay={100} animationType="slideInUp">
        <div className={`${darkMode ? 'bg-gradient-to-br from-gray-800 to-gray-900' : 'bg-gradient-to-br from-white to-gray-50'} p-4 rounded-xl shadow-lg border-0 min-w-0 w-full backdrop-blur-sm`}>
          <div className="flex items-center space-x-3 mb-4">
            <FaCalendarAlt className={`w-4 h-4 ${darkMode ? 'text-indigo-400' : 'text-indigo-500'}`} />
            <h2 className={`text-lg font-bold bg-gradient-to-r ${darkMode ? 'from-indigo-400 to-purple-400' : 'from-indigo-600 to-purple-600'} bg-clip-text text-transparent`}>Appointment Calendar</h2>
          </div>
          <AppointmentCalendar appointments={appointments} darkMode={darkMode} />
        </div>
      </AnimatedChartContainer>

      {/* Gender Distribution Chart */}
      <AnimatedChartContainer delay={200} animationType="fadeInLeft">
        <div className={`${darkMode ? 'bg-gradient-to-br from-gray-800 to-gray-900' : 'bg-gradient-to-br from-white to-gray-50'} p-4 rounded-xl shadow-lg border-0 min-w-0 w-full relative backdrop-blur-sm`}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <FaUsers className={`w-4 h-4 ${darkMode ? 'text-pink-400' : 'text-pink-500'}`} />
              <h2 className={`text-lg font-bold bg-gradient-to-r ${darkMode ? 'from-pink-400 to-blue-400' : 'from-pink-600 to-blue-600'} bg-clip-text text-transparent`}>Gender Distribution</h2>
            </div>
            <div className="flex items-center gap-2">
              <div className="group relative">
                <FaInfoCircle className={`w-3 h-3 cursor-help ${darkMode ? 'text-gray-400 hover:text-gray-300' : 'text-gray-500 hover:text-gray-600'}`} />
                <div className={`absolute right-0 top-6 w-48 p-2 text-xs rounded-md shadow-lg opacity-0 group-hover:opacity-100 transition-all duration-300 transform scale-95 group-hover:scale-100 z-10 ${darkMode ? 'bg-gray-700 text-white border-gray-600' : 'bg-white text-gray-800 border-gray-200'} border`}>
                  Distribution of students by gender in the system
                </div>
              </div>
            </div>
          </div>
          <div className={`h-64 w-full min-w-0`}>
            <Pie data={genderDistributionData} options={{
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: {
                position: 'bottom',
                labels: {
                  padding: 8,
                  font: {
                    size: 10,
                    weight: 'bold'
                  },
                  usePointStyle: true,
                  pointStyle: 'circle'
                }
              },
              tooltip: {
                enabled: true,
                backgroundColor: darkMode ? 'rgba(31, 41, 55, 0.95)' : 'rgba(255, 255, 255, 0.95)',
                titleColor: darkMode ? '#fff' : '#000',
                bodyColor: darkMode ? '#fff' : '#000',
                borderColor: darkMode ? '#6B7280' : '#D1D5DB',
                borderWidth: 1,
                cornerRadius: 8,
                displayColors: true,
                callbacks: {
                  label: function(context: any) {
                    const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0);
                    const percentage = ((context.parsed / total) * 100).toFixed(1);
                    return `${context.label}: ${context.parsed} (${percentage}%)`;
                  }
                }
              }
            },
            cutout: '0%',
            interaction: {
              intersect: false,
              mode: 'index'
            }
            }} />
          </div>
          
          {/* Statistics summary below chart */}
          <div className={`mt-4 p-4 rounded-xl ${darkMode ? 'bg-gradient-to-r from-gray-700/50 to-gray-800/50' : 'bg-gradient-to-r from-blue-50/80 to-indigo-50/80'} border ${darkMode ? 'border-gray-600/50' : 'border-blue-200/50'} backdrop-blur-sm`}>
            <h3 className={`text-sm font-semibold mb-3 ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>Gender Distribution Summary</h3>
            <div className="grid grid-cols-2 gap-3">
              {genderDistributionData.labels.map((label, index) => (
                <div key={label} className={`flex flex-col p-3 rounded-lg transition-all duration-300 hover:scale-105 hover:shadow-md ${darkMode ? 'bg-gray-800/60 hover:bg-gray-800/80' : 'bg-white/70 hover:bg-white/90'} border ${darkMode ? 'border-gray-600/30' : 'border-gray-200/50'}`}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: genderDistributionData.datasets[0].backgroundColor[index] }}
                      ></div>
                      <span className={`text-sm font-medium ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>{label}</span>
                    </div>
                    <span className={`text-sm font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                      {genderDistributionData.datasets[0].data[index]}
                    </span>
                  </div>
                  <span className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Student gender data</span>
                </div>
              ))}
            </div>
            <div className={`mt-3 pt-3 border-t ${darkMode ? 'border-gray-600/50' : 'border-gray-300/50'}`}>
              <div className={`flex items-center justify-between p-1.5 rounded-lg ${darkMode ? 'bg-gradient-to-r from-indigo-900/40 to-purple-900/40' : 'bg-gradient-to-r from-indigo-100/80 to-purple-100/80'} border ${darkMode ? 'border-indigo-700/50' : 'border-indigo-300/50'}`}>
                <span className={`text-xs font-semibold ${darkMode ? 'text-indigo-300' : 'text-indigo-700'}`}>Total Students:</span>
                <span className={`text-xs font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                  {genderDistributionData.datasets[0].data.reduce((a, b) => a + b, 0)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </AnimatedChartContainer>

      {/* Anxiety Level Distribution Chart */}
      <AnimatedChartContainer delay={300} animationType="fadeInRight">
        <div className={`${darkMode ? 'bg-gradient-to-br from-gray-800 to-gray-900' : 'bg-gradient-to-br from-white to-gray-50'} p-4 rounded-xl shadow-lg border-0 min-w-0 w-full relative backdrop-blur-sm`}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <FaHeart className={`w-4 h-4 ${darkMode ? 'text-red-400' : 'text-red-500'}`} />
              <h2 className={`text-lg font-bold bg-gradient-to-r ${darkMode ? 'from-green-400 to-red-400' : 'from-green-600 to-red-600'} bg-clip-text text-transparent`}>Anxiety Level Distribution</h2>
            </div>
            <div className="flex items-center gap-2">
              <div className="group relative">
                <FaInfoCircle className={`w-3 h-3 cursor-help ${darkMode ? 'text-gray-400 hover:text-gray-300' : 'text-gray-500 hover:text-gray-600'}`} />
                <div className={`absolute right-0 top-6 w-56 p-2 text-xs rounded-md shadow-lg opacity-0 group-hover:opacity-100 transition-all duration-300 transform scale-95 group-hover:scale-100 z-10 ${darkMode ? 'bg-gray-700 text-white border-gray-600' : 'bg-white text-gray-800 border-gray-200'} border`}>
                  Current anxiety levels based on latest assessments. Hover over chart segments for detailed information.
                </div>
              </div>
            </div>
          </div>
          <div className={`h-64 w-full min-w-0`}>
            <Pie data={anxietyLevelDistributionData} options={{
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: {
                position: 'bottom',
                labels: {
                  padding: 8,
                  font: {
                    size: 10,
                    weight: 'bold'
                  },
                  usePointStyle: true,
                  pointStyle: 'circle'
                }
              },
              tooltip: {
                enabled: true,
                backgroundColor: darkMode ? 'rgba(31, 41, 55, 0.95)' : 'rgba(255, 255, 255, 0.95)',
                titleColor: darkMode ? '#fff' : '#000',
                bodyColor: darkMode ? '#fff' : '#000',
                borderColor: darkMode ? '#6B7280' : '#D1D5DB',
                borderWidth: 1,
                cornerRadius: 8,
                displayColors: true,
                callbacks: {
                  label: function(context: any) {
                    const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0);
                    const percentage = ((context.parsed / total) * 100).toFixed(1);
                    const level = context.label.toLowerCase();
                    let description = '';
                    switch(level) {
                      case 'minimal': description = 'Low anxiety levels'; break;
                      case 'mild': description = 'Slight anxiety symptoms'; break;
                      case 'moderate': description = 'Noticeable anxiety symptoms'; break;
                      case 'severe': description = 'High anxiety levels'; break;
                    }
                    return [`${context.label}: ${context.parsed} students (${percentage}%)`, description];
                  }
                }
              }
            },
            cutout: '0%',
            interaction: {
              intersect: false,
              mode: 'index'
            }
            }} />
          </div>
          
          {/* Statistics summary below chart */}
          <div className={`mt-4 p-4 rounded-xl ${darkMode ? 'bg-gradient-to-r from-gray-700/50 to-gray-800/50' : 'bg-gradient-to-r from-green-50/80 to-red-50/80'} border ${darkMode ? 'border-gray-600/50' : 'border-green-200/50'} backdrop-blur-sm`}>
            <h3 className={`text-sm font-semibold mb-3 ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>Anxiety Level Summary</h3>
            <div className="grid grid-cols-2 gap-3">
              {anxietyLevelDistributionData.labels.map((label, index) => {
                const level = label.toLowerCase();
                let description = '';
                switch(level) {
                  case 'minimal': description = 'Low anxiety'; break;
                  case 'mild': description = 'Slight symptoms'; break;
                  case 'moderate': description = 'Noticeable symptoms'; break;
                  case 'severe': description = 'High anxiety'; break;
                }
                return (
                  <div key={label} className={`flex flex-col p-3 rounded-lg transition-all duration-300 hover:scale-105 hover:shadow-md ${darkMode ? 'bg-gray-800/60 hover:bg-gray-800/80' : 'bg-white/70 hover:bg-white/90'} border ${darkMode ? 'border-gray-600/30' : 'border-gray-200/50'}`}>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: anxietyLevelDistributionData.datasets[0].backgroundColor[index] }}
                        ></div>
                        <span className={`text-sm font-medium ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>{label}</span>
                      </div>
                      <span className={`text-sm font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                        {anxietyLevelDistributionData.datasets[0].data[index]}
                      </span>
                    </div>
                    <span className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{description}</span>
                  </div>
                );
              })}
            </div>
            <div className={`mt-3 pt-3 border-t ${darkMode ? 'border-gray-600/50' : 'border-gray-300/50'}`}>
              <div className={`flex items-center justify-between p-1.5 rounded-lg ${darkMode ? 'bg-gradient-to-r from-indigo-900/40 to-purple-900/40' : 'bg-gradient-to-r from-indigo-100/80 to-purple-100/80'} border ${darkMode ? 'border-indigo-700/50' : 'border-indigo-300/50'}`}>
                <span className={`text-xs font-semibold ${darkMode ? 'text-indigo-300' : 'text-indigo-700'}`}>Total Assessments:</span>
                <span className={`text-xs font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                  {anxietyLevelDistributionData.datasets[0].data.reduce((a, b) => a + b, 0)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </AnimatedChartContainer>

      {/* Anxiety History Bar Chart */}
      <AnimatedChartContainer delay={400} animationType="zoomIn" className="lg:col-span-3">
        <div className={`${darkMode ? 'bg-gradient-to-br from-gray-800 to-gray-900' : 'bg-gradient-to-br from-white to-gray-50'} p-6 rounded-2xl shadow-xl border-0 min-w-0 w-full backdrop-blur-sm`}>
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-3">
              <FaChartLine className={`w-4 h-4 ${darkMode ? 'text-emerald-400' : 'text-emerald-500'}`} />
              <h2 className={`text-lg font-bold bg-gradient-to-r ${darkMode ? 'from-indigo-400 to-emerald-400' : 'from-indigo-600 to-emerald-600'} bg-clip-text text-transparent`}>Anxiety Level History</h2>
              <div className="group relative">
                <FaInfoCircle className={`w-3 h-3 cursor-help ${darkMode ? 'text-gray-400 hover:text-gray-300' : 'text-gray-500 hover:text-gray-600'}`} />
                <div className={`absolute left-0 top-6 w-64 p-2 text-xs rounded-md shadow-lg opacity-0 group-hover:opacity-100 transition-opacity z-10 ${darkMode ? 'bg-gray-700 text-white border-gray-600' : 'bg-white text-gray-800 border-gray-200'} border`}>
                  Track anxiety level trends over time. Use time range buttons to switch between daily, weekly, and monthly views. Navigate through pages using arrow buttons.
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex">
                <button
                  onClick={() => handleTimeRangeChange('daily')}
                  className={`px-4 py-2 text-xs font-semibold rounded-xl transition-all duration-300 transform hover:scale-110 hover:-translate-y-0.5 active:scale-95 ${
                    timeRange === 'daily' 
                      ? 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-lg' 
                      : darkMode ? 'bg-gray-700/50 hover:bg-gray-600/70 text-gray-300' : 'bg-gray-200/80 hover:bg-gray-300 text-gray-600'
                  }`}
                >
                  Daily
                </button>
                <button
                  onClick={() => handleTimeRangeChange('weekly')}
                  className={`ml-2 px-4 py-2 text-xs font-semibold rounded-xl transition-all duration-300 transform hover:scale-110 hover:-translate-y-0.5 active:scale-95 ${
                    timeRange === 'weekly' 
                      ? 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-lg' 
                      : darkMode ? 'bg-gray-700/50 hover:bg-gray-600/70 text-gray-300' : 'bg-gray-200/80 hover:bg-gray-300 text-gray-600'
                  }`}
                >
                  Weekly
                </button>
                <button
                  onClick={() => handleTimeRangeChange('monthly')}
                  className={`ml-2 px-4 py-2 text-xs font-semibold rounded-xl transition-all duration-300 transform hover:scale-110 hover:-translate-y-0.5 active:scale-95 ${
                    timeRange === 'monthly' 
                      ? 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-lg' 
                      : darkMode ? 'bg-gray-700/50 hover:bg-gray-600/70 text-gray-300' : 'bg-gray-200/80 hover:bg-gray-300 text-gray-600'
                  }`}
                >
                  Monthly
                </button>
              </div>
              
              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="flex items-center gap-2 ml-4">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 0))}
                    disabled={currentPage === 0}
                    className={`px-3 py-2 text-xs rounded-xl transition-all duration-300 transform hover:scale-110 hover:-translate-x-0.5 active:scale-95 ${
                      currentPage === 0
                        ? `${darkMode ? 'bg-gray-700/30 text-gray-500' : 'bg-gray-200/50 text-gray-400'} cursor-not-allowed opacity-50`
                        : `${darkMode ? 'bg-gray-600/50 hover:bg-gray-500/70 text-white' : 'bg-gray-300/80 hover:bg-gray-400 text-gray-700'} shadow-md hover:shadow-lg`
                    }`}
                    title="Previous page"
                  >
                    ←
                  </button>
                  <span className={`px-3 py-2 text-xs font-semibold rounded-xl ${darkMode ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30' : 'bg-indigo-100 text-indigo-700 border border-indigo-200'}`}>
                    {currentPage + 1} / {totalPages}
                  </span>
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages - 1))}
                    disabled={currentPage === totalPages - 1}
                    className={`px-3 py-2 text-xs rounded-xl transition-all duration-300 transform hover:scale-110 hover:translate-x-0.5 active:scale-95 ${
                      currentPage === totalPages - 1
                      ? `${darkMode ? 'bg-gray-700/30 text-gray-500' : 'bg-gray-200/50 text-gray-400'} cursor-not-allowed opacity-50`
                      : `${darkMode ? 'bg-gray-600/50 hover:bg-gray-500/70 text-white' : 'bg-gray-300/80 hover:bg-gray-400 text-gray-700'} shadow-md hover:shadow-lg`
                  }`}
                  title="Next page"
                >
                  →
                </button>
              </div>
            )}
            </div>
          </div>
          <div className={`h-72 w-full min-w-0`}>
            <Bar data={{ labels: anxietyLabels, datasets: anxietyDatasets }} options={{
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: {
                position: 'bottom',
                labels: {
                  padding: 8,
                  font: {
                    size: 10,
                    weight: 'bold'
                  },
                  usePointStyle: true,
                  pointStyle: 'rect'
                }
              },
              tooltip: {
                enabled: true,
                backgroundColor: darkMode ? 'rgba(31, 41, 55, 0.95)' : 'rgba(255, 255, 255, 0.95)',
                titleColor: darkMode ? '#fff' : '#000',
                bodyColor: darkMode ? '#fff' : '#000',
                borderColor: darkMode ? '#6B7280' : '#D1D5DB',
                borderWidth: 1,
                cornerRadius: 8,
                displayColors: true,
                callbacks: {
                  title: function(context: any) {
                    return `Date: ${context[0].label}`;
                  },
                  label: function(context: any) {
                    const level = context.dataset.label;
                    const count = context.parsed.y;
                    return `${level}: ${count} student${count !== 1 ? 's' : ''}`;
                  },
                  afterBody: function(context: any) {
                    const total = context.reduce((sum: number, item: any) => sum + item.parsed.y, 0);
                    return total > 0 ? `Total assessments: ${total}` : '';
                  }
                }
              }
            },
            scales: {
              x: {
                stacked: false,
                grid: {
                  color: darkMode ? 'rgba(75, 85, 99, 0.3)' : 'rgba(229, 231, 235, 0.8)'
                },
                ticks: {
                  color: darkMode ? '#D1D5DB' : '#6B7280',
                  font: {
                    size: 10
                  }
                }
              },
              y: {
                stacked: false,
                beginAtZero: true,
                grid: {
                  color: darkMode ? 'rgba(75, 85, 99, 0.3)' : 'rgba(229, 231, 235, 0.8)'
                },
                ticks: {
                  stepSize: 1,
                  color: darkMode ? '#D1D5DB' : '#6B7280',
                  font: {
                    size: 10
                  }
                },
                title: {
                  display: true,
                  text: 'Number of Students',
                  color: darkMode ? '#D1D5DB' : '#6B7280',
                  font: {
                    size: 11,
                    weight: 'bold'
                  }
                }
              }
            },
            interaction: {
              intersect: false,
              mode: 'index'
            }
            }} />
          </div>
        </div>
      </AnimatedChartContainer>

      {/* Anxiety History Line Chart (Average Percentage) */}
      <AnimatedChartContainer delay={500} animationType="bounceIn" className="lg:col-span-3">
        <div className={`${darkMode ? 'bg-gradient-to-br from-gray-800 to-gray-900' : 'bg-gradient-to-br from-white to-gray-50'} p-6 rounded-2xl shadow-xl border-0 min-w-0 w-full backdrop-blur-sm`}>
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-3">
              <FaChartLine className={`${darkMode ? 'text-blue-300' : 'text-blue-500'} w-4 h-4`} />
              <h2 className={`text-lg font-bold bg-gradient-to-r ${darkMode ? 'from-blue-300 to-indigo-400' : 'from-blue-600 to-indigo-600'} bg-clip-text text-transparent`}>Average Anxiety Percentage</h2>
              <div className="group relative">
                <FaInfoCircle className={`w-3 h-3 cursor-help ${darkMode ? 'text-gray-400 hover:text-gray-300' : 'text-gray-500 hover:text-gray-600'}`} />
                <div className={`absolute left-0 top-6 w-64 p-2 text-xs rounded-md shadow-lg opacity-0 group-hover:opacity-100 transition-opacity z-10 ${darkMode ? 'bg-gray-700 text-white border-gray-600' : 'bg-white text-gray-800 border-gray-200'} border`}>
                  Shows the average assessment percentage over time using the same time range and pages.
                </div>
              </div>
            </div>
          </div>
          <div className={`h-72 w-full min-w-0`}>
            <Line data={{
              labels: anxietyLabels,
              datasets: [
                {
                  label: 'Average %',
                  data: averagePercentageData,
                  borderColor: 'rgba(59, 130, 246, 1)',
                  backgroundColor: 'rgba(59, 130, 246, 0.2)',
                  pointBackgroundColor: darkMode ? '#93C5FD' : '#1D4ED8',
                  pointBorderColor: darkMode ? '#1F2937' : '#E5E7EB',
                  fill: true,
                  tension: 0.35,
                  borderWidth: 2,
                }
              ]
            }} options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: {
                  position: 'bottom',
                  labels: {
                    padding: 8,
                    font: { size: 10, weight: 'bold' },
                    usePointStyle: true,
                    pointStyle: 'line'
                  }
                },
                tooltip: {
                  enabled: true,
                  backgroundColor: darkMode ? 'rgba(31, 41, 55, 0.95)' : 'rgba(255, 255, 255, 0.95)',
                  titleColor: darkMode ? '#fff' : '#000',
                  bodyColor: darkMode ? '#fff' : '#000',
                  borderColor: darkMode ? '#6B7280' : '#D1D5DB',
                  borderWidth: 1,
                  cornerRadius: 8,
                  callbacks: {
                    label: function(context: any) {
                      const value = context.parsed.y;
                      return `Average: ${value}%`;
                    }
                  }
                }
              },
              scales: {
                x: {
                  grid: {
                    color: darkMode ? 'rgba(75, 85, 99, 0.3)' : 'rgba(229, 231, 235, 0.8)'
                  },
                  ticks: {
                    color: darkMode ? '#D1D5DB' : '#6B7280',
                    font: { size: 10 }
                  }
                },
                y: {
                  beginAtZero: true,
                  max: 100,
                  grid: {
                    color: darkMode ? 'rgba(75, 85, 99, 0.3)' : 'rgba(229, 231, 235, 0.8)'
                  },
                  ticks: {
                    stepSize: 10,
                    color: darkMode ? '#D1D5DB' : '#6B7280',
                    font: { size: 10 },
                    callback: function(value: number | string) { return `${value}%`; }
                  },
                  title: {
                    display: true,
                    text: 'Average %',
                    color: darkMode ? '#D1D5DB' : '#6B7280',
                    font: { size: 11, weight: 'bold' }
                  }
                }
              },
              interaction: { intersect: false, mode: 'index' }
            }} />
          </div>
        </div>
      </AnimatedChartContainer>
      
      {/* Print Button - Aligned with charts container */}
      <AnimatedChartContainer delay={600} animationType="fadeInDown">
        <div className="mt-6 justify-end w-full">
          <button
            onClick={() => window.print()}
            className={`px-6 py-3 rounded-xl font-semibold transition-all duration-300 transform hover:scale-110 hover:-translate-y-1 active:scale-95 bg-gradient-to-r from-[#800000] to-[#8B0000] hover:from-[#8B0000] hover:to-[#A0522D] text-white shadow-lg hover:shadow-2xl hover:shadow-red-900/25 flex items-center gap-2`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
            Print Report
          </button>
        </div>
      </AnimatedChartContainer>
    </div>
  );
} 