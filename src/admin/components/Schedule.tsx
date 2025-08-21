import { FaCalendarAlt } from 'react-icons/fa';

interface ScheduleProps {
  darkMode: boolean;
}

const Schedule = ({ darkMode }: ScheduleProps) => {
  return (
    <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow p-6`}>
      <div className="flex items-center mb-6">
        <FaCalendarAlt className={`mr-3 text-2xl ${darkMode ? 'text-indigo-400' : 'text-indigo-500'}`} />
        <h2 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Schedule Management</h2>
      </div>
      <div className={`${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
        <p className="mb-4">Manage appointments and counseling sessions.</p>
        <div className={`${darkMode ? 'bg-gray-700' : 'bg-gray-50'} rounded-lg p-4 border ${darkMode ? 'border-gray-600' : 'border-gray-200'}`}>
          <p className="text-sm">Schedule management interface coming soon...</p>
        </div>
      </div>
    </div>
  );
};

export default Schedule; 