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

interface AdminChartsProps {
  users: UserProfile[];
  assessments: { [key: string]: Assessment[] };
  darkMode?: boolean;
  compact?: boolean;
}

export default function AdminCharts(props: AdminChartsProps) {
  const {
    users,
    assessments,
    darkMode = false,
    // compact = false,
  } = props;

  const [timeRange, setTimeRange] = useState('daily');

  const getLocalDateKey = (dateInput: string | Date) => {
    const dateObj = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
    return dateObj.getFullYear() + '-' +
      String(dateObj.getMonth() + 1).padStart(2, '0') + '-' +
      String(dateObj.getDate()).padStart(2, '0');
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

  const anxietyHistoryData = useMemo(() => {
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
    const labels = timeRange === 'daily'
      ? sortedKeys.map(key => {
          // By appending T00:00:00, we ensure the date is parsed in the local timezone,
          // preventing potential day shifts when converting from UTC.
          const date = new Date(key + 'T00:00:00');
          const dayOfWeek = date.toLocaleDateString('en-US', { weekday: 'short' });
          return `${dayOfWeek} (${key})`;
        })
      : sortedKeys;
    const anxietyLevels: Array<keyof typeof counts[string]> = ['minimal', 'mild', 'moderate', 'severe'];

    const levelColors: Record<keyof typeof counts[string], string> = {
      minimal: 'rgba(34, 197, 94, 1)',
      mild: 'rgba(59, 130, 246, 1)',
      moderate: 'rgba(234, 179, 8, 1)',
      severe: 'rgba(239, 68, 68, 1)',
    };

    const datasets = anxietyLevels.map(level => ({
      label: level.charAt(0).toUpperCase() + level.slice(1),
      data: sortedKeys.map(key => counts[key][level]),
      borderColor: levelColors[level],
      backgroundColor: levelColors[level].replace('1)', '0.8)'),
      borderWidth: 1,
    }));

    return { labels, datasets };
  }, [assessments, timeRange]);

  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 gap-4 mb-4 w-full px-0 md:px-0`}>
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
      <div className={`md:col-span-2 ${darkMode ? 'bg-gray-800 text-gray-100' : 'bg-white text-gray-800'} p-3 rounded-md shadow min-w-0 w-full`}>
        <div className="flex justify-between items-center mb-2">
          <h2 className={`text-sm font-semibold ${darkMode ? 'text-gray-100' : 'text-gray-800'}`}>Anxiety Level History</h2>
          <div>
            <button
              onClick={() => setTimeRange('daily')}
              className={`px-2 py-1 text-xs rounded ${timeRange === 'daily' ? 'bg-blue-500 text-white' : (darkMode ? 'bg-gray-700' : 'bg-gray-200')}`}
            >
              Daily
            </button>
            <button
              onClick={() => setTimeRange('weekly')}
              className={`ml-2 px-2 py-1 text-xs rounded ${timeRange === 'weekly' ? 'bg-blue-500 text-white' : (darkMode ? 'bg-gray-700' : 'bg-gray-200')}`}
            >
              Weekly
            </button>
            <button
              onClick={() => setTimeRange('monthly')}
              className={`ml-2 px-2 py-1 text-xs rounded ${timeRange === 'monthly' ? 'bg-blue-500 text-white' : (darkMode ? 'bg-gray-700' : 'bg-gray-200')}`}
            >
              Monthly
            </button>
          </div>
        </div>
        <div className={`h-72 w-full min-w-0`}>
          <Bar data={anxietyHistoryData} options={{
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