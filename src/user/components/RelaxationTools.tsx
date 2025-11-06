import React, { useState, useEffect, useRef } from 'react';
import { motion} from 'framer-motion';
import { 
  FaPlay, FaPause, FaStop, FaVolumeUp, FaVolumeMute, FaLeaf, FaWater, FaWind, 
  FaFire, FaDove, FaCloud, FaMountain, FaBrain, FaEye, FaHandPaper, 
  FaHome, FaExpand, FaCompress
} from 'react-icons/fa';
import GuidedMeditation from './GuidedMeditation';
import ProgressiveMuscleRelaxation from './ProgressiveMuscleRelaxation';
import VisualizationJourney from './VisualizationJourney';

interface RelaxationToolsProps {
  onClose?: () => void;
}

const RelaxationTools: React.FC<RelaxationToolsProps> = ({ onClose }) => {
  const [activeSession, setActiveSession] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(50);
  const [isMuted, setIsMuted] = useState(false);
  const [sessionTime, setSessionTime] = useState(0);
  const [selectedTool, setSelectedTool] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  // Audio state/refs for nature sounds
  const audioCtxRef = useRef<AudioContext | null>(null);
  const masterGainRef = useRef<GainNode | null>(null);
  const soundNodesRef = useRef<{ stop?: () => void; cleanup?: () => void } | null>(null);
  const [activeNatureSound, setActiveNatureSound] = useState<string | null>(null);
  const [selectedSession, setSelectedSession] = useState<any>(null);

  const relaxationTools = [
    {
      id: 'meditation',
      title: 'Guided Meditation',
      subtitle: 'Mindful awareness practice',
      icon: FaBrain,
      gradient: 'from-purple-500 to-indigo-600',
      bgGradient: 'from-purple-50 to-indigo-100',
      borderColor: 'border-purple-200',
      duration: '5-20 min',
      description: 'Calm your mind with guided meditation sessions focusing on breath awareness and mindfulness.',
      sessions: [
        { name: 'Quick Calm', duration: 5, script: 'meditation-calm' },
        { name: 'Deep Peace', duration: 10, script: 'meditation-peace' },
        { name: 'Anxiety Relief', duration: 15, script: 'meditation-anxiety' },
        { name: 'Sleep Preparation', duration: 20, script: 'meditation-sleep' }
      ]
    },
    {
      id: 'progressive-muscle',
      title: 'Progressive Muscle Relaxation',
      subtitle: 'Release physical tension',
      icon: FaHandPaper,
      gradient: 'from-green-500 to-emerald-600',
      bgGradient: 'from-green-50 to-emerald-100',
      borderColor: 'border-green-200',
      duration: '10-25 min',
      description: 'Systematically tense and release muscle groups to achieve deep physical and mental relaxation.',
      sessions: [
        { name: 'Quick Release', duration: 10, script: 'pmr-quick' },
        { name: 'Full Body Scan', duration: 20, script: 'pmr-full' },
        { name: 'Targeted Relief', duration: 15, script: 'pmr-targeted' }
      ]
    },
    {
      id: 'visualization',
      title: 'Visualization Journey',
      subtitle: 'Mental escape & imagery',
      icon: FaEye,
      gradient: 'from-blue-500 to-cyan-600',
      bgGradient: 'from-blue-50 to-cyan-100',
      borderColor: 'border-blue-200',
      duration: '8-15 min',
      description: 'Transport your mind to peaceful places through guided visualization and mental imagery.',
      sessions: [
        { name: 'Beach Serenity', duration: 12, script: 'viz-beach' },
        { name: 'Forest Walk', duration: 15, script: 'viz-forest' },
        { name: 'Mountain Peak', duration: 10, script: 'viz-mountain' },
        { name: 'Safe Space', duration: 8, script: 'viz-safe' }
      ]
    },
    {
      id: 'nature-sounds',
      title: 'Nature Soundscape',
      subtitle: 'Ambient audio therapy',
      icon: FaLeaf,
      gradient: 'from-teal-500 to-green-600',
      bgGradient: 'from-teal-50 to-green-100',
      borderColor: 'border-teal-200',
      duration: 'Continuous',
      description: 'Immerse yourself in calming nature sounds designed to reduce stress and promote relaxation.',
      sounds: [
        { name: 'Bird Chirp', icon: FaDove, sound: 'bird-chirp' },
        { name: 'Ocean Waves', icon: FaWater, sound: 'ocean-waves' },
        { name: 'Mountain Stream', icon: FaMountain, sound: 'mountain-stream' },
        { name: 'Gentle Rain', icon: FaCloud, sound: 'gentle-rain' },
        { name: 'Wind Chimes', icon: FaWind, sound: 'wind-chimes' },
        { name: 'Crackling Fire', icon: FaFire, sound: 'crackling-fire' }
      ]
    }
  ];

  // Timer and session management
  useEffect(() => {
    if (isPlaying && activeSession) {
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
  }, [isPlaying, activeSession]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // ---------- Web Audio: Nature Sounds ----------
  const ensureAudio = async (): Promise<AudioContext> => {
    if (!audioCtxRef.current) {
      const Ctx = (window.AudioContext || (window as any).webkitAudioContext) as typeof AudioContext;
      audioCtxRef.current = new Ctx();
      masterGainRef.current = audioCtxRef.current.createGain();
      masterGainRef.current!.gain.value = isMuted ? 0 : volume / 100;
      masterGainRef.current!.connect(audioCtxRef.current.destination);
    }
    if (audioCtxRef.current!.state === 'suspended') {
      await audioCtxRef.current!.resume();
    }
    return audioCtxRef.current!;
  };

  const createNoiseSource = (ctx: AudioContext) => {
    const bufferSize = 2 * ctx.sampleRate;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1; // white noise
    }
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    noise.loop = true;
    return noise;
  };

  // Subtle reverb impulse for a soothing tail
  const createReverbImpulse = (ctx: AudioContext, duration = 2.8, decay = 2.2): AudioBuffer => {
    const rate = ctx.sampleRate;
    const length = Math.max(1, Math.floor(rate * duration));
    const impulse = ctx.createBuffer(2, length, rate);
    for (let ch = 0; ch < 2; ch++) {
      const channelData = impulse.getChannelData(ch);
      for (let i = 0; i < length; i++) {
        const t = (length - i) / length;
        channelData[i] = (Math.random() * 2 - 1) * Math.pow(t, decay);
      }
    }
    return impulse;
  };

  const startNatureSound = async (type: string) => {
    const ctx: AudioContext = await ensureAudio();
    stopNatureSound();

    const gain = ctx.createGain();
    gain.gain.value = 0.6;

    // Gentle tone-shaping and subtle reverb send
    const preHPF = ctx.createBiquadFilter();
    preHPF.type = 'highpass';
    preHPF.frequency.value = 120;

    const lpTone = ctx.createBiquadFilter();
    lpTone.type = 'lowpass';
    lpTone.frequency.value = 6500;

    const compressor = ctx.createDynamicsCompressor();
    compressor.threshold.value = -32;
    compressor.knee.value = 12;
    compressor.ratio.value = 2;
    compressor.attack.value = 0.01;
    compressor.release.value = 0.3;

    const dryGain = ctx.createGain();
    dryGain.gain.value = 0.85;

    const wetGain = ctx.createGain();
    wetGain.gain.value = 0.25;

    const convolver = ctx.createConvolver();
    convolver.buffer = createReverbImpulse(ctx);

    // route
    gain.connect(preHPF);
    preHPF.connect(lpTone);
    lpTone.connect(compressor);
    compressor.connect(dryGain);
    dryGain.connect(masterGainRef.current!);

    gain.connect(convolver);
    convolver.connect(wetGain);
    wetGain.connect(masterGainRef.current!);

    let cleanupFns: Array<() => void> = [];

    if (type === 'ocean-waves') {
      const noise = createNoiseSource(ctx);
      const lp = ctx.createBiquadFilter();
      lp.type = 'lowpass';
      lp.frequency.value = 600;
      const lfo = ctx.createOscillator();
      lfo.frequency.value = 0.12;
      const lfoGain = ctx.createGain();
      lfoGain.gain.value = 400;
      lfo.connect(lfoGain);
      lfoGain.connect(lp.frequency);

      noise.connect(lp);
      lp.connect(gain);
      noise.start();
      lfo.start();
      cleanupFns.push(() => noise.stop());
      cleanupFns.push(() => lfo.stop());
    } else if (type === 'gentle-rain') {
      const noise = createNoiseSource(ctx);
      const hp = ctx.createBiquadFilter();
      hp.type = 'highpass';
      hp.frequency.value = 500;
      const hs = ctx.createBiquadFilter();
      hs.type = 'highshelf';
      hs.frequency.value = 6000;
      hs.gain.value = -8;

      // Soft amplitude undulation
      const ampLfo = ctx.createOscillator();
      ampLfo.frequency.value = 0.08;
      const ampLfoGain = ctx.createGain();
      ampLfoGain.gain.value = 0.15;
      ampLfo.connect(ampLfoGain);
      ampLfoGain.connect(gain.gain);

      noise.connect(hp);
      hp.connect(hs);
      hs.connect(gain);
      noise.start();
      ampLfo.start();
      cleanupFns.push(() => noise.stop());
      cleanupFns.push(() => ampLfo.stop());
    } else if (type === 'mountain-stream') {
      const noise = createNoiseSource(ctx);
      const bp = ctx.createBiquadFilter();
      bp.type = 'bandpass';
      bp.frequency.value = 1500;
      bp.Q.value = 0.8;

      // gentle flow modulation
      const lfo = ctx.createOscillator();
      lfo.frequency.value = 0.15;
      const lfoGain = ctx.createGain();
      lfoGain.gain.value = 150;
      lfo.connect(lfoGain);
      lfoGain.connect(bp.frequency);

      // slow stereo drift
      const panner = ctx.createStereoPanner();
      const panLfo = ctx.createOscillator();
      panLfo.frequency.value = 0.05;
      const panGain = ctx.createGain();
      panGain.gain.value = 0.6;
      panLfo.connect(panGain);
      panGain.connect(panner.pan);

      noise.connect(bp);
      bp.connect(panner);
      panner.connect(gain);
      noise.start();
      lfo.start();
      panLfo.start();
      cleanupFns.push(() => noise.stop());
      cleanupFns.push(() => lfo.stop());
      cleanupFns.push(() => panLfo.stop());
    } else if (type === 'bird-chirp') {
      // Periodic, gentle bird chirps without constant noise bed
      const chirpInterval = setInterval(() => {
        const osc = ctx.createOscillator();
        const env = ctx.createGain();
        const panner = ctx.createStereoPanner();
        const now = ctx.currentTime;
        const startFreq = 1800 + Math.random() * 2000;
        const endFreq = 700 + Math.random() * 500;

        osc.type = 'sine';
        osc.frequency.setValueAtTime(startFreq, now);
        osc.frequency.exponentialRampToValueAtTime(endFreq, now + 0.18);

        env.gain.setValueAtTime(0.0, now);
        env.gain.linearRampToValueAtTime(0.18, now + 0.03);
        env.gain.exponentialRampToValueAtTime(0.0001, now + 0.4);

        panner.pan.setValueAtTime((Math.random() - 0.5) * 0.9, now);

        osc.connect(env);
        env.connect(panner);
        panner.connect(gain);

        osc.start(now);
        osc.stop(now + 0.45);
      }, 1400 + Math.random() * 1300);
      cleanupFns.push(() => clearInterval(chirpInterval));
    } else if (type === 'wind-chimes') {
      const chimeInterval = setInterval(() => {
        const base = 440 * (0.5 + Math.random());
        for (let i = 0; i < 3; i++) {
          const osc = ctx.createOscillator();
          const env = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(base * (1 + i * 0.25 + Math.random() * 0.05), ctx.currentTime);
          env.gain.setValueAtTime(0, ctx.currentTime);
          env.gain.linearRampToValueAtTime(0.25, ctx.currentTime + 0.05);
          env.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 2.0 + i * 0.2);
          osc.connect(env);
          env.connect(gain);
          osc.start();
          osc.stop(ctx.currentTime + 2.5 + i * 0.2);
        }
      }, 2500);
      cleanupFns.push(() => clearInterval(chimeInterval));
    } else if (type === 'crackling-fire') {
      const noise = createNoiseSource(ctx);
      const bp = ctx.createBiquadFilter();
      bp.type = 'bandpass';
      bp.frequency.value = 600;
      bp.Q.value = 0.9;
      const lp = ctx.createBiquadFilter();
      lp.type = 'lowpass';
      lp.frequency.value = 3500;
      noise.connect(bp);
      bp.connect(lp);
      lp.connect(gain);
      noise.start();
      cleanupFns.push(() => noise.stop());
      const crackleInterval = setInterval(() => {
        const env = ctx.createGain();
        env.gain.setValueAtTime(0, ctx.currentTime);
        env.gain.linearRampToValueAtTime(0.25, ctx.currentTime + 0.02);
        env.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.14);
        const burst = createNoiseSource(ctx);
        const tilt = ctx.createBiquadFilter();
        tilt.type = 'highpass';
        tilt.frequency.value = 500 + Math.random() * 300;
        burst.connect(tilt);
        tilt.connect(env);
        env.connect(gain);
        burst.start();
        burst.stop(ctx.currentTime + 0.16);
      }, 550);
      cleanupFns.push(() => clearInterval(crackleInterval));
    }

    soundNodesRef.current = {
      stop: () => {
        cleanupFns.forEach(fn => {
          try { fn(); } catch {}
        });
      },
      cleanup: () => {
        try {
          gain.disconnect();
          preHPF.disconnect();
          lpTone.disconnect();
          compressor.disconnect();
          dryGain.disconnect();
          convolver.disconnect();
          wetGain.disconnect();
        } catch {}
      }
    };
  };

  const stopNatureSound = () => {
    try {
      soundNodesRef.current?.stop?.();
      soundNodesRef.current?.cleanup?.();
    } catch {}
    soundNodesRef.current = null;
  };

  // keep volume/mute in sync with master gain
  useEffect(() => {
    if (!masterGainRef.current) return;
    masterGainRef.current.gain.value = isMuted ? 0 : volume / 100;
  }, [volume, isMuted]);

  // ---------- Session controls ----------
  const startSession = (toolId: string, sessionOrSound?: any) => {
    setActiveSession(toolId);
    setSelectedTool(toolId);
    setSelectedSession(sessionOrSound);
    setIsPlaying(true);
    setSessionTime(0);

    if (toolId === 'nature-sounds' && sessionOrSound?.sound) {
      setActiveNatureSound(sessionOrSound.sound);
      startNatureSound(sessionOrSound.sound);
    } else {
      setActiveNatureSound(null);
    }
  };

  const stopSession = () => {
    setIsPlaying(false);
    if (selectedTool === 'nature-sounds') {
      stopNatureSound();
    }
    setActiveNatureSound(null);
    setActiveSession(null);
    setSessionTime(0);
  };

  const togglePlayPause = () => {
    if (selectedTool === 'nature-sounds') {
      const audioCtx = audioCtxRef.current;
      if (audioCtx) {
        if (isPlaying) {
          audioCtx.suspend();
        } else {
          audioCtx.resume();
        }
      }
    }
    setIsPlaying(prev => !prev);
  };

  const handleClose = () => {
    stopSession();
    setSelectedTool(null);
    if (onClose) {
      onClose();
    }
  };

  useEffect(() => {
    return () => {
      // cleanup on unmount
      try { stopNatureSound(); } catch {}
      try { audioCtxRef.current?.close?.(); } catch {}
    };
  }, []);

  // Scroll to top when tool is selected
  useEffect(() => {
    if (selectedTool) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [selectedTool]);

  // Tool session interface
  if (selectedTool) {
    const tool = relaxationTools.find(t => t.id === selectedTool);
    if (!tool) return null;

    return (
      <motion.div 
        className={`${isFullscreen ? 'fixed inset-0 z-50' : 'relative'} bg-gradient-to-br ${tool.bgGradient} rounded-2xl overflow-hidden shadow-2xl border-2 ${tool.borderColor}`}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.3 }}
      >
        {/* Header */}
        <div className={`relative z-10 bg-gradient-to-r ${tool.gradient} p-4 text-white`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <motion.div
                className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center"
                animate={{ rotate: [0, 5, 0, -5, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              >
                <tool.icon className="text-white text-xl" />
              </motion.div>
              <div>
                <h2 className="text-xl font-bold">{tool.title}</h2>
                <p className="text-white/80 text-sm">{tool.subtitle}</p>
                {selectedTool === 'nature-sounds' && activeNatureSound && (
                  <p className="text-white/80 text-xs mt-1">Now playing: {tool.sounds?.find((s: any) => s.sound === activeNatureSound)?.name}</p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <motion.button
                onClick={() => setIsFullscreen(!isFullscreen)}
                className="w-10 h-10 bg-white/20 hover:bg-white/30 rounded-lg flex items-center justify-center transition-colors"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {isFullscreen ? <FaCompress className="text-sm" /> : <FaExpand className="text-sm" />}
              </motion.button>
              <motion.button
                onClick={handleClose}
                className="w-10 h-10 bg-white/20 hover:bg-white/30 rounded-lg flex items-center justify-center transition-colors"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <FaHome className="text-sm" />
              </motion.button>
            </div>
          </div>
        </div>

        {/* Session Content */}
        <div className="relative z-10 min-h-[400px]">
          {/* Render appropriate component based on tool type */}
          {tool.id === 'meditation' && selectedSession ? (
            <GuidedMeditation
              session={selectedSession}
              onStop={stopSession}
              isPlaying={isPlaying}
              onTogglePlay={togglePlayPause}
            />
          ) : tool.id === 'progressive-muscle' && selectedSession ? (
            <ProgressiveMuscleRelaxation
              session={selectedSession}
              onStop={stopSession}
              isPlaying={isPlaying}
              onTogglePlay={togglePlayPause}
            />
          ) : tool.id === 'visualization' && selectedSession ? (
            <VisualizationJourney
              session={selectedSession}
              onStop={stopSession}
              isPlaying={isPlaying}
              onTogglePlay={togglePlayPause}
            />
          ) : tool.id === 'nature-sounds' ? (
            <div className="p-6">
              {activeSession && (
                <motion.div 
                  className="text-center mb-6"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 260, damping: 20 }}
                >
                  <div className={`inline-flex items-center gap-4 bg-white/80 backdrop-blur-sm rounded-2xl px-6 py-4 shadow-lg border ${tool.borderColor}`}>
                    <div className="text-3xl font-mono font-bold text-gray-800">
                      {formatTime(sessionTime)}
                    </div>
                    <div className="flex items-center gap-2">
                      <motion.button
                        onClick={togglePlayPause}
                        className={`w-12 h-12 bg-gradient-to-r ${tool.gradient} text-white rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transition-all`}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        {isPlaying ? <FaPause /> : <FaPlay className="ml-1" />}
                      </motion.button>
                      <motion.button
                        onClick={stopSession}
                        className="w-12 h-12 bg-gray-500 hover:bg-gray-600 text-white rounded-full flex items-center justify-center shadow-lg transition-all"
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <FaStop />
                      </motion.button>
                    </div>
                  </div>
                </motion.div>
              )}

              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {tool.sounds?.map((sound, index) => (
                  <motion.button
                    key={sound.sound}
                    onClick={() => startSession(tool.id, sound)}
                    className={`p-4 bg-white/60 hover:bg-white/80 rounded-xl border-2 transition-all text-center ${
                      activeSession === tool.id && activeNatureSound === sound.sound ? `${tool.borderColor} shadow-lg` : 'border-gray-200'
                    }`}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    whileHover={{ y: -5, scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <sound.icon className={`text-2xl mb-2 mx-auto text-teal-600`} />
                    <p className="font-semibold text-gray-800">{sound.name}</p>
                  </motion.button>
                ))}
              </div>

              {activeSession && (
                <motion.div 
                  className="mt-6 flex items-center justify-center gap-4 bg-white/60 backdrop-blur-sm rounded-xl p-4"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                >
                  <motion.button
                    onClick={() => setIsMuted(!isMuted)}
                    className="w-10 h-10 bg-gray-200 hover:bg-gray-300 rounded-lg flex items-center justify-center transition-colors"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    {isMuted ? <FaVolumeMute className="text-gray-600" /> : <FaVolumeUp className="text-gray-600" />}
                  </motion.button>
                  <div className="flex-1 max-w-xs">
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={isMuted ? 0 : volume}
                      onChange={(e) => setVolume(Number(e.target.value))}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                    />
                  </div>
                  <span className="text-sm text-gray-600 font-medium min-w-[3rem]">
                    {isMuted ? '0%' : `${volume}%`}
                  </span>
                </motion.div>
              )}
            </div>
          ) : (
            <div className="p-6 space-y-4">
              {tool.sessions?.map((session, index) => (
                <motion.button
                  key={session.script}
                  onClick={() => startSession(tool.id, session)}
                  className={`w-full p-4 bg-white/60 hover:bg-white/80 rounded-xl border-2 transition-all text-left ${
                    activeSession === tool.id ? `${tool.borderColor} shadow-lg` : 'border-gray-200'
                  }`}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ x: 5, scale: 1.01 }}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-semibold text-gray-800">{session.name}</h4>
                      <p className="text-sm text-gray-600">{session.duration} minutes</p>
                    </div>
                    <div className={`w-8 h-8 bg-gradient-to-r ${tool.gradient} rounded-full flex items-center justify-center`}>
                      <FaPlay className="text-white text-xs ml-0.5" />
                    </div>
                  </div>
                </motion.button>
              ))}
            </div>
          )}
        </div>
      </motion.div>
    );
  }

  // Main tool selection interface
  return (
    <motion.div 
      className="bg-white rounded-2xl shadow-xl border-2 border-gray-200 overflow-hidden"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="bg-gradient-to-r from-teal-500 to-green-600 p-6 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <motion.div
              className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center"
              animate={{ rotate: [0, 5, 0, -5, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            >
              <FaLeaf className="text-white text-xl" />
            </motion.div>
            <div>
              <h2 className="text-2xl font-bold">Relaxation Tools</h2>
              <p className="text-white/80">Choose your path to tranquility</p>
            </div>
          </div>
          {onClose && (
            <motion.button
              onClick={onClose}
              className="w-10 h-10 bg-white/20 hover:bg-white/30 rounded-lg flex items-center justify-center transition-colors"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <span className="text-white text-xl">×</span>
            </motion.button>
          )}
        </div>
      </div>

      <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
        {relaxationTools.map((tool, index) => (
          <motion.div
            key={tool.id}
            className={`cursor-pointer bg-gradient-to-br ${tool.bgGradient} rounded-2xl p-6 shadow-lg border-2 ${tool.borderColor} hover:shadow-xl transition-all group`}
            onClick={() => setSelectedTool(tool.id)}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            whileHover={{ y: -8, scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <div className="relative z-10">
              <div className="flex items-center gap-4 mb-4">
                <motion.div
                  className={`w-16 h-16 bg-gradient-to-r ${tool.gradient} rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform`}
                  animate={{ y: [0, -3, 0] }}
                  transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: index * 0.2 }}
                >
                  <tool.icon className="text-white text-2xl" />
                </motion.div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-gray-800 mb-1">{tool.title}</h3>
                  <p className="text-sm text-gray-600 mb-2">{tool.subtitle}</p>
                  <span className="text-xs font-semibold text-gray-500 bg-white/60 px-2 py-1 rounded-full">
                    {tool.duration}
                  </span>
                </div>
              </div>
              
              <p className="text-sm text-gray-700 leading-relaxed mb-4">
                {tool.description}
              </p>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-gray-500">
                  <div className="w-2 h-2 bg-current rounded-full opacity-60"></div>
                  <span className="text-xs">Tap to begin</span>
                </div>
                <motion.div
                  className={`w-8 h-8 bg-gradient-to-r ${tool.gradient} rounded-full flex items-center justify-center group-hover:translate-x-1 transition-transform`}
                  whileHover={{ scale: 1.1 }}
                >
                  <FaPlay className="text-white text-xs ml-0.5" />
                </motion.div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
};

export default RelaxationTools; 