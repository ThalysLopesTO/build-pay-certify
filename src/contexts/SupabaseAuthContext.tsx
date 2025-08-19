import React, { createContext, useContext, useEffect, useRef } from 'react';
import { AuthContextType } from './auth/types';
import { useAuthState } from './auth/useAuthState';
import { login, loginWithUsername, signUp, logout, checkSubscriptionStatus } from './auth/authService';
// import { useNavigate } from 'react-router-dom'; // ❌ unused

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, session, loading, companyError, setCompanyError } = useAuthState();

  // Optional: prevent duplicate subscription checks
  const lastCheckedSessionId = useRef<string | null>(null);
  useEffect(() => {
    if (user && session && !loading) {
      if (lastCheckedSessionId.current !== session.access_token) {
        lastCheckedSessionId.current = session.access_token;
        checkSubscriptionStatus();
      }
    }
  }, [user, session, loading]);

  const handleLogout = async () => {
    console.log('🔄 Logout requested...');
    try {
      setCompanyError(null);
      const { error } = await logout();
      if (error) {
        console.error('❌ Logout failed:', error);
        throw error;
      }
      console.log('✅ Logout successful');
      // No need to manually tear down realtime channels here:
      // RealtimeProvider clears on SIGNED_OUT automatically.
    } catch (error) {
      console.error('💥 Logout handler error:', error);
    }
  };

  const isCompanyAdmin = user?.role === 'admin' || user?.role === 'super_admin';
  const isSuperAdmin = user?.role === 'super_admin';
  const isAuthenticated = !!session && !!user && !companyError;

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
