import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaTimes, FaHistory, FaSave, FaEdit } from 'react-icons/fa';
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
  const [isEditing, setIsEditing] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [savedMood, setSavedMood] = useState<number | null>(null);
  const [savedNotes, setSavedNotes] = useState('');
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  // Prevent background scroll when modals are open
  useEffect(() => {
    if (showDateModal || showHistory) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    
    // Cleanup on unmount
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [showDateModal, showHistory]);
  
  
  // Generate all dates with today as the 3rd card (index 2)
  const getAllMoodStats = () => {
    const stats = [];
    const today = new Date();
    
    // Generate dates: 2 days before today, today, then future dates
    // Total range: 30 days before today to 14 days after today (44 days total)
    for (let i = 29; i >= -14; i--) { // Start from 29 days ago, go to 14 days in future
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      
      // Find mood for this date (only for past and present dates)
      const moodForDate = recentMoods.find(mood => {
        const moodDate = new Date(mood.created_at);
        return moodDate.toDateString() === date.toDateString();
      });
      
      // Check if date is in the future
      const isFuture = date > today;
      
      stats.push({
        day: date.getDate(),
        dayName: date.toLocaleDateString('en-US', { weekday: 'short' }),
        monthName: date.toLocaleDateString('en-US', { month: 'short' }),
        mood: moodForDate?.mood_emoji || null,
        hasRecord: !!moodForDate,
        isToday: date.toDateString() === today.toDateString(),
        isFuture: isFuture,
        fullDate: date,
        moodData: moodForDate || null
      });
    }
    
    return stats;
  };
  
  const allMoodStats = getAllMoodStats();

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
        setSavedMood(todayMood.mood_level);
        setSavedNotes(todayMood.notes || '');
        setLastUpdated(todayMood.updated_at || todayMood.created_at);
        setIsEditing(false);
        setHasUnsavedChanges(false);
      }

      // Load all recent moods (no limit)
      const recent = await moodService.getRecentMoods(userData.id, 365); // Get up to 1 year of data
      setRecentMoods(recent);
    } catch (error) {
      console.error('Error loading mood data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMoodSelect = (moodLevel: number) => {
    if (!userData?.id) return;
    
    // Set mood without auto-saving
    setSelectedMood(moodLevel);
    setIsEditing(true);
    
    // Check if there are unsaved changes
    const hasChanges = moodLevel !== savedMood || notes !== savedNotes;
    setHasUnsavedChanges(hasChanges);
  };

  const updateRecentMoods = async () => {
    if (!userData?.id) return;
    
    try {
      const recent = await moodService.getRecentMoods(userData.id, 365); // Get up to 1 year of data
      setRecentMoods(recent);
    } catch (error) {
      console.error('Error updating recent moods:', error);
    }
  };

  const handleNotesChange = (newNotes: string) => {
    setNotes(newNotes);
    setIsEditing(true);
    
    // Check if there are unsaved changes
    const hasChanges = selectedMood !== savedMood || newNotes !== savedNotes;
    setHasUnsavedChanges(hasChanges);
  };

  const handleSave = async () => {
    if (!userData?.id || !selectedMood) return;
    
    try {
      // Set the timestamp to current time immediately for instant UI feedback
      const saveTime = new Date().toISOString();
      setLastUpdated(saveTime);
      
      const moodEntry = await moodService.setTodaysMood(userData.id, selectedMood, notes);
      if (moodEntry) {
        setTodaysMood(moodEntry);
        setSavedMood(selectedMood);
        setSavedNotes(notes);
        // Update with the actual timestamp from the database
        setLastUpdated(moodEntry.updated_at || moodEntry.created_at);
        setIsEditing(false);
        setHasUnsavedChanges(false);
        
        // Update recent moods after saving
        await updateRecentMoods();
      }
    } catch (error) {
      console.error('Error saving mood:', error);
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleCancel = () => {
    // Revert to saved values
    setSelectedMood(savedMood);
    setNotes(savedNotes);
    setIsEditing(false);
    setHasUnsavedChanges(false);
  };

  const handleDateClick = (stat: any) => {
    // Don't allow clicking on future dates
    if (stat.isFuture) {
      return;
    }
    
    const moodForDate = stat.moodData;
    const date = stat.fullDate;

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
      <div className="bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50 min-h-0 p-4 pb-8 animate-pulse">
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
    <div className="bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50 min-h-0 pb-4 rounded-2xl sm:rounded-3xl overflow-hidden">

      {/* How's Your Mood Today Section */}
      <div className="px-3 sm:px-4 mb-6 sm:mb-8 pt-4 sm:pt-6">
        <h2 className="text-lg sm:text-xl font-bold text-gray-800 mb-3 sm:mb-4">How's Your Mood Today</h2>
        
        {/* Mood Selection - Horizontal Layout */}
        <div className="w-full overflow-x-auto scrollbar-hide pl-1 pr-3 sm:pr-4 py-2 sm:py-3">
          <div className="flex items-center gap-3 sm:gap-4 pb-2" style={{ minWidth: 'max-content' }}>
            {MOOD_OPTIONS.map((mood) => (
              <motion.button
                key={mood.level}
                onClick={() => handleMoodSelect(mood.level)}
                className={`relative flex-shrink-0 w-14 h-14 sm:w-16 sm:h-16 rounded-full flex items-center justify-center transition-all duration-300 overflow-hidden ${
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
                <span className="filter drop-shadow-sm relative z-10 text-xl sm:text-2xl leading-none">{mood.emoji}</span>
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

      {/* All Mood Entries Section */}
      <div className="px-3 sm:px-4 mb-6 sm:mb-8">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base sm:text-lg font-bold text-gray-800">Mood History</h3>
          <button 
            onClick={() => setShowHistory(true)}
            className="text-purple-600 text-sm font-medium flex items-center gap-1 hover:text-purple-700 transition-colors"
          >
            <FaHistory className="text-xs" />
            View History
          </button>
        </div>
        
        {/* All Date Pills - Horizontal Scroll */}
        <div className="w-full overflow-x-auto scrollbar-hide pl-1 pr-3 sm:pr-4 py-2 sm:py-3" ref={(el) => {
          // Auto-scroll to show today as 3rd card when component loads
          if (el && allMoodStats.length > 0) {
            const todayIndex = allMoodStats.findIndex(stat => stat.isToday);
            if (todayIndex >= 2) {
              // Scroll to position today as the 3rd visible card
              const cardWidth = 72; // w-16 + gap
              const scrollPosition = (todayIndex - 2) * cardWidth;
              el.scrollLeft = scrollPosition;
            }
          }
        }}>
          <div className="flex gap-2 pb-2" style={{ minWidth: 'max-content' }}>
            {allMoodStats.map((stat, index) => {
              const colors = [
                'from-yellow-400 to-orange-500',
                'from-orange-400 to-red-500', 
                'from-green-400 to-emerald-500',
                'from-blue-400 to-cyan-500',
                'from-red-400 to-pink-500',
                'from-purple-400 to-indigo-500',
                'from-indigo-400 to-purple-500',
                'from-teal-400 to-cyan-500',
                'from-rose-400 to-pink-500',
                'from-violet-400 to-purple-500'
              ];
              
              // Different styling for past, present, and future dates
              const hasEntry = stat.hasRecord;
              const isFuture = stat.isFuture;
              
              let cardClass;
              if (isFuture) {
                // Future dates - lighter styling
                cardClass = 'bg-gradient-to-b from-blue-50 to-blue-100 text-blue-400 shadow-md border-2 border-dashed border-blue-200';
              } else if (hasEntry) {
                // Past/present dates with mood entries
                cardClass = `bg-gradient-to-b ${colors[index % colors.length]} text-white shadow-lg`;
              } else {
                // Past/present dates without mood entries
                cardClass = 'bg-gradient-to-b from-gray-100 to-gray-200 text-gray-500 shadow-md border-2 border-dashed border-gray-300';
              }
              
              return (
                <motion.button
                  key={`${stat.day}-${stat.fullDate.getTime()}`}
                  onClick={() => handleDateClick(stat)}
                  className={`flex-shrink-0 w-16 h-36 sm:w-18 sm:h-40 rounded-2xl sm:rounded-3xl ${cardClass} flex flex-col items-center justify-center transition-all duration-300 hover:scale-105 hover:shadow-xl cursor-pointer ${
                    stat.isToday ? 'ring-4 ring-white ring-opacity-70 scale-110 shadow-2xl' : ''
                  }`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.01 }}
                >
                  <span className={`text-xs sm:text-sm font-medium mb-1 ${
                    stat.isFuture ? 'text-blue-300' : hasEntry ? 'text-white/80' : 'text-gray-400'
                  }`}>
                    {stat.monthName}
                  </span>
                  <span className="text-lg sm:text-xl font-bold">{stat.day}</span>
                  <span className="text-xs sm:text-sm font-medium">{stat.dayName}</span>
                  {stat.isFuture ? (
                    <span className="text-lg sm:text-xl mt-1 sm:mt-2 opacity-50">🔮</span>
                  ) : stat.hasRecord ? (
                    <span className="text-xl sm:text-2xl mt-1 sm:mt-2">{stat.mood}</span>
                  ) : (
                    <span className="text-lg sm:text-xl mt-1 sm:mt-2 opacity-50">📝</span>
                  )}
                </motion.button>
              );
            })}
          </div>
        </div>
      </div>
      
      
      {/* Notes Section - Hidden by default, shown when mood selected */}
      {selectedMood && (
        <motion.div
          className="px-3 sm:px-4 mb-4 sm:mb-6"
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
        >
          <div className="bg-gradient-to-br from-white to-purple-50 rounded-2xl sm:rounded-3xl p-4 sm:p-5 shadow-lg sm:shadow-xl border border-purple-100">
            <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-white text-sm sm:text-lg">📝</span>
              </div>
              <h3 className="text-base sm:text-lg font-semibold text-gray-800">Share your thoughts</h3>
            </div>
            <textarea
              value={notes}
              onChange={(e) => handleNotesChange(e.target.value)}
              placeholder="How are you feeling today? What's on your mind? (optional)"
              className={`w-full h-20 sm:h-24 bg-transparent border-0 resize-none focus:outline-none text-gray-700 placeholder-gray-400 text-sm sm:text-base leading-relaxed ${
                !isEditing ? 'cursor-default' : ''
              }`}
              disabled={!isEditing}
              maxLength={500}
            />
            
            {/* Mobile-first responsive footer */}
            <div className="mt-3 pt-3 border-t border-purple-100 space-y-2 sm:space-y-0">
              {/* Top row on mobile: Privacy text and unsaved indicator */}
              <div className="flex items-center justify-between sm:justify-start sm:gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500 flex-shrink-0">Private & secure</span>
                  {lastUpdated && !isEditing && (
                    <span className="text-xs text-gray-400 flex-shrink-0">
                      • Updated {new Date(lastUpdated).toLocaleTimeString('en-US', {
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit'
                      })}
                    </span>
                  )}
                </div>
                {hasUnsavedChanges && (
                  <span className="text-xs text-amber-500 font-medium flex items-center gap-1">
                    <div className="w-2 h-2 bg-amber-400 rounded-full animate-pulse"></div>
                    <span className="hidden xs:inline">Unsaved changes</span>
                    <span className="xs:hidden">Unsaved</span>
                  </span>
                )}
              </div>
              
              {/* Bottom row on mobile: Character count and buttons */}
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs text-purple-500 font-medium">{notes.length}/500</span>
                
                {/* Action Buttons - Responsive sizing */}
                <div className="flex gap-1.5 sm:gap-2">
                  {!isEditing ? (
                    <motion.button
                      onClick={handleEdit}
                      className="flex items-center gap-1 px-2.5 py-1.5 sm:px-3 sm:py-1.5 bg-gradient-to-r from-blue-500 to-blue-600 text-white text-xs font-medium rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all duration-200 shadow-sm hover:shadow-md min-w-0"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <FaEdit className="text-xs flex-shrink-0" />
                      <span className="hidden xs:inline">Edit</span>
                    </motion.button>
                  ) : (
                    <>
                      <motion.button
                        onClick={handleCancel}
                        className="flex items-center gap-1 px-2 py-1.5 sm:px-3 sm:py-1.5 bg-gradient-to-r from-gray-400 to-gray-500 text-white text-xs font-medium rounded-lg hover:from-gray-500 hover:to-gray-600 transition-all duration-200 shadow-sm hover:shadow-md min-w-0"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <FaTimes className="text-xs flex-shrink-0" />
                        <span className="hidden xs:inline">Cancel</span>
                      </motion.button>
                      <motion.button
                        onClick={handleSave}
                        className="flex items-center gap-1 px-2.5 py-1.5 sm:px-3 sm:py-1.5 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white text-xs font-medium rounded-lg hover:from-emerald-600 hover:to-emerald-700 transition-all duration-200 shadow-sm hover:shadow-md min-w-0"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <FaSave className="text-xs flex-shrink-0" />
                        <span className="hidden xs:inline">Save</span>
                      </motion.button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Date Details Modal - Sticky with consistent sizing */}
      <AnimatePresence>
        {showDateModal && selectedDateData && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[9999] p-4"
            style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}
            onClick={() => setShowDateModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-3xl shadow-2xl w-full max-w-md h-[500px] flex flex-col relative"
              style={{ position: 'relative', zIndex: 10000 }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header - Fixed */}
              <div className="flex items-center justify-between p-6 pb-4 border-b border-gray-100 flex-shrink-0">
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

              {/* Modal Content - Scrollable */}
              <div className="flex-1 p-6 pt-4 overflow-y-auto">
                {/* Mood Display */}
                {selectedDateData.mood ? (
                  <div className="text-center mb-6">
                    <div className="text-6xl mb-3">{selectedDateData.mood.mood_emoji}</div>
                    <div className="text-lg font-semibold text-gray-800 mb-2">
                      {selectedDateData.mood.mood_label}
                    </div>
                    <div className="text-sm text-gray-500">
                      {new Date(selectedDateData.mood.updated_at || selectedDateData.mood.created_at).toLocaleTimeString('en-US', {
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit'
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
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Daily Mood History Modal - Sticky with smaller height */}
      <AnimatePresence>
        {showHistory && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[9999] p-4"
            style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}
            onClick={() => setShowHistory(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-3xl shadow-2xl w-full max-w-lg h-[65vh] flex flex-col relative"
              style={{ position: 'relative', zIndex: 10000 }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header - Fixed */}
              <div className="flex items-center justify-between p-6 pb-4 border-b border-gray-100 flex-shrink-0">
                <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                  <FaHistory className="text-purple-500" />
                  Mood History ({recentMoods.length} entries)
                </h3>
                <button
                  onClick={() => setShowHistory(false)}
                  className="p-2 rounded-xl hover:bg-gray-100 transition-colors"
                >
                  <FaTimes className="text-gray-500" />
                </button>
              </div>

              {/* Daily Mood History - Scrollable */}
              <div className="flex-1 overflow-y-auto p-6 pt-4">
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

                    // Format the full date - use updated_at if available, otherwise created_at
                    const displayDate = new Date(mood.updated_at || mood.created_at);
                    const fullDate = displayDate.toLocaleDateString('en-US', { 
                      year: 'numeric', 
                      month: 'short', 
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                      second: '2-digit'
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
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default MoodTracker;