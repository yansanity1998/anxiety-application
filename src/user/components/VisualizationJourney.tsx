import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaPlay, FaPause, FaStop, FaVolumeUp, FaVolumeMute, FaWater, FaTree, FaMountain, FaHome } from 'react-icons/fa';

interface VisualizationSession {
  name: string;
  duration: number;
  script: string;
}

interface VisualizationJourneyProps {
  session: VisualizationSession;
  onStop: () => void;
  isPlaying: boolean;
  onTogglePlay: () => void;
}

interface Scene {
  time: number;
  text: string;
  setting: string;
  visualCue?: string;
  ambientColor?: string;
}

const visualizationScripts: Record<string, Scene[]> = {
  'viz-beach': [
    { 
      time: 0, 
      text: "Close your eyes and take a deep breath. You're about to visit a beautiful, peaceful beach.", 
      setting: "Preparation",
      ambientColor: "from-blue-200 to-cyan-100"
    },
    { 
      time: 20, 
      text: "You find yourself standing on warm, soft sand. The sun is gentle on your skin.", 
      setting: "Arrival",
      visualCue: "Feel the warmth",
      ambientColor: "from-yellow-200 to-orange-100"
    },
    { 
      time: 50, 
      text: "You hear the rhythmic sound of waves rolling onto the shore. Each wave brings calm.", 
      setting: "Ocean Sounds",
      visualCue: "Listen deeply",
      ambientColor: "from-blue-300 to-cyan-200"
    },
    { 
      time: 90, 
      text: "You walk closer to the water. The cool ocean breeze touches your face, carrying the scent of salt.", 
      setting: "By the Water",
      visualCue: "Feel the breeze",
      ambientColor: "from-cyan-200 to-blue-200"
    },
    { 
      time: 140, 
      text: "You sit down on the sand, watching the waves. Each wave that comes in takes away your worries.", 
      setting: "Seated Peace",
      visualCue: "Release worries",
      ambientColor: "from-blue-200 to-indigo-100"
    },
    { 
      time: 200, 
      text: "The sun begins to set, painting the sky in beautiful shades of orange, pink, and purple.", 
      setting: "Sunset",
      visualCue: "See the colors",
      ambientColor: "from-orange-300 to-pink-200"
    },
    { 
      time: 260, 
      text: "You feel completely at peace, connected to the rhythm of the ocean and the beauty around you.", 
      setting: "Deep Peace",
      visualCue: "Total serenity",
      ambientColor: "from-purple-200 to-pink-100"
    },
    { 
      time: 320, 
      text: "Take a few more moments here, knowing you can return to this peaceful beach whenever you need.", 
      setting: "Integration",
      visualCue: "Remember this place",
      ambientColor: "from-blue-200 to-cyan-100"
    },
    { 
      time: 380, 
      text: "Slowly bring your awareness back to your body. Wiggle your fingers and toes.", 
      setting: "Return",
      visualCue: "Gentle awakening",
      ambientColor: "from-gray-200 to-blue-100"
    },
    { 
      time: 420, 
      text: "When you're ready, open your eyes, carrying this peace with you.", 
      setting: "Complete",
      visualCue: "Eyes open",
      ambientColor: "from-white to-gray-100"
    }
  ],
  'viz-forest': [
    { 
      time: 0, 
      text: "Close your eyes and prepare to enter a magical forest sanctuary.", 
      setting: "Preparation",
      ambientColor: "from-green-200 to-emerald-100"
    },
    { 
      time: 20, 
      text: "You find yourself at the edge of a lush, green forest. The air is fresh and clean.", 
      setting: "Forest Edge",
      visualCue: "Breathe the fresh air",
      ambientColor: "from-green-300 to-lime-200"
    },
    { 
      time: 60, 
      text: "You begin walking on a soft path covered with moss and fallen leaves.", 
      setting: "The Path",
      visualCue: "Feel each step",
      ambientColor: "from-emerald-300 to-green-200"
    },
    { 
      time: 110, 
      text: "Tall trees surround you, their leaves creating a canopy that filters golden sunlight.", 
      setting: "Under the Canopy",
      visualCue: "See the light",
      ambientColor: "from-yellow-200 to-green-200"
    },
    { 
      time: 170, 
      text: "You hear birds singing, a gentle stream flowing nearby, and leaves rustling in the breeze.", 
      setting: "Nature's Symphony",
      visualCue: "Listen to nature",
      ambientColor: "from-green-300 to-teal-200"
    },
    { 
      time: 240, 
      text: "You discover a peaceful clearing with a carpet of soft grass. You sit down and rest.", 
      setting: "The Clearing",
      visualCue: "Rest here",
      ambientColor: "from-lime-200 to-green-100"
    },
    { 
      time: 310, 
      text: "You feel connected to the earth beneath you, the trees around you, and the sky above.", 
      setting: "Connection",
      visualCue: "Feel the connection",
      ambientColor: "from-green-200 to-blue-100"
    },
    { 
      time: 390, 
      text: "This forest is your sanctuary. You can return here anytime you need peace and renewal.", 
      setting: "Your Sanctuary",
      visualCue: "Claim this space",
      ambientColor: "from-emerald-200 to-green-100"
    },
    { 
      time: 480, 
      text: "Slowly, you begin your journey back, carrying the forest's peace within you.", 
      setting: "Return Journey",
      visualCue: "Bring peace with you",
      ambientColor: "from-green-200 to-gray-100"
    },
    { 
      time: 550, 
      text: "Take a deep breath, and when you're ready, gently open your eyes.", 
      setting: "Complete",
      visualCue: "Return refreshed",
      ambientColor: "from-white to-gray-100"
    }
  ],
  'viz-mountain': [
    { 
      time: 0, 
      text: "Close your eyes. You're about to climb to a peaceful mountain peak.", 
      setting: "Preparation",
      ambientColor: "from-gray-200 to-blue-100"
    },
    { 
      time: 20, 
      text: "You stand at the base of a majestic mountain. The path ahead is clear and inviting.", 
      setting: "The Base",
      visualCue: "Look up",
      ambientColor: "from-stone-300 to-gray-200"
    },
    { 
      time: 60, 
      text: "You begin your ascent. Each step is steady and sure. You feel strong and capable.", 
      setting: "The Climb",
      visualCue: "Feel your strength",
      ambientColor: "from-gray-300 to-blue-200"
    },
    { 
      time: 120, 
      text: "As you climb higher, the air becomes cooler and clearer. Your breathing is deep and rhythmic.", 
      setting: "Higher Ground",
      visualCue: "Breathe deeply",
      ambientColor: "from-blue-300 to-cyan-200"
    },
    { 
      time: 190, 
      text: "You pause to look back. You've come so far. The view is already breathtaking.", 
      setting: "Looking Back",
      visualCue: "See how far you've come",
      ambientColor: "from-blue-200 to-purple-100"
    },
    { 
      time: 260, 
      text: "With renewed energy, you continue upward. The peak is within reach now.", 
      setting: "Near the Summit",
      visualCue: "Almost there",
      ambientColor: "from-indigo-200 to-blue-100"
    },
    { 
      time: 330, 
      text: "You reach the summit. The view is magnificent - endless sky, distant horizons, pure freedom.", 
      setting: "The Summit",
      visualCue: "See everything",
      ambientColor: "from-sky-300 to-blue-200"
    },
    { 
      time: 410, 
      text: "You stand tall at the peak, above the clouds. You feel powerful, peaceful, and free.", 
      setting: "Above the Clouds",
      visualCue: "Feel your power",
      ambientColor: "from-white to-blue-100"
    },
    { 
      time: 490, 
      text: "You know that you can overcome any challenge. You carry this mountain strength within you.", 
      setting: "Inner Strength",
      visualCue: "Embrace your power",
      ambientColor: "from-purple-200 to-indigo-100"
    },
    { 
      time: 550, 
      text: "Begin to return, bringing this strength and clarity with you. Open your eyes when ready.", 
      setting: "Complete",
      visualCue: "Return empowered",
      ambientColor: "from-gray-200 to-white"
    }
  ],
  'viz-safe': [
    { 
      time: 0, 
      text: "Close your eyes. You're going to create your perfect safe space.", 
      setting: "Preparation",
      ambientColor: "from-purple-200 to-pink-100"
    },
    { 
      time: 20, 
      text: "Imagine a place where you feel completely safe, comfortable, and at peace.", 
      setting: "Imagination",
      visualCue: "Create your space",
      ambientColor: "from-pink-200 to-purple-100"
    },
    { 
      time: 60, 
      text: "This can be a real place you know, or somewhere entirely from your imagination.", 
      setting: "Your Choice",
      visualCue: "Make it yours",
      ambientColor: "from-purple-200 to-blue-100"
    },
    { 
      time: 100, 
      text: "What does this space look like? Notice the colors, the light, the atmosphere.", 
      setting: "Visual Details",
      visualCue: "See it clearly",
      ambientColor: "from-blue-200 to-cyan-100"
    },
    { 
      time: 150, 
      text: "What sounds do you hear? Perhaps gentle music, nature sounds, or peaceful silence.", 
      setting: "Sounds",
      visualCue: "Listen",
      ambientColor: "from-cyan-200 to-teal-100"
    },
    { 
      time: 200, 
      text: "What do you feel? The temperature, the textures, the comfort around you.", 
      setting: "Sensations",
      visualCue: "Feel it",
      ambientColor: "from-teal-200 to-green-100"
    },
    { 
      time: 250, 
      text: "In this space, nothing can harm you. You are completely protected and at peace.", 
      setting: "Safety",
      visualCue: "You are safe",
      ambientColor: "from-green-200 to-emerald-100"
    },
    { 
      time: 310, 
      text: "You can bring anything you want into this space - objects, people, pets that bring you joy.", 
      setting: "Personalization",
      visualCue: "Add what you love",
      ambientColor: "from-yellow-200 to-orange-100"
    },
    { 
      time: 380, 
      text: "Rest here as long as you need. This is your sanctuary, always available to you.", 
      setting: "Your Sanctuary",
      visualCue: "Rest deeply",
      ambientColor: "from-purple-200 to-pink-100"
    },
    { 
      time: 440, 
      text: "Remember, you can return to this safe space anytime, anywhere, just by closing your eyes.", 
      setting: "Always Available",
      visualCue: "Remember this",
      ambientColor: "from-pink-200 to-purple-100"
    },
    { 
      time: 480, 
      text: "When you're ready, gently open your eyes, knowing your safe space is always with you.", 
      setting: "Complete",
      visualCue: "Return safely",
      ambientColor: "from-white to-gray-100"
    }
  ]
};

const getSceneIcon = (script: string) => {
  if (script.includes('beach')) return FaWater;
  if (script.includes('forest')) return FaTree;
  if (script.includes('mountain')) return FaMountain;
  return FaHome;
};

const VisualizationJourney: React.FC<VisualizationJourneyProps> = ({ 
  session, 
  onStop, 
  isPlaying, 
  onTogglePlay 
}) => {
  const [currentSceneIndex, setCurrentSceneIndex] = useState(0);
  const [sessionTime, setSessionTime] = useState(0);
  const [volume, setVolume] = useState(70);
  const [isMuted, setIsMuted] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const masterGainRef = useRef<GainNode | null>(null);
  const ambientNoiseRef = useRef<{ stop: () => void } | null>(null);
  const speechRef = useRef<SpeechSynthesisUtterance | null>(null);
  const lastSceneRef = useRef<number>(-1);

  const script = visualizationScripts[session.script] || visualizationScripts['viz-safe'];
  const currentScene = script[currentSceneIndex];
  const SceneIcon = getSceneIcon(session.script);

  // Text-to-speech function
  const speakText = (text: string) => {
    if (!isMuted && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.75; // Slower for visualization
      utterance.pitch = 1.0;
      utterance.volume = volume / 100;
      
      const voices = window.speechSynthesis.getVoices();
      const preferredVoice = voices.find(voice => 
        voice.name.includes('Female') || 
        voice.name.includes('Samantha') ||
        voice.name.includes('natural')
      );
      if (preferredVoice) {
        utterance.voice = preferredVoice;
      }
      
      speechRef.current = utterance;
      window.speechSynthesis.speak(utterance);
    }
  };

  const stopSpeech = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  };

  // Timer management
  useEffect(() => {
    if (isPlaying) {
      intervalRef.current = setInterval(() => {
        setSessionTime(prev => prev + 1);
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      stopSpeech();
    }
    
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      stopSpeech();
    };
  }, [isPlaying]);

  // Auto-stop at end
  useEffect(() => {
    if (sessionTime >= session.duration * 60) {
      onStop();
    }
  }, [sessionTime, session.duration, onStop]);

  // Initial narration when starting
  useEffect(() => {
    if (isPlaying && sessionTime === 0 && script[0]?.text) {
      speakText(script[0].text);
    }
  }, [isPlaying, sessionTime, script]);

  // Update current scene based on session time
  useEffect(() => {
    // Find the correct scene for current time (reverse loop for performance)
    for (let i = script.length - 1; i >= 0; i--) {
      if (sessionTime >= script[i].time) {
        if (i !== lastSceneRef.current) {
          lastSceneRef.current = i;
          setCurrentSceneIndex(i);
          if (i > 0) { // Don't play tone on first scene
            playTransitionTone();
          }
          // Speak the scene text for all scenes after the first
          if (isPlaying && i > 0 && script[i].text) {
            speakText(script[i].text);
          }
        }
        break;
      }
    }
  }, [sessionTime, script, isPlaying]);

  // Audio context
  const ensureAudio = async (): Promise<AudioContext> => {
    if (!audioCtxRef.current) {
      const Ctx = (window.AudioContext || (window as any).webkitAudioContext) as typeof AudioContext;
      audioCtxRef.current = new Ctx();
      masterGainRef.current = audioCtxRef.current.createGain();
      masterGainRef.current.gain.value = isMuted ? 0 : volume / 100;
      masterGainRef.current.connect(audioCtxRef.current.destination);
    }
    if (audioCtxRef.current.state === 'suspended') {
      await audioCtxRef.current.resume();
    }
    return audioCtxRef.current;
  };

  // Ambient background tone
  useEffect(() => {
    if (isPlaying) {
      startAmbientSound();
    } else {
      stopAmbientSound();
    }
    
    return () => stopAmbientSound();
  }, [isPlaying]);

  const startAmbientSound = async () => {
    try {
      const ctx = await ensureAudio();
      
      // Create gentle ambient drone
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();
      const filter = ctx.createBiquadFilter();
      
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(110, ctx.currentTime); // A2
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(165, ctx.currentTime); // E3
      
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(800, ctx.currentTime);
      
      gain.gain.setValueAtTime(0, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.03, ctx.currentTime + 3);
      
      osc1.connect(filter);
      osc2.connect(filter);
      filter.connect(gain);
      gain.connect(masterGainRef.current!);
      
      osc1.start();
      osc2.start();
      
      ambientNoiseRef.current = {
        stop: () => {
          gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 2);
          setTimeout(() => {
            osc1.stop();
            osc2.stop();
          }, 2000);
        }
      };
    } catch {}
  };

  const stopAmbientSound = () => {
    ambientNoiseRef.current?.stop();
    ambientNoiseRef.current = null;
  };

  const playTransitionTone = async () => {
    try {
      const ctx = await ensureAudio();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(528, ctx.currentTime);
      
      gain.gain.setValueAtTime(0, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.08, ctx.currentTime + 0.1);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 2);
      
      osc.connect(gain);
      gain.connect(masterGainRef.current!);
      
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 2);
    } catch {}
  };

  useEffect(() => {
    if (masterGainRef.current) {
      masterGainRef.current.gain.value = isMuted ? 0 : volume / 100;
    }
  }, [volume, isMuted]);

  useEffect(() => {
    return () => {
      try {
        stopAmbientSound();
        audioCtxRef.current?.close();
      } catch {}
    };
  }, []);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = (sessionTime / (session.duration * 60)) * 100;

  return (
    <div className="relative min-h-[500px] flex flex-col items-center justify-center p-4 sm:p-6 md:p-8 overflow-hidden">
      {/* Animated background based on scene */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentScene?.ambientColor || 'default'}
          className={`absolute inset-0 bg-gradient-to-br ${currentScene?.ambientColor || 'from-blue-200 to-purple-100'} rounded-2xl`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 3 }}
        />
      </AnimatePresence>

      {/* Floating particles effect */}
      <div className="absolute inset-0 pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1.5 h-1.5 sm:w-2 sm:h-2 bg-white/20 rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              y: [0, -30, 0],
              opacity: [0.2, 0.5, 0.2],
              scale: [1, 1.5, 1],
            }}
            transition={{
              duration: 5 + Math.random() * 5,
              repeat: Infinity,
              delay: Math.random() * 5,
              ease: "easeInOut"
            }}
          />
        ))}
      </div>

      {/* Content */}
      <div className="relative z-10 w-full max-w-2xl">
        {/* Timer and Progress */}
        <motion.div
          className="text-center mb-4 sm:mb-6 md:mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="inline-flex items-center gap-2 sm:gap-3 md:gap-4 bg-white/80 backdrop-blur-sm rounded-xl sm:rounded-2xl px-4 sm:px-6 md:px-8 py-3 sm:py-4 shadow-lg mb-3 sm:mb-4">
            <SceneIcon className="text-2xl sm:text-3xl text-blue-600" />
            <div className="text-2xl sm:text-3xl md:text-4xl font-mono font-bold text-gray-800">
              {formatTime(sessionTime)}
            </div>
            <div className="text-xs sm:text-sm text-gray-600">
              / {session.duration}:00
            </div>
          </div>
          
          {/* Progress bar */}
          <div className="w-full max-w-md mx-auto bg-white/60 rounded-full h-1.5 sm:h-2 overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-blue-500 to-cyan-600"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </motion.div>

        {/* Combined Visual & Scene Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentSceneIndex}
            className="bg-white/70 backdrop-blur-md rounded-xl sm:rounded-2xl p-4 sm:p-6 md:p-8 shadow-2xl mb-4 sm:mb-6"
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: -20 }}
            transition={{ duration: 0.8 }}
          >
            {/* Mobile: Stacked, Desktop: Side by Side */}
            <div className="flex flex-col lg:flex-row gap-6 lg:gap-8 items-center">
              
              {/* Scene Visualization - Left Side on Desktop */}
              <motion.div 
                className="flex flex-col items-center lg:w-1/3"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
              >
                <div className="text-xs sm:text-sm font-semibold text-gray-600 mb-3 sm:mb-4">Scene Visualization</div>
                
                {/* Animated Scene Icon */}
                <div className="relative w-40 h-40 sm:w-48 sm:h-48 lg:w-56 lg:h-56 mb-3 sm:mb-4">
                  {/* Ambient glow effect */}
                  <motion.div
                    className="absolute inset-0 rounded-full bg-gradient-to-br from-blue-300 via-cyan-200 to-teal-200 blur-2xl"
                    animate={{
                      scale: [1, 1.2, 1],
                      opacity: [0.3, 0.5, 0.3]
                    }}
                    transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                  />
                  
                  {/* Main scene circle */}
                  <motion.div
                    className="absolute inset-4 rounded-full bg-gradient-to-br from-blue-400 via-cyan-400 to-teal-400 shadow-2xl flex items-center justify-center overflow-hidden"
                    animate={{
                      rotate: [0, 5, -5, 0]
                    }}
                    transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
                  >
                    {/* Floating elements based on scene */}
                    <div className="absolute inset-0">
                      {/* Beach scene - waves */}
                      {session.script.includes('beach') && (
                        <>
                          <motion.div
                            className="absolute bottom-0 left-0 right-0 h-1/3 bg-gradient-to-t from-blue-500/40 to-transparent"
                            animate={{
                              y: [0, -10, 0]
                            }}
                            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                          />
                          <motion.div
                            className="absolute top-1/4 right-1/4 text-2xl"
                            animate={{
                              y: [0, -5, 0],
                              rotate: [0, 10, 0]
                            }}
                            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
                          >
                            ☀️
                          </motion.div>
                        </>
                      )}
                      
                      {/* Forest scene - trees */}
                      {session.script.includes('forest') && (
                        <>
                          <motion.div
                            className="absolute bottom-0 left-0 right-0 h-2/3 bg-gradient-to-t from-green-600/30 to-transparent"
                          />
                          <motion.div
                            className="absolute top-1/3 left-1/4 text-xl"
                            animate={{
                              rotate: [0, -5, 5, 0]
                            }}
                            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                          >
                            🌲
                          </motion.div>
                          <motion.div
                            className="absolute top-1/2 right-1/4 text-lg"
                            animate={{
                              rotate: [0, 5, -5, 0]
                            }}
                            transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
                          >
                            🌳
                          </motion.div>
                        </>
                      )}
                      
                      {/* Mountain scene */}
                      {session.script.includes('mountain') && (
                        <>
                          <motion.div
                            className="absolute bottom-0 left-0 right-0 h-1/2 bg-gradient-to-t from-gray-500/30 to-transparent"
                          />
                          <motion.div
                            className="absolute top-1/4 left-1/2 transform -translate-x-1/2 text-2xl"
                            animate={{
                              scale: [1, 1.05, 1]
                            }}
                            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                          >
                            ⛰️
                          </motion.div>
                        </>
                      )}
                      
                      {/* Safe space - home */}
                      {session.script.includes('safe') && (
                        <motion.div
                          className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-4xl"
                          animate={{
                            scale: [1, 1.1, 1]
                          }}
                          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                        >
                          🏡
                        </motion.div>
                      )}
                    </div>
                  </motion.div>
                  
                  {/* Scene indicator */}
                  <motion.div
                    className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 text-xs sm:text-sm font-semibold text-blue-600 whitespace-nowrap"
                  >
                    {isPlaying ? "Immerse yourself" : "Ready to begin"}
                  </motion.div>
                </div>
                
                {/* Scene elements key */}
                <div className="text-center space-y-1 mt-6">
                  <div className="text-xs sm:text-sm text-gray-600">
                    <span className="font-semibold text-blue-600">Visualize</span> the scene
                  </div>
                  <div className="text-xs sm:text-sm text-gray-600">
                    <span className="font-semibold text-cyan-600">Feel</span> the environment
                  </div>
                </div>
              </motion.div>

              {/* Scene Description - Right Side on Desktop */}
              <motion.div 
                className="flex-1 lg:w-2/3 min-h-[150px] sm:min-h-[180px] flex flex-col justify-center"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
              >
                <motion.div
                  className="text-xs sm:text-sm font-semibold text-blue-600 mb-2 sm:mb-3 uppercase tracking-wide"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                >
                  {currentScene?.setting}
                </motion.div>
                
                {currentScene?.visualCue && (
                  <motion.div
                    className="text-[10px] sm:text-xs font-medium text-cyan-600 mb-3 sm:mb-4 px-3 sm:px-4 py-1.5 sm:py-2 bg-cyan-50 rounded-full inline-block"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.5 }}
                  >
                    {currentScene.visualCue}
                  </motion.div>
                )}
                
                <motion.p
                  className="text-base sm:text-lg md:text-xl text-gray-700 leading-relaxed"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                >
                  {currentScene?.text || "Breathe deeply and let your imagination guide you..."}
                </motion.p>
              </motion.div>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Scene indicator dots */}
        <div className="flex justify-center gap-1.5 sm:gap-2 mb-4 sm:mb-6">
          {script.map((_, index) => (
            <motion.div
              key={index}
              className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full transition-all ${
                index === currentSceneIndex
                  ? 'bg-blue-600 w-6 sm:w-8'
                  : index < currentSceneIndex
                  ? 'bg-blue-400'
                  : 'bg-white/50'
              }`}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: index * 0.05 }}
            />
          ))}
        </div>

        {/* Controls */}
        <div className="flex items-center justify-center gap-3 sm:gap-4 mb-4 sm:mb-6">
          <motion.button
            onClick={onTogglePlay}
            className="w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-r from-blue-500 to-cyan-600 text-white rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transition-all active:scale-95"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
          >
            {isPlaying ? <FaPause className="text-lg sm:text-xl" /> : <FaPlay className="text-lg sm:text-xl ml-1" />}
          </motion.button>
          <motion.button
            onClick={onStop}
            className="w-14 h-14 sm:w-16 sm:h-16 bg-gray-500 hover:bg-gray-600 text-white rounded-full flex items-center justify-center shadow-lg transition-all active:scale-95"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
          >
            <FaStop className="text-lg sm:text-xl" />
          </motion.button>
        </div>

        {/* Volume Control */}
        <motion.div
          className="flex items-center justify-center gap-3 sm:gap-4 bg-white/60 backdrop-blur-sm rounded-lg sm:rounded-xl p-3 sm:p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <motion.button
            onClick={() => setIsMuted(!isMuted)}
            className="w-9 h-9 sm:w-10 sm:h-10 bg-gray-200 hover:bg-gray-300 rounded-lg flex items-center justify-center transition-colors active:scale-95"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {isMuted ? <FaVolumeMute className="text-gray-600 text-sm sm:text-base" /> : <FaVolumeUp className="text-gray-600 text-sm sm:text-base" />}
          </motion.button>
          <div className="flex-1 max-w-[200px] sm:max-w-xs">
            <input
              type="range"
              min="0"
              max="100"
              value={isMuted ? 0 : volume}
              onChange={(e) => setVolume(Number(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            />
          </div>
          <span className="text-xs sm:text-sm text-gray-600 font-medium min-w-[2.5rem] sm:min-w-[3rem]">
            {isMuted ? '0%' : `${volume}%`}
          </span>
        </motion.div>
      </div>
    </div>
  );
};

export default VisualizationJourney;
