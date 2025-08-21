import { FaSpa } from 'react-icons/fa';

interface RelaxationToolsProps {
  darkMode: boolean;
}

const RelaxationTools = ({ darkMode }: RelaxationToolsProps) => {
  return (
    <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow p-6`}>
      <div className="flex items-center mb-6">
        <FaSpa className={`mr-3 text-2xl ${darkMode ? 'text-cyan-400' : 'text-cyan-500'}`} />
        <h2 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Relaxation Tools</h2>
      </div>
      <div className={`${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
        <p className="mb-4">Manage relaxation and meditation tools for students.</p>
        <div className={`${darkMode ? 'bg-gray-700' : 'bg-gray-50'} rounded-lg p-4 border ${darkMode ? 'border-gray-600' : 'border-gray-200'}`}>
          <p className="text-sm">Relaxation Tools management interface coming soon...</p>
        </div>
      </div>
    </div>
  );
};

export default RelaxationTools; 