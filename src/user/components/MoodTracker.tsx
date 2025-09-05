import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaTimes, FaHistory } from 'react-icons/fa';
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
  const [showDateModal, setShowDateModal] = useState(false);
  const [selectedDateData, setSelectedDateData] = useState<{date: string, mood: any, notes?: string} | null>(null);
  
  
  // Generate monthly stats (last 7 days) - Today in middle
  const getMonthlyStats = () => {
    const stats = [];
    // Generate 3 days before today, today, and 3 days after today
    for (let i = 3; i >= -3; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dayNum = date.getDate();
      const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
      
      // Find mood for this date
      const moodForDate = recentMoods.find(mood => {
        const moodDate = new Date(mood.created_at);
        return moodDate.toDateString() === date.toDateString();
      });
      
      stats.push({
        day: dayNum,
        dayName,
        mood: moodForDate?.mood_emoji || null,
        hasRecord: !!moodForDate,
        isToday: date.toDateString() === new Date().toDateString()
      });
    }
    return stats;
  };
  
  const monthlyStats = getMonthlyStats();

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

  const handleDateClick = (stat: any) => {
    const date = new Date();
    date.setDate(date.getDate() - (3 - monthlyStats.indexOf(stat)));
    
    // Find the mood entry for this date
    const moodForDate = recentMoods.find(mood => {
      const moodDate = new Date(mood.created_at);
      return moodDate.toDateString() === date.toDateString();
    });

    setSelectedDateData({
      date: date.toLocaleDateString('en-US', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      }),
      mood: moodForDate,
      notes: moodForDate?.notes || ''
    });
    setShowDateModal(true);
  };


  if (loading) {
    return (
      <div className="bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50 min-h-screen p-4 animate-pulse">
        <div className="h-6 bg-purple-200 rounded mb-4"></div>
        <div className="flex gap-3 mb-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="w-16 h-16 bg-purple-200 rounded-full"></div>
          ))}
        </div>
        <div className="flex gap-2 mb-4">
          {[1, 2, 3, 4, 5, 6, 7].map((i) => (
            <div key={i} className="w-16 h-20 bg-purple-200 rounded-3xl"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50 min-h-screen">

      {/* How's Your Mood Today Section */}
      <div className="px-4 mb-8 pt-6">
        <h2 className="text-xl font-bold text-gray-800 mb-4">How's Your Mood Today</h2>
        
        {/* Mood Selection - Horizontal Layout */}
        <div className="w-full overflow-x-auto scrollbar-hide pl-1 pr-4 py-3">
          <div className="flex items-center gap-4 pb-2" style={{ minWidth: 'max-content' }}>
            {MOOD_OPTIONS.map((mood) => (
              <motion.button
                key={mood.level}
                onClick={() => handleMoodSelect(mood.level)}
                className={`relative flex-shrink-0 w-16 h-16 rounded-full flex items-center justify-center transition-all duration-300 overflow-hidden ${
                  selectedMood === mood.level
                    ? 'scale-110 shadow-2xl bg-gradient-to-br from-purple-100 to-pink-100'
                    : 'hover:scale-105 shadow-lg bg-white hover:bg-gradient-to-br hover:from-gray-50 hover:to-purple-50'
                }`}
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.95 }}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: mood.level * 0.1 }}
              >
                <span className="filter drop-shadow-sm relative z-10 text-2xl leading-none">{mood.emoji}</span>
                {selectedMood === mood.level && (
                  <motion.div
                    className="absolute inset-0 rounded-full border-4 border-purple-400 bg-purple-50 bg-opacity-20"
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ duration: 0.5, type: "spring", bounce: 0.4 }}
                  />
                )}
              </motion.button>
            ))}
          </div>
        </div>
      </div>

      {/* Monthly Stats Section */}
      <div className="px-4 mb-8">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-gray-800">Monthly Stats</h3>
          <button 
            onClick={() => setShowHistory(true)}
            className="text-purple-600 text-sm font-medium flex items-center gap-1 hover:text-purple-700 transition-colors"
          >
            <FaHistory className="text-xs" />
            View History
          </button>
        </div>
        
        {/* Date Pills */}
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide pl-1 pr-4 py-3">
          {monthlyStats.map((stat, index) => {
            const colors = [
              'from-yellow-400 to-orange-500',
              'from-orange-400 to-red-500', 
              'from-green-400 to-emerald-500',
              'from-blue-400 to-cyan-500',
              'from-red-400 to-pink-500',
              'from-purple-400 to-indigo-500',
              'from-indigo-400 to-purple-500'
            ];
            
            return (
              <motion.button
                key={`${stat.day}-${index}`}
                onClick={() => handleDateClick(stat)}
                className={`flex-shrink-0 w-18 h-36 rounded-3xl bg-gradient-to-b ${colors[index]} flex flex-col items-center justify-center text-white shadow-lg transition-all duration-300 hover:scale-105 hover:shadow-xl cursor-pointer ${
                  stat.isToday ? 'ring-4 ring-white ring-opacity-70 scale-110 shadow-2xl' : ''
                }`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <span className="text-xl font-bold">{stat.day}</span>
                <span className="text-sm font-medium">{stat.dayName}</span>
                {stat.hasRecord && (
                  <span className="text-2xl mt-2">{stat.mood}</span>
                )}
              </motion.button>
            );
          })}
        </div>
      </div>
      
      
      {/* Notes Section - Hidden by default, shown when mood selected */}
      {selectedMood && (
        <motion.div
          className="px-4 mb-8"
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
        >
          <div className="bg-gradient-to-br from-white to-purple-50 rounded-3xl p-6 shadow-xl border border-purple-100">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full flex items-center justify-center">
                <span className="text-white text-lg">📝</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-800">Share your thoughts</h3>
            </div>
            <textarea
              value={notes}
              onChange={(e) => handleNotesChange(e.target.value)}
              placeholder="How are you feeling today? What's on your mind? (optional)"
              className="w-full h-24 bg-transparent border-0 resize-none focus:outline-none text-gray-700 placeholder-gray-400 text-base leading-relaxed"
            />
            <div className="flex justify-between items-center mt-3 pt-3 border-t border-purple-100">
              <span className="text-xs text-gray-500">Your thoughts are private and secure</span>
              <span className="text-xs text-purple-500 font-medium">{notes.length}/500</span>
            </div>
          </div>
        </motion.div>
      )}

      {/* Date Details Modal */}
      <AnimatePresence>
        {showDateModal && selectedDateData && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setShowDateModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-800">
                  {selectedDateData.date}
                </h3>
                <button
                  onClick={() => setShowDateModal(false)}
                  className="p-2 rounded-xl hover:bg-gray-100 transition-colors"
                >
                  <FaTimes className="text-gray-500" />
                </button>
              </div>

              {/* Mood Display */}
              {selectedDateData.mood ? (
                <div className="text-center mb-6">
                  <div className="text-6xl mb-3">{selectedDateData.mood.mood_emoji}</div>
                  <div className="text-lg font-semibold text-gray-800 mb-2">
                    {selectedDateData.mood.mood_label}
                  </div>
                  <div className="text-sm text-gray-500">
                    {new Date(selectedDateData.mood.created_at).toLocaleTimeString('en-US', {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </div>
                </div>
              ) : (
                <div className="text-center mb-6 py-8">
                  <div className="text-4xl mb-3 opacity-50">📝</div>
                  <div className="text-gray-500">No mood recorded for this date</div>
                </div>
              )}

              {/* Notes Section */}
              <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-4">
                <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                  <span>📝</span> Notes
                </h4>
                {selectedDateData.notes ? (
                  <div className="text-gray-700 leading-relaxed">
                    "{selectedDateData.notes}"
                  </div>
                ) : (
                  <div className="text-gray-500 italic">
                    No notes recorded for this day
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

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
