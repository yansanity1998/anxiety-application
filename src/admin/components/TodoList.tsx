import { useState, useEffect } from 'react';
import { FaTasks, FaPlus, FaEdit, FaTrash, FaCheck, FaClock, FaExclamationTriangle, FaSearch, FaCalendarAlt, FaUser, FaFlag, FaTimes } from 'react-icons/fa';
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
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingTodo, setEditingTodo] = useState<TodoItem | null>(null);
  const [editFormData, setEditFormData] = useState({
    title: '',
    description: '',
    status: 'in_progress' as TodoItem['status'],
    category: '',
    priority: 3 as 1 | 2 | 3 | 4 | 5,
    due_at: ''
  });

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

  // Modern confirmation dialog with dark mode support
  const showConfirmDialog = (title: string, message: string, confirmText = 'Confirm', cancelText = 'Cancel'): Promise<boolean> => {
    return new Promise((resolve) => {
      const confirmDiv = document.createElement('div');
      confirmDiv.className = 'fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[9999] overflow-y-auto';
      document.body.style.overflow = 'hidden';
      confirmDiv.innerHTML = `
        <div class="${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-2xl p-6 max-w-sm mx-4 shadow-2xl">
          <div class="text-center">
            <div class="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
              <svg class="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16c-.77.833.192 2.5 1.732 2.5z"/>
              </svg>
            </div>
            <h3 class="text-lg font-medium ${darkMode ? 'text-white' : 'text-gray-900'} mb-2">${title}</h3>
            <p class="text-sm ${darkMode ? 'text-gray-300' : 'text-gray-500'} mb-6">${message}</p>
            <div class="flex space-x-3">
              <button id="cancelBtn" class="flex-1 ${darkMode ? 'bg-gray-700 text-gray-200 hover:bg-gray-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'} px-4 py-2 rounded-xl font-medium transition-colors">${cancelText}</button>
              <button id="confirmBtn" class="flex-1 bg-red-500 text-white px-4 py-2 rounded-xl font-medium hover:bg-red-600 transition-colors">${confirmText}</button>
            </div>
          </div>
        </div>
      `;
      
      document.body.appendChild(confirmDiv);
      
      const cancelBtn = confirmDiv.querySelector('#cancelBtn');
      const confirmBtn = confirmDiv.querySelector('#confirmBtn');
      
      cancelBtn?.addEventListener('click', () => {
        document.body.style.overflow = '';
        confirmDiv.remove();
        resolve(false);
      });
      confirmBtn?.addEventListener('click', () => {
        document.body.style.overflow = '';
        confirmDiv.remove();
        resolve(true);
      });
    });
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    filterTodos();
  }, [todos, searchTerm, statusFilter, categoryFilter, priorityFilter]);

  // Manage body overflow when modal is open
  useEffect(() => {
    if (showEditModal) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [showEditModal]);

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
            <input type="text" id="title" class="w-full p-3 border rounded-lg ${darkMode ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-gray-500 focus:ring-gray-500' : 'bg-white border-gray-300 placeholder-gray-500 focus:border-blue-500 focus:ring-blue-500'}" placeholder="Enter todo title" required>
          </div>
          <div>
            <label class="block text-sm font-medium ${darkMode ? 'text-gray-200' : 'text-gray-700'} mb-1">Description</label>
            <textarea id="description" class="w-full p-3 border rounded-lg ${darkMode ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-gray-500 focus:ring-gray-500' : 'bg-white border-gray-300 placeholder-gray-500 focus:border-blue-500 focus:ring-blue-500'}" rows="3" placeholder="Enter description"></textarea>
          </div>
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium ${darkMode ? 'text-gray-200' : 'text-gray-700'} mb-1">Category</label>
              <select id="category" class="w-full p-3 border rounded-lg ${darkMode ? 'bg-gray-700 border-gray-600 text-white focus:border-gray-500 focus:ring-gray-500' : 'bg-white border-gray-300 focus:border-blue-500 focus:ring-blue-500'}">
                <option value="">Select category</option>
                ${TODO_CATEGORIES.map(cat => `<option value="${cat}">${cat}</option>`).join('')}
              </select>
            </div>
            <div>
              <label class="block text-sm font-medium ${darkMode ? 'text-gray-200' : 'text-gray-700'} mb-1">Priority</label>
              <select id="priority" class="w-full p-3 border rounded-lg ${darkMode ? 'bg-gray-700 border-gray-600 text-white focus:border-gray-500 focus:ring-gray-500' : 'bg-white border-gray-300 focus:border-blue-500 focus:ring-blue-500'}">
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
            <input type="datetime-local" id="due_at" class="w-full p-3 border rounded-lg ${darkMode ? 'bg-gray-700 border-gray-600 text-white focus:border-gray-500 focus:ring-gray-500' : 'bg-white border-gray-300 focus:border-blue-500 focus:ring-blue-500'}">
          </div>
          <div>
            <label class="block text-sm font-medium ${darkMode ? 'text-gray-200' : 'text-gray-700'} mb-1">Assign to User *</label>
            <select id="profile_id" class="w-full p-3 border rounded-lg ${darkMode ? 'bg-gray-700 border-gray-600 text-white focus:border-gray-500 focus:ring-gray-500' : 'bg-white border-gray-300 focus:border-blue-500 focus:ring-blue-500'}" required>
              <option value="">Select a user</option>
              ${users.map(user => `<option value="${user.id}">${user.full_name || user.email} (${user.role})</option>`).join('')}
            </select>
          </div>
        </div>
      `,
      background: darkMode ? '#1f2937' : '#ffffff',
      color: darkMode ? '#f3f4f6' : '#111827',
      showCancelButton: true,
      confirmButtonText: 'Create Todo',
      cancelButtonText: 'Cancel',
      width: '500px',
      scrollbarPadding: false,
      customClass: {
        popup: `rounded-xl shadow-xl border ${darkMode ? 'border-gray-700' : 'border-gray-200'}`,
        title: `text-lg font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`,
        confirmButton: 'bg-[#800000] hover:bg-[#660000] text-white font-medium py-2 px-4 rounded-lg',
        cancelButton: `${darkMode ? 'bg-gray-700 border-gray-600 text-gray-200 hover:bg-gray-600' : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'} border font-medium py-2 px-4 rounded-lg`
      },
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
    setEditingTodo(todo);
    setEditFormData({
      title: todo.title,
      description: todo.description || '',
      status: todo.status,
      category: todo.category || '',
      priority: todo.priority,
      due_at: todo.due_at ? new Date(todo.due_at).toISOString().slice(0, 16) : ''
    });
    setShowEditModal(true);
  };

  const handleUpdateTodo = async () => {
    if (!editFormData.title) {
      Toast.fire({
        icon: 'warning',
        title: 'Title is required'
      });
      return;
    }

    if (editingTodo && editingTodo.id) {
      try {
        await updateTodoItem(editingTodo.id, {
          title: editFormData.title,
          description: editFormData.description || undefined,
          status: editFormData.status,
          category: editFormData.category || undefined,
          priority: editFormData.priority,
          due_at: editFormData.due_at || undefined
        });
        await fetchData();
        setShowEditModal(false);
        setEditingTodo(null);
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
    const confirmed = await showConfirmDialog(
      'Delete Todo',
      `Are you sure you want to delete "${todo.title}"?`,
      'Delete',
      'Cancel'
    );

    if (confirmed && todo.id) {
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
              className={`w-full pl-9 pr-4 py-2 text-sm border rounded-xl ${darkMode ? 'bg-gray-700/50 border-gray-600 text-white placeholder-gray-400' : 'bg-white border-gray-300 placeholder-gray-500'} focus:ring-2 focus:ring-red-800 focus:border-transparent focus:outline-none transition-all duration-200`}
            />
          </div>
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className={`px-3 py-2 text-sm border rounded-xl whitespace-nowrap ${darkMode ? 'bg-gray-700/50 border-gray-600 text-white' : 'bg-white border-gray-300'} focus:ring-2 focus:ring-red-800 focus:border-transparent focus:outline-none`}
          >
            <option value="all">All Status</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="canceled">Canceled</option>
          </select>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className={`px-3 py-2 text-sm border rounded-xl whitespace-nowrap ${darkMode ? 'bg-gray-700/50 border-gray-600 text-white' : 'bg-white border-gray-300'} focus:ring-2 focus:ring-red-800 focus:border-transparent focus:outline-none`}
          >
            <option value="all">All Categories</option>
            {TODO_CATEGORIES.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className={`px-3 py-2 text-sm border rounded-xl whitespace-nowrap ${darkMode ? 'bg-gray-700/50 border-gray-600 text-white' : 'bg-white border-gray-300'} focus:ring-2 focus:ring-red-800 focus:border-transparent focus:outline-none`}
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
              className={`group relative p-4 rounded-xl border transition-all duration-200 hover:shadow-lg hover:-translate-y-1 flex flex-col ${
                darkMode ? 'bg-gray-700/50 border-gray-600 hover:bg-gray-700' : 'bg-white border-gray-200 hover:shadow-xl'
              } ${isOverdue(todo) ? 'ring-2 ring-red-500/20 border-red-300' : ''}`}
            >
              {todo.category && (
                <div className={`absolute -top-2 left-4 px-2 py-1 rounded-full text-xs font-medium shadow-sm ${getCategoryColor(todo.category)}`}>
                  {todo.category}
                </div>
              )}

              {/* Card Header */}
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
                <div className="flex items-center gap-2">
                  <div className={`px-2 py-1 rounded text-xs font-medium flex items-center gap-1 ${getPriorityColor(todo.priority)}`}>
                    <FaFlag className="text-xs" />
                    <span className="hidden sm:inline">{PRIORITY_LABELS[todo.priority]}</span>
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
              </div>

              {/* Card Content - Flexible */}
              <div className="flex-1 flex flex-col">
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
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit Todo Modal */}
      {showEditModal && editingTodo && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[9999] p-4 overflow-y-auto">
          <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-2xl w-full max-w-md max-h-[80vh] overflow-y-auto`}>
            <div className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  Edit Todo
                </h3>
                <button
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingTodo(null);
                  }}
                  className={`p-1.5 rounded-lg transition-colors ${
                    darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
                  }`}
                >
                  <FaTimes className={`${darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                </button>
              </div>
              
              <div className="space-y-3">
                <div>
                  <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={editFormData.title}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, title: e.target.value }))}
                    className={`w-full px-3 py-2 rounded-lg border transition-colors ${
                      darkMode 
                        ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-[#800000]' 
                        : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-[#800000]'
                    } focus:outline-none focus:ring-2 focus:ring-[#800000]/20`}
                    placeholder="Enter todo title"
                  />
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Description
                  </label>
                  <textarea
                    value={editFormData.description}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, description: e.target.value }))}
                    rows={3}
                    className={`w-full px-3 py-2 rounded-lg border transition-colors resize-none ${
                      darkMode 
                        ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-[#800000]' 
                        : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-[#800000]'
                    } focus:outline-none focus:ring-2 focus:ring-[#800000]/20`}
                    placeholder="Enter description"
                  />
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      Status
                    </label>
                    <select
                      value={editFormData.status}
                      onChange={(e) => setEditFormData(prev => ({ ...prev, status: e.target.value as TodoItem['status'] }))}
                      className={`w-full px-3 py-2 rounded-lg border transition-colors ${
                        darkMode 
                          ? 'bg-gray-700 border-gray-600 text-white focus:border-[#800000]' 
                          : 'bg-white border-gray-300 text-gray-900 focus:border-[#800000]'
                      } focus:outline-none focus:ring-2 focus:ring-[#800000]/20`}
                    >
                      <option value="in_progress">In Progress</option>
                      <option value="completed">Completed</option>
                      <option value="canceled">Canceled</option>
                    </select>
                  </div>

                  <div>
                    <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      Category
                    </label>
                    <select
                      value={editFormData.category}
                      onChange={(e) => setEditFormData(prev => ({ ...prev, category: e.target.value }))}
                      className={`w-full px-3 py-2 rounded-lg border transition-colors ${
                        darkMode 
                          ? 'bg-gray-700 border-gray-600 text-white focus:border-[#800000]' 
                          : 'bg-white border-gray-300 text-gray-900 focus:border-[#800000]'
                      } focus:outline-none focus:ring-2 focus:ring-[#800000]/20`}
                    >
                      <option value="">Select category</option>
                      {TODO_CATEGORIES.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      Priority
                    </label>
                    <select
                      value={editFormData.priority}
                      onChange={(e) => setEditFormData(prev => ({ ...prev, priority: parseInt(e.target.value) as 1 | 2 | 3 | 4 | 5 }))}
                      className={`w-full px-3 py-2 rounded-lg border transition-colors ${
                        darkMode 
                          ? 'bg-gray-700 border-gray-600 text-white focus:border-[#800000]' 
                          : 'bg-white border-gray-300 text-gray-900 focus:border-[#800000]'
                      } focus:outline-none focus:ring-2 focus:ring-[#800000]/20`}
                    >
                      <option value="1">Urgent</option>
                      <option value="2">High</option>
                      <option value="3">Medium</option>
                      <option value="4">Low</option>
                      <option value="5">Very Low</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Due Date
                  </label>
                  <input
                    type="datetime-local"
                    value={editFormData.due_at}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, due_at: e.target.value }))}
                    className={`w-full px-3 py-2 rounded-lg border transition-colors ${
                      darkMode 
                        ? 'bg-gray-700 border-gray-600 text-white focus:border-[#800000]' 
                        : 'bg-white border-gray-300 text-gray-900 focus:border-[#800000]'
                    } focus:outline-none focus:ring-2 focus:ring-[#800000]/20`}
                  />
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Assigned User
                  </label>
                  <select
                    value={editingTodo.profile_id}
                    disabled
                    className={`w-full px-3 py-2 rounded-lg border transition-colors opacity-60 cursor-not-allowed ${
                      darkMode 
                        ? 'bg-gray-700 border-gray-600 text-white' 
                        : 'bg-white border-gray-300 text-gray-900'
                    }`}
                  >
                    {users.map(user => (
                      <option key={user.id} value={user.id}>
                        {user.full_name || user.email} ({user.role})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex gap-3 mt-4">
                <button
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingTodo(null);
                  }}
                  className={`flex-1 px-4 py-2 rounded-lg border transition-colors font-medium ${
                    darkMode 
                      ? 'border-gray-600 text-gray-300 hover:bg-gray-700' 
                      : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpdateTodo}
                  className="flex-1 px-4 py-2 rounded-lg transition-colors font-medium text-white bg-blue-600 hover:bg-blue-700"
                >
                  Update Todo
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TodoList; 