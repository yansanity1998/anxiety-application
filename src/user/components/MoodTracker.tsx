import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaHeart, FaHistory, FaTimes } from 'react-icons/fa';
import { moodService, MOOD_OPTIONS } from '../../lib/moodService';
import type { MoodEntry } from '../../lib/moodService';

interface MoodTrackerProps {
  userData: any;
}

const MoodTracker = ({ userData }: MoodTrackerProps) => {
  const [, setTodaysMood] = useState<MoodEntry | null>(null);
  const [recentMoods, setRecentMoods] = useState<MoodEntry[]>([]);
  const [selectedMood, setSelectedMood] = useState<number | null>(null);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(true);
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    if (userData?.id) {
      loadMoodData();
    }
  }, [userData]);

  const loadMoodData = async () => {
    if (!userData?.id) return;
    
    setLoading(true);
    try {
      // Load today's mood
      const todayMood = await moodService.getTodaysMood(userData.id);
      setTodaysMood(todayMood);
      
      if (todayMood) {
        setSelectedMood(todayMood.mood_level);
        setNotes(todayMood.notes || '');
      }

      // Load recent moods (last 7 days)
      const recent = await moodService.getRecentMoods(userData.id, 7);
      setRecentMoods(recent);
    } catch (error) {
      console.error('Error loading mood data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMoodSelect = async (moodLevel: number) => {
    if (!userData?.id) return;
    
    // Immediate UI feedback
    setSelectedMood(moodLevel);
    
    try {
      const moodEntry = await moodService.setTodaysMood(userData.id, moodLevel, notes);
      if (moodEntry) {
        setTodaysMood(moodEntry);
        
        // Immediately update recent moods for instant feedback
        await updateRecentMoods();
      }
    } catch (error) {
      console.error('Error saving mood:', error);
      // Revert UI state on error
      setSelectedMood(null);
    }
  };

  const updateRecentMoods = async () => {
    if (!userData?.id) return;
    
    try {
      const recent = await moodService.getRecentMoods(userData.id, 7);
      setRecentMoods(recent);
    } catch (error) {
      console.error('Error updating recent moods:', error);
    }
  };

  const handleNotesChange = async (newNotes: string) => {
    setNotes(newNotes);
    
    if (selectedMood && userData?.id) {
      try {
        const moodEntry = await moodService.setTodaysMood(userData.id, selectedMood, newNotes);
        if (moodEntry) {
          setTodaysMood(moodEntry);
          // Update recent moods when notes change too
          await updateRecentMoods();
        }
      } catch (error) {
        console.error('Error updating notes:', error);
      }
    }
  };


  if (loading) {
    return (
      <div className="bg-gradient-to-r from-pink-50 to-purple-50 rounded-3xl p-6 border border-pink-200/50 animate-pulse">
        <div className="h-6 bg-pink-200 rounded mb-4"></div>
        <div className="flex gap-3 mb-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="w-12 h-12 bg-pink-200 rounded-2xl"></div>
          ))}
        </div>
        <div className="h-20 bg-pink-200 rounded-2xl"></div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-r from-pink-50 to-purple-50 rounded-3xl p-6 border border-pink-200/50 shadow-lg">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-bold text-gray-800 flex items-center gap-2 text-lg">
          <FaHeart className="text-pink-500" />
          How's Your Mood Today
        </h3>
        <button
          onClick={() => setShowHistory(true)}
          className="p-2 rounded-xl bg-white/80 hover:bg-white shadow-md transition-all duration-200 text-purple-600 hover:scale-105"
        >
          <FaHistory className="text-sm" />
        </button>
      </div>

      {/* Mood Selection */}
      <div className="flex gap-3 mb-6 justify-center">
        {MOOD_OPTIONS.map((mood) => (
          <motion.button
            key={mood.level}
            onClick={() => handleMoodSelect(mood.level)}
            className={`relative w-14 h-14 rounded-2xl flex items-center justify-center text-2xl transition-all duration-300 shadow-lg ${
              selectedMood === mood.level
                ? 'scale-110 shadow-xl ring-4 ring-white/50'
                : 'hover:scale-105'
            } ${mood.color}`}
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.95 }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: mood.level * 0.1 }}
          >
            <span className="filter drop-shadow-sm">{mood.emoji}</span>
            {selectedMood === mood.level && (
              <motion.div
                className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-white rounded-full"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2 }}
              />
            )}
          </motion.button>
        ))}
      </div>

      {/* Selected Mood Label */}
      {selectedMood && (
        <motion.div
          className="text-center mb-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <p className="text-gray-700 font-semibold">
            {MOOD_OPTIONS.find(m => m.level === selectedMood)?.label}
          </p>
        </motion.div>
      )}

      {/* Notes Section */}
      <div className="bg-white/80 rounded-2xl p-4 backdrop-blur-sm">
        <textarea
          value={notes}
          onChange={(e) => handleNotesChange(e.target.value)}
          placeholder="How are you feeling? (optional)"
          className="w-full h-20 bg-transparent border-0 resize-none focus:outline-none text-gray-700 placeholder-gray-500"
        />
      </div>

      {/* Daily Mood History Modal */}
      <AnimatePresence>
        {showHistory && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setShowHistory(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-3xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                  <FaHistory className="text-purple-500" />
                  Recent Moods
                </h3>
                <button
                  onClick={() => setShowHistory(false)}
                  className="p-2 rounded-xl hover:bg-gray-100 transition-colors"
                >
                  <FaTimes className="text-gray-500" />
                </button>
              </div>

              {/* Daily Mood History */}
              <div className="space-y-3">
                {recentMoods.length > 0 ? (
                  recentMoods.map((mood, index) => {
                    const date = new Date(mood.created_at);
                    const isToday = date.toDateString() === new Date().toDateString();
                    const isYesterday = date.toDateString() === new Date(Date.now() - 86400000).toDateString();
                    
                    let dayLabel = '';
                    if (isToday) dayLabel = 'Today';
                    else if (isYesterday) dayLabel = 'Yesterday';
                    else dayLabel = date.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });

                    // Format the full date
                    const fullDate = date.toLocaleDateString('en-US', { 
                      year: 'numeric', 
                      month: 'short', 
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    });

                    return (
                      <motion.div
                        key={mood.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="flex items-center gap-4 p-4 bg-gradient-to-r from-gray-50 to-white rounded-2xl border border-gray-200"
                      >
                        <div className="text-3xl">{mood.mood_emoji}</div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <div className="font-semibold text-gray-800">{dayLabel}</div>
                            <div className="text-xs text-gray-500">{fullDate}</div>
                          </div>
                          <div className="text-sm text-gray-600">{mood.mood_label}</div>
                          {mood.notes && (
                            <div className="text-xs text-gray-500 mt-1 italic">"{mood.notes}"</div>
                          )}
                        </div>
                      </motion.div>
                    );
                  })
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <FaHistory className="mx-auto mb-3 text-3xl opacity-50" />
                    <p>No mood entries yet</p>
                    <p className="text-sm">Start tracking your mood today!</p>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default MoodTracker;
