import { useState, useEffect, useCallback } from 'react';
import { 
  FaBrain, 
  FaPlay, 
  FaPause, 
  FaRedo, 
  FaTrophy,
  FaEye,
  FaClock,
  FaInfoCircle,
  FaStar,
  FaLightbulb
} from 'react-icons/fa';

interface BrainTrainingGameProps {
  userData?: any;
}

interface MemoryCard {
  id: number;
  value: string;
  isFlipped: boolean;
  isMatched: boolean;
  color: string;
}

const BrainTrainingGame: React.FC<BrainTrainingGameProps> = ({}) => {
  const [gameActive, setGameActive] = useState(false);
  const [score, setScore] = useState(0);
  const [level, setLevel] = useState(1);
  const [cards, setCards] = useState<MemoryCard[]>([]);
  const [flippedCards, setFlippedCards] = useState<number[]>([]);
  const [gameTime, setGameTime] = useState(0);
  const [showInstructions, setShowInstructions] = useState(true);
  const [gameOver, setGameOver] = useState(false);
  const [highScore, setHighScore] = useState(0);
  const [matches, setMatches] = useState(0);
  const [attempts, setAttempts] = useState(0);

  // Memory symbols with colors
  const symbols = [
    { value: '🧠', color: 'bg-blue-100' },
    { value: '💚', color: 'bg-green-100' },
    { value: '🌟', color: 'bg-yellow-100' },
    { value: '🔥', color: 'bg-red-100' },
    { value: '🌸', color: 'bg-pink-100' },
    { value: '🍃', color: 'bg-emerald-100' },
    { value: '⚡', color: 'bg-orange-100' },
    { value: '💎', color: 'bg-purple-100' }
  ];

  // Load high score from localStorage
  useEffect(() => {
    const savedHighScore = localStorage.getItem('brainGameHighScore');
    if (savedHighScore) {
      setHighScore(parseInt(savedHighScore));
    }
  }, []);

  // Game timer
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (gameActive && !gameOver) {
      timer = setInterval(() => {
        setGameTime(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [gameActive, gameOver]);

  // Check for game completion
  useEffect(() => {
    if (cards.length > 0 && cards.every(card => card.isMatched)) {
      // Level completed
      const timeBonus = Math.max(0, 60 - gameTime) * 10;
      const levelBonus = level * 100;
      const totalScore = score + timeBonus + levelBonus;
      
      setScore(totalScore);
      
      if (level < 5) {
        // Next level
        setTimeout(() => {
          setLevel(prev => prev + 1);
          setGameTime(0);
          setMatches(0);
          setAttempts(0);
          initializeCards(level + 1);
        }, 1500);
      } else {
        // Game completed
        endGame();
      }
    }
  }, [cards, score, level, gameTime]);

  const initializeCards = useCallback((currentLevel: number) => {
    const pairsCount = Math.min(4 + currentLevel, 8); // 5-8 pairs based on level
    const selectedSymbols = symbols.slice(0, pairsCount);
    
    const cardPairs: MemoryCard[] = [];
    selectedSymbols.forEach((symbol, index) => {
      // Create two cards for each symbol
      cardPairs.push(
        {
          id: index * 2,
          value: symbol.value,
          isFlipped: false,
          isMatched: false,
          color: symbol.color
        },
        {
          id: index * 2 + 1,
          value: symbol.value,
          isFlipped: false,
          isMatched: false,
          color: symbol.color
        }
      );
    });

    // Shuffle cards
    const shuffledCards = cardPairs.sort(() => Math.random() - 0.5);
    setCards(shuffledCards);
    setFlippedCards([]);
  }, []);

  const flipCard = (cardId: number) => {
    if (flippedCards.length >= 2 || flippedCards.includes(cardId)) return;
    
    const newFlippedCards = [...flippedCards, cardId];
    setFlippedCards(newFlippedCards);
    
    // Update card state
    setCards(prevCards => 
      prevCards.map(card => 
        card.id === cardId ? { ...card, isFlipped: true } : card
      )
    );

    if (newFlippedCards.length === 2) {
      setAttempts(prev => prev + 1);
      
      // Check for match after a short delay
      setTimeout(() => {
        const [firstId, secondId] = newFlippedCards;
        const firstCard = cards.find(c => c.id === firstId);
        const secondCard = cards.find(c => c.id === secondId);
        
        if (firstCard && secondCard && firstCard.value === secondCard.value) {
          // Match found
          setCards(prevCards => 
            prevCards.map(card => 
              (card.id === firstId || card.id === secondId) 
                ? { ...card, isMatched: true }
                : card
            )
          );
          setMatches(prev => prev + 1);
          setScore(prev => prev + 50 + (level * 10));
        } else {
          // No match - flip cards back
          setCards(prevCards => 
            prevCards.map(card => 
              (card.id === firstId || card.id === secondId) 
                ? { ...card, isFlipped: false }
                : card
            )
          );
        }
        
        setFlippedCards([]);
      }, 1000);
    }
  };

  const startGame = () => {
    setGameActive(true);
    setGameOver(false);
    setScore(0);
    setLevel(1);
    setGameTime(0);
    setMatches(0);
    setAttempts(0);
    setShowInstructions(false);
    initializeCards(1);
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
      localStorage.setItem('brainGameHighScore', score.toString());
    }
  };

  const resetGame = () => {
    setGameActive(false);
    setGameOver(false);
    setScore(0);
    setLevel(1);
    setGameTime(0);
    setMatches(0);
    setAttempts(0);
    setCards([]);
    setFlippedCards([]);
    setShowInstructions(true);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getAccuracy = () => {
    return attempts > 0 ? Math.round((matches / attempts) * 100) : 0;
  };

  return (
    <div className="mb-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 mb-4 sm:mb-6 px-2">
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="relative">
            <div className="flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-indigo-500 via-purple-500 to-blue-600 rounded-2xl sm:rounded-3xl shadow-2xl transform hover:scale-110 transition-all duration-300">
              <FaBrain className="text-white text-lg sm:text-xl" />
            </div>
            <div className="absolute -top-1 -right-1 w-3 h-3 sm:w-4 sm:h-4 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center animate-pulse">
              <FaLightbulb className="text-white text-xs" />
            </div>
          </div>
          <div className="flex-1">
            <h2 className="font-bold text-xl sm:text-2xl bg-gradient-to-r from-indigo-600 via-purple-600 to-blue-600 bg-clip-text text-transparent mb-1">
              Memory Master
            </h2>
            <p className="text-xs sm:text-sm text-gray-600 font-medium">Train your memory and cognitive skills</p>
            <p className="text-xs text-gray-500 sm:hidden">Enhance brain power through play</p>
          </div>
        </div>
        <div className="flex sm:hidden items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl border border-indigo-200 self-start">
          <FaInfoCircle className="text-indigo-500 text-xs" />
          <span className="text-xs font-medium text-indigo-700">Brain Training</span>
        </div>
        <div className="hidden sm:flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-2xl border border-indigo-200">
          <FaInfoCircle className="text-indigo-500 text-sm" />
          <span className="text-xs font-medium text-indigo-700">Brain Training</span>
        </div>
      </div>

      <div className="bg-gradient-to-br from-indigo-50 via-purple-50 to-blue-50 rounded-2xl sm:rounded-3xl p-4 sm:p-6 lg:p-8 shadow-2xl border border-indigo-200/50 backdrop-blur-sm relative overflow-hidden">
        {/* Decorative background elements */}
        <div className="absolute top-0 left-0 w-32 h-32 bg-gradient-to-br from-indigo-200/30 to-transparent rounded-full -translate-x-16 -translate-y-16"></div>
        <div className="absolute bottom-0 right-0 w-40 h-40 bg-gradient-to-tl from-purple-200/30 to-transparent rounded-full translate-x-20 translate-y-20"></div>
        {/* Game Stats */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-0 mb-4 sm:mb-6">
          <div className="flex flex-wrap gap-2 sm:gap-4 lg:gap-6 w-full sm:w-auto">
            <div className="text-center bg-white/60 backdrop-blur-sm rounded-xl sm:rounded-2xl px-3 py-2 sm:px-4 sm:py-3 border border-white/50 shadow-lg hover:shadow-xl transition-all duration-300 flex-1 sm:flex-none min-w-0">
              <div className="text-xl sm:text-2xl lg:text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent truncate">{score}</div>
              <div className="text-xs font-medium text-gray-600 mt-1">Score</div>
            </div>
            <div className="text-center bg-white/60 backdrop-blur-sm rounded-xl sm:rounded-2xl px-3 py-2 sm:px-4 sm:py-3 border border-white/50 shadow-lg hover:shadow-xl transition-all duration-300">
              <div className="text-lg sm:text-xl lg:text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">L{level}</div>
              <div className="text-xs font-medium text-gray-600 mt-1">Level</div>
            </div>
            <div className="text-center bg-white/60 backdrop-blur-sm rounded-xl sm:rounded-2xl px-3 py-2 sm:px-4 sm:py-3 border border-white/50 shadow-lg hover:shadow-xl transition-all duration-300 flex-1 sm:flex-none min-w-0">
              <div className="flex items-center justify-center gap-1 sm:gap-2 mb-1">
                <FaClock className="text-blue-500 text-sm sm:text-base lg:text-lg animate-pulse" />
                <span className="text-lg sm:text-xl lg:text-2xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent truncate">{formatTime(gameTime)}</span>
              </div>
              <div className="text-xs font-medium text-gray-600">Time</div>
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
          
          {attempts > 0 && (
            <div className="flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl sm:rounded-2xl bg-gradient-to-r from-green-100 via-emerald-100 to-teal-100 border border-green-300 shadow-lg mt-2 sm:mt-0 self-start sm:self-auto">
              <FaEye className="text-green-500 text-sm sm:text-base lg:text-lg animate-pulse" />
              <span className="text-sm sm:text-base lg:text-lg font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">{getAccuracy()}%</span>
              <span className="text-xs font-medium text-green-700 hidden sm:inline">ACCURACY</span>
            </div>
          )}
        </div>

        {/* Instructions */}
        {showInstructions && (
          <div className="bg-gradient-to-br from-white/90 to-indigo-50/90 backdrop-blur-md rounded-3xl p-6 mb-6 border border-white/60 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-bl from-indigo-200/30 to-transparent rounded-full translate-x-10 -translate-y-10"></div>
            <h3 className="font-bold text-xl text-gray-800 mb-4 flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-2xl flex items-center justify-center">
                <FaBrain className="text-white text-sm" />
              </div>
              <span className="bg-gradient-to-r from-indigo-700 to-purple-700 bg-clip-text text-transparent">How to Play</span>
            </h3>
            <div className="text-sm text-gray-700 space-y-3">
              <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-2xl border border-blue-200">
                <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <FaEye className="text-white text-xs" />
                </div>
                <p><strong className="text-blue-700">Flip cards</strong> - Tap any card to reveal what's underneath</p>
              </div>
              <div className="flex items-start gap-3 p-3 bg-purple-50 rounded-2xl border border-purple-200">
                <div className="w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <FaBrain className="text-white text-xs" />
                </div>
                <p><strong className="text-purple-700">Remember locations</strong> - Use your memory to recall card positions</p>
              </div>
              <div className="flex items-start gap-3 p-3 bg-green-50 rounded-2xl border border-green-200">
                <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <FaStar className="text-white text-xs" />
                </div>
                <p><strong className="text-green-700">Match pairs</strong> - Find all matching symbols to advance levels</p>
              </div>
              <div className="flex items-start gap-3 p-3 bg-orange-50 rounded-2xl border border-orange-200">
                <div className="w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <FaClock className="text-white text-xs" />
                </div>
                <p><strong className="text-orange-700">Speed bonus</strong> - Complete levels faster for extra points!</p>
              </div>
            </div>
          </div>
        )}

        {/* Game Area */}
        <div className="relative bg-gradient-to-b from-white via-indigo-50 to-purple-50 rounded-2xl sm:rounded-3xl p-3 sm:p-4 lg:p-6 overflow-hidden border-2 border-white/60 mb-4 sm:mb-6 shadow-inner touch-manipulation">
          {/* Animated background particles */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-indigo-200/40 rounded-full animate-ping"></div>
            <div className="absolute top-3/4 right-1/3 w-1 h-1 bg-purple-200/50 rounded-full animate-pulse"></div>
            <div className="absolute top-1/2 right-1/4 w-1.5 h-1.5 bg-blue-200/30 rounded-full animate-ping" style={{animationDelay: '1s'}}></div>
          </div>
          {/* Memory Cards Grid */}
          <div className={`grid gap-2 sm:gap-3 lg:gap-4 justify-center relative z-10 ${
            cards.length <= 10 ? 'grid-cols-5' : 
            cards.length <= 12 ? 'grid-cols-4' : 
            'grid-cols-4'
          }`}>
            {cards.map((card) => (
              <button
                key={card.id}
                className={`w-14 h-14 sm:w-18 sm:h-18 lg:w-24 lg:h-24 rounded-xl sm:rounded-2xl border-2 transition-all duration-500 flex items-center justify-center text-2xl sm:text-3xl font-bold shadow-2xl hover:scale-110 active:scale-105 hover:rotate-3 transform ${
                  card.isFlipped || card.isMatched
                    ? `${card.color} border-white/80 shadow-3xl backdrop-blur-sm`
                    : 'bg-gradient-to-br from-indigo-200 via-purple-200 to-blue-200 border-indigo-400 hover:from-indigo-300 hover:via-purple-300 hover:to-blue-300 hover:border-white'
                } ${card.isMatched ? 'ring-2 sm:ring-4 ring-green-400 animate-pulse' : ''} ${card.isFlipped && !card.isMatched ? 'animate-bounce' : ''} touch-manipulation`}
                style={{
                  minHeight: '56px',
                  minWidth: '56px'
                }}
                onClick={() => flipCard(card.id)}
                disabled={!gameActive || card.isFlipped || card.isMatched || flippedCards.length >= 2}
              >
                {card.isFlipped || card.isMatched ? (
                  <span className="drop-shadow-lg filter brightness-110">{card.value}</span>
                ) : (
                  <div className="relative">
                    <FaBrain className="text-indigo-500 text-lg sm:text-xl lg:text-2xl opacity-60" />
                    <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent rounded-full"></div>
                  </div>
                )}
                {card.isMatched && (
                  <div className="absolute -top-1 -right-1 sm:-top-2 sm:-right-2 w-4 h-4 sm:w-6 sm:h-6 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full flex items-center justify-center animate-ping">
                    <FaStar className="text-white text-xs" />
                  </div>
                )}
              </button>
            ))}
          </div>

          {/* Game Over Overlay */}
          {gameOver && (
            <div className="absolute inset-0 bg-gradient-to-br from-black/60 via-indigo-900/40 to-purple-900/40 backdrop-blur-md flex items-center justify-center">
              <div className="bg-gradient-to-br from-white via-indigo-50 to-purple-50 rounded-3xl p-8 text-center shadow-3xl border border-white/50 max-w-sm mx-4 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-indigo-100/30 to-purple-100/30 rounded-3xl"></div>
                <div className="relative z-10">
                  <div className="w-20 h-20 bg-gradient-to-br from-indigo-500 via-purple-500 to-blue-500 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-2xl animate-bounce">
                    <FaTrophy className="text-white text-3xl" />
                  </div>
                  <h3 className="text-2xl font-bold bg-gradient-to-r from-indigo-700 to-purple-700 bg-clip-text text-transparent mb-4">Training Complete!</h3>
                  <div className="space-y-2 mb-6">
                    <p className="text-gray-700">Final Score: <span className="font-bold text-2xl bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">{score}</span></p>
                    <p className="text-gray-600">Accuracy: <span className="font-bold text-green-600">{getAccuracy()}%</span></p>
                    <p className="text-gray-600">Total Time: <span className="font-bold text-blue-600">{formatTime(gameTime)}</span></p>
                    <p className="text-gray-600">Levels Completed: <span className="font-bold text-purple-600">{level}</span></p>
                  </div>
                  {score === highScore && score > 0 && (
                    <div className="bg-gradient-to-r from-yellow-100 to-orange-100 border border-yellow-300 rounded-2xl p-3 mb-6">
                      <p className="text-lg font-bold text-yellow-700 flex items-center justify-center gap-2">
                        <FaStar className="text-yellow-500" />
                        🎉 New High Score! 🎉
                        <FaStar className="text-yellow-500" />
                      </p>
                    </div>
                  )}
                  <button
                    onClick={resetGame}
                    className="bg-gradient-to-r from-indigo-500 via-purple-500 to-blue-500 text-white px-8 py-3 rounded-2xl font-bold hover:from-indigo-600 hover:via-purple-600 hover:to-blue-600 transition-all duration-300 shadow-2xl hover:shadow-3xl hover:scale-105 transform"
                  >
                    Train Again
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Paused Overlay */}
          {!gameActive && !gameOver && !showInstructions && (
            <div className="absolute inset-0 bg-gradient-to-br from-black/40 to-indigo-900/30 backdrop-blur-md flex items-center justify-center">
              <div className="bg-gradient-to-br from-white/95 to-indigo-50/95 rounded-3xl p-6 text-center shadow-2xl border border-white/60">
                <div className="w-12 h-12 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-2xl flex items-center justify-center mx-auto mb-3">
                  <FaPause className="text-white text-xl" />
                </div>
                <p className="text-lg font-bold bg-gradient-to-r from-indigo-700 to-purple-700 bg-clip-text text-transparent">Training Paused</p>
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
              <span className="text-base sm:text-lg">{showInstructions ? 'Start Training' : 'Resume Training'}</span>
            </button>
          ) : gameActive ? (
            <button
              onClick={pauseGame}
              className="flex items-center justify-center gap-2 sm:gap-3 bg-gradient-to-r from-yellow-500 via-orange-500 to-red-500 text-white px-6 sm:px-8 py-3 sm:py-4 rounded-xl sm:rounded-2xl font-bold hover:from-yellow-600 hover:via-orange-600 hover:to-red-600 transition-all duration-300 shadow-2xl hover:shadow-3xl hover:scale-105 sm:hover:scale-110 transform group touch-manipulation min-h-[48px]"
            >
              <FaPause className="text-base sm:text-lg group-hover:scale-125 transition-transform duration-300" />
              <span className="text-base sm:text-lg">Pause Training</span>
            </button>
          ) : null}
          
          {!showInstructions && (
            <button
              onClick={resetGame}
              className="flex items-center justify-center gap-2 sm:gap-3 bg-gradient-to-r from-gray-500 via-slate-500 to-gray-600 text-white px-6 sm:px-8 py-3 sm:py-4 rounded-xl sm:rounded-2xl font-bold hover:from-gray-600 hover:via-slate-600 hover:to-gray-700 transition-all duration-300 shadow-2xl hover:shadow-3xl hover:scale-105 sm:hover:scale-110 transform group touch-manipulation min-h-[48px]"
            >
              <FaRedo className="text-base sm:text-lg group-hover:rotate-180 transition-transform duration-300" />
              <span className="text-base sm:text-lg">New Training</span>
            </button>
          )}
        </div>

        {/* Game Benefits */}
        <div className="mt-6 bg-gradient-to-br from-white/80 via-indigo-50/80 to-purple-50/80 backdrop-blur-md rounded-3xl p-6 border border-white/60 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-indigo-200/20 to-transparent rounded-full translate-x-12 -translate-y-12"></div>
          <h4 className="font-bold text-xl text-gray-800 mb-4 flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-2xl flex items-center justify-center">
              <FaBrain className="text-white text-sm" />
            </div>
            <span className="bg-gradient-to-r from-indigo-700 to-purple-700 bg-clip-text text-transparent">Cognitive Benefits</span>
          </h4>
          <div className="text-sm text-gray-700 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex items-center gap-3 p-3 bg-white/60 rounded-2xl border border-indigo-200">
              <div className="w-2 h-2 bg-indigo-500 rounded-full"></div>
              <span className="font-medium">Enhances working memory</span>
            </div>
            <div className="flex items-center gap-3 p-3 bg-white/60 rounded-2xl border border-purple-200">
              <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
              <span className="font-medium">Improves concentration</span>
            </div>
            <div className="flex items-center gap-3 p-3 bg-white/60 rounded-2xl border border-blue-200">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span className="font-medium">Boosts pattern recognition</span>
            </div>
            <div className="flex items-center gap-3 p-3 bg-white/60 rounded-2xl border border-cyan-200">
              <div className="w-2 h-2 bg-cyan-500 rounded-full"></div>
              <span className="font-medium">Strengthens visual processing</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BrainTrainingGame;
