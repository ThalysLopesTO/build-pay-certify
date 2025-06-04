
import React, { createContext, useContext } from 'react';
import { AuthContextType } from './auth/types';
import { useAuthState } from './auth/useAuthState';
import { login, signUp, logout } from './auth/authService';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, session, loading, companyError, setCompanyError } = useAuthState();

  const handleLogout = async () => {
    setCompanyError(null);
    await logout();
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
