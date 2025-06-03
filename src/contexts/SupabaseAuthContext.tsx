import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

// Updated AuthUser interface to include company information
export interface AuthUser extends User {
  role?: 'super_admin' | 'admin' | 'foreman' | 'payroll' | 'employee';
  companyId?: string;
  companyName?: string;
  hourlyRate?: number;
  trade?: string;
  position?: string;
  firstName?: string;
  lastName?: string;
}

interface AuthContextType {
  user: AuthUser | null;
  session: Session | null;
  login: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string) => Promise<{ error: any }>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
  loading: boolean;
  isCompanyAdmin: boolean;
  isSuperAdmin: boolean;
  companyError: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [companyError, setCompanyError] = useState<string | null>(null);

  // Helper function to fetch user profile and company data
  const fetchUserProfile = async (userId: string) => {
    try {
      console.log('Fetching user profile for:', userId);
      
      const { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .select(`
          *,
          companies:company_id (
            id,
            name,
            status
          )
        `)
        .eq('user_id', userId)
        .single();

      if (profileError) {
        console.error('Error fetching user profile:', profileError);
        
        // Check if user profile doesn't exist
        if (profileError.code === 'PGRST116') {
          setCompanyError('Your user profile is not set up. Please contact your system administrator.');
          return null;
        }
        
        setCompanyError('Failed to load user profile. Please try logging in again.');
        return null;
      }

      if (!profile) {
        setCompanyError('User profile not found. Please contact your system administrator.');
        return null;
      }

      if (!profile.company_id) {
        setCompanyError('You are not assigned to a company. Please contact your system administrator.');
        return null;
      }

      if (!profile.companies) {
        setCompanyError('Company information is missing. Please contact your system administrator.');
        return null;
      }

      if (profile.companies.status !== 'active') {
        setCompanyError('Your company account is not active. Please contact your system administrator.');
        return null;
      }

      console.log('User profile loaded successfully:', profile);
      setCompanyError(null);
      return profile;
    } catch (error) {
      console.error('Error in fetchUserProfile:', error);
      setCompanyError('An unexpected error occurred. Please try again.');
      return null;
    }
  };

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.email);
        setSession(session);
        
        if (session?.user) {
          // Fetch user profile and company data
          const profile = await fetchUserProfile(session.user.id);
          
          if (profile) {
            const authUser: AuthUser = {
              ...session.user,
              role: profile.role as 'super_admin' | 'admin' | 'foreman' | 'payroll' | 'employee',
              companyId: profile.company_id,
              companyName: profile.companies?.name,
              hourlyRate: profile.hourly_rate || 25,
              trade: profile.trade || 'General',
              position: profile.position || 'Worker',
              firstName: profile.first_name || '',
              lastName: profile.last_name || ''
            };
            setUser(authUser);
          } else {
            // If profile fetch failed, keep user null to show error
            setUser(null);
          }
        } else {
          setUser(null);
          setCompanyError(null);
        }
        setLoading(false);
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      console.log('Initial session check:', session?.user?.email);
      setSession(session);
      
      if (session?.user) {
        const profile = await fetchUserProfile(session.user.id);
        
        if (profile) {
          const authUser: AuthUser = {
            ...session.user,
            role: profile.role as 'super_admin' | 'admin' | 'foreman' | 'payroll' | 'employee',
            companyId: profile.company_id,
            companyName: profile.companies?.name,
            hourlyRate: profile.hourly_rate || 25,
            trade: profile.trade || 'General',
            position: profile.position || 'Worker',
            firstName: profile.first_name || '',
            lastName: profile.last_name || ''
          };
          setUser(authUser);
        } else {
          setUser(null);
        }
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const login = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    return { error };
  };

  const signUp = async (email: string, password: string) => {
    const redirectUrl = `${window.location.origin}/`;
    
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl
      }
    });
    return { error };
  };

  const logout = async () => {
    setCompanyError(null);
    await supabase.auth.signOut();
  };

  const isCompanyAdmin = user?.role === 'admin' || user?.role === 'super_admin';
  const isSuperAdmin = user?.role === 'super_admin';

  return (
    <AuthContext.Provider value={{
      user,
      session,
      login,
      signUp,
      logout,
      isAuthenticated: !!session && !!user,
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
