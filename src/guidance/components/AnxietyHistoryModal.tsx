import { useContext, useEffect } from 'react';
import { ThemeContext } from '../../App';
import { FaTimes, FaChartLine, FaCalendarAlt, FaArrowUp, FaArrowDown, FaExclamationTriangle } from 'react-icons/fa';

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

type AnxietyHistoryModalProps = {
  isOpen: boolean;
  onClose: () => void;
  userName: string;
  assessments: Assessment[];
};

const getAnxietyLevelColor = (level: string) => {
  switch (level.toLowerCase()) {
    case 'minimal':
      return {
        gradient: 'from-green-500 to-emerald-600',
        bg: 'bg-green-50',
        text: 'text-green-700',
        border: 'border-green-200',
        darkBg: 'bg-green-900/40',
        darkText: 'text-green-300',
        darkBorder: 'border-green-700'
      };
    case 'mild':
      return {
        gradient: 'from-blue-500 to-indigo-600',
        bg: 'bg-blue-50',
        text: 'text-blue-700',
        border: 'border-blue-200',
        darkBg: 'bg-blue-900/40',
        darkText: 'text-blue-300',
        darkBorder: 'border-blue-700'
      };
    case 'moderate':
      return {
        gradient: 'from-yellow-500 to-orange-600',
        bg: 'bg-yellow-50',
        text: 'text-yellow-700',
        border: 'border-yellow-200',
        darkBg: 'bg-yellow-900/40',
        darkText: 'text-yellow-300',
        darkBorder: 'border-yellow-700'
      };
    case 'severe':
      return {
        gradient: 'from-red-500 to-rose-600',
        bg: 'bg-red-50',
        text: 'text-red-700',
        border: 'border-red-200',
        darkBg: 'bg-red-900/40',
        darkText: 'text-red-300',
        darkBorder: 'border-red-700'
      };
    default:
      return {
        gradient: 'from-gray-500 to-gray-600',
        bg: 'bg-gray-50',
        text: 'text-gray-700',
        border: 'border-gray-200',
        darkBg: 'bg-gray-900/40',
        darkText: 'text-gray-300',
        darkBorder: 'border-gray-700'
      };
  }
};

const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  const options: Intl.DateTimeFormatOptions = { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  };
  return date.toLocaleDateString('en-US', options);
};

export default function AnxietyHistoryModal({ isOpen, onClose, userName, assessments }: AnxietyHistoryModalProps) {
  const { darkMode } = useContext(ThemeContext);

  // Prevent background scrolling when modal is open
  useEffect(() => {
    if (isOpen) {
      // Save current scroll position
      const scrollY = window.scrollY;
      
      // Lock body scroll
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = '100%';
      document.body.style.overflow = 'hidden';
    } else {
      // Restore scroll position
      const scrollY = document.body.style.top;
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.width = '';
      document.body.style.overflow = '';
      
      // Restore the scroll position
      if (scrollY) {
        window.scrollTo(0, parseInt(scrollY || '0') * -1);
      }
    }

    // Cleanup function to restore scrolling when component unmounts
    return () => {
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.width = '';
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  // Sort assessments by date (most recent first)
  const sortedAssessments = [...assessments].sort((a, b) => 
    new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  // Calculate statistics
  const totalAssessments = sortedAssessments.length;
  const averagePercentage = totalAssessments > 0 
    ? Math.round(sortedAssessments.reduce((sum, a) => sum + a.percentage, 0) / totalAssessments)
    : 0;
  const latestLevel = sortedAssessments[0]?.anxiety_level || 'N/A';

  // Level distribution
  const levelCounts = sortedAssessments.reduce((acc, assessment) => {
    const level = assessment.anxiety_level.toLowerCase();
    acc[level] = (acc[level] || 0) + 1;
    return acc;
  }, {} as { [key: string]: number });

  const levels = ['minimal', 'mild', 'moderate', 'severe'];

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm overflow-hidden"
      onClick={onClose}
    >
      <div 
        className={`relative w-full max-w-3xl max-h-[85vh] overflow-hidden rounded-2xl shadow-2xl ${
          darkMode ? 'bg-gradient-to-br from-gray-800 to-gray-900' : 'bg-gradient-to-br from-white to-gray-50'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className={`sticky top-0 z-10 px-6 py-4 border-b ${
          darkMode ? 'bg-gray-800/95 border-gray-700' : 'bg-white/95 border-gray-200'
        } backdrop-blur-sm`}>
          <div className="flex items-center justify-between">
            <div>
              <h2 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                Anxiety Assessment History
              </h2>
              <p className={`text-sm mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                {userName}
              </p>
            </div>
            <button
              onClick={onClose}
              className={`p-2 rounded-xl transition-all duration-200 hover:scale-110 ${
                darkMode 
                  ? 'bg-gray-700 hover:bg-gray-600 text-gray-300' 
                  : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
              }`}
              title="Close"
            >
              <FaTimes className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(85vh-80px)] p-6 space-y-6" style={{
          scrollbarWidth: 'thin',
          scrollbarColor: darkMode ? '#4b5563 #1f2937' : '#d1d5db #f3f4f6'
        }}>
          {/* Summary Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Total Assessments */}
            <div className={`rounded-2xl p-4 shadow-lg border ${
              darkMode 
                ? 'bg-gradient-to-br from-indigo-900/30 to-purple-900/30 border-indigo-700/40' 
                : 'bg-gradient-to-br from-indigo-50 to-purple-50 border-indigo-200'
            }`}>
              <div className="flex items-center space-x-3">
                <div className={`p-3 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg`}>
                  <FaChartLine className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className={`text-xs font-medium ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    Total Assessments
                  </p>
                  <p className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    {totalAssessments}
                  </p>
                </div>
              </div>
            </div>

            {/* Average Percentage */}
            <div className={`rounded-2xl p-4 shadow-lg border ${
              darkMode 
                ? 'bg-gradient-to-br from-blue-900/30 to-cyan-900/30 border-blue-700/40' 
                : 'bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-200'
            }`}>
              <div className="flex items-center space-x-3">
                <div className={`p-3 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-600 shadow-lg`}>
                  <FaCalendarAlt className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className={`text-xs font-medium ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    Average Score
                  </p>
                  <p className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    {averagePercentage}%
                  </p>
                </div>
              </div>
            </div>

            {/* Current Level */}
            <div className={`rounded-2xl p-4 shadow-lg border ${
              darkMode 
                ? `bg-gradient-to-br ${getAnxietyLevelColor(latestLevel).darkBg} ${getAnxietyLevelColor(latestLevel).darkBorder}` 
                : `bg-gradient-to-br ${getAnxietyLevelColor(latestLevel).bg} ${getAnxietyLevelColor(latestLevel).border}`
            }`}>
              <div className="flex items-center space-x-3">
                <div className={`p-3 rounded-xl bg-gradient-to-br ${getAnxietyLevelColor(latestLevel).gradient} shadow-lg`}>
                  <FaExclamationTriangle className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className={`text-xs font-medium ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    Current Level
                  </p>
                  <p className={`text-lg font-bold ${
                    darkMode ? getAnxietyLevelColor(latestLevel).darkText : getAnxietyLevelColor(latestLevel).text
                  }`}>
                    {latestLevel}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Level Distribution */}
          <div className={`rounded-2xl p-5 shadow-lg border ${
            darkMode 
              ? 'bg-gray-800/50 border-gray-700' 
              : 'bg-white border-gray-200'
          }`}>
            <h3 className={`text-base font-bold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              Level Distribution
            </h3>
            <div className="space-y-3">
              {levels.map(level => {
                const count = levelCounts[level] || 0;
                const percentage = totalAssessments > 0 ? Math.round((count / totalAssessments) * 100) : 0;
                const colors = getAnxietyLevelColor(level);
                
                return (
                  <div key={level}>
                    <div className="flex items-center justify-between mb-1">
                      <span className={`text-sm font-medium capitalize ${
                        darkMode ? colors.darkText : colors.text
                      }`}>
                        {level}
                      </span>
                      <span className={`text-xs font-semibold ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        {count} ({percentage}%)
                      </span>
                    </div>
                    <div className={`w-full h-2 rounded-full overflow-hidden ${
                      darkMode ? 'bg-gray-700' : 'bg-gray-200'
                    }`}>
                      <div 
                        className={`h-full bg-gradient-to-r ${colors.gradient} transition-all duration-500`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Assessment Timeline */}
          <div className={`rounded-2xl p-5 shadow-lg border ${
            darkMode 
              ? 'bg-gray-800/50 border-gray-700' 
              : 'bg-white border-gray-200'
          }`}>
            <h3 className={`text-base font-bold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              Assessment Timeline
            </h3>
            <div className="space-y-3">
              {sortedAssessments.map((assessment, index) => {
                const colors = getAnxietyLevelColor(assessment.anxiety_level);
                const isLatest = index === 0;
                
                // Calculate trend
                let trend = null;
                if (index < sortedAssessments.length - 1) {
                  const prevPercentage = sortedAssessments[index + 1].percentage;
                  const diff = assessment.percentage - prevPercentage;
                  trend = {
                    direction: diff > 0 ? 'up' : diff < 0 ? 'down' : 'same',
                    value: Math.abs(diff)
                  };
                }

                return (
                  <div 
                    key={assessment.id}
                    className={`relative rounded-xl p-4 border-2 transition-all duration-200 hover:shadow-lg ${
                      darkMode 
                        ? `${colors.darkBg} ${colors.darkBorder} hover:border-opacity-80` 
                        : `${colors.bg} ${colors.border} hover:border-opacity-80`
                    }`}
                  >
                    {isLatest && (
                      <div className={`absolute -top-2 -right-2 px-3 py-1 rounded-full text-xs font-bold shadow-lg bg-gradient-to-r ${colors.gradient} text-white`}>
                        Latest
                      </div>
                    )}
                    
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-3 flex-1">
                        {/* Number Badge */}
                        <div className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm bg-gradient-to-br ${colors.gradient} text-white shadow-md`}>
                          {index + 1}
                        </div>
                        
                        <div className="flex-1">
                          {/* Level and Date */}
                          <div className="flex items-center justify-between mb-2">
                            <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                              darkMode 
                                ? `${colors.darkBg} ${colors.darkText} border ${colors.darkBorder}` 
                                : `${colors.bg} ${colors.text} border ${colors.border}`
                            }`}>
                              {assessment.anxiety_level}
                            </span>
                            <span className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                              {formatDate(assessment.created_at)}
                            </span>
                          </div>
                          
                          {/* Score and Progress Bar */}
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <span className={`text-sm font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                                Score: {assessment.percentage}%
                              </span>
                              {trend && trend.direction !== 'same' && (
                                <div className={`flex items-center space-x-1 text-xs font-medium ${
                                  trend.direction === 'up' 
                                    ? 'text-red-500' 
                                    : 'text-green-500'
                                }`}>
                                  {trend.direction === 'up' ? (
                                    <FaArrowUp className="w-3 h-3" />
                                  ) : (
                                    <FaArrowDown className="w-3 h-3" />
                                  )}
                                  <span>{trend.value}%</span>
                                </div>
                              )}
                            </div>
                            <div className={`w-full h-2 rounded-full overflow-hidden ${
                              darkMode ? 'bg-gray-700' : 'bg-gray-200'
                            }`}>
                              <div 
                                className={`h-full bg-gradient-to-r ${colors.gradient} transition-all duration-500`}
                                style={{ width: `${assessment.percentage}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Action Alerts for High-Risk Cases */}
          {(latestLevel.toLowerCase() === 'moderate' || latestLevel.toLowerCase() === 'severe') && (
            <div className={`rounded-2xl p-5 shadow-lg border-2 ${
              latestLevel.toLowerCase() === 'severe'
                ? darkMode 
                  ? 'bg-gradient-to-br from-red-900/30 to-rose-900/30 border-red-600/50' 
                  : 'bg-gradient-to-br from-red-50 to-rose-50 border-red-300'
                : darkMode 
                  ? 'bg-gradient-to-br from-yellow-900/30 to-orange-900/30 border-yellow-600/50' 
                  : 'bg-gradient-to-br from-yellow-50 to-orange-50 border-yellow-300'
            }`}>
              <div className="flex items-start space-x-3">
                <div className={`flex-shrink-0 p-3 rounded-xl ${
                  latestLevel.toLowerCase() === 'severe'
                    ? 'bg-gradient-to-br from-red-500 to-rose-600'
                    : 'bg-gradient-to-br from-yellow-500 to-orange-600'
                } shadow-lg`}>
                  <FaExclamationTriangle className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1">
                  <h4 className={`text-sm font-bold mb-2 ${
                    darkMode 
                      ? latestLevel.toLowerCase() === 'severe' ? 'text-red-300' : 'text-yellow-300'
                      : latestLevel.toLowerCase() === 'severe' ? 'text-red-800' : 'text-yellow-800'
                  }`}>
                    {latestLevel.toLowerCase() === 'severe' ? '⚠️ IMMEDIATE ACTION REQUIRED' : '⚠️ ATTENTION NEEDED'}
                  </h4>
                  <p className={`text-xs mb-3 ${
                    darkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    This student requires immediate attention. Recommended actions:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <span className={`px-3 py-1.5 rounded-lg text-xs font-medium ${
                      darkMode ? 'bg-gray-800/50 text-gray-200' : 'bg-white text-gray-800'
                    } shadow-sm`}>
                      📅 Schedule counseling session
                    </span>
                    <span className={`px-3 py-1.5 rounded-lg text-xs font-medium ${
                      darkMode ? 'bg-gray-800/50 text-gray-200' : 'bg-white text-gray-800'
                    } shadow-sm`}>
                      📞 Contact student immediately
                    </span>
                    <span className={`px-3 py-1.5 rounded-lg text-xs font-medium ${
                      darkMode ? 'bg-gray-800/50 text-gray-200' : 'bg-white text-gray-800'
                    } shadow-sm`}>
                      👁️ Monitor closely
                    </span>
                    {latestLevel.toLowerCase() === 'severe' && (
                      <span className={`px-3 py-1.5 rounded-lg text-xs font-medium ${
                        darkMode ? 'bg-red-900/50 text-red-200' : 'bg-red-100 text-red-800'
                      } shadow-sm`}>
                        🏥 Consider psychiatric referral
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
