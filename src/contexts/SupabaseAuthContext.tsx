
import React, { createContext, useContext, useEffect } from 'react';
import { AuthContextType, Company } from './auth/types';
import { useAuthState } from './auth/useAuthState';
import { login, signUp, logout, checkSubscriptionStatus } from './auth/authService';
import { useToast } from '@/hooks/use-toast';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, session, loading, companyError, setCompanyError } = useAuthState();
  const { toast } = useToast();

  // Create company object from user data
  const company: Company | null = user ? {
    id: user.company_id || '',
    name: user.company_name || '',
    status: 'active',
    subscription_override: false,
    stripe_verified: false
  } : null;

  // Check subscription status when user logs in
  useEffect(() => {
    if (user && session && !loading) {
      // Skip subscription check for super admins
      if (user.role === 'super_admin') {
        console.log('✅ Super admin detected, bypassing subscription check');
        return;
      }
      
      // Check subscription for all other users
      console.log('🔄 User logged in, checking subscription status...');
      checkSubscriptionStatus().then((data) => {
        if (data) {
          // Handle routing based on subscription status and user role
          const currentPath = window.location.pathname;
          
          // Admin and super admin users get redirected to admin dashboard or regular dashboard
          if (user.role === 'admin' || user.role === 'super_admin') {
            console.log('👑 Admin user detected');
            if (currentPath === '/login' || currentPath === '/pricing') {
              window.location.href = '/dashboard';
            }
            return;
          }
          
          if (data.needsSubscription && user.role !== 'super_admin') {
            console.log('🚨 User needs subscription, redirecting to pricing');
            if (currentPath !== '/pricing') {
              toast({
                title: "Subscription Required",
                description: "You need a valid subscription to access the platform.",
                variant: "destructive",
              });
              window.location.href = '/pricing';
            }
          } else if (data.subscription?.status === 'active') {
            console.log('✅ Active subscription confirmed');
            if (currentPath === '/login' || currentPath === '/pricing') {
              // Route based on user role
              if (user.role === 'admin' || user.role === 'super_admin') {
                window.location.href = '/dashboard';
              } else {
                window.location.href = '/dashboard';
              }
            }
          }
        }
      }).catch((error) => {
        console.error('Failed to check subscription status:', error);
        toast({
          title: "Subscription Check Failed",
          description: "Unable to verify subscription status. Please try again.",
          variant: "destructive",
        });
      });
    }
  }, [user, session, loading, toast]);

  const handleLogout = async () => {
    console.log('🔄 Logout requested...');
    
    try {
      // Clear company error first
      setCompanyError(null);
      
      // Call logout service
      const { error } = await logout();
      
      if (error) {
        console.error('❌ Logout failed:', error);
        throw error;
      }
      
      console.log('✅ Logout successful');
      
      // Navigate to login page after successful logout
      window.location.href = '/login';
      
    } catch (error) {
      console.error('💥 Logout handler error:', error);
      // Force navigation to login even if logout fails
      window.location.href = '/login';
    }
  };

  const refreshUserProfile = async () => {
    // Implementation for refreshing user profile
    console.log('Refreshing user profile...');
  };

  const isCompanyAdmin = user?.role === 'admin' || user?.role === 'super_admin';
  const isSuperAdmin = user?.role === 'super_admin';
  const isAuthenticated = !!session && !!user && !companyError;

  console.log('🏗️ AuthProvider state:', {
    hasSession: !!session,
    hasUser: !!user,
    hasCompanyError: !!companyError,
    isAuthenticated,
    loading,
    userRole: user?.role,
    isCompanyAdmin
  });

  return (
    <AuthContext.Provider value={{
      user,
      company,
      session,
      login,
      signUp,
      logout: handleLogout,
      isAuthenticated,
      loading,
      isCompanyAdmin,
      isSuperAdmin,
      companyError,
      refreshUserProfile
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export type { AuthUser } from './auth/types';
