import { useState, useEffect } from 'react';
import { FaHeart, FaBrain, FaChevronRight, FaChevronLeft, FaCheckCircle, FaHome, FaShieldAlt, FaExclamationTriangle } from 'react-icons/fa';
import { supabase } from '../../lib/supabase';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Swal from 'sweetalert2';

type AssessmentProps = {
  onComplete?: (score: number, level: string) => void;
};

const questions = [
  {
    id: 1,
    text: "Feeling nervous, anxious, or on edge",
    category: "GAD-7 Scale"
  },
  {
    id: 2,
    text: "Not being able to stop or control worrying",
    category: "GAD-7 Scale"
  },
  {
    id: 3,
    text: "Worrying too much about different things",
    category: "GAD-7 Scale"
  },
  {
    id: 4,
    text: "Trouble relaxing",
    category: "GAD-7 Scale"
  },
  {
    id: 5,
    text: "Being so restless that it's hard to sit still",
    category: "GAD-7 Scale"
  },
  {
    id: 6,
    text: "Becoming easily annoyed or irritable",
    category: "GAD-7 Scale"
  },
  {
    id: 7,
    text: "Feeling afraid as if something awful might happen",
    category: "GAD-7 Scale"
  }
];

const answerOptions = [
  { value: 0, label: "Not at all", color: "text-green-600" },
  { value: 1, label: "Several days", color: "text-green-500" },
  { value: 2, label: "More than half the days", color: "text-yellow-500" },
  { value: 3, label: "Nearly every day", color: "text-red-500" }
];

const getAnxietyLevel = (percentage: number) => {
  // GAD-7 scoring: 0-4 minimal, 5-9 mild, 10-14 moderate, 15-21 severe
  const totalScore = Math.round((percentage / 100) * 21); // Convert percentage back to score
  
  if (totalScore <= 4) return { level: "Minimal", color: "text-green-600", bgColor: "bg-green-50", borderColor: "border-green-200" };
  if (totalScore <= 9) return { level: "Mild", color: "text-blue-600", bgColor: "bg-blue-50", borderColor: "border-blue-200" };
  if (totalScore <= 14) return { level: "Moderate", color: "text-yellow-600", bgColor: "bg-yellow-50", borderColor: "border-yellow-200" };
  return { level: "Severe", color: "text-red-600", bgColor: "bg-red-50", borderColor: "border-red-200" };
};

// Honesty Agreement Modal Component
function HonestyModal({ isOpen, onAgree, onDecline }: { 
  isOpen: boolean; 
  onAgree: () => void; 
  onDecline: () => void; 
}) {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
          className="bg-white rounded-2xl shadow-2xl border border-gray-200 w-full max-w-md max-h-[90vh] overflow-y-auto"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-red-500 to-orange-500 p-4 sm:p-6 rounded-t-2xl">
            <div className="flex items-center justify-center mb-3">
              <div className="bg-white/20 p-2 sm:p-3 rounded-full">
                <FaShieldAlt className="text-white text-xl sm:text-2xl" />
              </div>
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-white text-center mb-2">
              Honesty Agreement
            </h2>
            <p className="text-white/90 text-xs sm:text-sm text-center">
              Important: Please read carefully before proceeding
            </p>
          </div>

          {/* Content */}
          <div className="p-4 sm:p-6">
            {/* Warning Alert */}
            <div className="bg-red-50 border border-red-200 rounded-xl p-3 sm:p-4 mb-4 sm:mb-6">
              <div className="flex items-start gap-3">
                <FaExclamationTriangle className="text-red-500 text-lg sm:text-xl mt-1 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-red-800 text-sm sm:text-base mb-1">
                    Penalty Warning
                  </h3>
                  <p className="text-red-700 text-xs sm:text-sm leading-relaxed">
                    Providing dishonest or inaccurate responses may result in academic penalties, 
                    including but not limited to grade reduction or assessment invalidation.
                  </p>
                </div>
              </div>
            </div>

            {/* Agreement Terms */}
            <div className="space-y-3 sm:space-y-4 mb-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 sm:p-4">
                <h4 className="font-semibold text-blue-800 text-sm sm:text-base mb-2">
                  📋 Assessment Integrity
                </h4>
                <p className="text-blue-700 text-xs sm:text-sm leading-relaxed">
                  This GAD-7 assessment is designed to evaluate your mental health status accurately. 
                  Honest responses are crucial for proper assessment and potential support.
                </p>
              </div>

              <div className="bg-green-50 border border-green-200 rounded-lg p-3 sm:p-4">
                <h4 className="font-semibold text-green-800 text-sm sm:text-base mb-2">
                  🤝 Your Commitment
                </h4>
                <p className="text-green-700 text-xs sm:text-sm leading-relaxed">
                  By proceeding, you agree to answer all questions truthfully based on your 
                  experiences over the past 2 weeks.
                </p>
              </div>

              <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 sm:p-4">
                <h4 className="font-semibold text-purple-800 text-sm sm:text-base mb-2">
                  🔒 Confidentiality
                </h4>
                <p className="text-purple-700 text-xs sm:text-sm leading-relaxed">
                  Your responses will be handled with strict confidentiality and used only 
                  for assessment and support purposes.
                </p>
              </div>
            </div>

            {/* Checkbox Agreement */}
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 sm:p-4 mb-6">
              <div className="flex items-start gap-3">
                <div className="mt-1">
                  <div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-blue-500 rounded bg-blue-500 flex items-center justify-center">
                    <svg className="w-2 h-2 sm:w-3 sm:h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                </div>
                <p className="text-gray-700 text-xs sm:text-sm leading-relaxed">
                  <strong>I understand and agree</strong> that I must answer all questions honestly 
                  and accurately. I acknowledge that dishonest responses may result in academic 
                  penalties and will not provide the proper assessment needed for my well-being.
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2 sm:space-y-3">
              <button
                onClick={onAgree}
                className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-medium py-3 px-4 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl text-sm sm:text-base"
              >
                I Agree - Proceed with Assessment
              </button>
              
              <button
                onClick={onDecline}
                className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-3 px-4 rounded-xl transition-all duration-200 border border-gray-300 text-sm sm:text-base"
              >
                I Decline - Exit Assessment
              </button>
            </div>

            {/* Footer Note */}
            <div className="mt-4 pt-4 border-t border-gray-200">
              <p className="text-xs text-gray-500 text-center leading-relaxed">
                This assessment is for educational and health monitoring purposes. 
                If you're experiencing severe mental health concerns, please seek 
                professional help immediately.
              </p>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

export default function AnxietyAssessment({ onComplete }: AssessmentProps) {
  const [showHonestyModal, setShowHonestyModal] = useState(true);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<number[]>(new Array(questions.length).fill(-1));
  const [isComplete, setIsComplete] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const navigate = useNavigate();

  const progress = ((currentQuestion + 1) / questions.length) * 100;
  const totalScore = answers.reduce((sum, answer) => sum + (answer >= 0 ? answer : 0), 0);
  const maxScore = questions.length * 3; // 3 is the highest score per question in GAD-7
  const percentage = Math.round((totalScore / maxScore) * 100);
  const anxietyData = getAnxietyLevel(percentage);

  const handleModalAgree = () => {
    setShowHonestyModal(false);
  };

  const handleModalDecline = async () => {
    const result = await Swal.fire({
      title: 'Exit Assessment?',
      text: 'Are you sure you want to exit the assessment? You will be redirected to the login page.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, exit',
      cancelButtonText: 'Cancel',
      width: 320,
      padding: '1.5em',
      customClass: {
        popup: 'swal2-mobile-popup',
        title: 'swal2-mobile-title',
        htmlContainer: 'swal2-mobile-text',
        actions: 'swal2-mobile-actions',
        confirmButton: 'swal2-mobile-confirm',
        cancelButton: 'swal2-mobile-cancel',
      },
    });
    if (result.isConfirmed) {
      navigate('/');
    }
  };

  const handleAnswerSelect = (value: number) => {
    const newAnswers = [...answers];
    newAnswers[currentQuestion] = value;
    setAnswers(newAnswers);
  };

  const handleNext = async () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      setIsComplete(true);
      setTimeout(() => setShowResults(true), 500);
      onComplete?.(percentage, anxietyData.level);

      // Get the user profile_id from Supabase auth
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        alert('You must be logged in to save your assessment.');
        return;
      }

      try {
        console.log('Fetching profile for user:', user.id, new Date().toISOString());
        
        // First, get the profile_id for the current user
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('id')
          .eq('user_id', user.id)
          .single();

        if (profileError) {
          console.error('Error fetching profile:', profileError);
          alert('Error fetching profile: ' + profileError.message);
          return;
        }

        if (!profile) {
          console.error('No profile found for user:', user.id);
          alert('Profile not found. Please try again later.');
          return;
        }

        console.log('Found profile:', profile, new Date().toISOString());
        console.log('Profile id type:', typeof profile.id);
        console.log('Profile id value:', profile.id);

        // Always create a new assessment - this fixes the issue where users can't take a new assessment
        const assessmentData = {
          profile_id: profile.id,
          total_score: totalScore,
          percentage,
          anxiety_level: anxietyData.level,
          answers: answers,
        };

        console.log('Assessment data to save:', assessmentData, new Date().toISOString());

        // Create new assessment
        console.log('Creating new assessment', new Date().toISOString());
        const result = await supabase
          .from('anxiety_assessments')
          .insert(assessmentData)
          .select()
          .single();

        const { data: assessment, error: assessmentError } = result;

        if (assessmentError) {
          console.error('Error saving assessment:', assessmentError);
          console.error('Error details:', {
            message: assessmentError.message,
            details: assessmentError.details,
            hint: assessmentError.hint,
            code: assessmentError.code
          });
          
          // Try to get more specific error information
          if (assessmentError.code === '42501') {
            alert('Permission denied. Please check your authentication status and try again.');
          } else if (assessmentError.code === '23503') {
            alert('Foreign key constraint violation. Profile not found.');
          } else {
            alert('Error saving assessment: ' + assessmentError.message);
          }
        } else {
          console.log('Assessment saved successfully:', assessment, new Date().toISOString());
        }
      } catch (err) {
        console.error('Unexpected error:', err);
        alert('Unexpected error: ' + (err instanceof Error ? err.message : String(err)));
      }
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  const handleRestart = () => {
    console.log('Restarting assessment', new Date().toISOString());
    setCurrentQuestion(0);
    setAnswers(new Array(questions.length).fill(-1));
    setIsComplete(false);
    setShowResults(false);
    setShowHonestyModal(true);
  };

  const handleDashboard = () => {
    console.log('Navigating to dashboard', new Date().toISOString());
    navigate('/dashboard');
  };

  if (isComplete) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-2 sm:p-4 relative overflow-hidden">
        {/* Floating background elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-6 left-4 w-14 h-14 sm:w-20 sm:h-20 bg-blue-200 rounded-full opacity-20 animate-pulse"></div>
          <div className="absolute top-24 right-8 w-10 h-10 sm:w-16 sm:h-16 bg-purple-200 rounded-full opacity-20 animate-pulse delay-1000"></div>
          <div className="absolute bottom-16 left-16 w-16 h-16 sm:w-24 sm:h-24 bg-indigo-200 rounded-full opacity-20 animate-pulse delay-2000"></div>
          <div className="absolute bottom-24 right-4 w-8 h-8 sm:w-12 sm:h-12 bg-teal-200 rounded-full opacity-20 animate-pulse delay-500"></div>
        </div>

        <div className="w-full max-w-lg sm:max-w-lg max-w-full relative z-10">
          <AnimatePresence>
            {showResults && (
              <motion.div
                key="result-card"
                initial={{ scale: 0.8, opacity: 0, y: 40 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.8, opacity: 0, y: 40 }}
                transition={{ type: "spring", stiffness: 200, damping: 20 }}
                className={`bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border-2 ${anxietyData.borderColor} p-4 sm:p-8 text-center`}
              >
                {/* Success Icon */}
                <motion.div
                  initial={{ scale: 0, rotate: -90 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: "spring", stiffness: 300, damping: 15, delay: 0.2 }}
                  className="flex justify-center mb-4 sm:mb-6"
                >
                  <div className={`${anxietyData.bgColor} p-3 sm:p-4 rounded-full shadow-lg`}>
                    <FaCheckCircle className={`${anxietyData.color} text-2xl sm:text-3xl`} />
                  </div>
                </motion.div>

                {/* Results Header */}
                <h2 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-1 sm:mb-2">
                  Assessment Complete
                </h2>
                <p className="text-gray-600 text-xs sm:text-sm mb-4 sm:mb-8">
                  Thank you for taking the time to assess your mental well-being
                </p>

                {/* Score Display */}
                <div className={`${anxietyData.bgColor} rounded-2xl p-4 sm:p-6 mb-4 sm:mb-6 border ${anxietyData.borderColor}`}>
                  <div className="text-center mb-2 sm:mb-4">
                    <motion.div
                      initial={{ scale: 0.7, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ delay: 0.4, type: "spring", stiffness: 200 }}
                      className={`text-2xl sm:text-4xl font-bold ${anxietyData.color} mb-1 sm:mb-2`}
                    >
                      <AnimatedNumber value={percentage} />%
                    </motion.div>
                    <div className={`text-base sm:text-lg font-semibold ${anxietyData.color} mb-1`}>
                      {anxietyData.level} Anxiety Level
                    </div>
                    <div className="text-xs text-gray-600">
                      Score: {totalScore} out of {maxScore}
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: showResults ? `${percentage}%` : '0%' }}
                    transition={{ duration: 1, ease: "easeOut", delay: 0.5 }}
                    className={`h-2 sm:h-3 rounded-full transition-all duration-1000 ease-out ${
                      percentage <= 20 ? 'bg-gradient-to-r from-green-400 to-green-500' :
                      percentage <= 40 ? 'bg-gradient-to-r from-blue-400 to-blue-500' :
                      percentage <= 60 ? 'bg-gradient-to-r from-yellow-400 to-yellow-500' :
                      percentage <= 80 ? 'bg-gradient-to-r from-orange-400 to-orange-500' :
                      'bg-gradient-to-r from-red-400 to-red-500'
                    }`}
                  ></motion.div>
                </div>

                {/* Recommendations */}
                <div className="text-left mb-4 sm:mb-6">
                  <h3 className="font-semibold text-gray-800 mb-2 sm:mb-3 text-center">Recommendations</h3>
                  <div className="space-y-2 text-xs sm:text-sm text-gray-600">
                    {totalScore <= 4 && (
                      <div className="bg-green-50 p-2 sm:p-3 rounded-lg border border-green-200">
                        <p>✨ Great job! Your anxiety levels appear to be minimal. Continue practicing self-care and healthy coping strategies.</p>
                      </div>
                    )}
                    {totalScore > 4 && totalScore <= 9 && (
                      <div className="bg-blue-50 p-2 sm:p-3 rounded-lg border border-blue-200">
                        <p>💙 You're experiencing mild anxiety. Consider incorporating relaxation techniques like deep breathing or meditation into your daily routine.</p>
                      </div>
                    )}
                    {totalScore > 9 && totalScore <= 14 && (
                      <div className="bg-yellow-50 p-2 sm:p-3 rounded-lg border border-yellow-200">
                        <p>⚠️ Moderate anxiety detected. It may be helpful to speak with a counselor or try anxiety management techniques. Don't hesitate to reach out for support.</p>
                      </div>
                    )}
                    {totalScore > 14 && (
                      <div className="bg-red-50 p-2 sm:p-3 rounded-lg border border-red-200">
                        <p>❤️ Severe anxiety detected. We strongly recommend speaking with a mental health professional for proper support and guidance.</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="space-y-2 sm:space-y-3">
                  <button
                    onClick={handleRestart}
                    className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-medium py-2 sm:py-3 px-4 sm:px-6 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl"
                  >
                    Take Assessment Again
                  </button>
                  <button
                    onClick={handleDashboard}
                    className="w-full flex items-center justify-center gap-2 bg-white border border-blue-200 text-blue-700 font-medium py-2 sm:py-3 px-4 sm:px-6 rounded-xl transition-all duration-200 shadow hover:bg-blue-50"
                  >
                    <FaHome className="text-blue-500" />
                    View Dashboard
                  </button>
                  <div className="text-xs text-gray-500 leading-relaxed text-center">
                    Remember: This GAD-7 assessment is for informational purposes only and is not a substitute for professional medical advice. The assessment covers symptoms over the past 2 weeks.
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Honesty Agreement Modal */}
      <HonestyModal
        isOpen={showHonestyModal}
        onAgree={handleModalAgree}
        onDecline={handleModalDecline}
      />

      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-4 relative overflow-hidden">
        {/* Floating background elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-10 left-10 w-20 h-20 bg-blue-200 rounded-full opacity-20 animate-pulse"></div>
          <div className="absolute top-32 right-20 w-16 h-16 bg-purple-200 rounded-full opacity-20 animate-pulse delay-1000"></div>
          <div className="absolute bottom-20 left-32 w-24 h-24 bg-indigo-200 rounded-full opacity-20 animate-pulse delay-2000"></div>
          <div className="absolute bottom-32 right-10 w-12 h-12 bg-teal-200 rounded-full opacity-20 animate-pulse delay-500"></div>
        </div>

        <div className="w-full max-w-lg relative z-10">
          {/* Header */}
          <div className="text-center mb-6">
            <div className="flex items-center justify-center mb-3">
              <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-3 rounded-full shadow-lg">
                <FaBrain className="text-white text-2xl" />
              </div>
            </div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
              GAD-7 Anxiety Assessment
            </h1>
            <p className="text-gray-600 text-sm flex items-center justify-center gap-2">
              <FaHeart className="text-pink-500" />
              Over the past 2 weeks, how often have you been bothered by the following problems?
            </p>
          </div>

          {/* Progress Bar */}
          <div className="mb-8">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-gray-700">
                Question {currentQuestion + 1} of {questions.length}
              </span>
              <span className="text-sm font-medium text-blue-600">
                {Math.round(progress)}%
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full transition-all duration-300 ease-out"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          </div>

          {/* Question Card */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200 p-6 mb-6">
            <div className="mb-4">
              <div className="text-xs font-medium text-blue-600 mb-2">
                {questions[currentQuestion].category}
              </div>
              <h2 className="text-lg font-semibold text-gray-800 leading-relaxed">
                {questions[currentQuestion].text}
              </h2>
            </div>

            {/* Answer Options */}
            <div className="space-y-3">
              {answerOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => handleAnswerSelect(option.value)}
                  className={`w-full p-4 rounded-xl border-2 transition-all duration-200 text-left ${
                    answers[currentQuestion] === option.value
                      ? 'border-blue-500 bg-blue-50 shadow-md scale-[1.02]'
                      : 'border-gray-200 bg-gray-50/50 hover:border-blue-300 hover:bg-blue-50/50 hover:scale-[1.01]'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className={`font-medium ${
                      answers[currentQuestion] === option.value ? 'text-blue-700' : 'text-gray-700'
                    }`}>
                      {option.label}
                    </span>
                    <div className={`w-4 h-4 rounded-full border-2 ${
                      answers[currentQuestion] === option.value
                        ? 'border-blue-500 bg-blue-500'
                        : 'border-gray-300'
                    }`}>
                      {answers[currentQuestion] === option.value && (
                        <div className="w-full h-full rounded-full bg-white scale-50"></div>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Navigation Buttons */}
          <div className="flex gap-4">
            <button
              onClick={handlePrevious}
              disabled={currentQuestion === 0}
              className={`flex items-center justify-center px-6 py-3 rounded-xl font-medium transition-all duration-200 ${
                currentQuestion === 0
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200 shadow-sm hover:shadow-md'
              }`}
            >
              <FaChevronLeft className="mr-2" />
              Previous
            </button>
            
            <button
              onClick={handleNext}
              disabled={answers[currentQuestion] === -1}
              className={`flex-1 flex items-center justify-center px-6 py-3 rounded-xl font-medium transition-all duration-200 ${
                answers[currentQuestion] === -1
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white shadow-lg hover:shadow-xl'
              }`}
            >
              {currentQuestion === questions.length - 1 ? 'Complete Assessment' : 'Next Question'}
              <FaChevronRight className="ml-2" />
            </button>
          </div>

          {/* Motivational Message */}
          <div className="mt-6 text-center p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl border border-blue-100">
            <p className="text-xs text-gray-600 leading-relaxed">
              "Take your time and answer honestly. Your mental health matters." 💙
            </p>
          </div>
        </div>
      </div>
    </>
  );
}

// AnimatedNumber component for smooth number animation
function AnimatedNumber({ value }: { value: number }) {
  const [display, setDisplay] = useState(0);
  
  useEffect(() => {
    let start = 0;
    const duration = 800;
    const startTime = performance.now();
    
    function animate(now: number) {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      setDisplay(Math.round(start + (value - start) * progress));
      if (progress < 1) requestAnimationFrame(animate);
    }
    
    requestAnimationFrame(animate);
  }, [value]);
  
  return <span>{display}</span>;
}
