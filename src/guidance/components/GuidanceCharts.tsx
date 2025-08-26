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
import { Pie, Bar } from 'react-chartjs-2';
import { useState, useMemo } from 'react';
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa';
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
    <div className={`p-3 rounded-lg border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
      {/* Calendar Header */}
      <div className="flex items-center justify-between mb-3">
        <h3 className={`text-base font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
          {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
        </h3>
        <div className="flex items-center space-x-1">
          <button
            onClick={goToPreviousMonth}
            className={`p-1.5 rounded-md transition-colors ${darkMode ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-100 text-gray-600'}`}
          >
            <FaChevronLeft className="w-3 h-3" />
          </button>
          <button
            onClick={goToToday}
            className={`px-2 py-1 text-xs rounded-md transition-colors ${darkMode ? 'bg-indigo-600 hover:bg-indigo-700 text-white' : 'bg-indigo-500 hover:bg-indigo-600 text-white'}`}
          >
            Today
          </button>
          <button
            onClick={goToNextMonth}
            className={`p-1.5 rounded-md transition-colors ${darkMode ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-100 text-gray-600'}`}
          >
            <FaChevronRight className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-0.5">
        {/* Day Headers */}
        {dayNames.map(day => (
          <div
            key={day}
            className={`p-1 text-center text-xs font-medium ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}
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
              className={`relative p-1 min-h-[40px] border rounded-md transition-all cursor-pointer ${
                darkMode 
                  ? 'border-gray-700 hover:bg-gray-700' 
                  : 'border-gray-200 hover:bg-gray-50'
              } ${
                !isCurrentMonth(date) 
                  ? darkMode ? 'text-gray-600' : 'text-gray-400'
                  : ''
              }`}
              onClick={() => {
                if (hasAppointments) {
                  setSelectedDate(date);
                  setShowModal(true);
                }
              }}
              title={hasAppointments ? `View appointments for ${getLocalDateString(date)}` : undefined}
            >
              {/* Date Number */}
              <div className={`text-xs font-medium ${
                isToday(date) 
                  ? 'text-white bg-indigo-500 rounded-full w-5 h-5 flex items-center justify-center mx-auto mb-0.5'
                  : ''
              }`}>
                {date.getDate()}
              </div>
              {/* Appointment Count */}
              {hasAppointments && (
                <div className="absolute bottom-0.5 left-1/2 transform -translate-x-1/2">
                  <div className={`flex items-center justify-center w-4 h-4 rounded-full text-xs font-bold ${
                    appointmentCount >= 5 
                      ? 'bg-red-500 text-white' 
                      : appointmentCount >= 3 
                        ? 'bg-yellow-500 text-white' 
                        : 'bg-green-500 text-white'
                  }`}>
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
        <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-md bg-black/10">
          <div className={`rounded-2xl shadow-2xl p-4 w-full max-w-xs border ${darkMode ? 'bg-gray-900 text-white border-gray-700' : 'bg-white text-gray-900 border-gray-200'}`}
            style={{ minWidth: '270px', maxWidth: '320px' }}>
            <h3 className="text-base font-bold mb-2 text-center">Appointments for <span className="text-indigo-600">{getLocalDateString(selectedDate)}</span></h3>
            <ul className="space-y-2">
              {getAppointmentsForDate(selectedDate).map((app, idx) => (
                <li key={app.id || idx} className={`p-2 rounded-lg border flex flex-col gap-1 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'}`}> 
                  <div className="font-semibold text-[#800000] text-sm">{app.student_name}</div>
                  <div className="text-xs text-gray-500">{app.student_email}</div>
                  <div className="text-xs"><span className="font-medium text-gray-600">Time:</span> <span className="text-indigo-600 font-semibold">{app.appointment_time}</span></div>
                  <div className="text-xs"><span className="font-medium text-gray-600">Status:</span> <span className={`font-semibold ${app.status === 'Completed' ? 'text-green-600' : app.status === 'Canceled' ? 'text-red-600' : 'text-blue-600'}`}>{app.status}</span></div>
                  {app.notes && <div className="text-xs text-gray-700"><span className="font-medium">Notes:</span> {app.notes}</div>}
                </li>
              ))}
            </ul>
            <button
              className="mt-4 w-full py-1.5 rounded-lg font-semibold transition-colors text-sm"
              style={{ background: '#800000', color: '#fff', border: 'none' }}
              onClick={() => setShowModal(false)}
            >
              Close
            </button>
          </div>
        </div>
      )}
      <div className="flex items-center justify-center mt-3 space-x-3 text-xs">
        <div className="flex items-center space-x-1">
          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
          <span className={darkMode ? 'text-gray-300' : 'text-gray-600'}>1-2</span>
        </div>
        <div className="flex items-center space-x-1">
          <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
          <span className={darkMode ? 'text-gray-300' : 'text-gray-600'}>3-4</span>
        </div>
        <div className="flex items-center space-x-1">
          <div className="w-2 h-2 bg-red-500 rounded-full"></div>
          <span className={darkMode ? 'text-gray-300' : 'text-gray-600'}>5+</span>
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
    const [currentPage, setCurrentPage] = useState(timeRange === 'daily' ? 1 : 0);

  // Reset to first page when time range changes
  const handleTimeRangeChange = (newTimeRange: string) => {
    setTimeRange(newTimeRange);
      setCurrentPage(newTimeRange === 'daily' ? 1 : 0);
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

    // Sort the keys to ensure consistent color assignment
    const sortedKeys = Object.keys(anxietyCounts).sort();
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

  const { labels: anxietyLabels, datasets: anxietyDatasets, totalPages } = useMemo(() => {
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
        acc[key] = { minimal: 0, mild: 0, moderate: 0, severe: 0 };
      }
      const level = assessment.anxiety_level.toLowerCase();
      if (level in acc[key]) {
        acc[key][level as keyof typeof acc[string]]++;
      }
      return acc;
    }, {} as Record<string, { minimal: number; mild: number; moderate: number; severe: number }>);

    const sortedKeys = Object.keys(counts).sort();
    
    // Pagination logic - show only 7 items per page
    const ITEMS_PER_PAGE = 7;
    const totalPages = Math.ceil(sortedKeys.length / ITEMS_PER_PAGE);
    const startIndex = currentPage * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    const currentKeys = sortedKeys.slice(startIndex, endIndex);
    
    const labels = currentKeys.map(key => formatDateLabel(key, timeRange));
    const anxietyLevels: Array<keyof typeof counts[string]> = ['minimal', 'mild', 'moderate', 'severe'];

    const levelColors: Record<keyof typeof counts[string], string> = {
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

    return { labels, datasets, totalPages };
  }, [assessments, timeRange, currentPage]);

  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4 w-full px-0 md:px-0`}>
      {/* Appointment Calendar */}
      <div className={`${darkMode ? 'bg-gray-800 text-gray-100' : 'bg-white text-gray-800'} p-3 rounded-md shadow min-w-0 w-full`}>
        <h2 className={`text-sm font-semibold mb-3 ${darkMode ? 'text-gray-100' : 'text-gray-800'}`}>Appointment Calendar</h2>
        <AppointmentCalendar appointments={appointments} darkMode={darkMode} />
      </div>

      {/* Gender Distribution Chart */}
      <div className={`${darkMode ? 'bg-gray-800 text-gray-100' : 'bg-white text-gray-800'} p-3 rounded-md shadow min-w-0 w-full relative`}>
        <h2 className={`text-sm font-semibold mb-1 ${darkMode ? 'text-gray-100' : 'text-gray-800'}`}>Gender Distribution</h2>
        <div className={`h-60 w-full min-w-0`}>
          <Pie data={genderDistributionData} options={{
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: {
                position: 'bottom',
                labels: {
                  padding: 8,
                  font: {
                    size: 9,
                    weight: 'bold'
                  }
                }
              }
            },
            cutout: '0%'
          }} />
        </div>
        {/* Statistics summary */}
        <div className={`absolute top-1/2 left-2 transform -translate-y-1/2 p-2 rounded-md ${darkMode ? 'bg-gray-700/90' : 'bg-white/90'} backdrop-blur-sm border ${darkMode ? 'border-gray-600' : 'border-gray-200'} shadow-lg`}>
          <div className="space-y-1 text-xs">
            {genderDistributionData.labels.map((label, index) => (
              <div key={label} className={`flex items-center justify-between gap-2 ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                <span className="font-medium">{label}:</span>
                <span className={`font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                  {genderDistributionData.datasets[0].data[index]}
                </span>
              </div>
            ))}
            <div className={`pt-1 border-t ${darkMode ? 'border-gray-600' : 'border-gray-200'}`}>
              <div className={`flex items-center justify-between gap-2 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                <span className="font-medium">Total:</span>
                <span className={`font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                  {genderDistributionData.datasets[0].data.reduce((a, b) => a + b, 0)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Anxiety Level Distribution Chart */}
      <div className={`${darkMode ? 'bg-gray-800 text-gray-100' : 'bg-white text-gray-800'} p-3 rounded-md shadow min-w-0 w-full relative`}>
        <h2 className={`text-sm font-semibold mb-1 ${darkMode ? 'text-gray-100' : 'text-gray-800'}`}>Anxiety Level Distribution</h2>
        <div className={`h-60 w-full min-w-0`}>
          <Pie data={anxietyLevelDistributionData} options={{
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: {
                position: 'bottom',
                labels: {
                  padding: 8,
                  font: {
                    size: 9,
                    weight: 'bold'
                  }
                }
              }
            },
            cutout: '0%'
          }} />
        </div>
        {/* Statistics summary */}
        <div className={`absolute top-1/2 left-2 transform -translate-y-1/2 p-2 rounded-md ${darkMode ? 'bg-gray-700/90' : 'bg-white/90'} backdrop-blur-sm border ${darkMode ? 'border-gray-600' : 'border-gray-200'} shadow-lg`}>
          <div className="space-y-1 text-xs">
            {anxietyLevelDistributionData.labels.map((label, index) => (
              <div key={label} className={`flex items-center justify-between gap-2 ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                <span className="font-medium">{label}:</span>
                <span className={`font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                  {anxietyLevelDistributionData.datasets[0].data[index]}
                </span>
              </div>
            ))}
            <div className={`pt-1 border-t ${darkMode ? 'border-gray-600' : 'border-gray-200'}`}>
              <div className={`flex items-center justify-between gap-2 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                <span className="font-medium">Total:</span>
                <span className={`font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                  {anxietyLevelDistributionData.datasets[0].data.reduce((a, b) => a + b, 0)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Anxiety History Bar Chart */}
      <div className={`lg:col-span-3 ${darkMode ? 'bg-gray-800 text-gray-100' : 'bg-white text-gray-800'} p-3 rounded-md shadow min-w-0 w-full`}>
        <div className="flex justify-between items-center mb-2">
          <h2 className={`text-sm font-semibold ${darkMode ? 'text-gray-100' : 'text-gray-800'}`}>Anxiety Level History</h2>
          <div className="flex items-center gap-2">
            <div className="flex">
            <button
                onClick={() => handleTimeRangeChange('daily')}
              className={`px-2 py-1 text-xs rounded ${timeRange === 'daily' ? 'bg-blue-500 text-white' : (darkMode ? 'bg-gray-700' : 'bg-gray-200')}`}
            >
              Daily
            </button>
            <button
                onClick={() => handleTimeRangeChange('weekly')}
              className={`ml-2 px-2 py-1 text-xs rounded ${timeRange === 'weekly' ? 'bg-blue-500 text-white' : (darkMode ? 'bg-gray-700' : 'bg-gray-200')}`}
            >
              Weekly
            </button>
            <button
                onClick={() => handleTimeRangeChange('monthly')}
              className={`ml-2 px-2 py-1 text-xs rounded ${timeRange === 'monthly' ? 'bg-blue-500 text-white' : (darkMode ? 'bg-gray-700' : 'bg-gray-200')}`}
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
                  className={`px-2 py-1 text-xs rounded transition-colors ${
                    currentPage === 0
                      ? `${darkMode ? 'bg-gray-700 text-gray-400' : 'bg-gray-200 text-gray-400'} cursor-not-allowed`
                      : `${darkMode ? 'bg-gray-600 hover:bg-gray-500 text-white' : 'bg-gray-300 hover:bg-gray-400 text-gray-700'}`
                  }`}
                  title="Previous page"
                >
                  ←
                </button>
                <span className={`text-xs ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                  {currentPage + 1} / {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages - 1))}
                  disabled={currentPage === totalPages - 1}
                  className={`px-2 py-1 text-xs rounded transition-colors ${
                    currentPage === totalPages - 1
                      ? `${darkMode ? 'bg-gray-700 text-gray-400' : 'bg-gray-200 text-gray-400'} cursor-not-allowed`
                      : `${darkMode ? 'bg-gray-600 hover:bg-gray-500 text-white' : 'bg-gray-300 hover:bg-gray-400 text-gray-700'}`
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
                    size: 9,
                    weight: 'bold'
                  }
                }
              }
            },
            scales: {
              x: {
                stacked: false,
              },
              y: {
                stacked: false,
                beginAtZero: true,
                ticks: {
                  stepSize: 1
                }
              }
            }
          }} />
        </div>
      </div>
    </div>
  );
} 