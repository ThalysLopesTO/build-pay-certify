import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import LoginForm from './LoginForm';
import { useEffect } from 'react';

const getDefaultRouteForRole = (role: string | undefined): string => {
  switch (role) {
    case 'admin':
    case 'super_admin':
      return '/admin/dashboard';
    case 'foreman':
      return '/foreman/dashboard';
    case 'management':
      return '/management/dashboard';
    case 'employee':
      return '/employee/dashboard';
    default:
      return '/';
  }
};

const PublicOrRedirect = () => {
  const { isAuthenticated, user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated && user && !loading) {
      const defaultRoute = getDefaultRouteForRole(user.role);
      console.log('🔄 User authenticated, redirecting to:', defaultRoute, 'for role:', user.role);
      navigate(defaultRoute, { replace: true });
    }
  }, [isAuthenticated, user, loading, navigate]);

  // Show loading state while auth is initializing
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
      </div>
    );
  }

  // Show login form when not authenticated
  if (!isAuthenticated) {
    return <LoginForm />;
  }

  // Show loading state while navigating
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
    </div>
  );
};

export default PublicOrRedirect;