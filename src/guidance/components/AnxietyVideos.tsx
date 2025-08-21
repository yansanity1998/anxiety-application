import { FaVideo } from 'react-icons/fa';

interface AnxietyVideosProps {
  darkMode: boolean;
}

const AnxietyVideos = ({ darkMode }: AnxietyVideosProps) => {
  return (
    <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow p-6`}>
      <div className="flex items-center mb-6">
        <FaVideo className={`mr-3 text-2xl ${darkMode ? 'text-red-400' : 'text-red-500'}`} />
        <h2 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Anxiety Videos</h2>
      </div>
      <div className={`${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
        <p className="mb-4">Manage anxiety management videos for students.</p>
        <div className={`${darkMode ? 'bg-gray-700' : 'bg-gray-50'} rounded-lg p-4 border ${darkMode ? 'border-gray-600' : 'border-gray-200'}`}>
          <p className="text-sm">Anxiety Videos management interface coming soon...</p>
        </div>
      </div>
    </div>
  );
};

export default AnxietyVideos; 