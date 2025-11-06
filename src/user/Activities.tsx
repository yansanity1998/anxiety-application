import { useState, useMemo } from 'react';
import { 
  FaArrowLeft, 
  FaSearch,
  FaTimes
} from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import AnxietyReliefGame from './components/AnxietyReliefGame';
import BrainTrainingGame from './components/BrainTrainingGame';
import AnxietyMonsterTamer from './components/AnxietyMonsterTamer';

const Activities = () => {
  const navigate = useNavigate();
  const [userData] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  const goBack = () => {
    navigate('/dashboard');
  };

  // Game data for filtering
  const games = [
    {
      id: 'anxiety-relief',
      name: 'Anxiety Relief',
      description: 'Catch positive items, avoid negative ones',
      keywords: ['anxiety', 'relief', 'catch', 'calm', 'mindfulness'],
      component: <AnxietyReliefGame userData={userData} />
    },
    {
      id: 'brain-training',
      name: 'Memory Master',
      description: 'Match cards to train your memory',
      keywords: ['brain', 'memory', 'match', 'cards', 'cognitive'],
      component: <BrainTrainingGame userData={userData} />
    },
    {
      id: 'monster-tamer',
      name: 'Anxiety Monster Tamer',
      description: 'Transform anxious vibes into good energy',
      keywords: ['monster', 'tamer', 'anxiety', 'energy', 'tap'],
      component: <AnxietyMonsterTamer userData={userData} />
    }
  ];

  // Filter games based on search query
  const filteredGames = useMemo(() => {
    if (!searchQuery.trim()) return games;
    
    const query = searchQuery.toLowerCase();
    return games.filter(game => 
      game.name.toLowerCase().includes(query) ||
      game.description.toLowerCase().includes(query) ||
      game.keywords.some(keyword => keyword.includes(query))
    );
  }, [searchQuery]);

  return (
    <div className="min-h-screen bg-[#800000]/20 w-full" style={{ maxWidth: '100vw' }}>
      {/* Header */}
      <div className="bg-[#800000] border-b border-white/10 sticky top-0 z-50 shadow-lg w-full backdrop-blur-sm">
        <div className="relative px-3 sm:px-4 md:px-6 py-3 sm:py-4 w-full max-w-full">
          <div className="flex items-center justify-between w-full max-w-full">
            {/* Left: Back Button & Title */}
            <div className="flex items-center space-x-3 sm:space-x-4 flex-1 min-w-0">
              <button
                onClick={goBack}
                className="flex-shrink-0 bg-white/10 hover:bg-white/20 rounded-full transition-colors w-10 h-10 flex items-center justify-center border border-white/20"
                aria-label="Go back to dashboard"
              >
                <FaArrowLeft className="text-white text-base" />
              </button>
              
              <div className="flex items-center space-x-2 sm:space-x-3 min-w-0 flex-1">
                <div className="flex-shrink-0">
                  <img 
                    src="/lotus.png" 
                    alt="Lotus" 
                    className="h-8 w-8 sm:h-10 sm:w-10" 
                  />
                </div>
                
                <div className="flex-1 min-w-0">
                  <h1 
                    className="text-lg sm:text-xl md:text-2xl font-bold text-white truncate"
                    style={{ 
                      textShadow: '0 2px 8px rgba(0,0,0,0.4), 0 0 30px rgba(255,255,255,0.15)'
                    }}
                  >
                    Activities
                  </h1>
                  <p className="text-xs sm:text-sm text-white/80 truncate">
                    Fun wellness challenges & games
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content - Minimalist Design */}
      <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 py-8 pb-24">
        
        {/* Search Bar - Minimalist & Responsive */}
        <div className="mb-8 sm:mb-12">
          <div className="relative max-w-2xl mx-auto">
            <FaSearch className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm sm:text-lg" />
            <input
              type="text"
              placeholder="Search games..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 sm:pl-12 pr-10 sm:pr-12 py-3 sm:py-4 bg-white border border-gray-200 rounded-xl sm:rounded-2xl text-gray-800 placeholder-gray-400 focus:outline-none focus:border-[#800000] focus:ring-2 focus:ring-[#800000]/20 transition-all text-base sm:text-lg"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <FaTimes className="text-sm sm:text-lg" />
              </button>
            )}
          </div>
          
          {/* Results count */}
          {searchQuery && (
            <p className="text-center mt-3 sm:mt-4 text-xs sm:text-sm text-gray-600">
              {filteredGames.length} {filteredGames.length === 1 ? 'game' : 'games'} found
            </p>
          )}
        </div>

        {/* Games Grid - With Containers */}
        <div className="space-y-6 sm:space-y-8">
          {filteredGames.length > 0 ? (
            filteredGames.map((game) => (
              <div 
                key={game.id}
                className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-shadow"
              >
                {game.component}
              </div>
            ))
          ) : (
            <div className="text-center py-16">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FaSearch className="text-gray-400 text-2xl" />
              </div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">No games found</h3>
              <p className="text-gray-600 mb-6">Try searching with different keywords</p>
              <button
                onClick={() => setSearchQuery('')}
                className="px-6 py-2 bg-[#800000] text-white rounded-lg hover:bg-[#600000] transition-colors"
              >
                Clear search
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Activities;
