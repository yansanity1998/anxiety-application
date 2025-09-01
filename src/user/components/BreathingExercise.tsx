import React, { useState, useEffect } from 'react';
import { FaLeaf, FaPlay, FaHome, FaCheckCircle } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';

interface BreathingExerciseProps {
  breathingActive: boolean;
  setBreathingActive: (active: boolean) => void;
}

const BreathingExercise: React.FC<BreathingExerciseProps> = ({ 
  breathingActive, 
  setBreathingActive 
}) => {
  const [phase, setPhase] = useState('inhale');
  const [count, setCount] = useState(4);
  const [sessionCount, setSessionCount] = useState(0);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [voiceGender, setVoiceGender] = useState<'female' | 'male'>('female');

  // Voice narration for breathing phases
  const speakBreathingInstruction = (currentPhase: string) => {
    if (!voiceEnabled || !('speechSynthesis' in window)) return;
    
    // Cancel any ongoing speech
    window.speechSynthesis.cancel();
    
    const utterance = new SpeechSynthesisUtterance();
    
    // Set voice instructions
    switch (currentPhase) {
      case 'inhale':
        utterance.text = 'Breathe in';
        break;
      case 'hold':
        utterance.text = 'Hold';
        break;
      case 'exhale':
        utterance.text = 'Breathe out';
        break;
    }
    
    // Configure voice settings
    utterance.rate = 0.8; // Slower, more calming pace
    utterance.pitch = 1.1; // Slightly higher pitch for clarity
    utterance.volume = 0.7; // Moderate volume
    
    // Try to select preferred voice gender
    const voices = window.speechSynthesis.getVoices();
    if (voices.length > 0) {
      const preferredVoice = voices.find(voice => 
        voiceGender === 'female' 
          ? voice.name.toLowerCase().includes('female') || voice.name.toLowerCase().includes('woman') || voice.name.toLowerCase().includes('zira') || voice.name.toLowerCase().includes('susan')
          : voice.name.toLowerCase().includes('male') || voice.name.toLowerCase().includes('man') || voice.name.toLowerCase().includes('david') || voice.name.toLowerCase().includes('mark')
      );
      
      if (preferredVoice) {
        utterance.voice = preferredVoice;
      } else {
        // Fallback: use first available voice of preferred gender based on voice characteristics
        const genderVoice = voices.find(voice => 
          voiceGender === 'female' ? !voice.name.toLowerCase().includes('male') : voice.name.toLowerCase().includes('male')
        );
        if (genderVoice) utterance.voice = genderVoice;
      }
    }
    
    window.speechSynthesis.speak(utterance);
  };

  // Sound effects for breathing phases
  const playBreathingSound = (currentPhase: string) => {
    if (!soundEnabled) return;
    
    // Create audio context for better mobile support
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    // Different frequencies for each phase
    switch (currentPhase) {
      case 'inhale':
        oscillator.frequency.setValueAtTime(220, audioContext.currentTime); // A3
        gainNode.gain.setValueAtTime(0, audioContext.currentTime);
        gainNode.gain.linearRampToValueAtTime(0.1, audioContext.currentTime + 0.5);
        gainNode.gain.linearRampToValueAtTime(0, audioContext.currentTime + 4);
        break;
      case 'hold':
        oscillator.frequency.setValueAtTime(330, audioContext.currentTime); // E4
        gainNode.gain.setValueAtTime(0.05, audioContext.currentTime);
        break;
      case 'exhale':
        oscillator.frequency.setValueAtTime(165, audioContext.currentTime); // E3
        gainNode.gain.setValueAtTime(0, audioContext.currentTime);
        gainNode.gain.linearRampToValueAtTime(0.1, audioContext.currentTime + 0.5);
        gainNode.gain.linearRampToValueAtTime(0, audioContext.currentTime + 4);
        break;
    }
    
    oscillator.type = 'sine';
    oscillator.start();
    oscillator.stop(audioContext.currentTime + 4);
  };

  useEffect(() => {
    if (!breathingActive) return;

    const timer = setInterval(() => {
      setCount(prev => {
        if (prev === 1) {
          setPhase(current => {
            let nextPhase;
            if (current === 'inhale') nextPhase = 'hold';
            else if (current === 'hold') nextPhase = 'exhale';
            else {
              setSessionCount(c => c + 1);
              nextPhase = 'inhale';
            }
            
            // Play sound and voice for the new phase
            playBreathingSound(nextPhase);
            speakBreathingInstruction(nextPhase);
            return nextPhase;
          });
          return 4;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [breathingActive, phase, soundEnabled, voiceEnabled, voiceGender]);

  const getPhaseConfig = () => {
    switch (phase) {
      case 'inhale':
        return {
          gradient: 'from-blue-400 via-cyan-400 to-teal-400',
          bgGradient: 'from-blue-500/10 via-cyan-500/10 to-teal-500/10',
          borderColor: 'border-blue-300/30',
          icon: '🫁',
          instruction: 'Breathe in slowly through your nose',
          color: 'text-blue-600',
          shadowColor: 'shadow-blue-500/25',
          glowColor: 'from-blue-400/40 to-cyan-400/40'
        };
      case 'hold':
        return {
          gradient: 'from-purple-400 via-violet-400 to-indigo-400',
          bgGradient: 'from-purple-500/10 via-violet-500/10 to-indigo-500/10',
          borderColor: 'border-purple-300/30',
          icon: '⏸️',
          instruction: 'Hold your breath gently',
          color: 'text-purple-600',
          shadowColor: 'shadow-purple-500/25',
          glowColor: 'from-purple-400/40 to-indigo-400/40'
        };
      case 'exhale':
        return {
          gradient: 'from-emerald-400 via-green-400 to-lime-400',
          bgGradient: 'from-emerald-500/10 via-green-500/10 to-lime-500/10',
          borderColor: 'border-emerald-300/30',
          icon: '🌬️',
          instruction: 'Breathe out slowly through your mouth',
          color: 'text-emerald-600',
          shadowColor: 'shadow-emerald-500/25',
          glowColor: 'from-emerald-400/40 to-lime-400/40'
        };
      default:
        return {
          gradient: 'from-blue-400 via-cyan-400 to-teal-400',
          bgGradient: 'from-blue-500/10 via-cyan-500/10 to-teal-500/10',
          borderColor: 'border-blue-300/30',
          icon: '🫁',
          instruction: 'Breathe in slowly through your nose',
          color: 'text-blue-600',
          shadowColor: 'shadow-blue-500/25',
          glowColor: 'from-blue-400/40 to-cyan-400/40'
        };
    }
  };

  const phaseConfig = getPhaseConfig();

  return (
    <motion.div 
      className={`relative overflow-hidden rounded-2xl sm:rounded-3xl p-4 sm:p-6 md:p-8 backdrop-blur-xl border ${
        breathingActive ? 
          `bg-gradient-to-br ${phaseConfig.bgGradient} ${phaseConfig.borderColor} ${phaseConfig.shadowColor} shadow-2xl` : 
          'bg-white/70 border-white/20 shadow-xl hover:shadow-2xl'
      } transition-all duration-500 max-w-full mx-auto`}
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      whileHover={{ y: -8, scale: 1.02 }}
      style={{
        background: breathingActive ? 
          `linear-gradient(135deg, ${phaseConfig.bgGradient.replace('from-', '').replace(' via-', ', ').replace(' to-', ', ')})` :
          'linear-gradient(135deg, rgba(255,255,255,0.7), rgba(255,255,255,0.5))'
      }}
    >
      {/* Modern Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <motion.div 
          className="w-full h-full"
          style={{
            background: breathingActive ? 
              `radial-gradient(circle at 25% 25%, ${phaseConfig.color.replace('text-', '').replace('-600', '')} 2px, transparent 2px), radial-gradient(circle at 75% 75%, ${phaseConfig.color.replace('text-', '').replace('-600', '')} 1px, transparent 1px)` :
              'radial-gradient(circle at 25% 25%, #800000 2px, transparent 2px), radial-gradient(circle at 75% 75%, #800000 1px, transparent 1px)',
            backgroundSize: '40px 40px, 20px 20px'
          }}
          animate={{
            backgroundPosition: ['0% 0%', '100% 100%', '0% 0%']
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        />
      </div>
      
      {/* Floating Particles */}
      {breathingActive && (
        <div className="absolute inset-0 pointer-events-none">
          {[...Array(6)].map((_, i) => (
            <motion.div
              key={i}
              className={`absolute w-2 h-2 rounded-full bg-gradient-to-r ${phaseConfig.gradient} opacity-30`}
              style={{
                left: `${20 + (i * 15)}%`,
                top: `${30 + (i * 10)}%`
              }}
              animate={{
                y: [-20, -40, -20],
                opacity: [0.3, 0.7, 0.3],
                scale: [0.8, 1.2, 0.8]
              }}
              transition={{
                duration: 4,
                repeat: Infinity,
                delay: i * 0.5,
                ease: "easeInOut"
              }}
            />
          ))}
        </div>
      )}

      <div className="relative z-10">
        {/* Icon in top-left corner */}
        <motion.div
          className={`absolute top-2 left-2 sm:top-4 sm:left-4 w-11 h-11 sm:w-13 sm:h-13 lg:w-16 lg:h-16 rounded-xl sm:rounded-2xl flex items-center justify-center shadow-xl ${
            breathingActive ? `bg-gradient-to-r ${phaseConfig.gradient}` : 'bg-gradient-to-r from-[#800000] to-[#a00000]'
          } backdrop-blur-sm z-20`}
          animate={{ 
            y: [0, -2, 0],
            rotate: [0, 4, 0],
            scale: breathingActive ? [1, 1.05, 1] : 1
          }}
          transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
        >
          {/* Glow effect */}
          <div className={`absolute inset-0 rounded-xl sm:rounded-2xl bg-gradient-to-r ${
            breathingActive ? phaseConfig.gradient : 'from-[#800000] to-[#a00000]'
          } blur-lg opacity-50 -z-10`} />
          <FaLeaf className="text-white text-sm sm:text-lg drop-shadow-lg" />
        </motion.div>

        {/* Audio Controls in top-right corner */}
        <div className="absolute top-2 right-2 sm:top-4 sm:right-4 flex items-center gap-1 sm:gap-2 z-20">
          {/* Sound Toggle */}
          <motion.button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl flex items-center justify-center transition-all duration-200 ${
              soundEnabled ? 'bg-gradient-to-r from-green-400 to-emerald-400 text-white shadow-lg' : 'bg-gray-200 text-gray-500'
            }`}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            {soundEnabled ? '🔊' : '🔇'}
          </motion.button>
          
          {/* Voice Toggle */}
          <motion.button
            onClick={() => setVoiceEnabled(!voiceEnabled)}
            className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl flex items-center justify-center transition-all duration-200 ${
              voiceEnabled ? 'bg-gradient-to-r from-blue-400 to-purple-400 text-white shadow-lg' : 'bg-gray-200 text-gray-500'
            }`}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            title={voiceEnabled ? 'Voice guidance enabled' : 'Voice guidance disabled'}
          >
            {voiceEnabled ? '🎙️' : '🔇'}
          </motion.button>
          
          {/* Voice Gender Toggle */}
          {voiceEnabled && (
            <motion.button
              onClick={() => setVoiceGender(voiceGender === 'female' ? 'male' : 'female')}
              className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl flex items-center justify-center bg-gradient-to-r from-pink-400 to-purple-400 text-white shadow-lg transition-all duration-200"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              title={`Voice: ${voiceGender}`}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
            >
              {voiceGender === 'female' ? '👩' : '👨'}
            </motion.button>
          )}
        </div>

        {/* Centered Title and Session Info */}
        <div className="text-center pt-16 sm:pt-20 lg:pt-24 pb-6 sm:pb-8">
          <motion.h3 
            className="font-bold text-gray-800 text-2xl sm:text-3xl lg:text-4xl mb-2 sm:mb-3"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          >
            Breathing Exercise
          </motion.h3>
          <motion.p 
            className="text-base sm:text-lg lg:text-xl text-gray-600 font-medium"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
          >
            {breathingActive ? `Session: ${sessionCount + 1} cycles` : 'Find your inner peace'}
          </motion.p>
        </div>
      
        <AnimatePresence mode="wait">
          {!breathingActive ? (
            <motion.div
              key="start-section"
              className="text-center"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5 }}
            >
              {/* Hero Icon with Animation */}
              <motion.div 
                className="relative mb-8"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 200, damping: 15 }}
              >
                <motion.div
                  className="text-6xl md:text-7xl mb-4 relative z-10"
                  animate={{
                    y: [0, -10, 0],
                    rotate: [0, 2, 0, -2, 0]
                  }}
                  transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                >
                  🧘‍♀️
                </motion.div>
                
                {/* Floating rings around icon */}
                <motion.div
                  className="absolute inset-0 w-20 h-20 mx-auto mt-4 border-2 border-blue-300/30 rounded-full"
                  animate={{ rotate: 360, scale: [1, 1.1, 1] }}
                  transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                />
                <motion.div
                  className="absolute inset-0 w-24 h-24 mx-auto mt-2 border border-purple-300/20 rounded-full"
                  animate={{ rotate: -360, scale: [1, 1.05, 1] }}
                  transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
                />
              </motion.div>
              
              {/* Enhanced Description */}
              <motion.div 
                className="mb-8 space-y-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                <h4 className="text-2xl font-bold bg-gradient-to-r from-gray-700 to-gray-900 bg-clip-text text-transparent mb-3">
                  4-4-4 Breathing
                </h4>
                <p className="text-gray-600 text-base leading-relaxed max-w-md mx-auto">
                  A proven technique to reduce anxiety and promote deep relaxation. 
                  Follow the guided rhythm with optional sound cues.
                </p>
                
                {/* Benefits Pills */}
                <div className="flex flex-wrap justify-center gap-2 mt-4">
                  {['Reduces Stress', 'Improves Focus', 'Calms Mind'].map((benefit, index) => (
                    <motion.span
                      key={benefit}
                      className="px-3 py-1 bg-gradient-to-r from-blue-100 to-cyan-100 text-blue-700 rounded-full text-xs font-medium border border-blue-200/50"
                      initial={{ opacity: 0, scale: 0 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.5 + index * 0.1 }}
                    >
                      {benefit}
                    </motion.span>
                  ))}
                </div>
              </motion.div>
              
              {/* Enhanced Start Button */}
              <motion.button
                onClick={() => {
                  setBreathingActive(true);
                  setSessionCount(0);
                  if (soundEnabled) playBreathingSound('inhale');
                  if (voiceEnabled) speakBreathingInstruction('inhale');
                }}
                className="relative w-full max-w-sm sm:max-w-md bg-gradient-to-r from-[#800000] via-[#900000] to-[#a00000] hover:from-[#660000] hover:via-[#770000] hover:to-[#880000] text-white px-6 sm:px-8 py-4 sm:py-5 rounded-xl sm:rounded-2xl font-semibold shadow-2xl hover:shadow-3xl transition-all duration-300 flex items-center justify-center gap-3 sm:gap-4 overflow-hidden group mx-auto"
                whileHover={{ scale: 1.03, y: -2 }}
                whileTap={{ scale: 0.97 }}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
              >
                {/* Button glow effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-white/10 via-white/5 to-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                
                {/* Animated play icon */}
                <motion.div
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <FaPlay className="text-lg" />
                </motion.div>
                
                <span className="text-base sm:text-lg">Start Breathing Session</span>
                
                {/* Ripple effect */}
                <motion.div
                  className="absolute inset-0 bg-white/20 rounded-2xl"
                  initial={{ scale: 0, opacity: 0.5 }}
                  animate={{ scale: 1.5, opacity: 0 }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                />
              </motion.button>
            </motion.div>
          ) : (
            <motion.div 
              key="breathing-session"
              className="text-center"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.6 }}
            >
              {/* Enhanced Breathing Circle */}
              <div className="relative mb-6 sm:mb-8">
                {/* Outer breathing rings */}
                <motion.div
                  className="absolute inset-0 w-32 h-32 sm:w-40 sm:h-40 lg:w-48 lg:h-48 mx-auto rounded-full border-2 opacity-20"
                  style={{
                    borderImage: `linear-gradient(45deg, ${phaseConfig.gradient.replace('from-', '').replace(' via-', ', ').replace(' to-', ', ')}) 1`
                  }}
                  animate={{
                    scale: phase === 'inhale' ? [1, 1.3] : phase === 'hold' ? 1.3 : [1.3, 1],
                    opacity: [0.2, 0.4, 0.2]
                  }}
                  transition={{ duration: 4, ease: "easeInOut" }}
                />
                
                <motion.div
                  className="absolute inset-0 w-28 h-28 sm:w-32 sm:h-32 lg:w-40 lg:h-40 mx-auto mt-2 sm:mt-4 ml-2 sm:ml-4 rounded-full border opacity-30"
                  style={{
                    borderColor: phaseConfig.gradient.includes('blue') ? '#3b82f6' : 
                                phaseConfig.gradient.includes('purple') ? '#8b5cf6' : '#10b981'
                  }}
                  animate={{
                    scale: phase === 'inhale' ? [1, 1.2] : phase === 'hold' ? 1.2 : [1.2, 1],
                    rotate: [0, 180, 360]
                  }}
                  transition={{ duration: 4, ease: "easeInOut" }}
                />
                
                {/* Main breathing circle */}
                <motion.div 
                  className={`relative w-32 h-32 sm:w-36 sm:h-36 lg:w-40 lg:h-40 mx-auto rounded-full bg-gradient-to-r ${phaseConfig.gradient} shadow-2xl flex items-center justify-center overflow-hidden backdrop-blur-sm`}
                  animate={{
                    scale: phase === 'inhale' ? 1.15 : phase === 'hold' ? 1.15 : 0.85,
                    rotate: [0, 360]
                  }}
                  transition={{ 
                    scale: { duration: 4, ease: "easeInOut" },
                    rotate: { duration: 12, repeat: Infinity, ease: "linear" }
                  }}
                >
                  {/* Multiple pulse effects */}
                  <div className={`absolute inset-0 rounded-full bg-gradient-to-r ${phaseConfig.gradient} animate-ping opacity-20`}></div>
                  <div className={`absolute inset-0 rounded-full bg-gradient-to-r ${phaseConfig.gradient} animate-pulse opacity-30`}></div>
                  
                  {/* Inner glow */}
                  <motion.div
                    className="absolute inset-2 rounded-full bg-white/20 backdrop-blur-sm"
                    animate={{
                      opacity: [0.2, 0.4, 0.2]
                    }}
                    transition={{ duration: 2, repeat: Infinity }}
                  />
                  
                  {/* Inner content */}
                  <div className="relative z-10 text-center">
                    <motion.div 
                      className="text-2xl sm:text-3xl mb-1 sm:mb-2"
                      animate={{
                        scale: [1, 1.1, 1],
                        rotate: [0, 5, 0, -5, 0]
                      }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      {phaseConfig.icon}
                    </motion.div>
                    <motion.div 
                      className="text-2xl sm:text-3xl font-bold text-white drop-shadow-2xl"
                      key={`${phase}-${count}`}
                      initial={{ scale: 0.5, opacity: 0, y: 10 }}
                      animate={{ scale: 1, opacity: 1, y: 0 }}
                      transition={{ type: "spring", stiffness: 300, damping: 20 }}
                    >
                      {count}
                    </motion.div>
                  </div>
                </motion.div>
                
                {/* Enhanced glow effects */}
                <motion.div 
                  className={`absolute inset-0 w-32 h-32 sm:w-36 sm:h-36 lg:w-40 lg:h-40 mx-auto rounded-full bg-gradient-to-r ${phaseConfig.gradient} blur-2xl opacity-40 -z-10`}
                  animate={{
                    scale: phase === 'inhale' ? [1, 1.3] : phase === 'hold' ? 1.3 : [1.3, 1],
                    opacity: [0.3, 0.6, 0.3]
                  }}
                  transition={{ duration: 4, ease: "easeInOut" }}
                />
                
                {/* Outer glow ring */}
                <motion.div 
                  className={`absolute inset-0 w-36 h-36 sm:w-44 sm:h-44 lg:w-48 lg:h-48 mx-auto rounded-full bg-gradient-to-r ${phaseConfig.glowColor} blur-3xl opacity-20 -z-20`}
                  animate={{
                    scale: [1, 1.5, 1],
                    opacity: [0.1, 0.3, 0.1]
                  }}
                  transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                />
              </div>
              
              {/* Enhanced Phase Information */}
              <motion.div 
                className="mb-6 sm:mb-8 space-y-3 sm:space-y-4 px-2 sm:px-0"
                key={phase}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                {/* Phase title with modern styling */}
                <motion.div
                  className={`inline-flex items-center gap-2 sm:gap-3 px-4 sm:px-6 py-2 sm:py-3 rounded-xl sm:rounded-2xl backdrop-blur-sm border ${phaseConfig.borderColor} ${phaseConfig.bgGradient} shadow-lg`}
                  animate={{
                    scale: [1, 1.02, 1]
                  }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <span className="text-xl sm:text-2xl">{phaseConfig.icon}</span>
                  <h4 className={`text-lg sm:text-xl font-bold capitalize ${phaseConfig.color}`}>
                    {phase}
                  </h4>
                </motion.div>
                
                {/* Instruction with better typography */}
                <motion.p 
                  className="text-gray-700 text-sm sm:text-base leading-relaxed max-w-xs sm:max-w-sm mx-auto font-medium px-2 sm:px-0"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2 }}
                >
                  {phaseConfig.instruction}
                </motion.p>
                
                {/* Progress indicator */}
                <div className="flex justify-center gap-2 mt-4">
                  {[...Array(4)].map((_, i) => (
                    <motion.div
                      key={i}
                      className={`w-2 h-2 rounded-full ${
                        i < (4 - count) ? `bg-gradient-to-r ${phaseConfig.gradient}` : 'bg-gray-300'
                      }`}
                      animate={{
                        scale: i === (4 - count) ? [1, 1.3, 1] : 1
                      }}
                      transition={{ duration: 0.5, repeat: i === (4 - count) ? Infinity : 0 }}
                    />
                  ))}
                </div>
              </motion.div>
              
              {/* Modern Controls */}
              <div className="flex flex-col gap-4 items-center">
                
                {/* Control Buttons */}
                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center w-full px-2 sm:px-0">
                  <motion.button
                    onClick={() => {
                      setBreathingActive(false);
                      setPhase('inhale');
                      setCount(4);
                    }}
                    className="w-full sm:w-auto px-4 sm:px-6 py-2 sm:py-3 bg-white/90 hover:bg-white text-gray-700 rounded-xl sm:rounded-2xl text-sm font-semibold transition-all duration-200 shadow-lg hover:shadow-xl flex items-center justify-center gap-2 sm:gap-3 backdrop-blur-sm border border-white/50"
                    whileHover={{ scale: 1.05, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <FaHome className="text-xs sm:text-sm" />
                    End Session
                  </motion.button>
                  
                  {sessionCount >= 3 && (
                    <motion.div
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="w-full sm:w-auto px-4 sm:px-6 py-2 sm:py-3 bg-gradient-to-r from-green-400 to-emerald-400 text-white rounded-xl sm:rounded-2xl text-sm font-semibold flex items-center justify-center gap-2 sm:gap-3 shadow-lg"
                    >
                      <FaCheckCircle className="text-xs sm:text-sm" />
                      Excellent Work!
                    </motion.div>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

export default BreathingExercise;
