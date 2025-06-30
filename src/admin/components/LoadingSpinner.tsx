import { useContext } from 'react';
import { ThemeContext } from '../../App';

const LoadingSpinner = () => {
  const { darkMode } = useContext(ThemeContext);

  return (
    <div className={`fixed inset-0 flex items-center justify-center ${darkMode ? 'bg-gray-900/80' : 'bg-gray-50/80'} backdrop-blur-sm z-50`}>
      <div className={`relative ${darkMode ? 'bg-gray-800' : 'bg-white'} p-8 rounded-2xl shadow-xl border ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
        <div className="flex flex-col items-center space-y-4">
          <div className="relative">
            <div className={`w-12 h-12 rounded-full border-4 ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}></div>
            <div className="absolute top-0 left-0 w-12 h-12 rounded-full border-4 border-t-blue-500 border-r-purple-500 animate-spin"></div>
          </div>
          <div className={`text-sm font-medium ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
            Loading...
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoadingSpinner; 