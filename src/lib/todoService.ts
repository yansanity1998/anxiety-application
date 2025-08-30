import { supabase } from './supabase';

export interface TodoItem {
  id?: number;
  profile_id: number;
  title: string;
  description?: string;
  category?: string;
  status: 'in_progress' | 'completed' | 'canceled';
  priority: 1 | 2 | 3 | 4 | 5; // 1=highest, 5=lowest
  due_at?: string;
  completed_at?: string;
  created_at?: string;
  updated_at?: string;
  profiles?: {
    full_name: string;
    email: string;
  };
}

export interface UserProfile {
  id: number;
  full_name: string;
  email: string;
  role: string;
}

export interface CreateTodoItem {
  profile_id: number;
  title: string;
  description?: string;
  category?: string;
  priority?: 1 | 2 | 3 | 4 | 5;
  due_at?: string;
}

export interface UpdateTodoItem {
  title?: string;
  description?: string;
  category?: string;
  status?: 'in_progress' | 'completed' | 'canceled';
  priority?: 1 | 2 | 3 | 4 | 5;
  due_at?: string;
  completed_at?: string | null;
}

// Get all todo items for a user
export const getTodoItems = async (profileId: number): Promise<TodoItem[]> => {
  const { data, error } = await supabase
    .from('todo_items')
    .select('*')
    .eq('profile_id', profileId)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch todo items: ${error.message}`);
  }

  return data || [];
};

// Get all todo items for admin view with profile information
export const getAllTodoItems = async (): Promise<TodoItem[]> => {
  const { data, error } = await supabase
    .from('todo_items')
    .select(`
      *,
      profiles (
        full_name,
        email
      )
    `)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch all todo items: ${error.message}`);
  }

  return data || [];
};

// Fetch users for the dropdown (same pattern as CBT modules and videos)
export const fetchUsers = async (): Promise<UserProfile[]> => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, full_name, email, role')
      .in('role', ['student', 'guidance', 'admin'])
      .order('full_name');
    
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching users:', error);
    return [];
  }
};

// Create a new todo item
export const createTodoItem = async (todoData: CreateTodoItem): Promise<TodoItem> => {
  const { data, error } = await supabase
    .from('todo_items')
    .insert([todoData])
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create todo item: ${error.message}`);
  }

  return data;
};

// Update a todo item
export const updateTodoItem = async (id: number, updates: UpdateTodoItem): Promise<TodoItem> => {
  // If marking as completed, set completed_at
  if (updates.status === 'completed') {
    updates = { ...updates, completed_at: new Date().toISOString() };
  }
  // If unmarking as completed, clear completed_at
  else if (updates.status && ['in_progress', 'canceled'].includes(updates.status)) {
    updates = { ...updates, completed_at: null };
  }

  const { data, error } = await supabase
    .from('todo_items')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update todo item: ${error.message}`);
  }

  return data;
};

// Delete a todo item
export const deleteTodoItem = async (id: number): Promise<void> => {
  const { error } = await supabase
    .from('todo_items')
    .delete()
    .eq('id', id);

  if (error) {
    throw new Error(`Failed to delete todo item: ${error.message}`);
  }
};

// Mark todo as completed
export const completeTodoItem = async (id: number): Promise<TodoItem> => {
  return updateTodoItem(id, { 
    status: 'completed',
    completed_at: new Date().toISOString()
  });
};

// Get todo statistics for a user
export const getTodoStats = async (profileId: number) => {
  const todos = await getTodoItems(profileId);
  
  return {
    total: todos.length,
    completed: todos.filter(t => t.status === 'completed').length,

    inProgress: todos.filter(t => t.status === 'in_progress').length,
    overdue: todos.filter(t => 
      t.due_at && 
      new Date(t.due_at) < new Date() && 
      t.status !== 'completed'
    ).length
  };
};

export const TODO_CATEGORIES = [
  'Exposure Therapy',
  'Relaxation',
  'Lifestyle',
  'Study',
  'Social',
  'Self-Care',
  'Exercise',
  'Mindfulness',
  'Other'
] as const;

export const PRIORITY_LABELS = {
  1: 'Urgent',
  2: 'High',
  3: 'Medium',
  4: 'Low',
  5: 'Very Low'
} as const;

export const STATUS_LABELS = {
  'in_progress': 'In Progress',
  'completed': 'Completed',
  'canceled': 'Canceled'
} as const; 