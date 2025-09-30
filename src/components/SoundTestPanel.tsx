import React from 'react';
import { soundService } from '../lib/soundService';
import { FaPlay, FaVolumeUp, FaVolumeMute, FaCog } from 'react-icons/fa';

type SoundTestPanelProps = {
  darkMode?: boolean;
};

export default function SoundTestPanel({ darkMode = false }: SoundTestPanelProps) {
  const [soundEnabled, setSoundEnabled] = React.useState(() => soundService.isEnabledState());
  const [volume, setVolume] = React.useState(() => soundService.getVolume());
  const [isOpen, setIsOpen] = React.useState(false);

  const toggleSound = () => {
    const newEnabled = !soundEnabled;
    setSoundEnabled(newEnabled);
    soundService.setEnabled(newEnabled);
    if (newEnabled) {
      soundService.playSuccessSound();
    }
  };

  const handleVolumeChange = (newVolume: number) => {
    setVolume(newVolume);
    soundService.setVolume(newVolume);
  };

  const testSound = async (soundType: string) => {
    switch (soundType) {
      case 'login':
        await soundService.playLoginSound();
        break;
      case 'registration':
        await soundService.playRegistrationSound();
        break;
      case 'archive':
        await soundService.playArchiveSound();
        break;
      case 'unarchive':
        await soundService.playUnarchiveSound();
        break;
      case 'schedule':
        await soundService.playScheduleSound();
        break;
      case 'verified':
        await soundService.playVerifiedSound();
        break;
      case 'unverified':
        await soundService.playUnverifiedSound();
        break;
      case 'message':
        await soundService.playMessageSound();
        break;
      case 'success':
        await soundService.playSuccessSound();
        break;
      case 'error':
        await soundService.playErrorSound();
        break;
    }
  };

  const testAllSounds = () => {
    soundService.testAllSounds();
  };

  if (!isOpen) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <button
          onClick={() => setIsOpen(true)}
          className={`p-3 rounded-full shadow-lg ${
            darkMode 
              ? 'bg-gray-800 hover:bg-gray-700 text-gray-300' 
              : 'bg-white hover:bg-gray-50 text-gray-700'
          } border ${darkMode ? 'border-gray-700' : 'border-gray-200'} transition-all hover:scale-105`}
          title="Sound Test Panel"
        >
          <FaCog className="w-5 h-5" />
        </button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div className={`p-4 rounded-xl shadow-2xl border ${
        darkMode 
          ? 'bg-gray-800 border-gray-700 text-gray-200' 
          : 'bg-white border-gray-200 text-gray-800'
      } w-80`}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">🔊 Sound Test Panel</h3>
          <button
            onClick={() => setIsOpen(false)}
            className={`p-1 rounded-full ${
              darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
            } transition-colors`}
          >
            ✕
          </button>
        </div>

        {/* Sound Toggle */}
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm font-medium">Sound Notifications</span>
          <button
            onClick={toggleSound}
            className={`flex items-center gap-2 px-3 py-1 rounded-lg transition-colors ${
              soundEnabled
                ? (darkMode ? 'bg-green-900 text-green-300' : 'bg-green-100 text-green-800')
                : (darkMode ? 'bg-gray-700 text-gray-400' : 'bg-gray-100 text-gray-600')
            }`}
          >
            {soundEnabled ? <FaVolumeUp className="w-3 h-3" /> : <FaVolumeMute className="w-3 h-3" />}
            <span className="text-xs">{soundEnabled ? 'ON' : 'OFF'}</span>
          </button>
        </div>

        {/* Volume Control */}
        {soundEnabled && (
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">
              Volume: {Math.round(volume * 100)}%
            </label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={volume}
              onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
              className={`w-full h-2 rounded-lg appearance-none cursor-pointer ${
                darkMode ? 'bg-gray-700' : 'bg-gray-200'
              }`}
            />
          </div>
        )}

        {/* Test Buttons */}
        <div className="space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => testSound('login')}
              disabled={!soundEnabled}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs transition-colors ${
                soundEnabled
                  ? (darkMode 
                      ? 'bg-blue-900 hover:bg-blue-800 text-blue-300' 
                      : 'bg-blue-100 hover:bg-blue-200 text-blue-800')
                  : (darkMode ? 'bg-gray-700 text-gray-500' : 'bg-gray-100 text-gray-400')
              }`}
            >
              <FaPlay className="w-2 h-2" />
              Login
            </button>
            <button
              onClick={() => testSound('registration')}
              disabled={!soundEnabled}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs transition-colors ${
                soundEnabled
                  ? (darkMode 
                      ? 'bg-green-900 hover:bg-green-800 text-green-300' 
                      : 'bg-green-100 hover:bg-green-200 text-green-800')
                  : (darkMode ? 'bg-gray-700 text-gray-500' : 'bg-gray-100 text-gray-400')
              }`}
            >
              <FaPlay className="w-2 h-2" />
              Registration
            </button>
            <button
              onClick={() => testSound('archive')}
              disabled={!soundEnabled}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs transition-colors ${
                soundEnabled
                  ? (darkMode 
                      ? 'bg-red-900 hover:bg-red-800 text-red-300' 
                      : 'bg-red-100 hover:bg-red-200 text-red-800')
                  : (darkMode ? 'bg-gray-700 text-gray-500' : 'bg-gray-100 text-gray-400')
              }`}
            >
              <FaPlay className="w-2 h-2" />
              Archive
            </button>
            <button
              onClick={() => testSound('unarchive')}
              disabled={!soundEnabled}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs transition-colors ${
                soundEnabled
                  ? (darkMode 
                      ? 'bg-emerald-900 hover:bg-emerald-800 text-emerald-300' 
                      : 'bg-emerald-100 hover:bg-emerald-200 text-emerald-800')
                  : (darkMode ? 'bg-gray-700 text-gray-500' : 'bg-gray-100 text-gray-400')
              }`}
            >
              <FaPlay className="w-2 h-2" />
              Unarchive
            </button>
            <button
              onClick={() => testSound('schedule')}
              disabled={!soundEnabled}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs transition-colors ${
                soundEnabled
                  ? (darkMode 
                      ? 'bg-purple-900 hover:bg-purple-800 text-purple-300' 
                      : 'bg-purple-100 hover:bg-purple-200 text-purple-800')
                  : (darkMode ? 'bg-gray-700 text-gray-500' : 'bg-gray-100 text-gray-400')
              }`}
            >
              <FaPlay className="w-2 h-2" />
              Schedule
            </button>
            <button
              onClick={() => testSound('verified')}
              disabled={!soundEnabled}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs transition-colors ${
                soundEnabled
                  ? (darkMode 
                      ? 'bg-cyan-900 hover:bg-cyan-800 text-cyan-300' 
                      : 'bg-cyan-100 hover:bg-cyan-200 text-cyan-800')
                  : (darkMode ? 'bg-gray-700 text-gray-500' : 'bg-gray-100 text-gray-400')
              }`}
            >
              <FaPlay className="w-2 h-2" />
              Verified
            </button>
            <button
              onClick={() => testSound('unverified')}
              disabled={!soundEnabled}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs transition-colors ${
                soundEnabled
                  ? (darkMode 
                      ? 'bg-orange-900 hover:bg-orange-800 text-orange-300' 
                      : 'bg-orange-100 hover:bg-orange-200 text-orange-800')
                  : (darkMode ? 'bg-gray-700 text-gray-500' : 'bg-gray-100 text-gray-400')
              }`}
            >
              <FaPlay className="w-2 h-2" />
              Unverified
            </button>
            <button
              onClick={() => testSound('message')}
              disabled={!soundEnabled}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs transition-colors ${
                soundEnabled
                  ? (darkMode 
                      ? 'bg-indigo-900 hover:bg-indigo-800 text-indigo-300' 
                      : 'bg-indigo-100 hover:bg-indigo-200 text-indigo-800')
                  : (darkMode ? 'bg-gray-700 text-gray-500' : 'bg-gray-100 text-gray-400')
              }`}
            >
              <FaPlay className="w-2 h-2" />
              Message
            </button>
            <button
              onClick={() => testSound('success')}
              disabled={!soundEnabled}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs transition-colors ${
                soundEnabled
                  ? (darkMode 
                      ? 'bg-green-900 hover:bg-green-800 text-green-300' 
                      : 'bg-green-100 hover:bg-green-200 text-green-800')
                  : (darkMode ? 'bg-gray-700 text-gray-500' : 'bg-gray-100 text-gray-400')
              }`}
            >
              <FaPlay className="w-2 h-2" />
              Success
            </button>
            <button
              onClick={() => testSound('error')}
              disabled={!soundEnabled}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs transition-colors ${
                soundEnabled
                  ? (darkMode 
                      ? 'bg-red-900 hover:bg-red-800 text-red-300' 
                      : 'bg-red-100 hover:bg-red-200 text-red-800')
                  : (darkMode ? 'bg-gray-700 text-gray-500' : 'bg-gray-100 text-gray-400')
              }`}
            >
              <FaPlay className="w-2 h-2" />
              Error
            </button>
          </div>
          
          <button
            onClick={testAllSounds}
            disabled={!soundEnabled}
            className={`w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              soundEnabled
                ? (darkMode 
                    ? 'bg-indigo-900 hover:bg-indigo-800 text-indigo-300' 
                    : 'bg-indigo-100 hover:bg-indigo-200 text-indigo-800')
                : (darkMode ? 'bg-gray-700 text-gray-500' : 'bg-gray-100 text-gray-400')
            }`}
          >
            <FaPlay className="w-3 h-3" />
            Test All Sounds
          </button>
        </div>

        <div className={`mt-4 p-3 rounded-lg text-xs ${
          darkMode ? 'bg-gray-700 text-gray-400' : 'bg-gray-50 text-gray-600'
        }`}>
          <p className="mb-1">
            <strong>Note:</strong> This panel is for testing notification sounds.
          </p>
          <p>
            Sounds will play automatically when students log in, register, or get archived.
          </p>
        </div>
      </div>
    </div>
  );
}
