import { useState } from 'react';
import { FaBars, FaTimes, FaTachometerAlt, FaUsers } from 'react-icons/fa';
import { FaArchive } from 'react-icons/fa';

interface AdminNavbarProps {
  activeView: string;
  setActiveView: (view: string) => void;
  darkMode: boolean;
}

const AdminNavbar = ({ activeView, setActiveView, darkMode }: AdminNavbarProps) => {
  const [isOpen, setIsOpen] = useState(false);

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: <FaTachometerAlt />, color: darkMode ? 'text-blue-400' : 'text-blue-500', hoverColor: darkMode ? 'group-hover:text-blue-400' : 'group-hover:text-blue-500' },
    { id: 'users', label: 'User Management', icon: <FaUsers />, color: darkMode ? 'text-purple-400' : 'text-purple-500', hoverColor: darkMode ? 'group-hover:text-purple-400' : 'group-hover:text-purple-500' },
    { id: 'archived', label: 'Archived Users', icon: <FaArchive />, color: darkMode ? 'text-gray-300' : 'text-gray-500', hoverColor: darkMode ? 'group-hover:text-gray-300' : 'group-hover:text-gray-700' },
  ];

  const navLinkClasses = (view: string) => 
    `group flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
      activeView === view
        ? (darkMode ? 'bg-gray-700 text-white' : 'bg-gray-200 text-gray-900')
        : (darkMode ? 'text-gray-300 hover:bg-gray-700 hover:text-white' : 'text-gray-600 hover:bg-gray-100')
    }`;

  const mobileNavLinkClasses = (view: string) => 
    `group flex items-center gap-2 w-full text-left px-3 py-2 rounded-md text-base font-medium transition-colors ${
      activeView === view
        ? (darkMode ? 'bg-gray-700 text-white' : 'bg-gray-200 text-gray-900')
        : (darkMode ? 'text-gray-300 hover:bg-gray-700 hover:text-white' : 'text-gray-600 hover:bg-gray-100')
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
                    <span className={`mr-1 transition-colors ${item.color} ${item.hoverColor}`}>{item.icon}</span>
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className="-mr-2 flex md:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              type="button"
              className={`inline-flex items-center justify-center p-2 rounded-md ${darkMode ? 'text-gray-400 hover:text-white hover:bg-gray-700' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'} focus:outline-none`}
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
                <span className={`mr-1 transition-colors ${item.color} ${item.hoverColor}`}>{item.icon}</span>
                {item.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </nav>
  );
};

export default AdminNavbar; 