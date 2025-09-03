import { useState } from 'react';
import { FaBars, FaTimes, FaTachometerAlt, FaUsers } from 'react-icons/fa';
import { FaArchive, FaBrain, FaVideo, FaTasks, FaHandshake, FaCalendarAlt, FaFileAlt } from 'react-icons/fa';

interface AdminNavbarProps {
  activeView: string;
  setActiveView: (view: string) => void;
  darkMode: boolean;
  archivedUsersCount?: number;
}

const AdminNavbar = ({ activeView, setActiveView, darkMode, archivedUsersCount = 0 }: AdminNavbarProps) => {
  const [isOpen, setIsOpen] = useState(false);

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: <FaTachometerAlt />, color: 'text-blue-500' },
    { id: 'users', label: 'User Management', icon: <FaUsers />, color: 'text-purple-500' },
    { id: 'archived', label: 'Archived Users', icon: <FaArchive />, color: 'text-red-500' },
    { id: 'schedule', label: 'Schedule', icon: <FaCalendarAlt />, color: 'text-indigo-500' },
    { id: 'cbt-modules', label: 'CBT Modules', icon: <FaBrain />, color: 'text-green-500' },
    { id: 'anxiety-videos', label: 'Anxiety Videos', icon: <FaVideo />, color: 'text-orange-500' },
    { id: 'todo-list', label: 'To-Do List', icon: <FaTasks />, color: 'text-teal-500' },
    { id: 'records', label: 'Records', icon: <FaFileAlt />, color: 'text-pink-500' },
    { id: 'referral', label: 'Referral', icon: <FaHandshake />, color: 'text-yellow-500' },
  ];

  // Desktop link styles
  const navLinkClasses = (view: string) =>
    `group flex items-center gap-2 px-3 py-2 rounded-md text-sm md:text-base whitespace-nowrap font-medium transition-colors ${
      activeView === view
        ? 'bg-[#800000] text-white' // Active = Maroon
        : darkMode
        ? 'text-gray-300 hover:bg-[#b56576] hover:text-white' // Hover = Light Maroon
        : 'text-gray-600 hover:bg-[#b56576] hover:text-white'
    }`;

  // Mobile link styles
  const mobileNavLinkClasses = (view: string) =>
    `group flex items-center gap-2 w-full text-left px-3 py-2 rounded-md text-sm whitespace-nowrap font-medium transition-colors ${
      activeView === view
        ? 'bg-[#800000] text-white'
        : darkMode
        ? 'text-gray-300 hover:bg-[#b56576] hover:text-white'
        : 'text-gray-600 hover:bg-[#b56576] hover:text-white'
    }`;

  return (
    <nav className={`w-full ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border-b`}>
      <div className="max-w-10xl mx-auto px-6 sm:px-12 lg:px-16">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <div className="hidden md:block">
              <div className="flex items-baseline space-x-4">
                {navItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setActiveView(item.id)}
                    className={navLinkClasses(item.id)}
                  >
                    <span
                      className={`mr-1 ${
                        activeView === item.id ? 'text-white' : item.color
                      }`}
                    >
                      {item.icon}
                    </span>
                    {item.label}
                    {item.id === 'archived' && archivedUsersCount > 0 && (
                      <span
                        className={`ml-2 inline-flex items-center justify-center px-2 py-1 text-xs font-bold rounded-full ${
                          darkMode ? 'bg-red-600 text-white' : 'bg-red-500 text-white'
                        }`}
                      >
                        {archivedUsersCount}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className="-mr-2 flex md:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              type="button"
              className={`inline-flex items-center justify-center p-2 rounded-md ${
                darkMode
                  ? 'text-gray-400 hover:text-white hover:bg-[#b56576]'
                  : 'text-gray-500 hover:text-white hover:bg-[#b56576]'
              } focus:outline-none`}
              aria-controls="mobile-menu"
              aria-expanded="false"
            >
              <span className="sr-only">Open main menu</span>
              {isOpen ? <FaTimes /> : <FaBars />}
            </button>
          </div>
        </div>
      </div>

      {isOpen && (
        <div className="md:hidden" id="mobile-menu">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  setActiveView(item.id);
                  setIsOpen(false);
                }}
                className={mobileNavLinkClasses(item.id)}
              >
                <span
                  className={`mr-1 ${
                    activeView === item.id ? 'text-white' : item.color
                  }`}
                >
                  {item.icon}
                </span>
                {item.label}
                {item.id === 'archived' && archivedUsersCount > 0 && (
                  <span
                    className={`ml-2 inline-flex items-center justify-center px-2 py-1 text-xs font-bold rounded-full ${
                      darkMode ? 'bg-red-600 text-white' : 'bg-red-500 text-white'
                    }`}
                  >
                    {archivedUsersCount}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </nav>
  );
};

export default AdminNavbar;
