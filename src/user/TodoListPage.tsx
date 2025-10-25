import { useNavigate } from 'react-router-dom';
import { FaArrowLeft } from 'react-icons/fa';
import StudentTodoList from './components/TodoList';
import { motion } from 'framer-motion';

const TodoListPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#800000]/20">
      {/* Modern Header */}
      <motion.div 
        className="bg-white/95 backdrop-blur-xl border-b border-white/20 sticky top-0 z-20 shadow-lg shadow-emerald-500/10"
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      >
        <div className="px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <motion.button
                onClick={() => navigate('/dashboard')}
                className="p-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-green-600 text-white shadow-lg shadow-emerald-500/25 hover:shadow-xl hover:shadow-emerald-500/30 transition-all duration-300"
                whileHover={{ scale: 1.05, x: -2 }}
                whileTap={{ scale: 0.95 }}
              >
                <FaArrowLeft className="text-lg" />
              </motion.button>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-green-700 bg-clip-text text-transparent">
                  My Tasks
                </h1>
                <p className="text-gray-600 font-medium">Daily Activity Tracker</p>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Main Content */}
      <div className="px-4 py-6">
        <div className="max-w-4xl mx-auto">
          <StudentTodoList />
        </div>
      </div>
    </div>
  );
};

export default TodoListPage;