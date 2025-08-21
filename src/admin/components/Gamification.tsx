import { FaGamepad } from 'react-icons/fa';

interface GamificationProps {
  darkMode: boolean;
}

const Gamification = ({ darkMode }: GamificationProps) => {
  return (
    <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow p-6`}>
      <div className="flex items-center mb-6">
        <FaGamepad className={`mr-3 text-2xl ${darkMode ? 'text-pink-400' : 'text-pink-500'}`} />
        <h2 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Gamification</h2>
      </div>
      <div className={`${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
        <p className="mb-4">Manage rewards, achievements, and engagement systems.</p>
        <div className={`${darkMode ? 'bg-gray-700' : 'bg-gray-50'} rounded-lg p-4 border ${darkMode ? 'border-gray-600' : 'border-gray-200'}`}>
          <p className="text-sm">Gamification management interface coming soon...</p>
        </div>
      </div>
    </div>
  );
};

export default Gamification; 