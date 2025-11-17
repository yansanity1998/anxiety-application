// App.tsx
import { useState, useEffect, createContext } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LandingPage from './components/LandingPage';
import Assessment from './user/assessment/Assessment';  
import AdminDashboard from './admin/AdminDashboard';
import GuidanceDashboard from './guidance/GuidanceDashboard';
import UserDashboard from './user/Dashboard';
import ProfilePage from './user/ProfilePage';
import CBTModules from './user/components/CBTModules';
import AnxietyVideos from './user/components/AnxietyVideos';
import TodoListPage from './user/TodoListPage';
import RelaxationPage from './user/RelaxationPage';
import Activities from './user/Activities';
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
        if (!session) {
          setIsAuthenticated(false);
          return;
        }

        // Allow admin and guidance by email explicitly
        const isAdminByEmail = session.user.email?.toLowerCase() === 'admin@gmail.com';
        const isGuidanceByEmail = session.user.email?.toLowerCase() === 'guidance@gmail.com';
        if (isAdminByEmail || isGuidanceByEmail) {
          setIsAuthenticated(true);
          return;
        }

        // Deny archived users
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('user_id', session.user.id)
          .single();

        if ((profile?.role || '').toLowerCase() === 'archived') {
          try { await supabase.auth.signOut(); } catch {}
          setIsAuthenticated(false);
          return;
        }

        setIsAuthenticated(true);
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

// Admin-only Route component
const AdminRoute = ({ children }: { children: React.ReactNode }) => {
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);

  useEffect(() => {
    const checkAuthorization = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          setIsAuthorized(false);
          return;
        }

        // Check if user is admin by email first
        const isAdminByEmail = session.user.email?.toLowerCase() === 'admin@gmail.com';
        
        if (isAdminByEmail) {
          setIsAuthorized(true);
          return;
        }

        // If not admin by email, check profile role
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('user_id', session.user.id)
          .single();

        setIsAuthorized(profile?.role === 'admin');
      } catch (error) {
        console.error('Error checking admin authorization:', error);
        setIsAuthorized(false);
      }
    };

    checkAuthorization();
  }, []);

  if (isAuthorized === null) {
    return <div>Loading...</div>;
  }

  return isAuthorized ? <>{children}</> : <Navigate to="/" />;
};

// Guidance-only Route component
const GuidanceRoute = ({ children }: { children: React.ReactNode }) => {
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);

  useEffect(() => {
    const checkAuthorization = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          setIsAuthorized(false);
          return;
        }

        // Check if user is guidance by email first
        const isGuidanceByEmail = session.user.email?.toLowerCase() === 'guidance@gmail.com';
        
        if (isGuidanceByEmail) {
          setIsAuthorized(true);
          return;
        }

        // If not guidance by email, check profile role
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('user_id', session.user.id)
          .single();

        setIsAuthorized(profile?.role === 'guidance');
      } catch (error) {
        console.error('Error checking guidance authorization:', error);
        setIsAuthorized(false);
      }
    };

    checkAuthorization();
  }, []);

  if (isAuthorized === null) {
    return <div>Loading...</div>;
  }

  return isAuthorized ? <>{children}</> : <Navigate to="/" />;
};

function App() {
  // Set initial darkMode from localStorage
  const getInitialDarkMode = () => {
    const savedTheme = localStorage.getItem('darkMode');
    return savedTheme === 'true';
  };
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
            element={<LandingPage />}
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
            path="/cbt-modules" 
            element={
              <AuthRoute>
                <CBTModules />
              </AuthRoute>
            } 
          />
          <Route 
            path="/anxiety-videos" 
            element={
              <AuthRoute>
                <AnxietyVideos />
              </AuthRoute>
            } 
          />
          <Route 
            path="/todo-list" 
            element={
              <AuthRoute>
                <TodoListPage />
              </AuthRoute>
            } 
          />
          <Route 
            path="/relaxation" 
            element={
              <AuthRoute>
                <RelaxationPage />
              </AuthRoute>
            } 
          />
          <Route 
            path="/activities" 
            element={
              <AuthRoute>
                <Activities />
              </AuthRoute>
            } 
          />
          <Route 
            path="/admin" 
            element={
              <AdminRoute>
                <AdminDashboard />
              </AdminRoute>
            } 
          />
          <Route 
            path="/admin/:view" 
            element={
              <AdminRoute>
                <AdminDashboard />
              </AdminRoute>
            } 
          />
          <Route 
            path="/guidance" 
            element={
              <GuidanceRoute>
                <GuidanceDashboard />
              </GuidanceRoute>
            } 
          />
          <Route 
            path="/guidance/:view" 
            element={
              <GuidanceRoute>
                <GuidanceDashboard />
              </GuidanceRoute>
            } 
          />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </Router>
    </ThemeContext.Provider>
  );
}

export default App;