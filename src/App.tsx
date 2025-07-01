// App.tsx
import { useState, useEffect, createContext } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LoginForm from './auth/Login';
import RegisterForm from './auth/Register';
import Assessment from './user/assessment/Assessment';  
import AdminDashboard from './admin/AdminDashboard';
import UserDashboard from './user/Dashboard';
import ProfilePage from './user/ProfilePage';
import { supabase } from './lib/supabase';
import './App.css';

// Create a theme context
export const ThemeContext = createContext({
  darkMode: false,
  toggleDarkMode: () => {},
});

// AuthRoute component for checking if user is authenticated
const AuthRoute = ({ children }: { children: React.ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        setIsAuthenticated(!!session);
      } catch (error) {
        console.error('Error checking authentication status:', error);
        setIsAuthenticated(false);
      }
    };

    checkAuth();
  }, []);

  if (isAuthenticated === null) {
    return <div>Loading...</div>;
  }

  return isAuthenticated ? <>{children}</> : <Navigate to="/" />;
};

// Protected Route component
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);

  useEffect(() => {
    const checkAdmin = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          setIsAdmin(false);
          return;
        }

        // Check if user is admin by email first
        const isAdminByEmail = session.user.email?.toLowerCase() === 'admin@gmail.com';
        
        if (isAdminByEmail) {
          setIsAdmin(true);
          return;
        }

        // If not admin by email, check profile role
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('user_id', session.user.id)
          .single();

        setIsAdmin(profile?.role === 'admin');
      } catch (error) {
        console.error('Error checking admin status:', error);
        setIsAdmin(false);
      }
    };

    checkAdmin();
  }, []);

  if (isAdmin === null) {
    return <div>Loading...</div>;
  }

  return isAdmin ? <>{children}</> : <Navigate to="/" />;
};

function App() {
  // Set initial darkMode from localStorage
  const getInitialDarkMode = () => {
    const savedTheme = localStorage.getItem('darkMode');
    return savedTheme === 'true';
  };
  const [showLogin, setShowLogin] = useState(true);
  const [darkMode, setDarkMode] = useState(getInitialDarkMode);

  // Immediately set the dark class on first render
  if (typeof document !== 'undefined') {
    document.documentElement.classList.toggle('dark', darkMode);
  }

  const toggleDarkMode = () => {
    setDarkMode((prev) => {
      document.documentElement.classList.toggle('dark', !prev);
      return !prev;
    });
  };

  // Save theme preference
  useEffect(() => {
    localStorage.setItem('darkMode', darkMode.toString());
  }, [darkMode]);

  return (
    <ThemeContext.Provider value={{ darkMode, toggleDarkMode }}>
      <Router>
        <Routes>
          <Route
            path="/"
            element={showLogin ? (
              <LoginForm onSwitch={() => setShowLogin(false)} />
            ) : (
              <RegisterForm onSwitch={() => setShowLogin(true)} />
            )}
          />
          <Route 
            path="/assessment" 
            element={
              <AuthRoute>
                <Assessment />
              </AuthRoute>
            } 
          />
          <Route 
            path="/dashboard" 
            element={
              <AuthRoute>
                <UserDashboard />
              </AuthRoute>
            } 
          />
          <Route 
            path="/profile" 
            element={
              <AuthRoute>
                <ProfilePage />
              </AuthRoute>
            } 
          />
          <Route 
            path="/admin" 
            element={
              <ProtectedRoute>
                <AdminDashboard />
              </ProtectedRoute>
            } 
          />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </Router>
    </ThemeContext.Provider>
  );
}

export default App;