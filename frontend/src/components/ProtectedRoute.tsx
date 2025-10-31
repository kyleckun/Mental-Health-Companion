import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { authService } from '../services/authService';

interface ProtectedRouteProps {
  children: React.ReactNode;
  redirectTo?: string;
}

/**
 * Protected Route Component
 * Redirects to login page if user is not authenticated
 */
const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  redirectTo = '/login',
}) => {
  const location = useLocation();
  const isAuthenticated = authService.isAuthenticated();

  // DEBUG: Log protection check
  console.log('[ProtectedRoute] Checking access:', {
    path: location.pathname,
    isAuthenticated: isAuthenticated,
    willRedirect: !isAuthenticated,
    redirectTo: redirectTo,
    timestamp: new Date().toISOString(),
  });

  if (!isAuthenticated) {
    console.log('[ProtectedRoute] Not authenticated, redirecting to:', redirectTo);
    // Redirect to login page while saving the attempted location
    return <Navigate to={redirectTo} state={{ from: location }} replace />;
  }

  console.log('[ProtectedRoute] Authenticated, access granted');
  return <>{children}</>;
};

export default ProtectedRoute;
