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
  const { isAuthenticated, user, ready } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (ready && isAuthenticated && user) {
      const defaultRoute = getDefaultRouteForRole(user.role);
      console.log('🔄 User authenticated, redirecting to:', defaultRoute, 'for role:', user.role);
      navigate(defaultRoute, { replace: true });
    }
  }, [ready, isAuthenticated, user, navigate]);

  // Show loading state while auth is initializing
  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
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
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
    </div>
  );
};

export default PublicOrRedirect;