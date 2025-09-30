import { useState, useEffect } from 'react';
import { FaTasks, FaPlus, FaEdit, FaTrash, FaCheck, FaClock, FaExclamationTriangle, FaSearch, FaCalendarAlt, FaUser, FaFlag } from 'react-icons/fa';
import { getAllTodoItems, createTodoItem, updateTodoItem, deleteTodoItem, fetchUsers, TODO_CATEGORIES, PRIORITY_LABELS, STATUS_LABELS, type TodoItem, type UserProfile } from '../../lib/todoService';
import Swal from 'sweetalert2';

interface TodoListProps {
  darkMode: boolean;
}

const TodoList = ({ darkMode }: TodoListProps) => {
  const [todos, setTodos] = useState<TodoItem[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [filteredTodos, setFilteredTodos] = useState<TodoItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');

  const Toast = Swal.mixin({
    toast: true,
    position: 'top-end',
    showConfirmButton: false,
    timer: 3000,
    timerProgressBar: true,
    background: darkMode ? '#1f2937' : '#f8fafc',
    color: darkMode ? '#f3f4f6' : '#111827',
    didOpen: (toast) => {
      toast.addEventListener('mouseenter', Swal.stopTimer);
      toast.addEventListener('mouseleave', Swal.resumeTimer);
    }
  });

  const Modal = Swal.mixin({
    background: darkMode ? '#1f2937' : '#f8fafc',
    color: darkMode ? '#f3f4f6' : '#111827',
    customClass: {
      popup: `rounded-xl shadow-xl border ${darkMode ? 'border-gray-700' : 'border-gray-200'}`,
      title: 'text-lg font-bold text-[#800000]',
      confirmButton: 'bg-[#800000] hover:bg-[#660000] text-white font-medium py-2 px-4 rounded-lg',
      cancelButton: `${darkMode ? 'bg-gray-700 border-gray-600 text-gray-200 hover:bg-gray-600' : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'} border font-medium py-2 px-4 rounded-lg`
    }
  });

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    filterTodos();
  }, [todos, searchTerm, statusFilter, categoryFilter, priorityFilter]);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [todosData, usersData] = await Promise.all([
        getAllTodoItems(),
        fetchUsers()
      ]);
      setTodos(todosData);
      setUsers(usersData);
    } catch (error) {
      console.error('Error fetching data:', error);
      Toast.fire({
        icon: 'error',
        title: 'Error fetching data'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const filterTodos = () => {
    let filtered = [...todos];

    if (searchTerm) {
      filtered = filtered.filter(todo =>
        todo.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (todo.description && todo.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (todo.profiles?.full_name && todo.profiles.full_name.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(todo => todo.status === statusFilter);
    }

    if (categoryFilter !== 'all') {
      filtered = filtered.filter(todo => todo.category === categoryFilter);
    }

    if (priorityFilter !== 'all') {
      filtered = filtered.filter(todo => todo.priority === parseInt(priorityFilter));
    }

    setFilteredTodos(filtered);
  };

  const getUserName = (profileId: number): string => {
    const user = users.find(u => u.id === profileId);
    return user ? user.full_name || user.email : `Profile ${profileId}`;
  };

  const getCategoryColor = (category: string) => {
    switch (category?.toLowerCase()) {
      case 'exposure therapy': return 'bg-gradient-to-r from-red-500 to-pink-500 text-white';
      case 'relaxation': return 'bg-gradient-to-r from-green-500 to-emerald-500 text-white';
      case 'lifestyle': return 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white';
      case 'study': return 'bg-gradient-to-r from-purple-500 to-indigo-500 text-white';
      case 'social': return 'bg-gradient-to-r from-orange-500 to-amber-500 text-white';
      case 'self-care': return 'bg-gradient-to-r from-pink-500 to-rose-500 text-white';
      case 'exercise': return 'bg-gradient-to-r from-lime-500 to-green-500 text-white';
      case 'mindfulness': return 'bg-gradient-to-r from-violet-500 to-purple-500 text-white';
      default: return 'bg-gradient-to-r from-gray-500 to-slate-500 text-white';
    }
  };

  const handleCreateTodo = async () => {
    const { value: formValues } = await Swal.fire({
      title: 'Create New Todo',
      html: `
        <div class="space-y-4 text-left">
          <div>
            <label class="block text-sm font-medium ${darkMode ? 'text-gray-200' : 'text-gray-700'} mb-1">Title *</label>
            <input type="text" id="title" class="w-full p-2 border rounded-lg ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}" placeholder="Enter todo title" required>
          </div>
          <div>
            <label class="block text-sm font-medium ${darkMode ? 'text-gray-200' : 'text-gray-700'} mb-1">Description</label>
            <textarea id="description" class="w-full p-2 border rounded-lg ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}" rows="3" placeholder="Enter description"></textarea>
          </div>
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium ${darkMode ? 'text-gray-200' : 'text-gray-700'} mb-1">Category</label>
              <select id="category" class="w-full p-2 border rounded-lg ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}">
                <option value="">Select category</option>
                ${TODO_CATEGORIES.map(cat => `<option value="${cat}">${cat}</option>`).join('')}
              </select>
            </div>
            <div>
              <label class="block text-sm font-medium ${darkMode ? 'text-gray-200' : 'text-gray-700'} mb-1">Priority</label>
              <select id="priority" class="w-full p-2 border rounded-lg ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}">
                <option value="3">Medium</option>
                <option value="1">Urgent</option>
                <option value="2">High</option>
                <option value="4">Low</option>
                <option value="5">Very Low</option>
              </select>
            </div>
          </div>
          <div>
            <label class="block text-sm font-medium ${darkMode ? 'text-gray-200' : 'text-gray-700'} mb-1">Due Date</label>
            <input type="datetime-local" id="due_at" class="w-full p-2 border rounded-lg ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}">
          </div>
          <div>
            <label class="block text-sm font-medium ${darkMode ? 'text-gray-200' : 'text-gray-700'} mb-1">Assign to User *</label>
            <select id="profile_id" class="w-full p-2 border rounded-lg ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}" required>
              <option value="">Select a user</option>
              ${users.map(user => `<option value="${user.id}">${user.full_name || user.email} (${user.role})</option>`).join('')}
            </select>
          </div>
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: 'Create Todo',
      width: '500px',
      scrollbarPadding: false,
      didOpen: () => {
        document.body.style.paddingRight = '0px !important';
      },
      didClose: () => {
        document.body.style.paddingRight = '';
      },
      preConfirm: () => {
        const title = (document.getElementById('title') as HTMLInputElement)?.value;
        const description = (document.getElementById('description') as HTMLTextAreaElement)?.value;
        const category = (document.getElementById('category') as HTMLSelectElement)?.value;
        const priority = parseInt((document.getElementById('priority') as HTMLSelectElement)?.value);
        const due_at = (document.getElementById('due_at') as HTMLInputElement)?.value;
        const profile_id = parseInt((document.getElementById('profile_id') as HTMLSelectElement)?.value);

        if (!title || !profile_id) {
          Swal.showValidationMessage('Title and User selection are required');
          return false;
        }

        return {
          title,
          description: description || undefined,
          category: category || undefined,
          priority,
          due_at: due_at || undefined,
          profile_id
        };
      }
    });

    if (formValues) {
      try {
        await createTodoItem(formValues);
        await fetchData();
        Toast.fire({
          icon: 'success',
          title: 'Todo created successfully'
        });
      } catch (error) {
        Toast.fire({
          icon: 'error',
          title: 'Error creating todo'
        });
      }
    }
  };

  const handleEditTodo = async (todo: TodoItem) => {
    const { value: formValues } = await Swal.fire({
      title: 'Edit Todo',
      html: `
        <div class="space-y-4 text-left">
          <div>
            <label class="block text-sm font-medium ${darkMode ? 'text-gray-200' : 'text-gray-700'} mb-1">Title *</label>
            <input type="text" id="title" value="${todo.title}" class="w-full p-2 border rounded-lg ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}" required>
          </div>
          <div>
            <label class="block text-sm font-medium ${darkMode ? 'text-gray-200' : 'text-gray-700'} mb-1">Description</label>
            <textarea id="description" class="w-full p-2 border rounded-lg ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}" rows="3">${todo.description || ''}</textarea>
          </div>
          <div class="grid grid-cols-3 gap-4">
            <div>
              <label class="block text-sm font-medium ${darkMode ? 'text-gray-200' : 'text-gray-700'} mb-1">Status</label>
              <select id="status" class="w-full p-2 border rounded-lg ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}">
                <option value="in_progress" ${todo.status === 'in_progress' ? 'selected' : ''}>In Progress</option>
                <option value="completed" ${todo.status === 'completed' ? 'selected' : ''}>Completed</option>
                <option value="canceled" ${todo.status === 'canceled' ? 'selected' : ''}>Canceled</option>
              </select>
            </div>
            <div>
              <label class="block text-sm font-medium ${darkMode ? 'text-gray-200' : 'text-gray-700'} mb-1">Category</label>
              <select id="category" class="w-full p-2 border rounded-lg ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}">
                <option value="">Select category</option>
                ${TODO_CATEGORIES.map(cat => `<option value="${cat}" ${todo.category === cat ? 'selected' : ''}>${cat}</option>`).join('')}
              </select>
            </div>
            <div>
              <label class="block text-sm font-medium ${darkMode ? 'text-gray-200' : 'text-gray-700'} mb-1">Priority</label>
              <select id="priority" class="w-full p-2 border rounded-lg ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}">
                <option value="1" ${todo.priority === 1 ? 'selected' : ''}>Urgent</option>
                <option value="2" ${todo.priority === 2 ? 'selected' : ''}>High</option>
                <option value="3" ${todo.priority === 3 ? 'selected' : ''}>Medium</option>
                <option value="4" ${todo.priority === 4 ? 'selected' : ''}>Low</option>
                <option value="5" ${todo.priority === 5 ? 'selected' : ''}>Very Low</option>
              </select>
            </div>
          </div>
          <div>
            <label class="block text-sm font-medium ${darkMode ? 'text-gray-200' : 'text-gray-700'} mb-1">Due Date</label>
            <input type="datetime-local" id="due_at" value="${todo.due_at ? new Date(todo.due_at).toISOString().slice(0, 16) : ''}" class="w-full p-2 border rounded-lg ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}">
          </div>
          <div>
            <label class="block text-sm font-medium ${darkMode ? 'text-gray-200' : 'text-gray-700'} mb-1">Assigned User</label>
            <select id="profile_id" class="w-full p-2 border rounded-lg ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}">
              ${users.map(user => `<option value="${user.id}" ${todo.profile_id === user.id ? 'selected' : ''}>${user.full_name || user.email} (${user.role})</option>`).join('')}
            </select>
          </div>
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: 'Update Todo',
      width: '500px',
      scrollbarPadding: false,
      didOpen: () => {
        document.body.style.paddingRight = '0px !important';
      },
      didClose: () => {
        document.body.style.paddingRight = '';
      },
      preConfirm: () => {
        const title = (document.getElementById('title') as HTMLInputElement)?.value;
        const description = (document.getElementById('description') as HTMLTextAreaElement)?.value;
        const status = (document.getElementById('status') as HTMLSelectElement)?.value;
        const category = (document.getElementById('category') as HTMLSelectElement)?.value;
        const priority = parseInt((document.getElementById('priority') as HTMLSelectElement)?.value);
        const due_at = (document.getElementById('due_at') as HTMLInputElement)?.value;

        if (!title) {
          Swal.showValidationMessage('Title is required');
          return false;
        }

        return {
          title,
          description: description || undefined,
          status: status as any,
          category: category || undefined,
          priority,
          due_at: due_at || undefined
        };
      }
    });

    if (formValues && todo.id) {
      try {
        await updateTodoItem(todo.id, formValues);
        await fetchData();
        Toast.fire({
          icon: 'success',
          title: 'Todo updated successfully'
        });
      } catch (error) {
        Toast.fire({
          icon: 'error',
          title: 'Error updating todo'
        });
      }
    }
  };

  const handleDeleteTodo = async (todo: TodoItem) => {
    const result = await Modal.fire({
      title: 'Delete Todo',
      text: `Are you sure you want to delete "${todo.title}"?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Delete',
      confirmButtonColor: '#dc2626'
    });

    if (result.isConfirmed && todo.id) {
      try {
        await deleteTodoItem(todo.id);
        await fetchData();
        Toast.fire({
          icon: 'success',
          title: 'Todo deleted successfully'
        });
      } catch (error) {
        Toast.fire({
          icon: 'error',
          title: 'Error deleting todo'
        });
      }
    }
  };

  const handleToggleComplete = async (todo: TodoItem) => {
    if (!todo.id) return;
    
    const newStatus = todo.status === 'completed' ? 'in_progress' : 'completed';
    try {
      await updateTodoItem(todo.id, { status: newStatus });
      await fetchData();
      Toast.fire({
        icon: 'success',
        title: `Todo ${newStatus === 'completed' ? 'completed' : 'reopened'}`
      });
    } catch (error) {
      Toast.fire({
        icon: 'error',
        title: 'Error updating todo'
      });
    }
  };

  const getPriorityColor = (priority: number) => {
    switch (priority) {
      case 1: return 'text-red-600 bg-red-50 border-red-200';
      case 2: return 'text-orange-600 bg-orange-50 border-orange-200';
      case 3: return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 4: return 'text-blue-600 bg-blue-50 border-blue-200';
      case 5: return 'text-gray-600 bg-gray-50 border-gray-200';
      default: return 'text-blue-600 bg-blue-50 border-blue-200';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-600 bg-green-50 border-green-200';
      case 'in_progress': return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'canceled': return 'text-red-600 bg-red-50 border-red-200';
      default: return 'text-blue-600 bg-blue-50 border-blue-200';
    }
  };

  const isOverdue = (todo: TodoItem) => {
    return todo.due_at && new Date(todo.due_at) < new Date() && todo.status !== 'completed';
  };

  const stats = {
    total: todos.length,
    completed: todos.filter(t => t.status === 'completed').length,
    inProgress: todos.filter(t => t.status === 'in_progress').length,
    overdue: todos.filter(t => isOverdue(t)).length
  };

  return (
    <div className={`${darkMode ? 'bg-gray-800' : 'bg-gray-100'} rounded-xl shadow-lg p-4 sm:p-6 border ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div className="flex items-center">
          <div className="p-2 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-xl mr-3">
            <FaTasks className="text-white text-xl" />
          </div>
          <div>
            <h2 className={`text-xl sm:text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>To-Do Management</h2>
            <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Manage anxiety therapy tasks</p>
          </div>
        </div>
        <button
          onClick={handleCreateTodo}
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-[#800000] to-[#a00000] text-white rounded-xl hover:from-[#660000] hover:to-[#800000] transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 text-sm font-medium"
        >
          <FaPlus className="text-xs" />
          <span className="hidden sm:inline">Add Todo</span>
          <span className="sm:hidden">Add</span>
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <div className={`p-3 rounded-xl bg-gradient-to-br ${darkMode ? 'from-gray-700 to-gray-900' : 'from-gray-50 to-gray-100'} border border-blue-200 transition-all duration-300 hover:shadow-xl hover:scale-105 shadow-lg backdrop-blur-sm`}>
          <div className="flex items-center justify-between mb-2">
            <div>
              <p className={`text-xs font-medium ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Total Tasks</p>
              <h3 className={`text-xl font-bold mt-0.5 ${darkMode ? 'text-white' : 'text-gray-900'}`}>{stats.total}</h3>
            </div>
            <div className="p-1.5 bg-blue-500 rounded-lg">
              <FaTasks className="text-white text-sm" />
            </div>
          </div>
          <div className="relative">
            <div className="h-1 rounded-full bg-white/30 overflow-hidden">
              <div className="h-full rounded-full bg-blue-400 transition-all duration-500 shadow-sm" style={{ width: '100%' }}></div>
            </div>
          </div>
        </div>

        <div className={`p-3 rounded-xl bg-gradient-to-br ${darkMode ? 'from-gray-700 to-gray-900' : 'from-gray-50 to-gray-100'} border border-emerald-200 transition-all duration-300 hover:shadow-xl hover:scale-105 shadow-lg backdrop-blur-sm`}>
          <div className="flex items-center justify-between mb-2">
            <div>
              <p className={`text-xs font-medium ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Completed</p>
              <h3 className={`text-xl font-bold mt-0.5 ${darkMode ? 'text-white' : 'text-gray-900'}`}>{stats.completed}</h3>
            </div>
            <div className="p-1.5 bg-emerald-500 rounded-lg">
              <FaCheck className="text-white text-sm" />
            </div>
          </div>
          <div className="relative">
            <div className="h-1 rounded-full bg-white/30 overflow-hidden">
              <div className="h-full rounded-full bg-emerald-400 transition-all duration-500 shadow-sm" style={{ width: `${(stats.completed / stats.total) * 100}%` }}></div>
            </div>
          </div>
        </div>

        <div className={`p-3 rounded-xl bg-gradient-to-br ${darkMode ? 'from-gray-700 to-gray-900' : 'from-gray-50 to-gray-100'} border border-amber-200 transition-all duration-300 hover:shadow-xl hover:scale-105 shadow-lg backdrop-blur-sm`}>
          <div className="flex items-center justify-between mb-2">
            <div>
              <p className={`text-xs font-medium ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>In Progress</p>
              <h3 className={`text-xl font-bold mt-0.5 ${darkMode ? 'text-white' : 'text-gray-900'}`}>{stats.inProgress}</h3>
            </div>
            <div className="p-1.5 bg-amber-500 rounded-lg">
              <FaClock className="text-white text-sm" />
            </div>
          </div>
          <div className="relative">
            <div className="h-1 rounded-full bg-white/30 overflow-hidden">
              <div className="h-full rounded-full bg-amber-400 transition-all duration-500 shadow-sm" style={{ width: `${(stats.inProgress / stats.total) * 100}%` }}></div>
            </div>
          </div>
        </div>

        <div className={`p-3 rounded-xl bg-gradient-to-br ${darkMode ? 'from-gray-700 to-gray-900' : 'from-gray-50 to-gray-100'} border border-red-200 transition-all duration-300 hover:shadow-xl hover:scale-105 shadow-lg backdrop-blur-sm`}>
          <div className="flex items-center justify-between mb-2">
            <div>
              <p className={`text-xs font-medium ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Canceled</p>
              <h3 className={`text-xl font-bold mt-0.5 ${darkMode ? 'text-white' : 'text-gray-900'}`}>{todos.filter(t => t.status === 'canceled').length}</h3>
            </div>
            <div className="p-1.5 bg-red-500 rounded-lg">
              <FaExclamationTriangle className="text-white text-sm" />
            </div>
          </div>
          <div className="relative">
            <div className="h-1 rounded-full bg-white/30 overflow-hidden">
              <div className="h-full rounded-full bg-red-400 transition-all duration-500 shadow-sm" style={{ width: `${(todos.filter(t => t.status === 'canceled').length / stats.total) * 100}%` }}></div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="flex-1">
          <div className="relative">
            <FaSearch className={`absolute left-3 top-1/2 transform -translate-y-1/2 text-xs ${darkMode ? 'text-gray-400' : 'text-gray-400'}`} />
            <input
              type="text"
              placeholder="Search todos or users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`w-full pl-9 pr-4 py-2 text-sm border rounded-xl ${darkMode ? 'bg-gray-700/50 border-gray-600 text-white placeholder-gray-400' : 'bg-white border-gray-300 placeholder-gray-500'} focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200`}
            />
          </div>
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className={`px-3 py-2 text-sm border rounded-xl whitespace-nowrap ${darkMode ? 'bg-gray-700/50 border-gray-600 text-white' : 'bg-white border-gray-300'} focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
          >
            <option value="all">All Status</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="canceled">Canceled</option>
          </select>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className={`px-3 py-2 text-sm border rounded-xl whitespace-nowrap ${darkMode ? 'bg-gray-700/50 border-gray-600 text-white' : 'bg-white border-gray-300'} focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
          >
            <option value="all">All Categories</option>
            {TODO_CATEGORIES.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className={`px-3 py-2 text-sm border rounded-xl whitespace-nowrap ${darkMode ? 'bg-gray-700/50 border-gray-600 text-white' : 'bg-white border-gray-300'} focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
          >
            <option value="all">All Priorities</option>
            <option value="1">Urgent</option>
            <option value="2">High</option>
            <option value="3">Medium</option>
            <option value="4">Low</option>
            <option value="5">Very Low</option>
          </select>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className={`p-4 rounded-xl ${darkMode ? 'bg-gray-700/30' : 'bg-gray-100/30'} animate-pulse`}>
              <div className={`h-4 ${darkMode ? 'bg-gray-600' : 'bg-gray-300'} rounded mb-3`}></div>
              <div className={`h-3 ${darkMode ? 'bg-gray-600' : 'bg-gray-300'} rounded mb-2 w-3/4`}></div>
              <div className={`h-3 ${darkMode ? 'bg-gray-600' : 'bg-gray-300'} rounded w-1/2`}></div>
            </div>
          ))}
        </div>
      ) : filteredTodos.length === 0 ? (
        <div className="text-center py-12">
          <div className="p-4 bg-gradient-to-r from-gray-100 to-gray-200 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
            <FaTasks className={`text-2xl ${darkMode ? 'text-gray-600' : 'text-gray-400'}`} />
          </div>
          <div className={`text-lg font-medium ${darkMode ? 'text-gray-300' : 'text-gray-600'} mb-2`}>
            {todos.length === 0 ? 'No todos yet' : 'No todos match filters'}
          </div>
          <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            {todos.length === 0 ? 'Create your first todo to get started!' : 'Try adjusting your search or filters.'}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
          {filteredTodos.map((todo) => (
            <div
              key={todo.id}
              className={`group relative p-4 rounded-xl border transition-all duration-200 hover:shadow-lg hover:-translate-y-1 ${
                darkMode ? 'bg-gray-700/50 border-gray-600 hover:bg-gray-700' : 'bg-white border-gray-200 hover:shadow-xl'
              } ${isOverdue(todo) ? 'ring-2 ring-red-500/20 border-red-300' : ''}`}
            >
              {todo.category && (
                <div className={`absolute -top-2 left-4 px-2 py-1 rounded-full text-xs font-medium shadow-sm ${getCategoryColor(todo.category)}`}>
                  {todo.category}
                </div>
              )}

              <div className="flex items-start justify-between mb-3 mt-2">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <button
                    onClick={() => handleToggleComplete(todo)}
                    className={`flex items-center justify-center w-5 h-5 rounded border-2 transition-all duration-200 flex-shrink-0 ${
                      todo.status === 'completed'
                        ? 'bg-green-500 border-green-500 text-white scale-110'
                        : 'border-gray-300 hover:border-green-500 hover:bg-green-50'
                    }`}
                  >
                    {todo.status === 'completed' && <FaCheck className="text-xs" />}
                  </button>
                  <h3 className={`font-semibold text-sm leading-tight truncate ${
                    darkMode ? 'text-white' : 'text-gray-900'
                  } ${todo.status === 'completed' ? 'line-through opacity-60' : ''}`}>
                    {todo.title}
                  </h3>
                </div>
                <div className={`px-2 py-1 rounded text-xs font-medium flex items-center gap-1 ${getPriorityColor(todo.priority)}`}>
                  <FaFlag className="text-xs" />
                  <span className="hidden sm:inline">{PRIORITY_LABELS[todo.priority]}</span>
                </div>
              </div>

              {isOverdue(todo) && (
                <div className="flex items-center gap-2 mb-3 p-2 bg-red-50 border border-red-200 rounded-lg">
                  <FaExclamationTriangle className="text-red-500 text-xs" />
                  <span className="text-red-700 text-xs font-medium">Overdue</span>
                </div>
              )}

              {todo.description && (
                <p className={`text-xs leading-relaxed mb-3 ${
                  darkMode ? 'text-gray-300' : 'text-gray-600'
                } ${todo.status === 'completed' ? 'line-through opacity-60' : ''}`}>
                  {todo.description.length > 100 ? `${todo.description.substring(0, 100)}...` : todo.description}
                </p>
              )}

              <div className="flex items-center justify-between mb-3">
                <span className={`px-2 py-1 text-xs rounded-full font-medium ${getStatusColor(todo.status)}`}>
                  {STATUS_LABELS[todo.status]}
                </span>
              </div>

              <div className="space-y-2 pt-3 border-t border-gray-200/50">
                {todo.due_at && (
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <FaCalendarAlt className="text-xs" />
                    <span>Due: {new Date(todo.due_at).toLocaleDateString()}</span>
                  </div>
                )}
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <FaUser className="text-xs" />
                  <span className="truncate">{todo.profiles?.full_name || getUserName(todo.profile_id)}</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <FaClock className="text-xs" />
                  <span>Created: {new Date(todo.created_at!).toLocaleDateString()}</span>
                </div>
              </div>

              <div className="absolute top-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                <button
                  onClick={() => handleEditTodo(todo)}
                  className={`p-1.5 rounded-lg text-xs transition-colors ${
                    darkMode 
                      ? 'text-blue-400 hover:bg-blue-900/50 hover:text-blue-300' 
                      : 'text-blue-600 hover:bg-blue-50 hover:text-blue-700'
                  }`}
                  title="Edit todo"
                >
                  <FaEdit />
                </button>
                <button
                  onClick={() => handleDeleteTodo(todo)}
                  className={`p-1.5 rounded-lg text-xs transition-colors ${
                    darkMode 
                      ? 'text-red-400 hover:bg-red-900/50 hover:text-red-300' 
                      : 'text-red-600 hover:bg-red-50 hover:text-red-700'
                  }`}
                  title="Delete todo"
                >
                  <FaTrash />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TodoList; 