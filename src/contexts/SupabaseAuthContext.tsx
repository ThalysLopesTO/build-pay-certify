
import React, { createContext, useContext, useEffect } from 'react';
import { AuthContextType } from './auth/types';
import { useAuthState } from './auth/useAuthState';
import { login, signUp, logout, checkSubscriptionStatus } from './auth/authService';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, session, loading, companyError, setCompanyError } = useAuthState();

  // Check subscription status when user logs in
  useEffect(() => {
    if (user && session && !loading) {
      // Skip subscription check for super admins
      if (user.role === 'super_admin') {
        console.log('✅ Super admin detected, bypassing subscription check');
        return;
      }
      
      // Only check subscription for non-super-admin users
      console.log('🔄 User logged in, checking subscription status...');
      checkSubscriptionStatus();
    }
  }, [user, session, loading]);

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

  const isCompanyAdmin = user?.role === 'admin' || user?.role === 'super_admin';
  const isSuperAdmin = user?.role === 'super_admin';
  const isAuthenticated = !!session && !!user && !companyError;

  console.log('🏗️ AuthProvider state:', {
    hasSession: !!session,
    hasUser: !!user,
    hasCompanyError: !!companyError,
    isAuthenticated,
    loading,
    userRole: user?.role
  });

  return (
    <AuthContext.Provider value={{
      user,
      session,
      login,
      signUp,
      logout: handleLogout,
      isAuthenticated,
      loading,
      isCompanyAdmin,
      isSuperAdmin,
      companyError
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
