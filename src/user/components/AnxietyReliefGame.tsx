import React, { useState, useEffect, useCallback } from 'react';
import { 
  FaGamepad, 
  FaHeart, 
  FaStar, 
  FaSmile, 
  FaLeaf, 
  FaSun, 
  FaCloud, 
  FaSnowflake,
  FaPlay,
  FaPause,
  FaRedo,
  FaTrophy,
  FaFire,
  FaInfoCircle
} from 'react-icons/fa';

interface AnxietyReliefGameProps {
  userData?: any;
}

interface GameItem {
  id: number;
  type: 'positive' | 'negative';
  icon: React.ComponentType<any>;
  color: string;
  bgColor: string;
  x: number;
  y: number;
  speed: number;
  collected: boolean;
}

const AnxietyReliefGame: React.FC<AnxietyReliefGameProps> = ({}) => {
  const [gameActive, setGameActive] = useState(false);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [gameItems, setGameItems] = useState<GameItem[]>([]);
  const [gameTime, setGameTime] = useState(0);
  const [level, setLevel] = useState(1);
  const [showInstructions, setShowInstructions] = useState(true);
  const [gameOver, setGameOver] = useState(false);
  const [highScore, setHighScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [showCombo, setShowCombo] = useState(false);

  // Positive items (collect these)
  const positiveItems = [
    { icon: FaHeart, color: 'text-pink-500', bgColor: 'bg-pink-100', points: 10 },
    { icon: FaSmile, color: 'text-yellow-500', bgColor: 'bg-yellow-100', points: 15 },
    { icon: FaLeaf, color: 'text-green-500', bgColor: 'bg-green-100', points: 12 },
    { icon: FaSun, color: 'text-orange-500', bgColor: 'bg-orange-100', points: 18 },
    { icon: FaStar, color: 'text-purple-500', bgColor: 'bg-purple-100', points: 20 }
  ];

  // Negative items (avoid these)
  const negativeItems = [
    { icon: FaCloud, color: 'text-gray-500', bgColor: 'bg-gray-100', damage: 1 },
    { icon: FaSnowflake, color: 'text-blue-500', bgColor: 'bg-blue-100', damage: 1 }
  ];

  // Load high score from localStorage
  useEffect(() => {
    const savedHighScore = localStorage.getItem('anxietyGameHighScore');
    if (savedHighScore) {
      setHighScore(parseInt(savedHighScore));
    }
  }, []);

  // Game loop
  useEffect(() => {
    let gameInterval: NodeJS.Timeout;
    let spawnInterval: NodeJS.Timeout;

    if (gameActive && !gameOver) {
      // Main game loop
      gameInterval = setInterval(() => {
        setGameTime(prev => prev + 1);
        
        // Move items down
        setGameItems(prevItems => 
          prevItems.map(item => ({
            ...item,
            y: item.y + item.speed
          })).filter(item => item.y < 100 && !item.collected)
        );

        // Check for items that reached bottom (missed positive items)
        setGameItems(prevItems => {
          const missedPositiveItems = prevItems.filter(
            item => item.y >= 95 && item.type === 'positive' && !item.collected
          );
          
          if (missedPositiveItems.length > 0) {
            setCombo(0); // Reset combo on missed items
          }
          
          return prevItems.filter(item => item.y < 95 || item.collected);
        });
      }, 100);

      // Spawn new items
      spawnInterval = setInterval(() => {
        spawnNewItem();
      }, 1500 - (level * 100)); // Faster spawning as level increases
    }

    return () => {
      clearInterval(gameInterval);
      clearInterval(spawnInterval);
    };
  }, [gameActive, gameOver, level]);

  // Level progression
  useEffect(() => {
    const newLevel = Math.floor(gameTime / 300) + 1; // Level up every 30 seconds
    if (newLevel > level) {
      setLevel(newLevel);
    }
  }, [gameTime, level]);

  const spawnNewItem = useCallback(() => {
    const isPositive = Math.random() > 0.3; // 70% chance for positive items
    const itemPool = isPositive ? positiveItems : negativeItems;
    const selectedItem = itemPool[Math.floor(Math.random() * itemPool.length)];
    
    const newItem: GameItem = {
      id: Date.now() + Math.random(),
      type: isPositive ? 'positive' : 'negative',
      icon: selectedItem.icon,
      color: selectedItem.color,
      bgColor: selectedItem.bgColor,
      x: Math.random() * 80 + 10, // Random x position (10-90%)
      y: -5,
      speed: Math.random() * 3 + 2.5 + (level * 0.8), // Speed increases with level
      collected: false
    };

    setGameItems(prev => [...prev, newItem]);
  }, [level]);

  const collectItem = (itemId: number) => {
    setGameItems(prevItems => {
      const targetItem = prevItems.find(item => item.id === itemId && !item.collected);
      if (!targetItem) return prevItems;
      
      if (targetItem.type === 'positive') {
        const basePoints = positiveItems.find(p => p.icon === targetItem.icon)?.points || 10;
        const comboMultiplier = Math.floor(combo / 5) + 1;
        const points = basePoints * comboMultiplier;
        
        setScore(prev => prev + points);
        setCombo(prev => prev + 1);
        setShowCombo(true);
        setTimeout(() => setShowCombo(false), 1000);
      } else {
        setLives(prev => {
          const newLives = prev - 1;
          if (newLives <= 0) {
            endGame();
          }
          return newLives;
        });
        setCombo(0); // Reset combo on negative item
      }
      
      return prevItems.map(item => 
        item.id === itemId ? { ...item, collected: true } : item
      );
    });
  };

  const startGame = () => {
    setGameActive(true);
    setGameOver(false);
    setScore(0);
    setLives(3);
    setGameItems([]);
    setGameTime(0);
    setLevel(1);
    setCombo(0);
    setShowInstructions(false);
  };

  const pauseGame = () => {
    setGameActive(false);
  };

  const resumeGame = () => {
    setGameActive(true);
  };

  const endGame = () => {
    setGameActive(false);
    setGameOver(true);
    
    // Update high score
    if (score > highScore) {
      setHighScore(score);
      localStorage.setItem('anxietyGameHighScore', score.toString());
    }
  };

  const resetGame = () => {
    setGameActive(false);
    setGameOver(false);
    setScore(0);
    setLives(3);
    setGameItems([]);
    setGameTime(0);
    setLevel(1);
    setCombo(0);
    setShowInstructions(true);
  };

  return (
    <div className="mb-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 mb-4 sm:mb-6 px-2">
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="relative">
            <div className="flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-purple-500 via-pink-500 to-rose-500 rounded-2xl sm:rounded-3xl shadow-2xl transform hover:scale-110 transition-all duration-300">
              <FaGamepad className="text-white text-lg sm:text-xl" />
            </div>
            <div className="absolute -top-1 -right-1 w-3 h-3 sm:w-4 sm:h-4 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center animate-pulse">
              <FaStar className="text-white text-xs" />
            </div>
          </div>
          <div className="flex-1">
            <h2 className="font-bold text-xl sm:text-2xl bg-gradient-to-r from-purple-600 via-pink-600 to-rose-600 bg-clip-text text-transparent mb-1">
              Mindful Collector
            </h2>
            <p className="text-xs sm:text-sm text-gray-600 font-medium">Collect positive thoughts, avoid negativity</p>
            <p className="text-xs text-gray-500 sm:hidden">Build mindfulness through play</p>
          </div>
        </div>
        <div className="flex sm:hidden items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl border border-purple-200 self-start">
          <FaInfoCircle className="text-purple-500 text-xs" />
          <span className="text-xs font-medium text-purple-700">Anxiety Relief</span>
        </div>
        <div className="hidden sm:flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl border border-purple-200">
          <FaInfoCircle className="text-purple-500 text-sm" />
          <span className="text-xs font-medium text-purple-700">Anxiety Relief</span>
        </div>
      </div>

      <div className="bg-gradient-to-br from-purple-50 via-pink-50 to-rose-50 rounded-2xl sm:rounded-3xl p-4 sm:p-6 lg:p-8 shadow-2xl border border-purple-200/50 backdrop-blur-sm relative overflow-hidden">
        {/* Decorative background elements */}
        <div className="absolute top-0 left-0 w-32 h-32 bg-gradient-to-br from-purple-200/30 to-transparent rounded-full -translate-x-16 -translate-y-16"></div>
        <div className="absolute bottom-0 right-0 w-40 h-40 bg-gradient-to-tl from-pink-200/30 to-transparent rounded-full translate-x-20 translate-y-20"></div>
        {/* Game Stats */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-0 mb-4 sm:mb-6">
          <div className="flex flex-wrap gap-2 sm:gap-4 lg:gap-6 w-full sm:w-auto">
            <div className="text-center bg-white/60 backdrop-blur-sm rounded-xl sm:rounded-2xl px-3 py-2 sm:px-4 sm:py-3 border border-white/50 shadow-lg hover:shadow-xl transition-all duration-300 flex-1 sm:flex-none min-w-0">
              <div className="text-xl sm:text-2xl lg:text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent truncate">{score}</div>
              <div className="text-xs font-medium text-gray-600 mt-1">Score</div>
            </div>
            <div className="text-center bg-white/60 backdrop-blur-sm rounded-xl sm:rounded-2xl px-3 py-2 sm:px-4 sm:py-3 border border-white/50 shadow-lg hover:shadow-xl transition-all duration-300">
              <div className="flex items-center justify-center gap-0.5 sm:gap-1 mb-1">
                {[...Array(3)].map((_, i) => (
                  <FaHeart 
                    key={i} 
                    className={`text-base sm:text-lg lg:text-xl transition-all duration-300 ${i < lives ? 'text-red-500 drop-shadow-sm animate-pulse' : 'text-gray-300'}`} 
                  />
                ))}
              </div>
              <div className="text-xs font-medium text-gray-600">Lives</div>
            </div>
            <div className="text-center bg-white/60 backdrop-blur-sm rounded-xl sm:rounded-2xl px-3 py-2 sm:px-4 sm:py-3 border border-white/50 shadow-lg hover:shadow-xl transition-all duration-300">
              <div className="text-lg sm:text-xl lg:text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">L{level}</div>
              <div className="text-xs font-medium text-gray-600 mt-1">Level</div>
            </div>
            {highScore > 0 && (
              <div className="text-center bg-gradient-to-br from-yellow-50 to-orange-50 backdrop-blur-sm rounded-xl sm:rounded-2xl px-3 py-2 sm:px-4 sm:py-3 border border-yellow-200 shadow-lg hover:shadow-xl transition-all duration-300 flex-1 sm:flex-none min-w-0">
                <div className="flex items-center justify-center gap-1 sm:gap-2 mb-1">
                  <FaTrophy className="text-yellow-500 text-sm sm:text-base lg:text-lg animate-bounce" />
                  <span className="text-lg sm:text-xl lg:text-2xl font-bold bg-gradient-to-r from-yellow-600 to-orange-600 bg-clip-text text-transparent truncate">{highScore}</span>
                </div>
                <div className="text-xs font-medium text-yellow-700">Best</div>
              </div>
            )}
          </div>
          
          {combo > 0 && (
            <div className={`flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl sm:rounded-2xl bg-gradient-to-r from-orange-100 via-red-100 to-pink-100 border border-orange-300 shadow-lg transition-all duration-300 ${showCombo ? 'scale-110 shadow-2xl' : ''} mt-2 sm:mt-0 self-start sm:self-auto`}>
              <FaFire className="text-orange-500 text-sm sm:text-base lg:text-lg animate-pulse" />
              <span className="text-sm sm:text-base lg:text-lg font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">{combo}x</span>
              <span className="text-xs font-medium text-orange-700 hidden sm:inline">COMBO</span>
            </div>
          )}
        </div>

        {/* Compact Instructions */}
        {showInstructions && (
          <div className="bg-gradient-to-br from-white/90 to-purple-50/90 backdrop-blur-md rounded-2xl p-4 mb-4 border border-white/60 shadow-xl relative overflow-hidden">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-lg text-gray-800 flex items-center gap-2">
                <div className="w-6 h-6 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                  <FaGamepad className="text-white text-xs" />
                </div>
                <span className="bg-gradient-to-r from-purple-700 to-pink-700 bg-clip-text text-transparent">Quick Guide</span>
              </h3>
            </div>
            <div className="flex items-center justify-center gap-6 text-xs text-gray-700">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                  <FaHeart className="text-white text-xs" />
                </div>
                <span className="font-medium text-green-700">Collect +</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
                  <FaCloud className="text-white text-xs" />
                </div>
                <span className="font-medium text-red-700">Avoid -</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-orange-500 rounded-full flex items-center justify-center">
                  <FaFire className="text-white text-xs" />
                </div>
                <span className="font-medium text-orange-700">Combo!</span>
              </div>
            </div>
          </div>
        )}

        {/* Game Area */}
        <div className="relative bg-gradient-to-b from-sky-100 via-blue-50 to-green-100 rounded-2xl sm:rounded-3xl h-64 sm:h-72 lg:h-80 overflow-hidden border-2 border-white/60 mb-4 sm:mb-6 shadow-inner touch-manipulation">
          {/* Animated background particles */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-white/30 rounded-full animate-ping"></div>
            <div className="absolute top-3/4 right-1/3 w-1 h-1 bg-white/40 rounded-full animate-pulse"></div>
            <div className="absolute top-1/2 right-1/4 w-1.5 h-1.5 bg-white/20 rounded-full animate-ping" style={{animationDelay: '1s'}}></div>
          </div>
          {/* Game Items */}
          {gameItems.map((item) => (
            <button
              key={item.id}
              className={`absolute w-12 h-12 sm:w-14 sm:h-14 ${item.bgColor} rounded-xl sm:rounded-2xl flex items-center justify-center shadow-2xl border-2 border-white/80 transition-all duration-300 hover:scale-125 active:scale-110 hover:rotate-12 hover:shadow-3xl ${item.collected ? 'opacity-0 scale-200 rotate-180' : 'hover:border-white animate-pulse'} ${item.type === 'positive' ? 'hover:ring-2 hover:ring-green-300' : 'hover:ring-2 hover:ring-red-300'} touch-manipulation`}
              style={{
                left: `${item.x}%`,
                top: `${item.y}%`,
                transform: 'translate(-50%, -50%)',
                filter: item.collected ? 'blur(2px)' : 'none',
                minHeight: '48px',
                minWidth: '48px'
              }}
              onClick={() => collectItem(item.id)}
              disabled={item.collected}
            >
              <item.icon className={`${item.color} text-lg sm:text-xl drop-shadow-sm`} />
              {item.type === 'positive' && (
                <div className="absolute -top-1 -right-1 w-2.5 h-2.5 sm:w-3 sm:h-3 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full animate-ping"></div>
              )}
            </button>
          ))}

          {/* Game Over Overlay */}
          {gameOver && (
            <div className="absolute inset-0 bg-gradient-to-br from-black/70 via-purple-900/50 to-pink-900/50 backdrop-blur-md flex items-center justify-center p-3 z-50">
              <div className="bg-gradient-to-br from-white via-purple-50 to-pink-50 rounded-xl p-3 text-center shadow-3xl border border-white/50 w-full max-w-[280px] relative overflow-hidden transform scale-100 animate-in fade-in zoom-in duration-300 mx-2">
                <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-purple-100/30 to-pink-100/30 rounded-xl"></div>
                <div className="relative z-20">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-500 via-pink-500 to-rose-500 rounded-xl flex items-center justify-center mx-auto mb-3 shadow-2xl animate-bounce">
                    <FaTrophy className="text-white text-lg" />
                  </div>
                  <h3 className="text-lg font-bold bg-gradient-to-r from-purple-700 to-pink-700 bg-clip-text text-transparent mb-3">Game Complete!</h3>
                  <div className="space-y-1 mb-4">
                    <p className="text-xs text-gray-700">Final Score:</p>
                    <div className="font-bold text-xl bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">{score}</div>
                    <div className="flex justify-center gap-3 text-xs text-gray-600">
                      <span>Level: <span className="font-bold text-indigo-600">{level}</span></span>
                      <span>Combo: <span className="font-bold text-orange-600">{combo}x</span></span>
                    </div>
                  </div>
                  {score === highScore && score > 0 && (
                    <div className="bg-gradient-to-r from-yellow-100 to-orange-100 border border-yellow-300 rounded-lg p-2 mb-3">
                      <p className="text-xs font-bold text-yellow-700 flex items-center justify-center gap-1">
                        <FaStar className="text-yellow-500 text-xs" />
                        <span>🎉 New High Score! 🎉</span>
                        <FaStar className="text-yellow-500 text-xs" />
                      </p>
                    </div>
                  )}
                  <button
                    onClick={resetGame}
                    className="bg-gradient-to-r from-purple-500 via-pink-500 to-rose-500 text-white px-4 py-2.5 rounded-lg font-bold hover:from-purple-600 hover:via-pink-600 hover:to-rose-600 transition-all duration-300 shadow-2xl hover:shadow-3xl hover:scale-105 transform text-sm w-full"
                  >
                    Play Again
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Paused Overlay */}
          {!gameActive && !gameOver && !showInstructions && (
            <div className="absolute inset-0 bg-gradient-to-br from-black/40 to-purple-900/30 backdrop-blur-md flex items-center justify-center">
              <div className="bg-gradient-to-br from-white/95 to-purple-50/95 rounded-3xl p-6 text-center shadow-2xl border border-white/60">
                <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center mx-auto mb-3">
                  <FaPause className="text-white text-xl" />
                </div>
                <p className="text-lg font-bold bg-gradient-to-r from-purple-700 to-pink-700 bg-clip-text text-transparent">Game Paused</p>
                <p className="text-sm text-gray-600 mt-1">Tap resume to continue</p>
              </div>
            </div>
          )}
        </div>

        {/* Game Controls */}
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-stretch sm:items-center">
          {!gameActive && !gameOver ? (
            <button
              onClick={showInstructions ? startGame : resumeGame}
              className="flex items-center justify-center gap-2 sm:gap-3 bg-gradient-to-r from-green-500 via-emerald-500 to-teal-500 text-white px-6 sm:px-8 py-3 sm:py-4 rounded-xl sm:rounded-2xl font-bold hover:from-green-600 hover:via-emerald-600 hover:to-teal-600 transition-all duration-300 shadow-2xl hover:shadow-3xl hover:scale-105 sm:hover:scale-110 transform group touch-manipulation min-h-[48px]"
            >
              <FaPlay className="text-base sm:text-lg group-hover:scale-125 transition-transform duration-300" />
              <span className="text-base sm:text-lg">{showInstructions ? 'Start Adventure' : 'Resume Game'}</span>
            </button>
          ) : gameActive ? (
            <button
              onClick={pauseGame}
              className="flex items-center justify-center gap-2 sm:gap-3 bg-gradient-to-r from-yellow-500 via-orange-500 to-red-500 text-white px-6 sm:px-8 py-3 sm:py-4 rounded-xl sm:rounded-2xl font-bold hover:from-yellow-600 hover:via-orange-600 hover:to-red-600 transition-all duration-300 shadow-2xl hover:shadow-3xl hover:scale-105 sm:hover:scale-110 transform group touch-manipulation min-h-[48px]"
            >
              <FaPause className="text-base sm:text-lg group-hover:scale-125 transition-transform duration-300" />
              <span className="text-base sm:text-lg">Pause Game</span>
            </button>
          ) : null}
          
          {!showInstructions && (
            <button
              onClick={resetGame}
              className="flex items-center justify-center gap-2 sm:gap-3 bg-gradient-to-r from-gray-500 via-slate-500 to-gray-600 text-white px-6 sm:px-8 py-3 sm:py-4 rounded-xl sm:rounded-2xl font-bold hover:from-gray-600 hover:via-slate-600 hover:to-gray-700 transition-all duration-300 shadow-2xl hover:shadow-3xl hover:scale-105 sm:hover:scale-110 transform group touch-manipulation min-h-[48px]"
            >
              <FaRedo className="text-base sm:text-lg group-hover:rotate-180 transition-transform duration-300" />
              <span className="text-base sm:text-lg">New Game</span>
            </button>
          )}
        </div>

        {/* Compact Benefits */}
        <div className="mt-4 bg-gradient-to-r from-green-50/80 to-emerald-50/80 backdrop-blur-md rounded-xl p-3 border border-green-200/50 shadow-lg">
          <div className="flex items-center justify-center gap-4 text-xs text-gray-700">
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="font-medium text-green-700">Focus</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span className="font-medium text-blue-700">Calm</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
              <span className="font-medium text-purple-700">Positive</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
              <span className="font-medium text-orange-700">Coordination</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnxietyReliefGame;
