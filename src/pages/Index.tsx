
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/SupabaseAuthContext';

const Index = () => {
  const { isAuthenticated } = useAuth();
  
  // Redirect to login if not authenticated, otherwise show dashboard
  return <Navigate to={isAuthenticated ? "/" : "/login"} replace />;
};

export default Index;
