import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaTimes, FaChartLine, FaCalendarAlt, FaSpinner, FaArrowUp, FaArrowDown, FaEquals } from 'react-icons/fa';
import { supabase } from '../../lib/supabase';

interface AnxietyAssessment {
  id: string;
  total_score: number;
  percentage: number;
  anxiety_level: string;
  answers: number[];
  created_at: string;
  updated_at: string;
}

interface AssessmentRecordsModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
}

const AssessmentRecordsModal = ({ isOpen, onClose, userId }: AssessmentRecordsModalProps) => {
  const [assessments, setAssessments] = useState<AnxietyAssessment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && userId) {
      fetchAssessments();
    }
  }, [isOpen, userId]);

  const fetchAssessments = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const { data, error } = await supabase
        .from('anxiety_assessments')
        .select('*')
        .eq('profile_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAssessments(data || []);
    } catch (err) {
      console.error('Error fetching assessments:', err);
      setError('Failed to load assessment records');
    } finally {
      setLoading(false);
    }
  };

  // GAD-7 based anxiety level colors: Green (Minimal 0-19%), Blue (Mild 20-47%), Yellow (Moderate 48-71%), Red (Severe 72-100%)
  const getAnxietyLevelColor = (percentage: number) => {
    if (percentage < 20) return {
      bg: 'bg-green-100',
      border: 'border-green-200',
      text: 'text-green-800',
      icon: 'text-green-600'
    }; // Green - Minimal anxiety (0-19%)
    if (percentage < 48) return {
      bg: 'bg-blue-100',
      border: 'border-blue-200',
      text: 'text-blue-800',
      icon: 'text-blue-600'
    }; // Blue - Mild anxiety (20-47%)
    if (percentage < 72) return {
      bg: 'bg-yellow-100',
      border: 'border-yellow-200',
      text: 'text-yellow-800',
      icon: 'text-yellow-600'
    }; // Yellow - Moderate anxiety (48-71%)
    return {
      bg: 'bg-red-100',
      border: 'border-red-200',
      text: 'text-red-800',
      icon: 'text-red-600'
    }; // Red - Severe anxiety (72-100%)
  };

  const getAnxietyLevelLabel = (percentage: number) => {
    if (percentage < 20) return 'Minimal';
    if (percentage < 48) return 'Mild';
    if (percentage < 72) return 'Moderate';
    return 'Severe';
  };

  const getTrendIcon = (current: number, previous: number) => {
    if (current > previous) return <FaArrowUp className="text-red-500" />;
    if (current < previous) return <FaArrowDown className="text-green-500" />;
    return <FaEquals className="text-gray-500" />;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
          />

          {/* Bottom Sheet */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed bottom-0 left-0 right-0 bg-white rounded-t-3xl shadow-2xl z-50 max-h-[85vh] overflow-hidden"
          >
            {/* Header */}
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 rounded-t-3xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center">
                    <FaChartLine className="text-white text-lg" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">Assessment History</h2>
                    <p className="text-sm text-gray-600">Your anxiety assessment records</p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="w-10 h-10 bg-gray-100 hover:bg-gray-200 rounded-xl flex items-center justify-center transition-colors"
                >
                  <FaTimes className="text-gray-600" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="overflow-y-auto p-6 pb-8 max-h-[calc(85vh-120px)]">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <FaSpinner className="animate-spin text-indigo-500 text-2xl mr-3" />
                  <span className="text-gray-600">Loading assessment records...</span>
                </div>
              ) : error ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <FaTimes className="text-red-500 text-xl" />
                  </div>
                  <p className="text-red-600 font-medium">{error}</p>
                  <button
                    onClick={fetchAssessments}
                    className="mt-4 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                  >
                    Try Again
                  </button>
                </div>
              ) : assessments.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <FaChartLine className="text-gray-400 text-xl" />
                  </div>
                  <p className="text-gray-600 font-medium mb-2">No assessments yet</p>
                  <p className="text-gray-500 text-sm">Take your first anxiety assessment to start tracking your progress</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Summary Stats */}
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="bg-gradient-to-br from-indigo-50 to-purple-100 rounded-2xl p-4 border border-indigo-200">
                      <div className="flex items-center gap-2 mb-2">
                        <FaChartLine className="text-indigo-600" />
                        <span className="text-sm font-medium text-indigo-800">Total Assessments</span>
                      </div>
                      <p className="text-2xl font-bold text-indigo-900">{assessments.length}</p>
                    </div>
                    <div className="bg-gradient-to-br from-emerald-50 to-green-100 rounded-2xl p-4 border border-emerald-200">
                      <div className="flex items-center gap-2 mb-2">
                        <FaCalendarAlt className="text-emerald-600" />
                        <span className="text-sm font-medium text-emerald-800">Latest Score</span>
                      </div>
                      <p className="text-2xl font-bold text-emerald-900">{assessments[0]?.percentage || 0}%</p>
                    </div>
                  </div>

                  {/* Assessment List */}
                  <div className="space-y-3">
                    {assessments.map((assessment, index) => {
                      const colors = getAnxietyLevelColor(assessment.percentage);
                      const previousAssessment = assessments[index + 1];
                      
                      return (
                        <motion.div
                          key={assessment.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.1 }}
                          className={`${colors.bg} ${colors.border} border-2 rounded-2xl p-4 shadow-lg`}
                        >
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-3">
                              <div className={`w-10 h-10 ${colors.bg} ${colors.border} border rounded-xl flex items-center justify-center`}>
                                <FaChartLine className={colors.icon} />
                              </div>
                              <div>
                                <h3 className={`font-bold ${colors.text}`}>
                                  {getAnxietyLevelLabel(assessment.percentage)} Anxiety
                                </h3>
                                <p className="text-sm text-gray-600">
                                  {formatDate(assessment.created_at)}
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="flex items-center gap-2">
                                <span className={`text-2xl font-bold ${colors.text}`}>
                                  {assessment.percentage}%
                                </span>
                                {previousAssessment && (
                                  <div className="flex items-center">
                                    {getTrendIcon(assessment.percentage, previousAssessment.percentage)}
                                  </div>
                                )}
                              </div>
                              <p className="text-sm text-gray-600">
                                Score: {assessment.total_score}/21
                              </p>
                            </div>
                          </div>
                          
                          {/* Progress Bar */}
                          <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                            <div
                              className={`h-2 rounded-full transition-all duration-300 ${
                                assessment.percentage < 20 ? 'bg-gradient-to-r from-green-500 to-green-600' :
                                assessment.percentage < 48 ? 'bg-gradient-to-r from-blue-500 to-blue-600' :
                                assessment.percentage < 72 ? 'bg-gradient-to-r from-yellow-500 to-yellow-600' :
                                'bg-gradient-to-r from-red-500 to-red-600'
                              }`}
                              style={{ width: `${assessment.percentage}%` }}
                            />
                          </div>
                          
                          {/* Change indicator */}
                          {previousAssessment && (
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-gray-600">
                                Previous: {previousAssessment.percentage}%
                              </span>
                              <span className={`font-medium ${
                                assessment.percentage < previousAssessment.percentage ? 'text-green-600' :
                                assessment.percentage > previousAssessment.percentage ? 'text-red-600' :
                                'text-gray-600'
                              }`}>
                                {assessment.percentage === previousAssessment.percentage ? 'No change' :
                                 assessment.percentage < previousAssessment.percentage ? 
                                 `Improved by ${previousAssessment.percentage - assessment.percentage}%` :
                                 `Increased by ${assessment.percentage - previousAssessment.percentage}%`}
                              </span>
                            </div>
                          )}
                        </motion.div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default AssessmentRecordsModal;
