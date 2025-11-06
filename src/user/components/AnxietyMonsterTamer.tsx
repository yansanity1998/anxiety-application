import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  FaHeart,
  FaStar,
  FaFire,
  FaPlay,
  FaPause,
  FaRedo,
  FaTrophy,
  FaInfoCircle
} from 'react-icons/fa';
import gameSoundService from '../../lib/gameSoundService';

interface AnxietyMonsterTamerProps {
  userData?: any;
}

interface Monster {
  id: number;
  emoji: string;
  name: string;
  x: number;
  y: number;
  speed: number;
  isTamed: boolean;
  bgColor: string;
}

interface CalmingOrb {
  id: number;
  x: number;
  y: number;
  collected: boolean;
}

const AnxietyMonsterTamer: React.FC<AnxietyMonsterTamerProps> = ({}) => {
  // Game state
  const [gameActive, setGameActive] = useState(false);
  const [score, setScore] = useState(0);
  const [energy, setEnergy] = useState(100);
  const [monsters, setMonsters] = useState<Monster[]>([]);
  const [calmingOrbs, setCalmingOrbs] = useState<CalmingOrb[]>([]);
  const [level, setLevel] = useState(1);
  const [showInstructions, setShowInstructions] = useState(true);
  const [gameOver, setGameOver] = useState(false);
  const [highScore, setHighScore] = useState(0);
  const [monstersTamed, setMonstersTamed] = useState(0);
  const [combo, setCombo] = useState(0);
  const [showCombo, setShowCombo] = useState(false);
  
  const collectedItemsRef = useRef<Set<number>>(new Set());

  // Monster types with Gen Z vibes
  const monsterTypes = [
    { emoji: '😰', name: 'Worry Blob', bgColor: 'bg-yellow-100' },
    { emoji: '😨', name: 'Panic Puff', bgColor: 'bg-red-100' },
    { emoji: '😟', name: 'Stress Sprite', bgColor: 'bg-orange-100' },
    { emoji: '😣', name: 'Tension Troll', bgColor: 'bg-purple-100' },
    { emoji: '😖', name: 'Dread Dragon', bgColor: 'bg-pink-100' },
    { emoji: '😫', name: 'Fear Fiend', bgColor: 'bg-blue-100' }
  ];

  // Load from localStorage
  useEffect(() => {
    const savedHighScore = localStorage.getItem('monsterTamerHighScore');
    if (savedHighScore) setHighScore(parseInt(savedHighScore));
    const savedScore = localStorage.getItem('monsterTamerCurrentScore');
    if (savedScore) setScore(parseInt(savedScore));
    const savedLevel = localStorage.getItem('monsterTamerCurrentLevel');
    if (savedLevel) setLevel(parseInt(savedLevel));
    const savedEnergy = localStorage.getItem('monsterTamerCurrentEnergy');
    if (savedEnergy) setEnergy(parseInt(savedEnergy));
  }, []);

  // Save to localStorage
  useEffect(() => {
    if (score > 0) localStorage.setItem('monsterTamerCurrentScore', score.toString());
  }, [score]);

  useEffect(() => {
    if (level > 1) localStorage.setItem('monsterTamerCurrentLevel', level.toString());
  }, [level]);

  useEffect(() => {
    localStorage.setItem('monsterTamerCurrentEnergy', energy.toString());
  }, [energy]);

  // Spawn functions
  const spawnMonster = useCallback(() => {
    const monsterType = monsterTypes[Math.floor(Math.random() * monsterTypes.length)];
    const newMonster: Monster = {
      id: Date.now() + Math.random(),
      emoji: monsterType.emoji,
      name: monsterType.name,
      x: Math.random() * 80 + 10,
      y: -5,
      speed: Math.random() * 2 + 1.5 + (level * 0.5),
      isTamed: false,
      bgColor: monsterType.bgColor
    };
    setMonsters(prev => [...prev, newMonster]);
  }, [level]);

  const spawnCalmingOrb = useCallback(() => {
    const newOrb: CalmingOrb = {
      id: Date.now() + Math.random(),
      x: Math.random() * 80 + 10,
      y: -5,
      collected: false
    };
    setCalmingOrbs(prev => [...prev, newOrb]);
  }, []);

  // Check for game over when energy depletes
  useEffect(() => {
    if (gameActive && energy <= 0) {
      setGameActive(false);
      setGameOver(true);
      if (score > highScore) {
        setHighScore(score);
        localStorage.setItem('monsterTamerHighScore', score.toString());
        gameSoundService.playNewHighScoreSound();
      } else {
        gameSoundService.playGameOverSound();
      }
      localStorage.removeItem('monsterTamerCurrentScore');
      localStorage.removeItem('monsterTamerCurrentLevel');
      localStorage.removeItem('monsterTamerCurrentEnergy');
    }
  }, [energy, gameActive, score, highScore]);

  // Game loop
  useEffect(() => {
    let gameInterval: NodeJS.Timeout;
    let spawnMonsterInterval: NodeJS.Timeout;
    let spawnOrbInterval: NodeJS.Timeout;

    if (gameActive && !gameOver) {
      gameInterval = setInterval(() => {
        
        setMonsters(prevMonsters => 
          prevMonsters.map(monster => ({
            ...monster,
            y: monster.y + monster.speed,
            x: monster.x + (Math.sin(Date.now() * 0.001 + monster.id) * 2)
          })).filter(monster => monster.y < 100 && !monster.isTamed)
        );

        setCalmingOrbs(prevOrbs =>
          prevOrbs.map(orb => ({ ...orb, y: orb.y + 1.5 }))
            .filter(orb => orb.y < 100 && !orb.collected)
        );

        setMonsters(prevMonsters => {
          const escapedMonsters = prevMonsters.filter(m => m.y >= 95 && !m.isTamed);
          if (escapedMonsters.length > 0) {
            setEnergy(prev => Math.max(0, prev - (escapedMonsters.length * 10)));
            setCombo(0);
          }
          return prevMonsters.filter(monster => monster.y < 95 || monster.isTamed);
        });
      }, 100);

      spawnMonsterInterval = setInterval(() => {
        spawnMonster();
      }, Math.max(500, 2000 - (level * 150)));
      
      spawnOrbInterval = setInterval(() => {
        spawnCalmingOrb();
      }, 3000);
    }

    return () => {
      clearInterval(gameInterval);
      clearInterval(spawnMonsterInterval);
      clearInterval(spawnOrbInterval);
    };
  }, [gameActive, gameOver, level, spawnMonster, spawnCalmingOrb]);

  // Level progression
  useEffect(() => {
    const newLevel = Math.floor(monstersTamed / 10) + 1;
    if (newLevel > level && newLevel <= 10) {
      setLevel(newLevel);
      gameSoundService.playLevelUpSound();
    }
  }, [monstersTamed, level]);

  const tameMonster = (monsterId: number, event?: React.MouseEvent) => {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    if (collectedItemsRef.current.has(monsterId)) return;
    collectedItemsRef.current.add(monsterId);

    setMonsters(prevMonsters => {
      const targetMonster = prevMonsters.find(m => m.id === monsterId && !m.isTamed);
      if (!targetMonster) return prevMonsters;

      const basePoints = 50 + (level * 10);
      const comboMultiplier = Math.floor(combo / 3) + 1;
      const points = basePoints * comboMultiplier;

      setScore(prev => prev + points);
      setMonstersTamed(prev => prev + 1);
      setCombo(prev => prev + 1);
      setShowCombo(true);
      setTimeout(() => setShowCombo(false), 1000);
      gameSoundService.playCollectSound();

      return prevMonsters.map(monster =>
        monster.id === monsterId ? { ...monster, isTamed: true } : monster
      );
    });
  };

  const collectOrb = (orbId: number, event?: React.MouseEvent) => {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    if (collectedItemsRef.current.has(orbId)) return;
    collectedItemsRef.current.add(orbId);

    setCalmingOrbs(prevOrbs => {
      const targetOrb = prevOrbs.find(o => o.id === orbId && !o.collected);
      if (!targetOrb) return prevOrbs;

      setEnergy(prev => Math.min(100, prev + 15));
      setScore(prev => prev + 20);
      gameSoundService.playComboSound();

      return prevOrbs.map(orb =>
        orb.id === orbId ? { ...orb, collected: true } : orb
      );
    });
  };

  const startGame = () => {
    setGameActive(true);
    setGameOver(false);
    setScore(0);
    setEnergy(100);
    setMonsters([]);
    setCalmingOrbs([]);
    setLevel(1);
    setMonstersTamed(0);
    setCombo(0);
    setShowInstructions(false);
    collectedItemsRef.current.clear();
    localStorage.removeItem('monsterTamerCurrentScore');
    localStorage.removeItem('monsterTamerCurrentLevel');
    localStorage.removeItem('monsterTamerCurrentEnergy');
    gameSoundService.playGameStartSound();
  };

  const pauseGame = () => setGameActive(false);
  const resumeGame = () => setGameActive(true);

  const resetGame = () => {
    setGameActive(false);
    setGameOver(false);
    setScore(0);
    setEnergy(100);
    setMonsters([]);
    setCalmingOrbs([]);
    setLevel(1);
    setMonstersTamed(0);
    setCombo(0);
    setShowInstructions(true);
    collectedItemsRef.current.clear();
    localStorage.removeItem('monsterTamerCurrentScore');
    localStorage.removeItem('monsterTamerCurrentLevel');
    localStorage.removeItem('monsterTamerCurrentEnergy');
  };

  return (
    <div className="mb-6 sm:mb-8">
      {/* Header - Mobile Optimized */}
      <div className="flex items-center justify-between gap-2 sm:gap-4 mb-3 sm:mb-6 px-1 sm:px-2">
        <div className="flex items-center gap-2 sm:gap-4 flex-1 min-w-0">
          <div className="relative flex-shrink-0">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-pink-500 via-purple-500 to-indigo-600 rounded-xl sm:rounded-3xl shadow-xl sm:shadow-2xl flex items-center justify-center transform hover:scale-110 transition-all">
              <span className="text-xl sm:text-2xl">👾</span>
            </div>
            <div className="absolute -top-0.5 -right-0.5 sm:-top-1 sm:-right-1 w-3 h-3 sm:w-4 sm:h-4 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center animate-pulse">
              <FaStar className="text-white text-[8px] sm:text-xs" />
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="font-bold text-base sm:text-2xl bg-gradient-to-r from-pink-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent truncate">
              Anxiety Monster Tamer
            </h2>
            <p className="text-[10px] sm:text-sm text-gray-600 font-medium truncate">Transform anxious vibes into good energy ✨</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1 sm:py-2 bg-gradient-to-r from-pink-50 to-purple-50 rounded-lg sm:rounded-2xl border border-pink-200 flex-shrink-0">
          <FaInfoCircle className="text-pink-500 text-[10px] sm:text-sm" />
          <span className="text-[10px] sm:text-xs font-medium text-pink-700 whitespace-nowrap">Gen Z</span>
        </div>
      </div>

      <div className="bg-gradient-to-br from-pink-50 via-purple-50 to-indigo-50 rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-2xl border border-pink-200/50 relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-0 left-0 w-32 h-32 bg-gradient-to-br from-pink-200/30 to-transparent rounded-full -translate-x-16 -translate-y-16"></div>
        <div className="absolute bottom-0 right-0 w-40 h-40 bg-gradient-to-tl from-purple-200/30 to-transparent rounded-full translate-x-20 translate-y-20"></div>
        
        {/* Stats - Mobile Optimized Grid */}
        <div className="mb-4 sm:mb-6 relative z-10">
          <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2 sm:gap-4 mb-2 sm:mb-0">
            {/* Score */}
            <div className="text-center bg-white/60 backdrop-blur-sm rounded-xl sm:rounded-2xl px-2 py-2 sm:px-4 sm:py-3 border border-white/50 shadow-lg">
              <div className="text-lg sm:text-3xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">{score}</div>
              <div className="text-xs font-medium text-gray-600 mt-0.5 sm:mt-1">Score</div>
            </div>
            
            {/* Energy */}
            <div className="text-center bg-white/60 backdrop-blur-sm rounded-xl sm:rounded-2xl px-2 py-2 sm:px-4 sm:py-3 border border-white/50 shadow-lg">
              <div className="flex items-center justify-center gap-0.5 sm:gap-1 mb-0.5 sm:mb-1">
                <FaHeart className="text-red-500 text-base sm:text-xl animate-pulse" />
                <span className="text-lg sm:text-2xl font-bold bg-gradient-to-r from-red-600 to-pink-600 bg-clip-text text-transparent">{energy}%</span>
              </div>
              <div className="text-xs font-medium text-gray-600">Energy</div>
            </div>
            
            {/* Level */}
            <div className="text-center bg-white/60 backdrop-blur-sm rounded-xl sm:rounded-2xl px-2 py-2 sm:px-4 sm:py-3 border border-white/50 shadow-lg">
              <div className="text-lg sm:text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">L{level}</div>
              <div className="text-xs font-medium text-gray-600 mt-0.5 sm:mt-1">Level</div>
            </div>
            
            {/* High Score */}
            {highScore > 0 && (
              <div className="text-center bg-gradient-to-br from-yellow-50 to-orange-50 rounded-xl sm:rounded-2xl px-2 py-2 sm:px-4 sm:py-3 border border-yellow-200 shadow-lg">
                <div className="flex items-center justify-center gap-1 sm:gap-2 mb-0.5 sm:mb-1">
                  <FaTrophy className="text-yellow-500 text-xs sm:text-lg animate-bounce" />
                  <span className="text-lg sm:text-2xl font-bold bg-gradient-to-r from-yellow-600 to-orange-600 bg-clip-text text-transparent">{highScore}</span>
                </div>
                <div className="text-xs font-medium text-yellow-700">Best</div>
              </div>
            )}
          </div>
          
          {/* Combo - Full Width on Mobile */}
          {combo > 0 && (
            <div className={`flex items-center justify-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 rounded-xl sm:rounded-2xl bg-gradient-to-r from-orange-100 to-pink-100 border border-orange-300 shadow-lg transition-all ${showCombo ? 'scale-105 shadow-2xl' : ''} mt-2 w-full sm:w-auto sm:inline-flex`}>
              <FaFire className="text-orange-500 text-base sm:text-lg animate-pulse" />
              <span className="text-base sm:text-lg font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">{combo}x</span>
              <span className="text-xs font-medium text-orange-700">STREAK</span>
            </div>
          )}
        </div>

        {/* Instructions - Mobile Optimized */}
        {showInstructions && (
          <div className="bg-gradient-to-br from-white/90 to-pink-50/90 backdrop-blur-md rounded-xl sm:rounded-2xl p-3 sm:p-4 mb-3 sm:mb-4 border border-white/60 shadow-xl relative z-10">
            <div className="flex items-center gap-2 mb-2 sm:mb-3">
              <div className="w-5 h-5 sm:w-6 sm:h-6 bg-gradient-to-r from-pink-500 to-purple-500 rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0">
                <span className="text-xs sm:text-sm">👾</span>
              </div>
              <h3 className="font-bold text-sm sm:text-lg text-gray-800 bg-gradient-to-r from-pink-700 to-purple-700 bg-clip-text text-transparent">How to Play</h3>
            </div>
            <div className="grid grid-cols-2 gap-2 sm:gap-3 text-[10px] sm:text-xs text-gray-700">
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-1 sm:gap-2">
                <div className="text-xl sm:text-2xl">😰</div>
                <span className="font-medium text-pink-700 text-center sm:text-left">Tap Monsters</span>
              </div>
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-1 sm:gap-2">
                <div className="text-xl sm:text-2xl">✨</div>
                <span className="font-medium text-purple-700 text-center sm:text-left">Collect Orbs</span>
              </div>
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-1 sm:gap-2">
                <FaHeart className="text-red-500 text-base sm:text-base" />
                <span className="font-medium text-red-700 text-center sm:text-left">Keep Energy</span>
              </div>
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-1 sm:gap-2">
                <FaFire className="text-orange-500 text-base sm:text-base" />
                <span className="font-medium text-orange-700 text-center sm:text-left">Build Streak!</span>
              </div>
            </div>
          </div>
        )}

        {/* Energy Bar */}
        <div className="mb-4 relative z-10">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-gray-700 flex items-center gap-1">
              <FaHeart className="text-red-500" />
              Energy Level
            </span>
            <span className="text-xs font-bold text-gray-700">{energy}%</span>
          </div>
          <div className="h-3 bg-gray-200 rounded-full overflow-hidden border-2 border-white shadow-inner">
            <div 
              className={`h-full transition-all duration-300 ${
                energy > 60 ? 'bg-gradient-to-r from-green-400 to-emerald-500' :
                energy > 30 ? 'bg-gradient-to-r from-yellow-400 to-orange-500' :
                'bg-gradient-to-r from-red-400 to-pink-500'
              }`}
              style={{ width: `${energy}%` }}
            />
          </div>
        </div>

        {/* Game Area - Mobile Responsive */}
        <div className="relative bg-gradient-to-b from-indigo-100 via-purple-50 to-pink-100 rounded-2xl sm:rounded-3xl h-64 sm:h-80 overflow-hidden border-2 border-white/60 mb-4 sm:mb-6 shadow-inner touch-manipulation">
          {/* Background effects */}
          <div className="absolute inset-0">
            <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-pink-200/40 rounded-full animate-ping"></div>
            <div className="absolute top-3/4 right-1/3 w-1 h-1 bg-purple-200/50 rounded-full animate-pulse"></div>
          </div>

          {/* Monsters - Touch Optimized */}
          {monsters.map((monster) => (
            <button
              key={monster.id}
              className={`absolute w-14 h-14 sm:w-16 sm:h-16 ${monster.bgColor} rounded-xl sm:rounded-2xl flex items-center justify-center shadow-2xl border-2 border-white/80 transition-all hover:scale-125 active:scale-110 hover:rotate-12 ${monster.isTamed ? 'opacity-0 scale-200 rotate-180' : 'animate-pulse'} touch-manipulation`}
              style={{
                left: `${monster.x}%`,
                top: `${monster.y}%`,
                transform: 'translate(-50%, -50%)',
                filter: monster.isTamed ? 'blur(2px)' : 'none',
                minHeight: '56px',
                minWidth: '56px'
              }}
              onClick={(e) => tameMonster(monster.id, e)}
              disabled={monster.isTamed}
            >
              <span className="text-3xl sm:text-4xl drop-shadow-lg">{monster.emoji}</span>
              {!monster.isTamed && (
                <div className="absolute -top-1 -right-1 w-2.5 h-2.5 sm:w-3 sm:h-3 bg-red-500 rounded-full animate-ping"></div>
              )}
            </button>
          ))}

          {/* Calming Orbs - Touch Optimized */}
          {calmingOrbs.map((orb) => (
            <button
              key={orb.id}
              className={`absolute w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-cyan-200 to-blue-300 rounded-full flex items-center justify-center shadow-xl border-2 border-white/80 transition-all hover:scale-125 active:scale-110 ${orb.collected ? 'opacity-0 scale-200' : 'animate-bounce'} touch-manipulation`}
              style={{
                left: `${orb.x}%`,
                top: `${orb.y}%`,
                transform: 'translate(-50%, -50%)',
                filter: orb.collected ? 'blur(2px)' : 'none',
                minHeight: '40px',
                minWidth: '40px'
              }}
              onClick={(e) => collectOrb(orb.id, e)}
              disabled={orb.collected}
            >
              <span className="text-lg sm:text-xl">✨</span>
            </button>
          ))}

          {/* Game Over Overlay */}
          {gameOver && (
            <div className="absolute inset-0 bg-gradient-to-br from-black/70 to-purple-900/50 backdrop-blur-md flex items-center justify-center z-50">
              <div className="bg-gradient-to-br from-white to-purple-50 rounded-xl p-6 text-center shadow-3xl border border-white/50 max-w-sm mx-4">
                <div className="w-12 h-12 bg-gradient-to-br from-pink-500 to-indigo-500 rounded-xl flex items-center justify-center mx-auto mb-3 shadow-2xl animate-bounce">
                  <FaTrophy className="text-white text-lg" />
                </div>
                <h3 className="text-lg font-bold bg-gradient-to-r from-pink-700 to-purple-700 bg-clip-text text-transparent mb-3">Game Over!</h3>
                <div className="space-y-1 mb-4">
                  <p className="text-xs text-gray-700">Final Score:</p>
                  <div className="font-bold text-xl bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">{score}</div>
                  <div className="flex justify-center gap-3 text-xs text-gray-600">
                    <span>Level: <span className="font-bold text-indigo-600">{level}</span></span>
                    <span>Tamed: <span className="font-bold text-pink-600">{monstersTamed}</span></span>
                  </div>
                </div>
                {score === highScore && score > 0 && (
                  <div className="bg-gradient-to-r from-yellow-100 to-orange-100 border border-yellow-300 rounded-lg p-2 mb-3">
                    <p className="text-xs font-bold text-yellow-700 flex items-center justify-center gap-1">
                      <FaStar className="text-yellow-500" />
                      🎉 New High Score! 🎉
                    </p>
                  </div>
                )}
                <button
                  onClick={resetGame}
                  className="bg-gradient-to-r from-pink-500 to-indigo-500 text-white px-4 py-2.5 rounded-lg font-bold hover:from-pink-600 hover:to-indigo-600 transition-all shadow-2xl hover:scale-105 w-full"
                >
                  Play Again
                </button>
              </div>
            </div>
          )}

          {/* Paused Overlay */}
          {!gameActive && !gameOver && !showInstructions && (
            <div className="absolute inset-0 bg-gradient-to-br from-black/40 to-pink-900/30 backdrop-blur-md flex items-center justify-center">
              <div className="bg-gradient-to-br from-white/95 to-pink-50/95 rounded-3xl p-6 text-center shadow-2xl border border-white/60">
                <div className="w-12 h-12 bg-gradient-to-r from-pink-500 to-purple-500 rounded-2xl flex items-center justify-center mx-auto mb-3">
                  <FaPause className="text-white text-xl" />
                </div>
                <p className="text-lg font-bold bg-gradient-to-r from-pink-700 to-purple-700 bg-clip-text text-transparent">Game Paused</p>
              </div>
            </div>
          )}
        </div>

        {/* Controls - Mobile Responsive */}
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-stretch sm:items-center relative z-10">
          {!gameActive && !gameOver ? (
            <button
              onClick={showInstructions ? startGame : resumeGame}
              className="flex items-center justify-center gap-2 sm:gap-3 bg-gradient-to-r from-green-500 to-teal-500 text-white px-6 sm:px-8 py-3 sm:py-4 rounded-xl sm:rounded-2xl font-bold hover:from-green-600 hover:to-teal-600 transition-all shadow-2xl hover:scale-105 sm:hover:scale-110 transform touch-manipulation min-h-[48px]"
            >
              <FaPlay className="text-base sm:text-xl" />
              <span className="text-base sm:text-lg">{showInstructions ? 'Start Game' : 'Resume'}</span>
            </button>
          ) : gameActive ? (
            <button
              onClick={pauseGame}
              className="flex items-center justify-center gap-2 sm:gap-3 bg-gradient-to-r from-orange-500 to-red-500 text-white px-6 sm:px-8 py-3 sm:py-4 rounded-xl sm:rounded-2xl font-bold hover:from-orange-600 hover:to-red-600 transition-all shadow-2xl hover:scale-105 sm:hover:scale-110 transform touch-manipulation min-h-[48px]"
            >
              <FaPause className="text-base sm:text-xl" />
              <span className="text-base sm:text-lg">Pause</span>
            </button>
          ) : null}
          
          {(gameActive || gameOver) && (
            <button
              onClick={resetGame}
              className="flex items-center justify-center gap-2 sm:gap-3 bg-gradient-to-r from-gray-500 to-gray-600 text-white px-6 sm:px-8 py-3 sm:py-4 rounded-xl sm:rounded-2xl font-bold hover:from-gray-600 hover:to-gray-700 transition-all shadow-2xl hover:scale-105 sm:hover:scale-110 transform touch-manipulation min-h-[48px]"
            >
              <FaRedo className="text-base sm:text-xl" />
              <span className="text-base sm:text-lg">Reset</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default AnxietyMonsterTamer;
