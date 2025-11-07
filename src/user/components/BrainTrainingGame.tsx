import { useState, useEffect, useCallback, useRef } from 'react';
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
import memorySoundService from '../../lib/memorySoundService';

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
  const [finalScore, setFinalScore] = useState(0);
  const [scoreBreakdown, setScoreBreakdown] = useState({
    matchPoints: 0,
    timeBonus: 0,
    levelBonus: 0,
    accuracyBonus: 0,
    completionBonus: 0
  });
  
  // Track flipped cards to prevent double sound
  const lastFlippedRef = useRef<number>(-1);

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

  // Load high score and current game state from localStorage
  useEffect(() => {
    const savedHighScore = localStorage.getItem('brainGameHighScore');
    if (savedHighScore) {
      setHighScore(parseInt(savedHighScore));
    }

    const savedScore = localStorage.getItem('brainGameCurrentScore');
    if (savedScore) {
      setScore(parseInt(savedScore));
    }

    const savedLevel = localStorage.getItem('brainGameCurrentLevel');
    if (savedLevel) {
      setLevel(parseInt(savedLevel));
    }

    const savedMatches = localStorage.getItem('brainGameCurrentMatches');
    if (savedMatches) {
      setMatches(parseInt(savedMatches));
    }

    const savedAttempts = localStorage.getItem('brainGameCurrentAttempts');
    if (savedAttempts) {
      setAttempts(parseInt(savedAttempts));
    }
  }, []);

  // Save current score to localStorage whenever it changes
  useEffect(() => {
    if (score > 0) {
      localStorage.setItem('brainGameCurrentScore', score.toString());
    }
  }, [score]);

  // Save current level to localStorage
  useEffect(() => {
    if (level > 1) {
      localStorage.setItem('brainGameCurrentLevel', level.toString());
    }
  }, [level]);

  // Save matches and attempts
  useEffect(() => {
    localStorage.setItem('brainGameCurrentMatches', matches.toString());
    localStorage.setItem('brainGameCurrentAttempts', attempts.toString());
  }, [matches, attempts]);

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
      // Calculate precise level completion bonuses
      const timeBonus = Math.max(0, (60 - gameTime)) * 15; // 15 points per second saved
      const levelBonus = level * 150; // 150 points per level
      const accuracy = getAccuracy();
      const accuracyBonus = accuracy >= 80 ? 200 : accuracy >= 60 ? 100 : accuracy >= 40 ? 50 : 0;
      
      const levelScore = timeBonus + levelBonus + accuracyBonus;
      const newTotalScore = score + levelScore;
      
      setScore(newTotalScore);
      setScoreBreakdown({
        matchPoints: score,
        timeBonus: timeBonus,
        levelBonus: levelBonus,
        accuracyBonus: accuracyBonus,
        completionBonus: 0
      });
      
      if (level < 5) {
        // Play level complete sound
        memorySoundService.playLevelCompleteSound();
        
        // Next level
        setTimeout(() => {
          setLevel(prev => prev + 1);
          setGameTime(0);
          setMatches(0);
          setAttempts(0);
          initializeCards(level + 1);
        }, 1500);
      } else {
        // Game completed - calculate final score
        const completionBonus = 500; // Bonus for completing all levels
        const finalTotalScore = newTotalScore + completionBonus;
        setFinalScore(finalTotalScore);
        setScore(finalTotalScore);
        setScoreBreakdown(prev => ({
          ...prev,
          completionBonus: completionBonus
        }));
        
        // Play game complete sound
        memorySoundService.playGameCompleteSound();
        
        endGame();
      }
    }
  }, [cards, score, level, gameTime, matches, attempts]);

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
    
    // Play flip sound
    if (lastFlippedRef.current !== cardId) {
      memorySoundService.playFlipSound();
      lastFlippedRef.current = cardId;
    }
    
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
          // Match found - play match sound
          memorySoundService.playMatchSound();
          
          setCards(prevCards => 
            prevCards.map(card => 
              (card.id === firstId || card.id === secondId) 
                ? { ...card, isMatched: true }
                : card
            )
          );
          setMatches(prev => prev + 1);
          // Precise match scoring: base 75 points + level multiplier
          const matchPoints = 75 + (level * 25);
          setScore(prev => prev + matchPoints);
        } else {
          // No match - play mismatch sound and flip cards back
          memorySoundService.playMismatchSound();
          
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
    setFinalScore(0);
    setScoreBreakdown({ matchPoints: 0, timeBonus: 0, levelBonus: 0, accuracyBonus: 0, completionBonus: 0 });
    setShowInstructions(false);
    
    // Clear saved game state
    localStorage.removeItem('brainGameCurrentScore');
    localStorage.removeItem('brainGameCurrentLevel');
    localStorage.removeItem('brainGameCurrentMatches');
    localStorage.removeItem('brainGameCurrentAttempts');
    
    // Reset flip tracking
    lastFlippedRef.current = -1;
    
    // Play game start sound
    memorySoundService.playGameStartSound();
    
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
    
    // Ensure final score is set and precise
    const currentFinalScore = finalScore > 0 ? finalScore : score;
    
    // Update high score with final precise score
    if (currentFinalScore > highScore) {
      setHighScore(currentFinalScore);
      localStorage.setItem('brainGameHighScore', currentFinalScore.toString());
      // Play new high score sound
      memorySoundService.playNewHighScoreSound();
    }
    
    // Clear saved game state
    localStorage.removeItem('brainGameCurrentScore');
    localStorage.removeItem('brainGameCurrentLevel');
    localStorage.removeItem('brainGameCurrentMatches');
    localStorage.removeItem('brainGameCurrentAttempts');
  };

  const resetGame = () => {
    setGameActive(false);
    setGameOver(false);
    setScore(0);
    setLevel(1);
    setGameTime(0);
    setMatches(0);
    setAttempts(0);
    setFinalScore(0);
    setScoreBreakdown({ matchPoints: 0, timeBonus: 0, levelBonus: 0, accuracyBonus: 0, completionBonus: 0 });
    setCards([]);
    setFlippedCards([]);
    setShowInstructions(true);
    
    // Clear saved game state
    localStorage.removeItem('brainGameCurrentScore');
    localStorage.removeItem('brainGameCurrentLevel');
    localStorage.removeItem('brainGameCurrentMatches');
    localStorage.removeItem('brainGameCurrentAttempts');
    
    // Reset flip tracking
    lastFlippedRef.current = -1;
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

      <div className="bg-gradient-to-br from-indigo-50 via-purple-50 to-blue-50 rounded-2xl sm:rounded-3xl p-3 sm:p-6 lg:p-8 shadow-2xl border border-indigo-200/50 backdrop-blur-sm relative overflow-hidden">
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

        {/* Compact Instructions */}
        {showInstructions && (
          <div className="bg-gradient-to-br from-white/90 to-indigo-50/90 backdrop-blur-md rounded-2xl p-4 mb-4 border border-white/60 shadow-xl relative overflow-hidden">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-lg text-gray-800 flex items-center gap-2">
                <div className="w-6 h-6 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center">
                  <FaBrain className="text-white text-xs" />
                </div>
                <span className="bg-gradient-to-r from-indigo-700 to-purple-700 bg-clip-text text-transparent">Quick Guide</span>
              </h3>
            </div>
            <div className="grid grid-cols-2 sm:flex sm:items-center sm:justify-center gap-3 sm:gap-6 text-xs text-gray-700 px-2">
              <div className="flex items-center gap-2 justify-center sm:justify-start">
                <div className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                  <FaEye className="text-white text-xs" />
                </div>
                <span className="font-medium text-blue-700">Flip</span>
              </div>
              <div className="flex items-center gap-2 justify-center sm:justify-start">
                <div className="w-4 h-4 bg-purple-500 rounded-full flex items-center justify-center flex-shrink-0">
                  <FaBrain className="text-white text-xs" />
                </div>
                <span className="font-medium text-purple-700">Remember</span>
              </div>
              <div className="flex items-center gap-2 justify-center sm:justify-start">
                <div className="w-4 h-4 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                  <FaStar className="text-white text-xs" />
                </div>
                <span className="font-medium text-green-700">Match</span>
              </div>
              <div className="flex items-center gap-2 justify-center sm:justify-start">
                <div className="w-4 h-4 bg-orange-500 rounded-full flex items-center justify-center flex-shrink-0">
                  <FaClock className="text-white text-xs" />
                </div>
                <span className="font-medium text-orange-700">Speed!</span>
              </div>
            </div>
          </div>
        )}

        {/* Game Area */}
        <div className="relative bg-gradient-to-b from-white via-indigo-50 to-purple-50 rounded-2xl sm:rounded-3xl p-2 sm:p-4 lg:p-6 overflow-hidden border-2 border-white/60 mb-4 sm:mb-6 shadow-inner touch-manipulation">
          {/* Animated background particles */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-indigo-200/40 rounded-full animate-ping"></div>
            <div className="absolute top-3/4 right-1/3 w-1 h-1 bg-purple-200/50 rounded-full animate-pulse"></div>
            <div className="absolute top-1/2 right-1/4 w-1.5 h-1.5 bg-blue-200/30 rounded-full animate-ping" style={{animationDelay: '1s'}}></div>
          </div>
          {/* Memory Cards Grid */}
          <div className={`grid gap-1.5 sm:gap-2 md:gap-3 lg:gap-4 justify-center relative z-10 w-full max-w-full ${
            cards.length <= 10 ? 'grid-cols-5' : 
            cards.length <= 12 ? 'grid-cols-4 sm:grid-cols-4' : 
            'grid-cols-4 sm:grid-cols-4'
          }`}>
            {cards.map((card) => (
              <button
                key={card.id}
                className={`aspect-square w-full max-w-[70px] sm:max-w-[80px] md:max-w-[90px] lg:max-w-[110px] rounded-lg sm:rounded-xl lg:rounded-2xl border-2 transition-all duration-500 flex items-center justify-center text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold shadow-xl sm:shadow-2xl hover:scale-105 active:scale-95 sm:hover:scale-110 sm:hover:rotate-3 transform ${
                  card.isFlipped || card.isMatched
                    ? `${card.color} border-white/80 shadow-2xl sm:shadow-3xl backdrop-blur-sm`
                    : 'bg-gradient-to-br from-indigo-200 via-purple-200 to-blue-200 border-indigo-400 hover:from-indigo-300 hover:via-purple-300 hover:to-blue-300 hover:border-white'
                } ${card.isMatched ? 'ring-2 sm:ring-4 ring-green-400 animate-pulse' : ''} ${card.isFlipped && !card.isMatched ? 'animate-bounce' : ''} touch-manipulation mx-auto`}
                onClick={() => flipCard(card.id)}
                disabled={!gameActive || card.isFlipped || card.isMatched || flippedCards.length >= 2}
              >
                {card.isFlipped || card.isMatched ? (
                  <span className="drop-shadow-lg filter brightness-110">{card.value}</span>
                ) : (
                  <div className="relative">
                    <FaBrain className="text-indigo-500 text-base sm:text-lg md:text-xl lg:text-2xl opacity-60" />
                    <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent rounded-full"></div>
                  </div>
                )}
                {card.isMatched && (
                  <div className="absolute -top-0.5 -right-0.5 sm:-top-1 sm:-right-1 lg:-top-2 lg:-right-2 w-3 h-3 sm:w-4 sm:h-4 lg:w-6 lg:h-6 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full flex items-center justify-center animate-ping">
                    <FaStar className="text-white text-[8px] sm:text-xs" />
                  </div>
                )}
              </button>
            ))}
          </div>

          {/* Game Over Overlay */}
          {gameOver && (
            <div className="absolute inset-0 bg-gradient-to-br from-black/70 via-indigo-900/50 to-purple-900/50 backdrop-blur-md flex items-center justify-center p-3 z-50">
              <div className="bg-gradient-to-br from-white via-indigo-50 to-purple-50 rounded-xl p-3 text-center shadow-3xl border border-white/50 w-full max-w-[280px] relative overflow-hidden transform scale-100 animate-in fade-in zoom-in duration-300 mx-2">
                <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-indigo-100/30 to-purple-100/30 rounded-xl"></div>
                <div className="relative z-20">
                  <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 via-purple-500 to-blue-500 rounded-xl flex items-center justify-center mx-auto mb-3 shadow-2xl animate-bounce">
                    <FaTrophy className="text-white text-lg" />
                  </div>
                  <h3 className="text-lg font-bold bg-gradient-to-r from-indigo-700 to-purple-700 bg-clip-text text-transparent mb-3">Training Complete!</h3>
                  <div className="space-y-2 mb-4">
                    <p className="text-xs text-gray-700">Final Score:</p>
                    <div className="font-bold text-2xl bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">{finalScore > 0 ? finalScore : score}</div>
                    
                    {/* Score Breakdown */}
                    <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg p-2 mt-2">
                      <p className="text-xs font-semibold text-gray-700 mb-1">Score Breakdown:</p>
                      <div className="grid grid-cols-2 gap-1 text-xs">
                        <div className="text-blue-600">Matches: <span className="font-bold">{scoreBreakdown.matchPoints}</span></div>
                        <div className="text-green-600">Time: <span className="font-bold">{scoreBreakdown.timeBonus}</span></div>
                        <div className="text-purple-600">Level: <span className="font-bold">{scoreBreakdown.levelBonus}</span></div>
                        <div className="text-orange-600">Accuracy: <span className="font-bold">{scoreBreakdown.accuracyBonus}</span></div>
                        {scoreBreakdown.completionBonus && (
                          <div className="col-span-2 text-yellow-600 text-center font-bold">Completion Bonus: {scoreBreakdown.completionBonus}</div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex justify-center gap-3 text-xs text-gray-600 mt-2">
                      <span>Accuracy: <span className="font-bold text-green-600">{getAccuracy()}%</span></span>
                      <span>Levels: <span className="font-bold text-purple-600">{level}/5</span></span>
                    </div>
                  </div>
                  {(finalScore > 0 ? finalScore : score) === highScore && (finalScore > 0 ? finalScore : score) > 0 && (
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
                    className="bg-gradient-to-r from-indigo-500 via-purple-500 to-blue-500 text-white px-4 py-2.5 rounded-lg font-bold hover:from-indigo-600 hover:via-purple-600 hover:to-blue-600 transition-all duration-300 shadow-2xl hover:shadow-3xl hover:scale-105 transform text-sm w-full"
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

        {/* Compact Benefits */}
        <div className="mt-3 bg-gradient-to-r from-indigo-50/80 to-purple-50/80 backdrop-blur-md rounded-lg py-1 px-1.5 border border-indigo-200/50 shadow-md">
          <div className="grid grid-cols-2 sm:flex sm:items-center sm:justify-center gap-1 sm:gap-2 text-[10px] text-gray-700">
            <div className="flex items-center gap-0.5 justify-center">
              <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full flex-shrink-0"></div>
              <span className="font-medium text-indigo-700 whitespace-nowrap">Memory</span>
            </div>
            <div className="flex items-center gap-0.5 justify-center">
              <div className="w-1.5 h-1.5 bg-purple-500 rounded-full flex-shrink-0"></div>
              <span className="font-medium text-purple-700 whitespace-nowrap">Focus</span>
            </div>
            <div className="flex items-center gap-0.5 justify-center">
              <div className="w-1.5 h-1.5 bg-blue-500 rounded-full flex-shrink-0"></div>
              <span className="font-medium text-blue-700 whitespace-nowrap">Pattern</span>
            </div>
            <div className="flex items-center gap-0.5 justify-center">
              <div className="w-1.5 h-1.5 bg-cyan-500 rounded-full flex-shrink-0"></div>
              <span className="font-medium text-cyan-700 whitespace-nowrap">Visual</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BrainTrainingGame;
