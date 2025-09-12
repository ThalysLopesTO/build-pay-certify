import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/SupabaseAuthContext';

interface RoleBasedRedirectProps {
  children: React.ReactNode;
}

const RoleBasedRedirect: React.FC<RoleBasedRedirectProps> = ({ children }) => {
  const { user, isAuthenticated, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (loading) return;

    if (!isAuthenticated || !user) {
      // Not authenticated - allow access to login pages but redirect dashboard pages to login
      if (location.pathname.includes('/dashboard')) {
        navigate('/admin-login', { replace: true });
      }
      // Allow access to login pages, home page, and registration pages when not authenticated
      return;
    }

    // Get the correct dashboard path for user's role
    const getRoleDashboard = (role: string): string => {
      switch (role) {
        case 'super_admin':
          return '/super-admin/dashboard';
        case 'admin':
          return '/admin/dashboard';
        case 'management':
          return '/management/dashboard';
        case 'foreman':
          return '/foreman/dashboard';
        case 'employee':
          return '/employee/dashboard';
        default:
          return '/admin-login';
      }
    };

    const expectedPath = getRoleDashboard(user.role || '');
    
    // Check if user is trying to access a dashboard route
    const isDashboardRoute = location.pathname.includes('/dashboard');
    
    // CRITICAL: Add a small delay to prevent interference with UI operations
    // This prevents redirects during delete operations or other mutations
    const shouldRedirect = (
      isDashboardRoute && location.pathname !== expectedPath ||
      location.pathname === '/admin-login' ||
      location.pathname === '/employee-login' ||
      location.pathname === '/'
    );
    
    if (shouldRedirect) {
      console.log(`🔄 Redirecting ${user.role} from ${location.pathname} to ${expectedPath}`);
      // Add a delay to prevent interference with ongoing operations
      setTimeout(() => {
        navigate(expectedPath, { replace: true });
      }, 150);
    }
  }, [user, isAuthenticated, loading, navigate, location.pathname]);

  // Don't render children until auth state is determined
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return <>{children}</>;
};

export default RoleBasedRedirect;