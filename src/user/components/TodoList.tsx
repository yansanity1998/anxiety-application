import { useState, useEffect } from 'react';
import { FaTasks, FaCheck, FaClock, FaExclamationTriangle, FaCalendarAlt, FaFlag, FaPause, FaUndo, FaPlus, FaTimes } from 'react-icons/fa';
import { getTodoItems, updateTodoItem, getTodoStats, createTodoItem, TODO_CATEGORIES, PRIORITY_LABELS, STATUS_LABELS, type TodoItem } from '../../lib/todoService';
import { supabase } from '../../lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';

interface TodoListProps {
	darkMode?: boolean;
}

const StudentTodoList = ({ darkMode = false }: TodoListProps) => {
	const [todos, setTodos] = useState<TodoItem[]>([]);
	const [filteredTodos, setFilteredTodos] = useState<TodoItem[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [userProfile, setUserProfile] = useState<any>(null);
	const [statusFilter, setStatusFilter] = useState<string>('all');
	const [categoryFilter, setCategoryFilter] = useState<string>('all');
	const [stats, setStats] = useState({ total: 0, completed: 0, inProgress: 0, overdue: 0 });
	const [statusModalOpen, setStatusModalOpen] = useState(false);
	const [categoryModalOpen, setCategoryModalOpen] = useState(false);
	const [showCreateModal, setShowCreateModal] = useState(false);
	const [createFormData, setCreateFormData] = useState({
		title: '',
		description: '',
		category: '',
		priority: 3 as 1 | 2 | 3 | 4 | 5,
		due_at: ''
	});
	const [isSubmitting, setIsSubmitting] = useState(false);

	useEffect(() => {
		fetchUserAndTodos();
	}, []);

	useEffect(() => {
		filterTodos();
	}, [todos, statusFilter, categoryFilter]);

	const fetchUserAndTodos = async () => {
		try {
			setIsLoading(true);
			
			// Get current user session
			const { data: { session } } = await supabase.auth.getSession();
			if (!session) return;

			// Get user profile
			const { data: profile } = await supabase
				.from('profiles')
				.select('*')
				.eq('user_id', session.user.id)
				.single();

			if (profile) {
				setUserProfile(profile);
				
				// Fetch user's todos
				const userTodos = await getTodoItems(profile.id);
				setTodos(userTodos);
				
				// Calculate stats
				const todoStats = await getTodoStats(profile.id);
				setStats(todoStats);
			}
		} catch (error) {
			console.error('Error fetching todos:', error);
		} finally {
			setIsLoading(false);
		}
	};

	const filterTodos = () => {
		let filtered = [...todos];

		// Status filter
		if (statusFilter !== 'all') {
			filtered = filtered.filter(todo => todo.status === statusFilter);
		}

		// Category filter
		if (categoryFilter !== 'all') {
			filtered = filtered.filter(todo => todo.category === categoryFilter);
		}

		setFilteredTodos(filtered);
	};

	const handleStatusUpdate = async (todoId: number, newStatus: string) => {
		try {
			await updateTodoItem(todoId, { status: newStatus as any });
			await fetchUserAndTodos(); // Refresh data
		} catch (error) {
			console.error('Error updating todo status:', error);
		}
	};

	const handleCreateTask = async () => {
		if (!createFormData.title.trim()) {
			alert('Please enter a task title');
			return;
		}

		if (!userProfile) {
			alert('User profile not found');
			return;
		}

		try {
			setIsSubmitting(true);
			await createTodoItem({
				profile_id: userProfile.id,
				title: createFormData.title.trim(),
				description: createFormData.description.trim() || undefined,
				category: createFormData.category || undefined,
				priority: createFormData.priority,
				due_at: createFormData.due_at || undefined
			});

			// Reset form and close modal
			setCreateFormData({
				title: '',
				description: '',
				category: '',
				priority: 3,
				due_at: ''
			});
			setShowCreateModal(false);

			// Refresh todos
			await fetchUserAndTodos();
		} catch (error) {
			console.error('Error creating task:', error);
			alert('Failed to create task. Please try again.');
		} finally {
			setIsSubmitting(false);
		}
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

	const getPriorityColor = (priority: number) => {
		switch (priority) {
			case 1: return 'text-red-600 bg-red-50 border-red-200';
			case 2: return 'text-orange-600 bg-orange-50 border-orange-200';
			case 3: return 'text-yellow-600 bg-yellow-50 border-yellow-200';
			case 4: return 'text-blue-600 bg-blue-50 border-blue-200';
			case 5: return 'text-gray-600 bg-gray-50 border-gray-200';
			default: return 'text-blue-600 bg-blue-50 border-blue-200'; // Default to in_progress styling
		}
	};

	const getStatusColor = (status: string) => {
		switch (status) {
			case 'completed': return 'text-green-600 bg-green-50 border-green-200';
			case 'in_progress': return 'text-blue-600 bg-blue-50 border-blue-200';
			case 'canceled': return 'text-red-600 bg-red-50 border-red-200';
			default: return 'text-blue-600 bg-blue-50 border-blue-200'; // Default to in_progress styling
		}
	};

	const isOverdue = (todo: TodoItem) => {
		return todo.due_at && new Date(todo.due_at) < new Date() && todo.status !== 'completed';
	};

	if (isLoading) {
		return (
			<div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-lg p-4 sm:p-6 border ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
				<div className="animate-pulse">
					<div className="flex items-center mb-6">
						<div className={`w-12 h-12 ${darkMode ? 'bg-gray-700' : 'bg-gray-200'} rounded-xl mr-3`}></div>
						<div className="flex-1">
							<div className={`h-6 ${darkMode ? 'bg-gray-700' : 'bg-gray-200'} rounded mb-2 w-48`}></div>
							<div className={`h-4 ${darkMode ? 'bg-gray-700' : 'bg-gray-200'} rounded w-32`}></div>
						</div>
					</div>
					<div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
						{[1, 2, 3, 4, 5, 6].map((i) => (
							<div key={i} className={`p-4 rounded-xl ${darkMode ? 'bg-gray-700/30' : 'bg-gray-100/30'}`}>
								<div className={`h-4 ${darkMode ? 'bg-gray-600' : 'bg-gray-300'} rounded mb-3`}></div>
								<div className={`h-3 ${darkMode ? 'bg-gray-600' : 'bg-gray-300'} rounded mb-2 w-3/4`}></div>
								<div className={`h-3 ${darkMode ? 'bg-gray-600' : 'bg-gray-300'} rounded w-1/2`}></div>
							</div>
						))}
					</div>
				</div>
			</div>
		);
	}

	return (
		<div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-lg p-4 sm:p-6 border ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
			{/* Header */}
			<div className="flex flex-col gap-4 mb-6">
				<div className="flex items-center justify-between">
					<div className="flex items-center min-w-0 flex-1">
						<div className="p-2 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-xl mr-3 flex-shrink-0">
							<FaTasks className="text-white text-lg sm:text-xl" />
						</div>
						<div className="min-w-0 flex-1">
							<h2 className={`text-lg sm:text-xl md:text-2xl font-bold truncate ${darkMode ? 'text-white' : 'text-gray-900'}`}>My To-Do List</h2>
							<p className={`text-xs sm:text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'} truncate`}>Track your anxiety therapy tasks</p>
						</div>
					</div>
					<button
						onClick={() => setShowCreateModal(true)}
						className="flex items-center justify-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 bg-gradient-to-r from-emerald-500 to-green-600 text-white rounded-xl hover:from-emerald-600 hover:to-green-700 transition-all duration-200 shadow-lg hover:shadow-xl active:scale-95 sm:hover:scale-105 text-xs sm:text-sm font-medium flex-shrink-0 whitespace-nowrap"
					>
						<FaPlus className="text-xs" />
						<span className="hidden sm:inline">Add Task</span>
						<span className="sm:hidden">Add</span>
					</button>
				</div>
				<div className={`text-xs sm:text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'} bg-gradient-to-r from-green-50 to-emerald-50 px-3 py-2 rounded-xl border border-green-200 text-center`}>
					<span className="font-semibold text-green-700">{stats.completed}</span>
					<span className="text-green-600"> of </span>
					<span className="font-semibold text-green-700">{stats.total}</span>
					<span className="text-green-600"> completed</span>
				</div>
			</div>

			{/* Filters */}
			<div className="flex flex-col sm:flex-row gap-3 mb-6">
				{/* Mobile: bottom-sheet buttons */}
				<div className="grid grid-cols-2 gap-3 sm:hidden">
					<button
						onClick={() => setStatusModalOpen(true)}
						className={`px-3 py-2 text-sm border rounded-xl text-left ${darkMode ? 'bg-gray-700/50 border-gray-600 text-white' : 'bg-white border-gray-300'} focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200`}
						aria-haspopup="dialog"
						aria-expanded={statusModalOpen}
					>
						{statusFilter === 'all' ? 'All Status' : STATUS_LABELS[statusFilter as keyof typeof STATUS_LABELS]}
					</button>
					<button
						onClick={() => setCategoryModalOpen(true)}
						className={`px-3 py-2 text-sm border rounded-xl text-left ${darkMode ? 'bg-gray-700/50 border-gray-600 text-white' : 'bg-white border-gray-300'} focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200`}
						aria-haspopup="dialog"
						aria-expanded={categoryModalOpen}
					>
						{categoryFilter === 'all' ? 'All Categories' : categoryFilter}
					</button>
				</div>

				{/* Desktop: native selects */}
				<div className="hidden sm:flex gap-3 w-full">
					<select
						value={statusFilter}
						onChange={(e) => setStatusFilter(e.target.value)}
						className={`px-3 py-2 text-sm border rounded-xl ${darkMode ? 'bg-gray-700/50 border-gray-600 text-white' : 'bg-white border-gray-300'} focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200`}
					>
						<option value="all">All Status</option>
						<option value="in_progress">In Progress</option>
						<option value="completed">Completed</option>
						<option value="canceled">Canceled</option>
					</select>
					<select
						value={categoryFilter}
						onChange={(e) => setCategoryFilter(e.target.value)}
						className={`px-3 py-2 text-sm border rounded-xl ${darkMode ? 'bg-gray-700/50 border-gray-600 text-white' : 'bg-white border-gray-300'} focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200`}
					>
						<option value="all">All Categories</option>
						{TODO_CATEGORIES.map(cat => (
							<option key={cat} value={cat}>{cat}</option>
						))}
					</select>
				</div>
			</div>

			{/* Status Bottom Sheet (Mobile) */}
			<AnimatePresence>
				{statusModalOpen && (
					<motion.div 
						className="fixed inset-0 z-50 sm:hidden"
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						exit={{ opacity: 0 }}
					>
						<div 
							className="absolute inset-0 bg-black/40"
							onClick={() => setStatusModalOpen(false)}
						/>
						<motion.div
							className={`absolute bottom-0 left-0 right-0 bg-white ${darkMode ? 'bg-gray-800 text-white' : 'text-gray-900'} rounded-t-2xl p-4 border-t ${darkMode ? 'border-gray-700' : 'border-gray-200'} max-h-[75vh] overflow-y-auto`}
							initial={{ y: '100%' }}
							animate={{ y: 0 }}
							exit={{ y: '100%' }}
							transition={{ type: 'spring', stiffness: 300, damping: 30 }}
						>
							<div className="mb-3 text-sm font-semibold">Status</div>
							<div className="space-y-2">
								{[
									{ value: 'all', label: 'All Status' },
									{ value: 'in_progress', label: 'In Progress' },
									{ value: 'completed', label: 'Completed' },
									{ value: 'canceled', label: 'Canceled' }
								].map(opt => (
									<button
										key={opt.value}
										onClick={() => { setStatusFilter(opt.value); setStatusModalOpen(false); }}
										className={`w-full text-left px-3 py-2 rounded-xl border ${darkMode ? 'border-gray-600 hover:bg-gray-700' : 'border-gray-200 hover:bg-gray-50'} ${statusFilter === opt.value ? 'ring-2 ring-blue-500' : ''}`}
									>
										{opt.label}
									</button>
								))}
							</div>
						</motion.div>
					</motion.div>
				)}
			</AnimatePresence>

			{/* Category Bottom Sheet (Mobile) */}
			<AnimatePresence>
				{categoryModalOpen && (
					<motion.div 
						className="fixed inset-0 z-50 sm:hidden"
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						exit={{ opacity: 0 }}
					>
						<div 
							className="absolute inset-0 bg-black/40"
							onClick={() => setCategoryModalOpen(false)}
						/>
						<motion.div
							className={`absolute bottom-0 left-0 right-0 bg-white ${darkMode ? 'bg-gray-800 text-white' : 'text-gray-900'} rounded-t-2xl p-4 border-t ${darkMode ? 'border-gray-700' : 'border-gray-200'} max-h-[75vh] overflow-y-auto`}
							initial={{ y: '100%' }}
							animate={{ y: 0 }}
							exit={{ y: '100%' }}
							transition={{ type: 'spring', stiffness: 300, damping: 30 }}
						>
							<div className="mb-3 text-sm font-semibold">Category</div>
							<div className="space-y-2">
								<button
									onClick={() => { setCategoryFilter('all'); setCategoryModalOpen(false); }}
									className={`w-full text-left px-3 py-2 rounded-xl border ${darkMode ? 'border-gray-600 hover:bg-gray-700' : 'border-gray-200 hover:bg-gray-50'} ${categoryFilter === 'all' ? 'ring-2 ring-blue-500' : ''}`}
								>
									All Categories
								</button>
								{TODO_CATEGORIES.map(cat => (
									<button
										key={cat}
										onClick={() => { setCategoryFilter(cat); setCategoryModalOpen(false); }}
										className={`w-full text-left px-3 py-2 rounded-xl border ${darkMode ? 'border-gray-600 hover:bg-gray-700' : 'border-gray-200 hover:bg-gray-50'} ${categoryFilter === cat ? 'ring-2 ring-blue-500' : ''}`}
									>
										{cat}
									</button>
								))}
							</div>
						</motion.div>
					</motion.div>
				)}
			</AnimatePresence>

			{/* Todo Grid */}
			{filteredTodos.length === 0 ? (
				<div className="text-center py-12">
					<div className="p-4 bg-gradient-to-r from-blue-100 to-cyan-100 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
						<FaTasks className={`text-2xl ${darkMode ? 'text-blue-600' : 'text-blue-500'}`} />
					</div>
					<div className={`text-lg font-medium ${darkMode ? 'text-gray-300' : 'text-gray-600'} mb-2`}>
						{todos.length === 0 ? 'No tasks assigned yet' : 'No tasks match filters'}
					</div>
					<div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
						{todos.length === 0 ? 'Your counselor will assign tasks to help with anxiety management.' : 'Try adjusting your filters to see more tasks.'}
					</div>
				</div>
			) : (
				<div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
					<AnimatePresence>
						{filteredTodos.map((todo) => (
							<motion.div
								key={todo.id}
								layout
								initial={{ opacity: 0, y: 20 }}
								animate={{ opacity: 1, y: 0 }}
								exit={{ opacity: 0, y: -20 }}
								className={`group relative p-4 rounded-xl border transition-all duration-200 hover:shadow-lg hover:-translate-y-1 ${
									darkMode ? 'bg-gray-700/50 border-gray-600 hover:bg-gray-700' : 'bg-white border-gray-200 hover:shadow-xl'
								} ${isOverdue(todo) ? 'ring-2 ring-red-500/20 border-red-300' : ''}`}
							>
								{/* Category Tag */}
								{todo.category && (
									<div className={`absolute -top-2 left-4 px-2 py-1 rounded-full text-xs font-medium shadow-sm ${getCategoryColor(todo.category)}`}>
										{todo.category}
									</div>
								)}

								{/* Header */}
								<div className="flex items-start justify-between mb-3 mt-2">
									<div className="flex items-center gap-2 flex-1 min-w-0">
										<button
											onClick={() => {
												const newStatus = todo.status === 'completed' ? 'in_progress' : 'completed';
												handleStatusUpdate(todo.id!, newStatus);
											}}
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
									
									{/* Priority Badge */}
									<div className={`px-2 py-1 rounded text-xs font-medium flex items-center gap-1 ${getPriorityColor(todo.priority)}`}>
										<FaFlag className="text-xs" />
										<span className="hidden sm:inline">{PRIORITY_LABELS[todo.priority]}</span>
									</div>
								</div>

								{/* Overdue Warning */}
								{isOverdue(todo) && (
									<div className="flex items-center gap-2 mb-3 p-2 bg-red-50 border border-red-200 rounded-lg">
										<FaExclamationTriangle className="text-red-500 text-xs" />
										<span className="text-red-700 text-xs font-medium">Overdue</span>
									</div>
								)}

								{/* Description */}
								{todo.description && (
									<p className={`text-xs leading-relaxed mb-3 ${
										darkMode ? 'text-gray-300' : 'text-gray-600'
									} ${todo.status === 'completed' ? 'line-through opacity-60' : ''}`}>
										{todo.description.length > 100 ? `${todo.description.substring(0, 100)}...` : todo.description}
									</p>
								)}

								{/* Status Badge */}
								<div className="flex items-center justify-between mb-3">
									<span className={`px-2 py-1 text-xs rounded-full font-medium ${getStatusColor(todo.status)}`}>
										{STATUS_LABELS[todo.status]}
									</span>
								</div>

								{/* Footer Info */}
								<div className="space-y-2 pt-3 border-t border-gray-200/50">
									{todo.due_at && (
										<div className="flex items-center gap-2 text-xs text-gray-500">
											<FaCalendarAlt className="text-xs" />
											<span>Due: {new Date(todo.due_at).toLocaleDateString()}</span>
										</div>
									)}
									<div className="flex items-center gap-2 text-xs text-gray-500">
										<FaClock className="text-xs" />
										<span>Created: {new Date(todo.created_at!).toLocaleDateString()}</span>
									</div>
								</div>

								{/* Quick Action Buttons */}
								<div className="absolute top-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
									{todo.status === 'in_progress' && (
										<button
											onClick={() => handleStatusUpdate(todo.id!, 'completed')}
											className={`p-1.5 rounded-lg text-xs transition-colors ${
												darkMode 
													? 'text-green-400 hover:bg-green-900/50 hover:text-green-300' 
													: 'text-green-600 hover:bg-green-50 hover:text-green-700'
											}`}
											title="Mark as complete"
										>
											<FaCheck />
										</button>
									)}
									{todo.status === 'completed' && (
										<button
											onClick={() => handleStatusUpdate(todo.id!, 'in_progress')}
											className={`p-1.5 rounded-lg text-xs transition-colors ${
												darkMode 
													? 'text-gray-400 hover:bg-gray-900/50 hover:text-gray-300' 
													: 'text-gray-600 hover:bg-gray-50 hover:text-gray-700'
											}`}
											title="Mark as in progress"
										>
											<FaUndo />
										</button>
									)}
									{(todo.status === 'in_progress' || todo.status === 'completed') && (
										<button
											onClick={() => handleStatusUpdate(todo.id!, 'canceled')}
											className={`p-1.5 rounded-lg text-xs transition-colors ${
												darkMode 
													? 'text-red-400 hover:bg-red-900/50 hover:text-red-300' 
													: 'text-red-600 hover:bg-red-50 hover:text-red-700'
											}`}
											title="Cancel task"
										>
											<FaPause />
										</button>
									)}
								</div>
							</motion.div>
						))}
					</AnimatePresence>
				</div>
			)}

			{/* Create Task Modal */}
			<AnimatePresence>
				{showCreateModal && (
					<motion.div
						className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[9999] p-4 overflow-y-auto"
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						exit={{ opacity: 0 }}
						onClick={() => setShowCreateModal(false)}
					>
						<motion.div
							className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-2xl shadow-2xl w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto`}
							initial={{ scale: 0.9, opacity: 0 }}
							animate={{ scale: 1, opacity: 1 }}
							exit={{ scale: 0.9, opacity: 0 }}
							onClick={(e) => e.stopPropagation()}
						>
							<div className="p-4 sm:p-6">
								{/* Modal Header */}
								<div className="flex items-start justify-between mb-4 sm:mb-6">
									<div className="flex items-start gap-2 sm:gap-3 min-w-0 flex-1">
										<div className="p-1.5 sm:p-2 bg-gradient-to-r from-emerald-500 to-green-600 rounded-xl flex-shrink-0">
											<FaPlus className="text-white text-base sm:text-lg" />
										</div>
										<div className="min-w-0 flex-1">
											<h3 className={`text-lg sm:text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
												Create New Task
											</h3>
											<p className={`text-xs sm:text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
												Add a personal task to track
											</p>
										</div>
									</div>
									<button
										onClick={() => setShowCreateModal(false)}
										className={`p-2 rounded-xl transition-colors flex-shrink-0 ${darkMode ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-500'}`}
									>
										<FaTimes className="text-base sm:text-lg" />
									</button>
								</div>

								{/* Form Fields */}
							<div className="space-y-3 sm:space-y-4">
								{/* Title */}
								<div>
									<label className={`block text-xs sm:text-sm font-medium mb-1.5 sm:mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
										Task Title <span className="text-red-500">*</span>
									</label>
									<input
										type="text"
										value={createFormData.title}
										onChange={(e) => setCreateFormData(prev => ({ ...prev, title: e.target.value }))}
										placeholder="Enter task title..."
										className={`w-full px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base rounded-xl border transition-colors ${darkMode ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-emerald-500' : 'bg-white border-gray-300 placeholder-gray-500 focus:border-emerald-500'} focus:ring-2 focus:ring-emerald-500/20 focus:outline-none`}
									/>
								</div>

								{/* Description */}
								<div>
									<label className={`block text-xs sm:text-sm font-medium mb-1.5 sm:mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
										Description
									</label>
									<textarea
										value={createFormData.description}
										onChange={(e) => setCreateFormData(prev => ({ ...prev, description: e.target.value }))}
										placeholder="Add details about your task..."
										rows={3}
										className={`w-full px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base rounded-xl border transition-colors resize-none ${darkMode ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-emerald-500' : 'bg-white border-gray-300 placeholder-gray-500 focus:border-emerald-500'} focus:ring-2 focus:ring-emerald-500/20 focus:outline-none`}
									/>
								</div>

								{/* Category and Priority */}
								<div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
									<div>
										<label className={`block text-xs sm:text-sm font-medium mb-1.5 sm:mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
											Category
										</label>
										<select
											value={createFormData.category}
											onChange={(e) => setCreateFormData(prev => ({ ...prev, category: e.target.value }))}
											className={`w-full px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base rounded-xl border transition-colors ${darkMode ? 'bg-gray-700 border-gray-600 text-white focus:border-emerald-500' : 'bg-white border-gray-300 focus:border-emerald-500'} focus:ring-2 focus:ring-emerald-500/20 focus:outline-none`}
										>
											<option value="">Select category</option>
											{TODO_CATEGORIES.map(cat => (
												<option key={cat} value={cat}>{cat}</option>
											))}
										</select>
									</div>

									<div>
										<label className={`block text-xs sm:text-sm font-medium mb-1.5 sm:mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
											Priority
										</label>
										<select
											value={createFormData.priority}
											onChange={(e) => setCreateFormData(prev => ({ ...prev, priority: parseInt(e.target.value) as any }))}
											className={`w-full px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base rounded-xl border transition-colors ${darkMode ? 'bg-gray-700 border-gray-600 text-white focus:border-emerald-500' : 'bg-white border-gray-300 focus:border-emerald-500'} focus:ring-2 focus:ring-emerald-500/20 focus:outline-none`}
										>
											<option value="3">Medium</option>
											<option value="1">Urgent</option>
											<option value="2">High</option>
											<option value="4">Low</option>
											<option value="5">Very Low</option>
										</select>
									</div>
								</div>

								{/* Due Date */}
								<div>
									<label className={`block text-xs sm:text-sm font-medium mb-1.5 sm:mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
										Due Date
									</label>
									<input
										type="datetime-local"
										value={createFormData.due_at}
										onChange={(e) => setCreateFormData(prev => ({ ...prev, due_at: e.target.value }))}
										className={`w-full px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base rounded-xl border transition-colors ${darkMode ? 'bg-gray-700 border-gray-600 text-white focus:border-emerald-500' : 'bg-white border-gray-300 focus:border-emerald-500'} focus:ring-2 focus:ring-emerald-500/20 focus:outline-none`}
									/>
								</div>
							</div>

							{/* Action Buttons */}
							<div className={`flex flex-col sm:flex-row gap-2 sm:gap-3 mt-4 sm:mt-6 pt-4 sm:pt-6 border-t ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
								<button
									onClick={() => setShowCreateModal(false)}
									disabled={isSubmitting}
									className={`w-full sm:flex-1 px-4 py-2.5 sm:py-3 text-sm sm:text-base rounded-xl font-medium transition-all duration-200 ${darkMode ? 'bg-gray-700 text-gray-200 hover:bg-gray-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'} ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
								>
									Cancel
								</button>
								<button
									onClick={handleCreateTask}
									disabled={isSubmitting || !createFormData.title.trim()}
									className={`w-full sm:flex-1 px-4 py-2.5 sm:py-3 text-sm sm:text-base rounded-xl font-medium transition-all duration-200 bg-gradient-to-r from-emerald-500 to-green-600 text-white hover:from-emerald-600 hover:to-green-700 shadow-lg hover:shadow-xl active:scale-95 sm:hover:scale-105 ${(isSubmitting || !createFormData.title.trim()) ? 'opacity-50 cursor-not-allowed hover:scale-100 active:scale-100' : ''}`}
								>
									{isSubmitting ? 'Creating...' : 'Create Task'}
								</button>
							</div>
							</div>
						</motion.div>
					</motion.div>
				)}
			</AnimatePresence>
		</div>
	);
};

export default StudentTodoList;