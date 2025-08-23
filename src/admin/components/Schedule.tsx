


import React, { useState } from 'react';
import lotus from '../../../public/lotus.png';
import { FaCalendarAlt, FaUser, FaClock, FaCheckCircle, FaTimesCircle, FaHourglassHalf } from 'react-icons/fa';

interface ScheduleProps {
  darkMode: boolean;
}

interface Appointment {
  id: number;
  user: string;
  date: string;
  time: string;
  status: 'In Progress' | 'Completed' | 'Canceled';
}

const users = [
  'John Doe',
  'Jane Smith',
  'Alice Johnson',
  'Bob Lee',
];

const statusColors: Record<string, string> = {
  'In Progress': 'bg-yellow-100 text-yellow-800',
  'Completed': 'bg-green-100 text-green-800',
  'Canceled': 'bg-red-100 text-red-800',
};

const statusIcons: Record<string, React.ReactNode> = {
  'In Progress': <FaHourglassHalf className="mr-1" />,
  'Completed': <FaCheckCircle className="mr-1" />,
  'Canceled': <FaTimesCircle className="mr-1" />,
};

const Schedule = ({ darkMode }: ScheduleProps) => {
  const [selectedUser, setSelectedUser] = useState(users[0]);
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [status, setStatus] = useState<'In Progress' | 'Completed' | 'Canceled'>('In Progress');

  const handleAddAppointment = () => {
    if (!date || !time) return;
    setAppointments([
      ...appointments,
      {
        id: Date.now(),
        user: selectedUser,
        date,
        time,
        status,
      },
    ]);
    setDate('');
    setTime('');
    setStatus('In Progress');
  };

  return (
    <div
      className={`relative rounded-2xl shadow-2xl p-8 transition-all overflow-hidden backdrop-blur-lg border border-white/20 ${darkMode ? 'bg-gradient-to-br from-indigo-900 via-purple-900 to-gray-900' : 'bg-gradient-to-br from-indigo-200 via-purple-100 to-white'}`}
      style={{ minHeight: '80vh' }}
    >
      <img src={lotus} alt="Lotus" className="absolute top-6 right-8 w-20 h-20 opacity-30 pointer-events-none select-none" />
      <div className="flex items-center mb-10">
        <FaCalendarAlt className={`mr-4 text-4xl animate-pulse ${darkMode ? 'text-indigo-300' : 'text-indigo-500'}`} />
        <h2 className={`text-4xl font-black tracking-tight drop-shadow-lg ${darkMode ? 'text-white' : 'text-gray-900'}`}>Guidance Office Appointments</h2>
      </div>
      <div className="mb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Create Appointment Card */}
          <div className={`relative rounded-xl p-8 border shadow-lg transition-all ${darkMode ? 'bg-gradient-to-br from-gray-900 via-indigo-900 to-gray-800 border-gray-700' : 'bg-gradient-to-br from-white via-indigo-100 to-purple-100 border-gray-200'}`}>
            <h3 className={`text-2xl font-bold mb-6 ${darkMode ? 'text-indigo-200' : 'text-indigo-700'}`}>Create Appointment</h3>
            <div className="mb-5">
              <label className="block mb-2 font-semibold flex items-center text-lg">
                <FaUser className="mr-2" /> Select User
              </label>
              <select
                className={`w-full p-3 rounded-lg border focus:ring-2 focus:ring-indigo-400 transition ${darkMode ? 'bg-gray-800 text-white border-gray-600' : 'bg-white border-gray-300'}`}
                value={selectedUser}
                onChange={e => setSelectedUser(e.target.value)}
              >
                {users.map(user => (
                  <option key={user} value={user}>{user}</option>
                ))}
              </select>
            </div>
            <div className="mb-5">
              <label className="block mb-2 font-semibold flex items-center text-lg">
                <FaClock className="mr-2" /> Date
              </label>
              <input
                type="date"
                className={`w-full p-3 rounded-lg border focus:ring-2 focus:ring-indigo-400 transition ${darkMode ? 'bg-gray-800 text-white border-gray-600' : 'bg-white border-gray-300'}`}
                value={date}
                onChange={e => setDate(e.target.value)}
              />
            </div>
            <div className="mb-5">
              <label className="block mb-2 font-semibold flex items-center text-lg">
                <FaClock className="mr-2" /> Time
              </label>
              <input
                type="time"
                className={`w-full p-3 rounded-lg border focus:ring-2 focus:ring-indigo-400 transition ${darkMode ? 'bg-gray-800 text-white border-gray-600' : 'bg-white border-gray-300'}`}
                value={time}
                onChange={e => setTime(e.target.value)}
              />
            </div>
            <div className="mb-5">
              <label className="block mb-2 font-semibold text-lg">Status</label>
              <select
                className={`w-full p-3 rounded-lg border focus:ring-2 focus:ring-indigo-400 transition ${darkMode ? 'bg-gray-800 text-white border-gray-600' : 'bg-white border-gray-300'}`}
                value={status}
                onChange={e => setStatus(e.target.value as Appointment['status'])}
              >
                <option value="In Progress">In Progress</option>
                <option value="Completed">Completed</option>
                <option value="Canceled">Canceled</option>
              </select>
            </div>
            <button
              className={`w-full py-3 px-4 rounded-xl font-extrabold text-lg transition-all shadow-lg hover:scale-105 active:scale-95 ${darkMode ? 'bg-gradient-to-r from-indigo-700 to-purple-700 text-white hover:from-indigo-600 hover:to-purple-600' : 'bg-gradient-to-r from-indigo-400 to-purple-400 text-white hover:from-indigo-500 hover:to-purple-500'} ${(!date || !time) ? 'opacity-50 cursor-not-allowed' : ''}`}
              onClick={handleAddAppointment}
              disabled={!date || !time}
            >
              Add Appointment
            </button>
            <div className="absolute -top-6 -left-6 w-16 h-16 bg-indigo-400 opacity-10 rounded-full blur-2xl" />
          </div>
          {/* Upcoming Appointments Card */}
          <div className={`relative rounded-xl p-8 border shadow-lg transition-all ${darkMode ? 'bg-gradient-to-br from-gray-900 via-indigo-900 to-gray-800 border-gray-700' : 'bg-gradient-to-br from-white via-indigo-100 to-purple-100 border-gray-200'}`}>
            <h3 className={`text-2xl font-bold mb-6 ${darkMode ? 'text-indigo-200' : 'text-indigo-700'}`}>Upcoming Appointments</h3>
            {appointments.length === 0 ? (
              <p className="text-gray-400 text-lg italic">No appointments scheduled yet.</p>
            ) : (
              <ul className="space-y-6">
                {appointments.map(app => (
                  <li
                    key={app.id}
                    className={`flex items-center justify-between p-5 rounded-xl shadow-lg border transition-all group hover:scale-[1.02] hover:shadow-2xl ${darkMode ? 'bg-gradient-to-r from-gray-900 via-indigo-900 to-gray-800 border-gray-700' : 'bg-gradient-to-r from-white via-indigo-100 to-purple-100 border-gray-200'}`}
                  >
                    <div>
                      <div className="font-extrabold text-xl flex items-center mb-1">
                        <FaUser className="mr-2 text-indigo-400 group-hover:animate-bounce" /> {app.user}
                      </div>
                      <div className="text-md text-gray-500 flex items-center">
                        <FaClock className="mr-1" /> {app.date} at {app.time}
                      </div>
                    </div>
                    <span className={`flex items-center px-4 py-2 rounded-full text-sm font-bold shadow ${statusColors[app.status]} group-hover:scale-110 transition-all`}>{statusIcons[app.status]} {app.status}</span>
                  </li>
                ))}
              </ul>
            )}
            <div className="absolute -bottom-6 -right-6 w-16 h-16 bg-purple-400 opacity-10 rounded-full blur-2xl" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Schedule;