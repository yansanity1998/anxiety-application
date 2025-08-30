import { useNavigate } from 'react-router-dom';
import { FaArrowLeft } from 'react-icons/fa';
import StudentTodoList from './components/TodoList';

const TodoListPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center mb-6">
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-2 text-[#800000] hover:text-[#660000] font-medium"
          >
            <FaArrowLeft />
            Back to Dashboard
          </button>
        </div>
        
        {/* Todo List Component */}
        <StudentTodoList />
      </div>
    </div>
  );
};

export default TodoListPage; 