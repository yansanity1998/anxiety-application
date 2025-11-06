import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaHandPaper, FaPlay, FaPause, FaStop, FaVolumeUp, FaVolumeMute, FaCheckCircle } from 'react-icons/fa';

interface PMRSession {
  name: string;
  duration: number;
  script: string;
}

interface ProgressiveMuscleRelaxationProps {
  session: PMRSession;
  onStop: () => void;
  isPlaying: boolean;
  onTogglePlay: () => void;
}

interface MuscleGroup {
  name: string;
  tenseInstruction: string;
  releaseInstruction: string;
  tenseDuration: number;
  releaseDuration: number;
  bodyPart: string;
}

const pmrSequences: Record<string, MuscleGroup[]> = {
  'pmr-quick': [
    {
      name: 'Hands & Arms',
      tenseInstruction: 'Make tight fists with both hands. Squeeze hard.',
      releaseInstruction: 'Release and let your hands and arms go completely limp.',
      tenseDuration: 7,
      releaseDuration: 15,
      bodyPart: 'Upper Body'
    },
    {
      name: 'Face & Jaw',
      tenseInstruction: 'Scrunch up your face. Squeeze your eyes shut, clench your jaw.',
      releaseInstruction: 'Let all facial muscles relax. Feel your jaw drop slightly.',
      tenseDuration: 7,
      releaseDuration: 15,
      bodyPart: 'Head'
    },
    {
      name: 'Shoulders & Neck',
      tenseInstruction: 'Raise your shoulders up to your ears. Hold the tension.',
      releaseInstruction: 'Drop your shoulders down. Feel the tension melt away.',
      tenseDuration: 7,
      releaseDuration: 15,
      bodyPart: 'Upper Body'
    },
    {
      name: 'Chest & Back',
      tenseInstruction: 'Take a deep breath and hold it. Arch your back slightly.',
      releaseInstruction: 'Exhale and let your chest and back relax completely.',
      tenseDuration: 7,
      releaseDuration: 15,
      bodyPart: 'Torso'
    },
    {
      name: 'Legs & Feet',
      tenseInstruction: 'Point your toes down and tense your entire legs.',
      releaseInstruction: 'Release and feel your legs become heavy and relaxed.',
      tenseDuration: 7,
      releaseDuration: 15,
      bodyPart: 'Lower Body'
    }
  ],
  'pmr-full': [
    {
      name: 'Right Hand & Forearm',
      tenseInstruction: 'Make a tight fist with your right hand.',
      releaseInstruction: 'Release and notice the difference between tension and relaxation.',
      tenseDuration: 8,
      releaseDuration: 20,
      bodyPart: 'Right Arm'
    },
    {
      name: 'Right Upper Arm',
      tenseInstruction: 'Bend your right arm and tense your bicep.',
      releaseInstruction: 'Let your arm drop and relax completely.',
      tenseDuration: 8,
      releaseDuration: 20,
      bodyPart: 'Right Arm'
    },
    {
      name: 'Left Hand & Forearm',
      tenseInstruction: 'Make a tight fist with your left hand.',
      releaseInstruction: 'Release and feel the warmth flowing into your hand.',
      tenseDuration: 8,
      releaseDuration: 20,
      bodyPart: 'Left Arm'
    },
    {
      name: 'Left Upper Arm',
      tenseInstruction: 'Bend your left arm and tense your bicep.',
      releaseInstruction: 'Let your arm drop and become heavy.',
      tenseDuration: 8,
      releaseDuration: 20,
      bodyPart: 'Left Arm'
    },
    {
      name: 'Forehead',
      tenseInstruction: 'Raise your eyebrows as high as you can.',
      releaseInstruction: 'Let your forehead become smooth and relaxed.',
      tenseDuration: 8,
      releaseDuration: 20,
      bodyPart: 'Face'
    },
    {
      name: 'Eyes & Nose',
      tenseInstruction: 'Squeeze your eyes shut tightly and wrinkle your nose.',
      releaseInstruction: 'Release and feel your eyes rest gently.',
      tenseDuration: 8,
      releaseDuration: 20,
      bodyPart: 'Face'
    },
    {
      name: 'Jaw & Mouth',
      tenseInstruction: 'Clench your jaw and press your tongue to the roof of your mouth.',
      releaseInstruction: 'Let your jaw hang loose and your tongue rest.',
      tenseDuration: 8,
      releaseDuration: 20,
      bodyPart: 'Face'
    },
    {
      name: 'Neck',
      tenseInstruction: 'Press your head back against the surface behind you.',
      releaseInstruction: 'Let your neck relax and your head rest naturally.',
      tenseDuration: 8,
      releaseDuration: 20,
      bodyPart: 'Neck'
    },
    {
      name: 'Shoulders',
      tenseInstruction: 'Raise your shoulders up toward your ears.',
      releaseInstruction: 'Drop your shoulders and feel the tension release.',
      tenseDuration: 8,
      releaseDuration: 20,
      bodyPart: 'Upper Body'
    },
    {
      name: 'Chest',
      tenseInstruction: 'Take a deep breath and hold it, tensing your chest.',
      releaseInstruction: 'Exhale slowly and let your chest relax.',
      tenseDuration: 8,
      releaseDuration: 20,
      bodyPart: 'Torso'
    },
    {
      name: 'Stomach',
      tenseInstruction: 'Tighten your stomach muscles, making them hard.',
      releaseInstruction: 'Let your stomach soften and relax.',
      tenseDuration: 8,
      releaseDuration: 20,
      bodyPart: 'Torso'
    },
    {
      name: 'Lower Back',
      tenseInstruction: 'Arch your lower back slightly.',
      releaseInstruction: 'Let your back settle and relax.',
      tenseDuration: 8,
      releaseDuration: 20,
      bodyPart: 'Torso'
    },
    {
      name: 'Right Thigh',
      tenseInstruction: 'Tense your right thigh muscle.',
      releaseInstruction: 'Release and feel your thigh become heavy.',
      tenseDuration: 8,
      releaseDuration: 20,
      bodyPart: 'Right Leg'
    },
    {
      name: 'Right Calf',
      tenseInstruction: 'Point your right toes down and tense your calf.',
      releaseInstruction: 'Release and let your calf relax.',
      tenseDuration: 8,
      releaseDuration: 20,
      bodyPart: 'Right Leg'
    },
    {
      name: 'Right Foot',
      tenseInstruction: 'Curl your right toes under tightly.',
      releaseInstruction: 'Release and feel your foot relax completely.',
      tenseDuration: 8,
      releaseDuration: 20,
      bodyPart: 'Right Leg'
    },
    {
      name: 'Left Thigh',
      tenseInstruction: 'Tense your left thigh muscle.',
      releaseInstruction: 'Release and feel your thigh become heavy.',
      tenseDuration: 8,
      releaseDuration: 20,
      bodyPart: 'Left Leg'
    },
    {
      name: 'Left Calf',
      tenseInstruction: 'Point your left toes down and tense your calf.',
      releaseInstruction: 'Release and let your calf relax.',
      tenseDuration: 8,
      releaseDuration: 20,
      bodyPart: 'Left Leg'
    },
    {
      name: 'Left Foot',
      tenseInstruction: 'Curl your left toes under tightly.',
      releaseInstruction: 'Release and feel your foot relax completely.',
      tenseDuration: 8,
      releaseDuration: 20,
      bodyPart: 'Left Leg'
    }
  ],
  'pmr-targeted': [
    {
      name: 'Shoulders & Upper Back',
      tenseInstruction: 'Pull your shoulders back and squeeze your shoulder blades together.',
      releaseInstruction: 'Let your shoulders drop forward and relax.',
      tenseDuration: 10,
      releaseDuration: 25,
      bodyPart: 'Upper Body'
    },
    {
      name: 'Neck & Jaw',
      tenseInstruction: 'Tilt your head back and clench your jaw tightly.',
      releaseInstruction: 'Bring your head to neutral and let your jaw hang loose.',
      tenseDuration: 10,
      releaseDuration: 25,
      bodyPart: 'Head & Neck'
    },
    {
      name: 'Lower Back',
      tenseInstruction: 'Arch your lower back and hold the tension.',
      releaseInstruction: 'Let your back flatten and relax into the surface.',
      tenseDuration: 10,
      releaseDuration: 25,
      bodyPart: 'Torso'
    },
    {
      name: 'Hips & Glutes',
      tenseInstruction: 'Squeeze your buttocks together tightly.',
      releaseInstruction: 'Release and feel your hips sink down.',
      tenseDuration: 10,
      releaseDuration: 25,
      bodyPart: 'Lower Body'
    },
    {
      name: 'Full Body Integration',
      tenseInstruction: 'Tense every muscle in your body at once.',
      releaseInstruction: 'Release everything and feel complete relaxation wash over you.',
      tenseDuration: 10,
      releaseDuration: 30,
      bodyPart: 'Whole Body'
    }
  ]
};

const ProgressiveMuscleRelaxation: React.FC<ProgressiveMuscleRelaxationProps> = ({ 
  session, 
  onStop, 
  isPlaying, 
  onTogglePlay 
}) => {
  const [currentGroupIndex, setCurrentGroupIndex] = useState(0);
  const [phase, setPhase] = useState<'intro' | 'tense' | 'release' | 'rest' | 'complete'>('intro');
  const [phaseTime, setPhaseTime] = useState(0);
  const [sessionTime, setSessionTime] = useState(0);
  const [completedGroups, setCompletedGroups] = useState<number[]>([]);
  const [volume, setVolume] = useState(70);
  const [isMuted, setIsMuted] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const masterGainRef = useRef<GainNode | null>(null);
  const speechRef = useRef<SpeechSynthesisUtterance | null>(null);

  const sequence = pmrSequences[session.script] || pmrSequences['pmr-quick'];
  const currentGroup = sequence[currentGroupIndex];
  const totalGroups = sequence.length;

  // Text-to-speech function
  const speakText = (text: string) => {
    if (!isMuted && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.85; // Slightly slower for instructions
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

  // Initial narration when starting
  useEffect(() => {
    if (isPlaying && phase === 'intro' && sessionTime === 0) {
      speakText('Welcome to Progressive Muscle Relaxation. Find a comfortable position and get ready to begin.');
    }
  }, [isPlaying, phase, sessionTime]);

  // Timer management
  useEffect(() => {
    if (isPlaying) {
      intervalRef.current = setInterval(() => {
        setSessionTime(prev => prev + 1);
        setPhaseTime(prev => {
          const newTime = prev + 1;
          
          // Phase transitions
          if (phase === 'intro' && newTime >= 5) {
            setPhase('tense');
            playTenseTone();
            speakText(`Now focus on your ${currentGroup.name}. ${currentGroup.tenseInstruction}`);
            return 0;
          } else if (phase === 'tense' && newTime >= currentGroup.tenseDuration) {
            setPhase('release');
            playReleaseTone();
            speakText(currentGroup.releaseInstruction);
            return 0;
          } else if (phase === 'release' && newTime >= currentGroup.releaseDuration) {
            setCompletedGroups(prev => [...prev, currentGroupIndex]);
            if (currentGroupIndex < totalGroups - 1) {
              setPhase('rest');
              speakText('Take a moment to notice the difference. Breathe naturally.');
              return 0;
            } else {
              setPhase('complete');
              playCompletionTone();
              speakText('Session complete! You have successfully relaxed all major muscle groups.');
              return 0;
            }
          } else if (phase === 'rest' && newTime >= 5) {
            const nextGroupIndex = currentGroupIndex + 1;
            setCurrentGroupIndex(nextGroupIndex);
            setPhase('tense');
            playTenseTone();
            // Speak the next muscle group name and instruction
            if (nextGroupIndex < totalGroups) {
              const nextGroup = sequence[nextGroupIndex];
              speakText(`Now focus on your ${nextGroup.name}. ${nextGroup.tenseInstruction}`);
            }
            return 0;
          }
          
          return newTime;
        });
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
  }, [isPlaying, phase, currentGroupIndex, currentGroup, totalGroups]);

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

  const playTenseTone = async () => {
    try {
      const ctx = await ensureAudio();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(300, ctx.currentTime);
      
      gain.gain.setValueAtTime(0, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.08, ctx.currentTime + 0.1);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8);
      
      osc.connect(gain);
      gain.connect(masterGainRef.current!);
      
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.8);
    } catch {}
  };

  const playReleaseTone = async () => {
    try {
      const ctx = await ensureAudio();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(528, ctx.currentTime); // Healing frequency
      
      gain.gain.setValueAtTime(0, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.12, ctx.currentTime + 0.15);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 2);
      
      osc.connect(gain);
      gain.connect(masterGainRef.current!);
      
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 2);
    } catch {}
  };

  const playCompletionTone = async () => {
    try {
      const ctx = await ensureAudio();
      // Play a pleasant chord
      [523.25, 659.25, 783.99].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, ctx.currentTime);
        
        gain.gain.setValueAtTime(0, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.1, ctx.currentTime + 0.1);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 2.5);
        
        osc.connect(gain);
        gain.connect(masterGainRef.current!);
        
        osc.start(ctx.currentTime + i * 0.1);
        osc.stop(ctx.currentTime + 2.5 + i * 0.1);
      });
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
        audioCtxRef.current?.close();
      } catch {}
    };
  }, []);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = ((currentGroupIndex + (phase === 'complete' ? 1 : 0)) / totalGroups) * 100;

  const getPhaseColor = () => {
    switch (phase) {
      case 'tense': return 'from-orange-500 to-red-600';
      case 'release': return 'from-green-500 to-emerald-600';
      case 'rest': return 'from-blue-500 to-cyan-600';
      case 'complete': return 'from-purple-500 to-pink-600';
      default: return 'from-green-500 to-emerald-600';
    }
  };

  const getPhaseText = () => {
    switch (phase) {
      case 'intro': return 'Prepare yourself';
      case 'tense': return 'TENSE';
      case 'release': return 'RELEASE';
      case 'rest': return 'Rest & Breathe';
      case 'complete': return 'Complete!';
    }
  };

  return (
    <div className="relative min-h-[500px] flex flex-col items-center justify-center p-4 sm:p-6 md:p-8">
      {/* Background */}
      <motion.div
        className={`absolute inset-0 bg-gradient-to-br ${getPhaseColor()} rounded-2xl opacity-10`}
        animate={{
          opacity: phase === 'tense' ? 0.2 : 0.1
        }}
        transition={{ duration: 0.5 }}
      />

      {/* Content */}
      <div className="relative z-10 w-full max-w-2xl">
        {/* Progress */}
        <motion.div className="text-center mb-4 sm:mb-6">
          <div className="inline-flex items-center gap-2 sm:gap-4 bg-white/80 backdrop-blur-sm rounded-xl sm:rounded-2xl px-4 sm:px-8 py-3 sm:py-4 shadow-lg mb-3 sm:mb-4">
            <FaHandPaper className="text-2xl sm:text-3xl text-green-600" />
            <div className="text-2xl sm:text-3xl md:text-4xl font-mono font-bold text-gray-800">
              {formatTime(sessionTime)}
            </div>
          </div>
          
          <div className="w-full max-w-md mx-auto bg-white/60 rounded-full h-2 sm:h-3 overflow-hidden mb-2">
            <motion.div
              className="h-full bg-gradient-to-r from-green-500 to-emerald-600"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
          
          <div className="text-xs sm:text-sm text-gray-600 font-medium">
            Muscle Group {currentGroupIndex + 1} of {totalGroups}
          </div>
        </motion.div>

        {/* Phase indicator */}
        <AnimatePresence mode="wait">
          <motion.div
            key={phase}
            className={`bg-gradient-to-r ${getPhaseColor()} text-white rounded-xl sm:rounded-2xl p-3 sm:p-4 mb-4 sm:mb-6 text-center shadow-lg`}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
          >
            <div className="text-xl sm:text-2xl font-bold mb-1">{getPhaseText()}</div>
            {phase !== 'intro' && phase !== 'complete' && (
              <div className="text-base sm:text-lg font-mono">{phaseTime}s</div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Combined Visual & Instructions */}
        {phase !== 'complete' && currentGroup && (
          <AnimatePresence mode="wait">
            <motion.div
              key={`${currentGroupIndex}-${phase}`}
              className="bg-white/90 backdrop-blur-sm rounded-xl sm:rounded-2xl p-4 sm:p-6 md:p-8 shadow-xl mb-4 sm:mb-6"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.5 }}
            >
              {/* Mobile: Stacked Layout, Desktop: Side by Side */}
              <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
                
                {/* Visual Body Diagram - Left Side on Desktop */}
                <motion.div 
                  className="flex flex-col items-center lg:w-1/3"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.6, delay: 0.2 }}
                >
                  <div className="text-xs sm:text-sm font-semibold text-gray-600 mb-3 sm:mb-4">Focus Area</div>
                  
                  {/* Body Diagram with Animation */}
                  <motion.div 
                    className="relative w-32 h-56 sm:w-40 sm:h-72 lg:w-48 lg:h-80 mb-3 sm:mb-4"
                    animate={phase === 'tense' ? {
                      scale: [1, 1.05, 1],
                    } : phase === 'release' ? {
                      scale: [1, 0.98, 1],
                    } : {}}
                    transition={{ 
                      duration: phase === 'tense' ? 1.5 : 2,
                      repeat: phase === 'tense' || phase === 'release' ? Infinity : 0,
                      ease: "easeInOut"
                    }}
                  >
                    <svg viewBox="0 0 200 320" className="w-full h-full drop-shadow-lg">
                  {/* Head */}
                  <circle 
                    cx="100" 
                    cy="30" 
                    r="25" 
                    fill={currentGroup.bodyPart.includes('Head') || currentGroup.bodyPart.includes('Face') ? '#10b981' : '#e5e7eb'}
                    stroke="#374151"
                    strokeWidth="2"
                    className={phase === 'tense' && (currentGroup.bodyPart.includes('Head') || currentGroup.bodyPart.includes('Face')) ? 'animate-pulse' : ''}
                  />
                  
                  {/* Neck */}
                  <rect 
                    x="90" 
                    y="55" 
                    width="20" 
                    height="15" 
                    fill={currentGroup.bodyPart.includes('Neck') ? '#10b981' : '#e5e7eb'}
                    stroke="#374151"
                    strokeWidth="2"
                    className={phase === 'tense' && currentGroup.bodyPart.includes('Neck') ? 'animate-pulse' : ''}
                  />
                  
                  {/* Shoulders */}
                  <line 
                    x1="50" 
                    y1="80" 
                    x2="150" 
                    y2="80" 
                    stroke={currentGroup.bodyPart.includes('Upper Body') || currentGroup.name.includes('Shoulder') ? '#10b981' : '#374151'}
                    strokeWidth={currentGroup.bodyPart.includes('Upper Body') || currentGroup.name.includes('Shoulder') ? '8' : '4'}
                    strokeLinecap="round"
                    className={phase === 'tense' && (currentGroup.bodyPart.includes('Upper Body') || currentGroup.name.includes('Shoulder')) ? 'animate-pulse' : ''}
                  />
                  
                  {/* Torso */}
                  <rect 
                    x="75" 
                    y="70" 
                    width="50" 
                    height="80" 
                    rx="10"
                    fill={currentGroup.bodyPart.includes('Torso') || currentGroup.bodyPart.includes('Chest') || currentGroup.bodyPart.includes('Back') ? '#10b981' : '#e5e7eb'}
                    stroke="#374151"
                    strokeWidth="2"
                    className={phase === 'tense' && (currentGroup.bodyPart.includes('Torso') || currentGroup.bodyPart.includes('Chest') || currentGroup.bodyPart.includes('Back')) ? 'animate-pulse' : ''}
                  />
                  
                  {/* Right Arm */}
                  <line 
                    x1="50" 
                    y1="80" 
                    x2="30" 
                    y2="140" 
                    stroke={currentGroup.bodyPart.includes('Right Arm') || (currentGroup.name.includes('Right') && currentGroup.name.includes('Arm')) ? '#10b981' : '#374151'}
                    strokeWidth={currentGroup.bodyPart.includes('Right Arm') || (currentGroup.name.includes('Right') && currentGroup.name.includes('Arm')) ? '6' : '4'}
                    strokeLinecap="round"
                    className={phase === 'tense' && (currentGroup.bodyPart.includes('Right Arm') || (currentGroup.name.includes('Right') && currentGroup.name.includes('Arm'))) ? 'animate-pulse' : ''}
                  />
                  
                  {/* Right Hand */}
                  <circle 
                    cx="30" 
                    cy="145" 
                    r="8" 
                    fill={currentGroup.name.includes('Right Hand') || currentGroup.name.includes('Hands') ? '#10b981' : '#e5e7eb'}
                    stroke="#374151"
                    strokeWidth="2"
                    className={phase === 'tense' && (currentGroup.name.includes('Right Hand') || currentGroup.name.includes('Hands')) ? 'animate-pulse' : ''}
                  />
                  
                  {/* Left Arm */}
                  <line 
                    x1="150" 
                    y1="80" 
                    x2="170" 
                    y2="140" 
                    stroke={currentGroup.bodyPart.includes('Left Arm') || (currentGroup.name.includes('Left') && currentGroup.name.includes('Arm')) ? '#10b981' : '#374151'}
                    strokeWidth={currentGroup.bodyPart.includes('Left Arm') || (currentGroup.name.includes('Left') && currentGroup.name.includes('Arm')) ? '6' : '4'}
                    strokeLinecap="round"
                    className={phase === 'tense' && (currentGroup.bodyPart.includes('Left Arm') || (currentGroup.name.includes('Left') && currentGroup.name.includes('Arm'))) ? 'animate-pulse' : ''}
                  />
                  
                  {/* Left Hand */}
                  <circle 
                    cx="170" 
                    cy="145" 
                    r="8" 
                    fill={currentGroup.name.includes('Left Hand') || currentGroup.name.includes('Hands') ? '#10b981' : '#e5e7eb'}
                    stroke="#374151"
                    strokeWidth="2"
                    className={phase === 'tense' && (currentGroup.name.includes('Left Hand') || currentGroup.name.includes('Hands')) ? 'animate-pulse' : ''}
                  />
                  
                  {/* Hips/Glutes */}
                  <ellipse 
                    cx="100" 
                    cy="155" 
                    rx="30" 
                    ry="15" 
                    fill={currentGroup.name.includes('Hips') || currentGroup.name.includes('Glutes') || currentGroup.bodyPart.includes('Lower Body') ? '#10b981' : '#e5e7eb'}
                    stroke="#374151"
                    strokeWidth="2"
                    className={phase === 'tense' && (currentGroup.name.includes('Hips') || currentGroup.name.includes('Glutes') || currentGroup.bodyPart.includes('Lower Body')) ? 'animate-pulse' : ''}
                  />
                  
                  {/* Right Leg */}
                  <line 
                    x1="85" 
                    y1="170" 
                    x2="75" 
                    y2="260" 
                    stroke={currentGroup.bodyPart.includes('Right Leg') || (currentGroup.name.includes('Right') && (currentGroup.name.includes('Thigh') || currentGroup.name.includes('Calf'))) ? '#10b981' : '#374151'}
                    strokeWidth={currentGroup.bodyPart.includes('Right Leg') || (currentGroup.name.includes('Right') && (currentGroup.name.includes('Thigh') || currentGroup.name.includes('Calf'))) ? '6' : '4'}
                    strokeLinecap="round"
                    className={phase === 'tense' && (currentGroup.bodyPart.includes('Right Leg') || (currentGroup.name.includes('Right') && (currentGroup.name.includes('Thigh') || currentGroup.name.includes('Calf')))) ? 'animate-pulse' : ''}
                  />
                  
                  {/* Right Foot */}
                  <ellipse 
                    cx="75" 
                    cy="270" 
                    rx="12" 
                    ry="8" 
                    fill={currentGroup.name.includes('Right Foot') ? '#10b981' : '#e5e7eb'}
                    stroke="#374151"
                    strokeWidth="2"
                    className={phase === 'tense' && currentGroup.name.includes('Right Foot') ? 'animate-pulse' : ''}
                  />
                  
                  {/* Left Leg */}
                  <line 
                    x1="115" 
                    y1="170" 
                    x2="125" 
                    y2="260" 
                    stroke={currentGroup.bodyPart.includes('Left Leg') || (currentGroup.name.includes('Left') && (currentGroup.name.includes('Thigh') || currentGroup.name.includes('Calf'))) ? '#10b981' : '#374151'}
                    strokeWidth={currentGroup.bodyPart.includes('Left Leg') || (currentGroup.name.includes('Left') && (currentGroup.name.includes('Thigh') || currentGroup.name.includes('Calf'))) ? '6' : '4'}
                    strokeLinecap="round"
                    className={phase === 'tense' && (currentGroup.bodyPart.includes('Left Leg') || (currentGroup.name.includes('Left') && (currentGroup.name.includes('Thigh') || currentGroup.name.includes('Calf')))) ? 'animate-pulse' : ''}
                  />
                  
                  {/* Left Foot */}
                  <ellipse 
                    cx="125" 
                    cy="270" 
                    rx="12" 
                    ry="8" 
                    fill={currentGroup.name.includes('Left Foot') ? '#10b981' : '#e5e7eb'}
                    stroke="#374151"
                    strokeWidth="2"
                    className={phase === 'tense' && currentGroup.name.includes('Left Foot') ? 'animate-pulse' : ''}
                  />
                  
                  {/* Full Body highlight for integration */}
                  {currentGroup.bodyPart === 'Whole Body' && (
                    <rect 
                      x="10" 
                      y="10" 
                      width="180" 
                      height="280" 
                      rx="20"
                      fill="none"
                      stroke="#10b981"
                      strokeWidth="4"
                      strokeDasharray="10,5"
                      className={phase === 'tense' ? 'animate-pulse' : ''}
                    />
                  )}
                </svg>
                  </motion.div>
                  
                  {/* Legend */}
                  <div className="flex items-center gap-3 sm:gap-4 text-[10px] sm:text-xs text-gray-600">
                    <div className="flex items-center gap-1.5 sm:gap-2">
                      <motion.div 
                        className="w-3 h-3 sm:w-4 sm:h-4 bg-green-500 rounded"
                        animate={phase === 'tense' ? { scale: [1, 1.2, 1] } : {}}
                        transition={{ duration: 1, repeat: Infinity }}
                      />
                      <span>Active</span>
                    </div>
                    <div className="flex items-center gap-1.5 sm:gap-2">
                      <div className="w-3 h-3 sm:w-4 sm:h-4 bg-gray-300 rounded"></div>
                      <span>Relaxed</span>
                    </div>
                  </div>
                </motion.div>

                {/* Instructions - Right Side on Desktop */}
                <motion.div 
                  className="flex-1 lg:w-2/3"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.6, delay: 0.3 }}
                >
                  <div className="text-xs sm:text-sm font-semibold text-green-600 mb-2 uppercase tracking-wide">
                    {currentGroup?.bodyPart}
                  </div>
                  
                  <motion.h3 
                    className="text-lg sm:text-xl md:text-2xl font-bold text-gray-800 mb-3 sm:mb-4"
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.4 }}
                  >
                    {currentGroup?.name}
                  </motion.h3>
                  
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.5, delay: 0.5 }}
                  >
                    {/* Phase-specific visual indicator */}
                    {phase === 'tense' && (
                      <motion.div 
                        className="mb-4 p-3 bg-orange-50 border-l-4 border-orange-500 rounded-r-lg"
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.3 }}
                      >
                        <div className="flex items-center gap-2 text-orange-700 font-semibold text-sm">
                          <motion.div
                            animate={{ scale: [1, 1.2, 1] }}
                            transition={{ duration: 1, repeat: Infinity }}
                          >
                            💪
                          </motion.div>
                          <span>Tense the muscles now!</span>
                        </div>
                      </motion.div>
                    )}
                    
                    {phase === 'release' && (
                      <motion.div 
                        className="mb-4 p-3 bg-green-50 border-l-4 border-green-500 rounded-r-lg"
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.3 }}
                      >
                        <div className="flex items-center gap-2 text-green-700 font-semibold text-sm">
                          <motion.div
                            animate={{ rotate: [0, 10, -10, 0] }}
                            transition={{ duration: 2, repeat: Infinity }}
                          >
                            🌊
                          </motion.div>
                          <span>Release and relax...</span>
                        </div>
                      </motion.div>
                    )}
                    
                    {phase === 'rest' && (
                      <motion.div 
                        className="mb-4 p-3 bg-blue-50 border-l-4 border-blue-500 rounded-r-lg"
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.3 }}
                      >
                        <div className="flex items-center gap-2 text-blue-700 font-semibold text-sm">
                          <motion.div
                            animate={{ scale: [1, 1.1, 1] }}
                            transition={{ duration: 3, repeat: Infinity }}
                          >
                            😌
                          </motion.div>
                          <span>Breathe naturally</span>
                        </div>
                      </motion.div>
                    )}
                    
                    <motion.p 
                      className="text-sm sm:text-base md:text-lg text-gray-700 leading-relaxed"
                      key={phase}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4 }}
                    >
                      {phase === 'intro' && 'Get ready to begin...'}
                      {phase === 'tense' && currentGroup?.tenseInstruction}
                      {phase === 'release' && currentGroup?.releaseInstruction}
                      {phase === 'rest' && 'Take a moment to notice the difference. Breathe naturally.'}
                    </motion.p>
                  </motion.div>
                </motion.div>
              </div>
            </motion.div>
          </AnimatePresence>
        )}

        {/* Completion Screen */}
        {phase === 'complete' && (
          <motion.div
            className="bg-white/90 backdrop-blur-sm rounded-xl sm:rounded-2xl p-6 sm:p-8 shadow-xl mb-4 sm:mb-6 text-center"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <FaCheckCircle className="text-4xl sm:text-5xl md:text-6xl text-green-600 mx-auto mb-3 sm:mb-4" />
            <h3 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-3 sm:mb-4">
              Session Complete!
            </h3>
            <p className="text-sm sm:text-base md:text-lg text-gray-700">
              You've successfully relaxed all major muscle groups. Notice how calm and relaxed your body feels.
            </p>
          </motion.div>
        )}

        {/* Completed groups tracker */}
        <div className="grid grid-cols-6 gap-1.5 sm:gap-2 mb-4 sm:mb-6">
          {sequence.map((_, index) => (
            <motion.div
              key={index}
              className={`h-1.5 sm:h-2 rounded-full ${
                completedGroups.includes(index)
                  ? 'bg-green-500'
                  : index === currentGroupIndex
                  ? 'bg-yellow-500'
                  : 'bg-gray-300'
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
            className="w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transition-all active:scale-95"
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

export default ProgressiveMuscleRelaxation;
