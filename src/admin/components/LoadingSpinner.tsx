import { useContext } from 'react';
import { ThemeContext } from '../../App';

const LoadingSpinner = () => {
  const { darkMode } = useContext(ThemeContext);

  return (
    <div className={`fixed inset-0 flex items-center justify-center ${darkMode ? 'bg-gray-900/80' : 'bg-gray-50/80'} backdrop-blur-sm z-50`}>
      <div className={`relative ${darkMode ? 'bg-gray-800' : 'bg-white'} p-8 rounded-2xl shadow-xl border ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
        <div className="flex flex-col items-center space-y-6">
          <div className="relative">
            {/* Multiple Hearts Container */}
            <div className="w-20 h-20 relative">
              {/* Background Hearts (Multiple layers for depth) */}
              <svg 
                className="absolute inset-0 w-full h-full opacity-30" 
                viewBox="0 0 24 24" 
                fill="none" 
                xmlns="http://www.w3.org/2000/svg"
              >
                <path 
                  d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" 
                  fill={darkMode ? '#4b5563' : '#d1d5db'} 
                  stroke={darkMode ? '#6b7280' : '#9ca3af'} 
                  strokeWidth="0.5"
                />
              </svg>
              
              {/* Main Filling Heart (Maroon) */}
              <svg 
                className="absolute inset-0 w-full h-full heart-fill-animation" 
                viewBox="0 0 24 24" 
                fill="none" 
                xmlns="http://www.w3.org/2000/svg"
              >
                <path 
                  d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" 
                  fill="#800000" 
                  stroke="#660000" 
                  strokeWidth="0.5"
                />
              </svg>

              {/* Pulsing Heart Ring */}
              <div className="absolute inset-0 w-full h-full heart-pulse-ring"></div>
              
              {/* Floating Hearts */}
              <div className="absolute inset-0 w-full h-full">
                <svg 
                  className="absolute top-0 right-0 w-4 h-4 floating-heart-1" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path 
                    d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" 
                    fill="#800000" 
                    opacity="0.6"
                  />
                </svg>
                <svg 
                  className="absolute bottom-0 left-0 w-3 h-3 floating-heart-2" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path 
                    d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" 
                    fill="#800000" 
                    opacity="0.4"
                  />
                </svg>
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
            @keyframes heartFill {
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
            
            @keyframes heartPulse {
              0%, 100% {
                transform: scale(1);
                opacity: 0.3;
              }
              50% {
                transform: scale(1.2);
                opacity: 0.1;
              }
            }
            
            @keyframes floatingHeart1 {
              0%, 100% {
                transform: translate(0, 0) scale(1);
                opacity: 0.6;
              }
              50% {
                transform: translate(-5px, -10px) scale(1.1);
                opacity: 0.8;
              }
            }
            
            @keyframes floatingHeart2 {
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
            
            .heart-fill-animation {
              animation: heartFill 4s ease-in-out infinite;
            }
            
            .heart-pulse-ring {
              border: 2px solid #800000;
              border-radius: 50%;
              animation: heartPulse 3.5s ease-in-out infinite;
            }
            
            .floating-heart-1 {
              animation: floatingHeart1 5s ease-in-out infinite;
            }
            
            .floating-heart-2 {
              animation: floatingHeart2 6s ease-in-out infinite;
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