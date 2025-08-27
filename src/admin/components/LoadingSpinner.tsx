import { useContext } from 'react';
import { ThemeContext } from '../../App';
import { FaBrain } from 'react-icons/fa';

const LoadingSpinner = () => {
  const { darkMode } = useContext(ThemeContext);

  return (
    <div className={`fixed inset-0 flex items-center justify-center ${darkMode ? 'bg-gray-900/80' : 'bg-gray-50/80'} backdrop-blur-sm z-50`}>
      <div className={`relative ${darkMode ? 'bg-gray-800' : 'bg-white'} p-8 rounded-2xl shadow-xl border ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
        <div className="flex flex-col items-center space-y-6">
          <div className="relative">
            {/* Multiple Brains Container */}
            <div className="w-20 h-20 relative">
              {/* Background Brain (Multiple layers for depth) */}
              <div className="absolute inset-0 w-full h-full opacity-30 flex items-center justify-center">
                <FaBrain 
                  className={`text-5xl ${darkMode ? 'text-gray-500' : 'text-gray-300'}`}
                />
              </div>
              
              {/* Main Filling Brain (Maroon) */}
              <div className="absolute inset-0 w-full h-full brain-fill-animation flex items-center justify-center">
                <FaBrain className="text-5xl text-[#800000]" />
              </div>

              {/* Pulsing Brain Ring */}
              <div className="absolute inset-0 w-full h-full brain-pulse-ring"></div>
              
              {/* Floating Brains */}
              <div className="absolute inset-0 w-full h-full">
                <div className="absolute top-0 right-0 w-4 h-4 floating-brain-1 flex items-center justify-center">
                  <FaBrain className="text-sm text-[#800000] opacity-60" />
                </div>
                <div className="absolute bottom-0 left-0 w-3 h-3 floating-brain-2 flex items-center justify-center">
                  <FaBrain className="text-xs text-[#800000] opacity-40" />
                </div>
              </div>
            </div>
          </div>
          
          {/* Loading Text with Typing Effect */}
          <div className="text-center">
            <div className={`text-sm font-medium ${darkMode ? 'text-gray-200' : 'text-gray-700'} typing-animation`}>
              Loading...
            </div>
            <div className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'} mt-1`}>
              Please wait while we prepare your data
            </div>
          </div>
        </div>
        
        {/* Custom CSS for enhanced animations with longer durations */}
        <style dangerouslySetInnerHTML={{
          __html: `
            @keyframes brainFill {
              0% {
                clip-path: inset(100% 0 0 0);
                transform: scale(1);
              }
              25% {
                clip-path: inset(50% 0 0 0);
                transform: scale(1.05);
              }
              50% {
                clip-path: inset(0 0 0 0);
                transform: scale(1.1);
              }
              75% {
                clip-path: inset(0 0 50% 0);
                transform: scale(1.05);
              }
              100% {
                clip-path: inset(100% 0 0 0);
                transform: scale(1);
              }
            }
            
            @keyframes brainPulse {
              0%, 100% {
                transform: scale(1);
                opacity: 0.3;
              }
              50% {
                transform: scale(1.2);
                opacity: 0.1;
              }
            }
            
            @keyframes floatingBrain1 {
              0%, 100% {
                transform: translate(0, 0) scale(1);
                opacity: 0.6;
              }
              50% {
                transform: translate(-5px, -10px) scale(1.1);
                opacity: 0.8;
              }
            }
            
            @keyframes floatingBrain2 {
              0%, 100% {
                transform: translate(0, 0) scale(1);
                opacity: 0.4;
              }
              50% {
                transform: translate(8px, -8px) scale(1.2);
                opacity: 0.6;
              }
            }
            
            @keyframes typing {
              0%, 50%, 100% {
                opacity: 1;
              }
              25%, 75% {
                opacity: 0.5;
              }
            }
            
            .brain-fill-animation {
              animation: brainFill 4s ease-in-out infinite;
            }
            
            .brain-pulse-ring {
              border: 2px solid #800000;
              border-radius: 50%;
              animation: brainPulse 3.5s ease-in-out infinite;
            }
            
            .floating-brain-1 {
              animation: floatingBrain1 5s ease-in-out infinite;
            }
            
            .floating-brain-2 {
              animation: floatingBrain2 6s ease-in-out infinite;
            }
            
            .typing-animation {
              animation: typing 3s ease-in-out infinite;
            }
          `
        }} />
      </div>
    </div>
  );
};

export default LoadingSpinner; 