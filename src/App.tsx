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

// Protected Route component for admin and guidance
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);

  useEffect(() => {
    const checkAuthorization = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          setIsAuthorized(false);
          return;
        }

        // Check if user is admin or guidance by email first
        const isAdminByEmail = session.user.email?.toLowerCase() === 'admin@gmail.com';
        const isGuidanceByEmail = session.user.email?.toLowerCase() === 'guidance@gmail.com';
        
        if (isAdminByEmail || isGuidanceByEmail) {
          setIsAuthorized(true);
          return;
        }

        // If not admin/guidance by email, check profile role
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('user_id', session.user.id)
          .single();

        setIsAuthorized(profile?.role === 'admin' || profile?.role === 'guidance');
      } catch (error) {
        console.error('Error checking authorization status:', error);
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
            path="/admin" 
            element={
              <ProtectedRoute>
                <AdminDashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/guidance" 
            element={
              <ProtectedRoute>
                <GuidanceDashboard />
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