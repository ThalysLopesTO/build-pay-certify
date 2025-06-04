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
  pendingApproval?: boolean;
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

  console.log('🔍 Auth State Debug:', { 
    user: user ? { id: user.id, email: user.email, companyId: user.companyId, pendingApproval: user.pendingApproval } : null, 
    hasSession: !!session, 
    loading, 
    companyError 
  });

  // Helper function to fetch user profile and company data
  const fetchUserProfile = async (userId: string) => {
    try {
      console.log('📝 Fetching user profile for:', userId);
      
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
        console.error('❌ Error fetching user profile:', profileError);
        
        // Check if user profile doesn't exist
        if (profileError.code === 'PGRST116') {
          setCompanyError('Your user profile is not set up. Please contact your system administrator.');
          return null;
        }
        
        setCompanyError('Failed to load user profile. Please try logging in again.');
        return null;
      }

      if (!profile) {
        console.warn('⚠️ User profile not found');
        setCompanyError('User profile not found. Please contact your system administrator.');
        return null;
      }

      // Check if user is pending approval
      if (profile.pending_approval) {
        console.warn('⚠️ User is pending approval');
        setCompanyError('Your company account is pending approval. You will receive an email notification once approved.');
        return null;
      }

      if (!profile.company_id) {
        console.warn('⚠️ User not assigned to company');
        setCompanyError('You are not assigned to a company. Please contact your system administrator.');
        return null;
      }

      if (!profile.companies) {
        console.warn('⚠️ Company information missing');
        setCompanyError('Company information is missing. Please contact your system administrator.');
        return null;
      }

      if (profile.companies.status === 'pending') {
        console.warn('⚠️ Company is pending approval');
        setCompanyError('Your company account is pending approval. You will receive an email notification once approved.');
        return null;
      }

      if (profile.companies.status !== 'active') {
        console.warn('⚠️ Company not active');
        setCompanyError('Your company account is not active. Please contact your system administrator.');
        return null;
      }

      console.log('✅ User profile loaded successfully:', profile);
      setCompanyError(null);
      return profile;
    } catch (error) {
      console.error('💥 Error in fetchUserProfile:', error);
      setCompanyError('An unexpected error occurred. Please try again.');
      return null;
    }
  };

  useEffect(() => {
    let isMounted = true;

    // Function to handle auth state changes
    const handleAuthStateChange = async (event: string, session: Session | null) => {
      if (!isMounted) return;
      
      console.log('🔄 Auth state changed:', event, session?.user?.email);
      setSession(session);
      
      if (session?.user) {
        console.log('👤 User session found, fetching profile...');
        
        // Fetch user profile and company data
        const profile = await fetchUserProfile(session.user.id);
        
        if (!isMounted) return;
        
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
            lastName: profile.last_name || '',
            pendingApproval: profile.pending_approval || false
          };
          console.log('✅ Setting auth user:', authUser);
          setUser(authUser);
        } else {
          console.warn('⚠️ Profile fetch failed, keeping user null');
          setUser(null);
        }
      } else {
        console.log('🚪 No user session, clearing state');
        setUser(null);
        setCompanyError(null);
      }
      
      if (isMounted) {
        console.log('🏁 Setting loading to false');
        setLoading(false);
      }
    };

    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(handleAuthStateChange);

    // Check for existing session
    const initializeAuth = async () => {
      try {
        console.log('🚀 Initializing auth...');
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('❌ Error getting session:', error);
          if (isMounted) {
            setLoading(false);
          }
          return;
        }
        
        console.log('📋 Initial session check:', session?.user?.email || 'No session');
        await handleAuthStateChange('initial', session);
      } catch (error) {
        console.error('💥 Error initializing auth:', error);
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    initializeAuth();

    return () => {
      console.log('🧹 Cleaning up auth listener');
      isMounted = false;
      subscription.unsubscribe();
    };
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
