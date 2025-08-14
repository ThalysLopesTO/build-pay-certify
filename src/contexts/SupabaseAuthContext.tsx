
import React, { createContext, useContext, useEffect } from 'react';
import { AuthContextType } from './auth/types';
import { useAuthState } from './auth/useAuthState';
import { login, loginWithUsername, signUp, logout, checkSubscriptionStatus } from './auth/authService';
import { useNavigate } from 'react-router-dom';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, session, loading, companyError, setCompanyError } = useAuthState();

  // Check subscription status when user logs in
  useEffect(() => {
    if (user && session && !loading) {
      checkSubscriptionStatus();
    }
  }, [user, session, loading]);

  const navigate = useNavigate();

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
      
      console.log('✅ Logout successful, navigating to home');
      // Navigate to home page after successful logout
      navigate('/', { replace: true });
      
    } catch (error) {
      console.error('💥 Logout handler error:', error);
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
    loading
  });

  return (
    <AuthContext.Provider value={{
      user,
      session,
      login,
      loginWithUsername,
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
