import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FaLeaf, FaBrain, FaHandPaper, FaTree,
  FaPlay, FaPause, FaStop, FaExpand, 
} from 'react-icons/fa';
import RelaxationTools from './RelaxationTools';

interface QuickRelaxationProps {
  className?: string;
}

const QuickRelaxation: React.FC<QuickRelaxationProps> = ({ className = '' }) => {
  const [showFullTools, setShowFullTools] = useState(false);
  const [activeQuickSession, setActiveQuickSession] = useState<string | null>(null);
  const [sessionTime, setSessionTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  const quickTools = [
    {
      id: 'quick-breathing',
      name: 'Quick Breathing',
      icon: FaLeaf,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
      duration: '2 min',
      description: '4-7-8 breathing technique for instant calm'
    },
    {
      id: 'body-scan',
      name: 'Body Scan',
      icon: FaHandPaper,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
      duration: '3 min',
      description: 'Quick muscle tension release'
    },
    {
      id: 'mindful-moment',
      name: 'Mindful Moment',
      icon: FaBrain,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
      duration: '1 min',
      description: 'Present moment awareness'
    },
    {
      id: 'nature-escape',
      name: 'Nature Escape',
      icon: FaTree,
      color: 'text-teal-600',
      bgColor: 'bg-teal-100',
      duration: '5 min',
      description: 'Quick visualization journey'
    }
  ];

  const startQuickSession = (toolId: string) => {
    setActiveQuickSession(toolId);
    setIsPlaying(true);
    setSessionTime(0);
    
    // Start timer
    const interval = setInterval(() => {
      setSessionTime(prev => {
        const newTime = prev + 1;
        // Auto-stop after tool duration (simplified)
        const tool = quickTools.find(t => t.id === toolId);
        const maxTime = tool ? parseInt(tool.duration) * 60 : 120;
        if (newTime >= maxTime) {
          clearInterval(interval);
          setIsPlaying(false);
          setActiveQuickSession(null);
          setSessionTime(0);
        }
        return newTime;
      });
    }, 1000);
  };

  const stopQuickSession = () => {
    setActiveQuickSession(null);
    setIsPlaying(false);
    setSessionTime(0);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <>
      <motion.div 
        className={`bg-white rounded-2xl p-4 sm:p-6 shadow-lg border-2 border-teal-200 ${className}`}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        whileHover={{ y: -5, boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)" }}
      >
        {/* Header */}
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-4 sm:mb-6">
            <div className="flex items-center gap-3">
              <motion.div
                className="w-12 h-12 bg-gradient-to-r from-teal-500 to-green-600 rounded-xl flex items-center justify-center shadow-lg"
                animate={{ 
                  rotate: [0, 5, 0, -5, 0],
                  y: [0, -2, 0]
                }}
                transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
              >
                <FaLeaf className="text-white text-xl" />
              </motion.div>
              <div>
                <h3 className="text-lg sm:text-xl font-bold text-gray-800">Quick Relaxation</h3>
                <p className="text-sm text-gray-600">Instant calm in minutes</p>
              </div>
            </div>
            
            <motion.button
              onClick={() => setShowFullTools(true)}
              className="p-2 bg-teal-100 hover:bg-teal-200 rounded-lg transition-colors"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              title="View all relaxation tools"
            >
              <FaExpand className="text-teal-600" />
            </motion.button>
          </div>

          {/* Active Session Display */}
          {activeQuickSession && (
            <motion.div 
              className="mb-6 text-center"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 260, damping: 20 }}
            >
              <div className="bg-gradient-to-r from-teal-50 to-green-100 rounded-xl p-4 border-2 border-teal-200">
                <div className="text-2xl font-mono font-bold text-teal-800 mb-2">
                  {formatTime(sessionTime)}
                </div>
                <div className="flex items-center justify-center gap-3">
                  <motion.button
                    onClick={() => setIsPlaying(!isPlaying)}
                    className="w-10 h-10 bg-gradient-to-r from-teal-500 to-green-600 text-white rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transition-all"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    {isPlaying ? <FaPause /> : <FaPlay className="ml-0.5" />}
                  </motion.button>
                  <motion.button
                    onClick={stopQuickSession}
                    className="w-10 h-10 bg-gray-500 hover:bg-gray-600 text-white rounded-full flex items-center justify-center shadow-lg transition-all"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <FaStop />
                  </motion.button>
                </div>
                <p className="text-sm text-teal-700 mt-2">
                  {quickTools.find(t => t.id === activeQuickSession)?.name} in progress
                </p>
              </div>
            </motion.div>
          )}

          {/* Quick Tools Grid */}
          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            {quickTools.map((tool, index) => (
              <motion.button
                key={tool.id}
                onClick={() => startQuickSession(tool.id)}
                disabled={activeQuickSession !== null}
                className={`p-3 sm:p-4 rounded-xl border-2 transition-all text-left group ${
                  activeQuickSession === tool.id 
                    ? 'border-teal-400 bg-teal-50 shadow-lg' 
                    : activeQuickSession 
                      ? 'border-gray-200 bg-gray-50 opacity-50 cursor-not-allowed'
                      : 'border-gray-200 bg-white hover:border-teal-300 hover:bg-teal-50'
                }`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                whileHover={activeQuickSession ? {} : { y: -3, scale: 1.02 }}
                whileTap={activeQuickSession ? {} : { scale: 0.98 }}
              >
                <div className="flex items-center gap-2 sm:gap-3 mb-2">
                  <div className={`w-8 h-8 sm:w-10 sm:h-10 ${tool.bgColor} rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform`}>
                    <tool.icon className={`${tool.color} text-sm sm:text-base`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-gray-800 text-sm sm:text-base truncate">{tool.name}</h4>
                    <p className="text-xs text-gray-500">{tool.duration}</p>
                  </div>
                </div>
                <p className="text-xs text-gray-600 leading-relaxed">{tool.description}</p>
                
                {activeQuickSession === tool.id && (
                  <motion.div 
                    className="mt-2 flex items-center gap-1"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  >
                    <div className="w-2 h-2 bg-teal-500 rounded-full animate-pulse"></div>
                    <span className="text-xs text-teal-600 font-medium">Active</span>
                  </motion.div>
                )}
              </motion.button>
            ))}
          </div>
          
          {/* Call to Action */}
          <motion.div 
            className="mt-4 sm:mt-6 text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            <p className="text-xs sm:text-sm text-gray-600 mb-3">
              Need more options? Explore our full relaxation toolkit
            </p>
            <motion.button
              onClick={() => setShowFullTools(true)}
              className="w-full bg-gradient-to-r from-teal-500 to-green-600 hover:from-teal-600 hover:to-green-700 text-white px-4 py-2 rounded-lg font-medium shadow-lg hover:shadow-xl transition-all duration-200 text-sm"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              View All Relaxation Tools
            </motion.button>
          </motion.div>
        </div>
      </motion.div>

      {/* Full Relaxation Tools Modal */}
      <AnimatePresence>
        {showFullTools && (
          <>
            <motion.div 
              className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowFullTools(false)}
            />
            <motion.div 
              className="fixed inset-4 z-51 overflow-auto"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
            >
              <RelaxationTools onClose={() => setShowFullTools(false)} />
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default QuickRelaxation; 