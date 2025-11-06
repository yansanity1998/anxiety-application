import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaBrain, FaPlay, FaPause, FaStop, FaVolumeUp, FaVolumeMute } from 'react-icons/fa';

interface MeditationSession {
  name: string;
  duration: number;
  script: string;
}

interface GuidedMeditationProps {
  session: MeditationSession;
  onStop: () => void;
  isPlaying: boolean;
  onTogglePlay: () => void;
}

const meditationScripts: Record<string, Array<{ time: number; text: string; instruction?: string }>> = {
  'meditation-calm': [
    { time: 0, text: "Welcome to your Quick Calm meditation.", instruction: "Find a comfortable position" },
    { time: 10, text: "Close your eyes gently and take a deep breath in through your nose...", instruction: "Breathe in slowly" },
    { time: 20, text: "Hold for a moment... and exhale slowly through your mouth.", instruction: "Release tension" },
    { time: 30, text: "Notice the natural rhythm of your breathing. No need to change it.", instruction: "Observe your breath" },
    { time: 50, text: "If your mind wanders, that's okay. Gently bring your attention back to your breath.", instruction: "Stay present" },
    { time: 70, text: "Feel the air entering your nostrils, filling your lungs, and leaving your body.", instruction: "Full awareness" },
    { time: 90, text: "With each exhale, release any tension you're holding.", instruction: "Let go" },
    { time: 120, text: "You are calm, centered, and at peace.", instruction: "Embrace tranquility" },
    { time: 150, text: "Take three more deep breaths at your own pace.", instruction: "Final breaths" },
    { time: 180, text: "When you're ready, gently open your eyes. Well done.", instruction: "Return refreshed" }
  ],
  'meditation-peace': [
    { time: 0, text: "Welcome to Deep Peace meditation. Let's begin this journey together.", instruction: "Settle in comfortably" },
    { time: 15, text: "Close your eyes and bring your awareness to your body.", instruction: "Body scan" },
    { time: 30, text: "Notice where you're holding tension. Your shoulders, your jaw, your hands.", instruction: "Identify tension" },
    { time: 50, text: "Take a deep breath in... and as you exhale, let that tension melt away.", instruction: "Release" },
    { time: 80, text: "Imagine a warm, golden light above your head, radiating peace and calm.", instruction: "Visualize light" },
    { time: 120, text: "This light slowly descends, washing over your head, your face, your neck.", instruction: "Feel warmth" },
    { time: 160, text: "It flows down your shoulders, arms, and chest, dissolving all stress.", instruction: "Complete relaxation" },
    { time: 200, text: "The light continues down your torso, legs, all the way to your toes.", instruction: "Full body peace" },
    { time: 250, text: "You are completely surrounded by this peaceful, healing light.", instruction: "Immerse yourself" },
    { time: 300, text: "Rest here for a moment, bathed in tranquility.", instruction: "Simply be" },
    { time: 350, text: "Know that you can return to this peaceful place anytime you need.", instruction: "Remember this feeling" },
    { time: 400, text: "Begin to deepen your breath, wiggle your fingers and toes.", instruction: "Gentle awakening" },
    { time: 450, text: "When you're ready, open your eyes, carrying this peace with you.", instruction: "Return renewed" }
  ],
  'meditation-anxiety': [
    { time: 0, text: "Welcome. This meditation is designed to help ease your anxiety.", instruction: "You are safe here" },
    { time: 20, text: "Find a comfortable position and close your eyes.", instruction: "Get comfortable" },
    { time: 40, text: "Place one hand on your heart and one on your belly.", instruction: "Connect with yourself" },
    { time: 60, text: "Feel your heartbeat. Feel your breath. You are alive and present.", instruction: "Ground yourself" },
    { time: 90, text: "Anxiety is just a feeling. It cannot harm you. It will pass.", instruction: "Acknowledge it" },
    { time: 120, text: "Breathe in slowly for 4 counts... 1, 2, 3, 4.", instruction: "Inhale deeply" },
    { time: 135, text: "Hold for 4 counts... 1, 2, 3, 4.", instruction: "Pause" },
    { time: 150, text: "Exhale for 6 counts... 1, 2, 3, 4, 5, 6.", instruction: "Release slowly" },
    { time: 170, text: "Let's do that again. Breathe in... 1, 2, 3, 4.", instruction: "Inhale" },
    { time: 185, text: "Hold... 1, 2, 3, 4.", instruction: "Hold" },
    { time: 200, text: "Exhale... 1, 2, 3, 4, 5, 6.", instruction: "Release" },
    { time: 230, text: "Notice how your body begins to relax with each breath.", instruction: "Feel the shift" },
    { time: 270, text: "Your thoughts are like clouds passing in the sky. Let them drift by.", instruction: "Observe thoughts" },
    { time: 320, text: "You don't need to fight anxiety. Simply breathe and let it be.", instruction: "Accept and release" },
    { time: 380, text: "With each breath, you become more calm, more centered, more at peace.", instruction: "Embrace calm" },
    { time: 450, text: "You are stronger than your anxiety. You are in control.", instruction: "Affirm your strength" },
    { time: 520, text: "Take three more deep breaths, feeling gratitude for this moment.", instruction: "Gratitude" },
    { time: 580, text: "When you're ready, gently open your eyes. You've done beautifully.", instruction: "Return empowered" }
  ],
  'meditation-sleep': [
    { time: 0, text: "Welcome to your Sleep Preparation meditation.", instruction: "Prepare for rest" },
    { time: 20, text: "Lie down in a comfortable position. Let your body sink into the surface beneath you.", instruction: "Get comfortable" },
    { time: 50, text: "Close your eyes and take a deep, slow breath in.", instruction: "Deep breath" },
    { time: 70, text: "As you exhale, let go of the day. Release all thoughts and worries.", instruction: "Let go" },
    { time: 100, text: "Your body knows how to sleep. Trust it to guide you into rest.", instruction: "Trust your body" },
    { time: 140, text: "Starting with your toes, feel them becoming heavy and relaxed.", instruction: "Relax toes" },
    { time: 180, text: "This heaviness spreads to your feet, your ankles, your calves.", instruction: "Legs relax" },
    { time: 220, text: "Your knees, thighs, and hips become soft and heavy.", instruction: "Lower body" },
    { time: 260, text: "Feel your belly rise and fall with each gentle breath.", instruction: "Breathe naturally" },
    { time: 300, text: "Your chest, shoulders, and arms grow heavy and warm.", instruction: "Upper body" },
    { time: 340, text: "Your neck releases all tension. Your jaw unclenches.", instruction: "Release face" },
    { time: 380, text: "Your face becomes smooth and peaceful. Your eyes rest gently.", instruction: "Peaceful face" },
    { time: 430, text: "Your entire body is now heavy, warm, and completely relaxed.", instruction: "Total relaxation" },
    { time: 480, text: "Imagine yourself floating on a soft cloud, drifting peacefully.", instruction: "Visualize floating" },
    { time: 540, text: "With each breath, you drift deeper into calm, peaceful sleep.", instruction: "Drift deeper" },
    { time: 600, text: "Let go completely. Allow sleep to embrace you.", instruction: "Surrender to sleep" },
    { time: 660, text: "Rest now. Sleep peacefully.", instruction: "Sleep well" }
  ]
};

const GuidedMeditation: React.FC<GuidedMeditationProps> = ({ session, onStop, isPlaying, onTogglePlay }) => {
  const [sessionTime, setSessionTime] = useState(0);
  const [currentStep, setCurrentStep] = useState(0);
  const [volume, setVolume] = useState(70);
  const [isMuted, setIsMuted] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const masterGainRef = useRef<GainNode | null>(null);
  const currentToneRef = useRef<{ stop: () => void } | null>(null);
  const lastStepRef = useRef<number>(-1);
  const speechRef = useRef<SpeechSynthesisUtterance | null>(null);

  const script = meditationScripts[session.script] || meditationScripts['meditation-calm'];

  // Text-to-speech function
  const speakText = (text: string) => {
    if (!isMuted && 'speechSynthesis' in window) {
      // Cancel any ongoing speech
      window.speechSynthesis.cancel();
      
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.8; // Slower, calming pace
      utterance.pitch = 1.0;
      utterance.volume = volume / 100;
      
      // Try to use a calm, soothing voice
      const voices = window.speechSynthesis.getVoices();
      const preferredVoice = voices.find(voice => 
        voice.name.includes('Female') || 
        voice.name.includes('Samantha') ||
        voice.name.includes('Karen') ||
        voice.name.includes('natural')
      );
      if (preferredVoice) {
        utterance.voice = preferredVoice;
      }
      
      speechRef.current = utterance;
      window.speechSynthesis.speak(utterance);
    }
  };

  // Stop speech when component unmounts or stops
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
    }
    
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
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

  // Update current step based on session time
  useEffect(() => {
    // Find the correct step for current time
    for (let i = script.length - 1; i >= 0; i--) {
      if (sessionTime >= script[i].time) {
        if (i !== lastStepRef.current) {
          lastStepRef.current = i;
          setCurrentStep(i);
          if (i > 0) { // Don't play tone on first step
            playTransitionTone();
          }
          // Speak the instruction text for all steps after the first
          if (isPlaying && i > 0 && script[i].text) {
            speakText(script[i].text);
          }
        }
        break;
      }
    }
  }, [sessionTime, script, isPlaying]);

  // Stop speech when paused or stopped
  useEffect(() => {
    if (!isPlaying) {
      stopSpeech();
    }
  }, [isPlaying]);

  // Audio context for ambient tones
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

  // Play gentle transition tone
  const playTransitionTone = async () => {
    try {
      const ctx = await ensureAudio();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(432, ctx.currentTime); // Calming frequency
      
      gain.gain.setValueAtTime(0, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.1, ctx.currentTime + 0.1);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.5);
      
      osc.connect(gain);
      gain.connect(masterGainRef.current!);
      
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 1.5);
    } catch (error) {
      console.error('Audio error:', error);
    }
  };

  // Update volume
  useEffect(() => {
    if (masterGainRef.current) {
      masterGainRef.current.gain.value = isMuted ? 0 : volume / 100;
    }
  }, [volume, isMuted]);

  // Cleanup
  useEffect(() => {
    return () => {
      try {
        stopSpeech();
        currentToneRef.current?.stop();
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
  const currentInstruction = script[currentStep];

  return (
    <div className="relative min-h-[500px] flex flex-col items-center justify-center p-4 sm:p-6 md:p-8">
      {/* Background ambient animation */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-br from-purple-100 via-indigo-50 to-blue-100 rounded-2xl"
        animate={{
          background: [
            'linear-gradient(to bottom right, #f3e8ff, #e0e7ff, #dbeafe)',
            'linear-gradient(to bottom right, #e0e7ff, #dbeafe, #f3e8ff)',
            'linear-gradient(to bottom right, #dbeafe, #f3e8ff, #e0e7ff)',
          ]
        }}
        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
      />

      {/* Breathing circle */}
      <motion.div
        className="absolute inset-0 flex items-center justify-center pointer-events-none"
        initial={{ opacity: 0 }}
        animate={{ opacity: isPlaying ? 0.3 : 0 }}
        transition={{ duration: 1 }}
      >
        <motion.div
          className="w-48 h-48 sm:w-64 sm:h-64 rounded-full bg-gradient-to-br from-purple-400 to-indigo-500 blur-3xl"
          animate={isPlaying ? {
            scale: [1, 1.3, 1],
            opacity: [0.3, 0.5, 0.3]
          } : {}}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        />
      </motion.div>

      {/* Content */}
      <div className="relative z-10 w-full max-w-2xl">
        {/* Timer and Progress */}
        <motion.div
          className="text-center mb-4 sm:mb-6 md:mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="inline-flex items-center gap-2 sm:gap-3 md:gap-4 bg-white/80 backdrop-blur-sm rounded-xl sm:rounded-2xl px-4 sm:px-6 md:px-8 py-3 sm:py-4 shadow-lg">
            <FaBrain className="text-2xl sm:text-3xl text-purple-600" />
            <div className="text-2xl sm:text-3xl md:text-4xl font-mono font-bold text-gray-800">
              {formatTime(sessionTime)}
            </div>
            <div className="text-xs sm:text-sm text-gray-600">
              / {session.duration}:00
            </div>
          </div>
          
          {/* Progress bar */}
          <div className="mt-3 sm:mt-4 w-full max-w-md mx-auto bg-white/60 rounded-full h-1.5 sm:h-2 overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-purple-500 to-indigo-600"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </motion.div>

        {/* Combined Visual & Instructions */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            className="bg-white/90 backdrop-blur-sm rounded-xl sm:rounded-2xl p-4 sm:p-6 md:p-8 shadow-xl mb-4 sm:mb-6"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.5 }}
          >
            {/* Mobile: Stacked, Desktop: Side by Side */}
            <div className="flex flex-col lg:flex-row gap-6 lg:gap-8 items-center">
              
              {/* Breathing Visualization - Left Side on Desktop */}
              <motion.div 
                className="flex flex-col items-center lg:w-1/3"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
              >
                <div className="text-xs sm:text-sm font-semibold text-gray-600 mb-3 sm:mb-4">Breathing Guide</div>
                
                {/* Animated Breathing Circle */}
                <div className="relative w-40 h-40 sm:w-48 sm:h-48 lg:w-56 lg:h-56 mb-3 sm:mb-4">
                  {/* Outer ripple rings */}
                  <motion.div
                    className="absolute inset-0 rounded-full border-4 border-purple-300"
                    animate={isPlaying ? {
                      scale: [1, 1.4, 1],
                      opacity: [0.6, 0, 0.6]
                    } : {}}
                    transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
                  />
                  <motion.div
                    className="absolute inset-0 rounded-full border-4 border-indigo-300"
                    animate={isPlaying ? {
                      scale: [1, 1.3, 1],
                      opacity: [0.5, 0, 0.5]
                    } : {}}
                    transition={{ duration: 8, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                  />
                  
                  {/* Main breathing circle */}
                  <motion.div
                    className="absolute inset-4 rounded-full bg-gradient-to-br from-purple-400 via-indigo-400 to-blue-400 shadow-2xl flex items-center justify-center"
                    animate={isPlaying ? {
                      scale: [1, 1.2, 1],
                    } : {}}
                    transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
                  >
                    {/* Inner glow */}
                    <motion.div
                      className="w-20 h-20 sm:w-24 sm:h-24 lg:w-28 lg:h-28 rounded-full bg-white/30 backdrop-blur-sm flex items-center justify-center"
                      animate={isPlaying ? {
                        scale: [1, 1.1, 1],
                        opacity: [0.5, 0.8, 0.5]
                      } : {}}
                      transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
                    >
                      <motion.div
                        className="text-2xl sm:text-3xl lg:text-4xl"
                        animate={isPlaying ? {
                          scale: [1, 1.2, 1]
                        } : {}}
                        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
                      >
                        🧘
                      </motion.div>
                    </motion.div>
                  </motion.div>
                  
                  {/* Breath phase indicator */}
                  <motion.div
                    className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 text-xs sm:text-sm font-semibold text-purple-600 whitespace-nowrap"
                    animate={isPlaying ? {
                      opacity: [1, 1, 1, 1]
                    } : {}}
                  >
                    {isPlaying ? (
                      <motion.span
                        key="breathing"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                      >
                        Breathe with the circle
                      </motion.span>
                    ) : (
                      "Press play to begin"
                    )}
                  </motion.div>
                </div>
                
                {/* Breathing instructions */}
                <div className="text-center space-y-1 mt-6">
                  <motion.div 
                    className="text-xs sm:text-sm text-gray-600"
                    animate={isPlaying ? { opacity: [0.5, 1, 0.5] } : {}}
                    transition={{ duration: 8, repeat: Infinity }}
                  >
                    <span className="font-semibold text-purple-600">Inhale</span> as circle expands
                  </motion.div>
                  <motion.div 
                    className="text-xs sm:text-sm text-gray-600"
                    animate={isPlaying ? { opacity: [1, 0.5, 1] } : {}}
                    transition={{ duration: 8, repeat: Infinity }}
                  >
                    <span className="font-semibold text-indigo-600">Exhale</span> as circle contracts
                  </motion.div>
                </div>
              </motion.div>

              {/* Instructions - Right Side on Desktop */}
              <motion.div 
                className="flex-1 lg:w-2/3 min-h-[150px] sm:min-h-[180px] flex flex-col justify-center"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
              >
                {currentInstruction?.instruction && (
                  <motion.div
                    className="text-xs sm:text-sm font-semibold text-purple-600 mb-2 sm:mb-3 uppercase tracking-wide"
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                  >
                    {currentInstruction.instruction}
                  </motion.div>
                )}
                <motion.p
                  className="text-base sm:text-lg md:text-xl text-gray-700 leading-relaxed"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                >
                  {currentInstruction?.text || "Breathe naturally and relax..."}
                </motion.p>
              </motion.div>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Controls */}
        <div className="flex items-center justify-center gap-3 sm:gap-4 mb-4 sm:mb-6">
          <motion.button
            onClick={onTogglePlay}
            className="w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transition-all active:scale-95"
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

export default GuidedMeditation;
