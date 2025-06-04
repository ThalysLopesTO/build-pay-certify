
import { useState, useEffect } from 'react';
import { Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { AuthUser } from './types';
import { fetchUserProfile } from './profileService';

export const useAuthState = () => {
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

  useEffect(() => {
    let isMounted = true;
    let authSubscription: any = null;

    // Function to handle auth state changes
    const handleAuthStateChange = async (event: string, session: Session | null) => {
      if (!isMounted) return;
      
      console.log('🔄 Auth state changed:', event, session?.user?.email);
      setSession(session);
      
      if (session?.user) {
        console.log('👤 User session found, fetching profile...');
        
        try {
          // Use supabase.auth.getSession() to reconfirm current session
          const { data: { session: currentSession } } = await supabase.auth.getSession();
          
          if (!currentSession?.user || !isMounted) {
            console.warn('⚠️ No current session found');
            setUser(null);
            setCompanyError('Session expired. Please log in again.');
            setLoading(false);
            return;
          }

          // Fetch user profile and company data using the session user ID
          const { profile, company, error } = await fetchUserProfile(currentSession.user.id);
          
          if (!isMounted) return;
          
          if (profile && company) {
            const authUser: AuthUser = {
              ...currentSession.user,
              role: profile.role as 'super_admin' | 'admin' | 'foreman' | 'payroll' | 'employee',
              companyId: profile.company_id,
              companyName: company.name,
              hourlyRate: profile.hourly_rate || 25,
              trade: profile.trade || 'General',
              position: profile.position || 'Worker',
              firstName: profile.first_name || '',
              lastName: profile.last_name || '',
              pendingApproval: profile.pending_approval || false
            };
            
            console.log('✅ Setting auth user:', authUser);
            console.log('✅ Setting company:', company);
            
            // Set Auth Context State
            setUser(authUser);
            setCompanyError(null);
          } else {
            console.warn('⚠️ Profile or company fetch failed');
            setUser(null);
            setCompanyError(error);
          }
        } catch (error) {
          console.error('💥 Error in auth state change handler:', error);
          if (isMounted) {
            setUser(null);
            setCompanyError('An unexpected error occurred while loading your profile.');
          }
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
    const setupAuthListener = () => {
      const { data: { subscription } } = supabase.auth.onAuthStateChange(handleAuthStateChange);
      authSubscription = subscription;
      return subscription;
    };

    // Check for existing session using supabase.auth.getSession()
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
          setCompanyError('Failed to initialize authentication.');
        }
      }
    };

    // Set up listener first, then check for existing session
    setupAuthListener();
    initializeAuth();

    return () => {
      console.log('🧹 Cleaning up auth listener');
      isMounted = false;
      if (authSubscription) {
        authSubscription.unsubscribe();
      }
    };
  }, []);

  return {
    user,
    session,
    loading,
    companyError,
    setCompanyError
  };
};
