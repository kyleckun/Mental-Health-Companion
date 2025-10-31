import React, { useEffect, useState } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { authService } from './services/authService';
import MoodJournalPage from './pages/MoodJournalPage';
import ChatPage from './pages/ChatPage';
import ProfilePage from './pages/ProfilePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';

// Protected route wrapper component
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    console.log('[ProtectedRoute] Checking auth status...');
    console.log('[ProtectedRoute] Current path:', location.pathname);

    // Force re-check auth state
    const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
    console.log('[ProtectedRoute] Token exists?', token ? 'yes' : 'no');

    if (!token) {
      console.log('[ProtectedRoute] No token, redirecting to login');
      navigate('/login', { replace: true });
    } else {
      console.log('[ProtectedRoute] Token found, access granted');
    }

    setIsChecking(false);
  }, [navigate, location.pathname]);

  if (isChecking) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        fontSize: '18px',
        color: '#667eea'
      }}>
        Checking authentication...
      </div>
    );
  }

  const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
  if (!token) {
    return null; // Already redirected in useEffect
  }

  return <>{children}</>;
};

// Main application component
const App: React.FC = () => {
  console.log('%c[App] Application component rendering', 'color: #667eea; font-weight: bold');

  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      {/* Protected routes */}
      <Route
        path="/app"
        element={
          <ProtectedRoute>
            <MoodJournalPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/chat"
        element={
          <ProtectedRoute>
            <ChatPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <ProfilePage />
          </ProtectedRoute>
        }
      />

      {/* Default route - redirect to login */}
      <Route path="/" element={<Navigate to="/login" replace />} />

      {/* 404 - redirect to login */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
};

export default App;
