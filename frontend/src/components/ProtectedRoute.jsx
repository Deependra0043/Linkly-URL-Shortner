import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';

/**
 * Route protection wrapper. Catches unauthenticated state attempts 
 * and cleanly forwards the client to login while preserving target path intents.
 */
export default function ProtectedRoute({ children }) {
  const location = useLocation();
  const token = localStorage.getItem('token');
  const isAuthenticated = !!token;

  if (!isAuthenticated) {
    // Redirecting to login, but passing the current location configuration 
    // down the state pipeline so we can bounce them back right after authentication.
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
}