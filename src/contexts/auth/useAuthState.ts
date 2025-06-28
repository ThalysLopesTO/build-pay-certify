
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
    user: user ? { id: user.id, email: user.email, companyId: user.companyId } : null, 
    hasSession: !!session, 
    loading, 
    companyError 
  });

  useEffect(() => {
    let isMounted = true;

    const handleAuthStateChange = async (event: string, session: Session | null) => {
      if (!isMounted) return;
      
      console.log('🔄 Auth state changed:', event, session?.user?.email);
      setSession(session);
      
      if (session?.user) {
        console.log('👤 User session found, fetching profile for:', session.user.id);
        
        try {
          const { profile, company, error } = await fetchUserProfile(session.user.id);
          
          if (!isMounted) return;
          
          if (error) {
            console.warn('⚠️ Profile fetch error:', error);
            setUser(null);
            setCompanyError(error);
          } else if (profile && company) {
            const authUser: AuthUser = {
              ...session.user,
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
            setUser(authUser);
            setCompanyError(null);
          } else {
            console.warn('⚠️ No profile or company found');
            setUser(null);
            setCompanyError('Profile or company not found. Please contact your administrator.');
          }
        } catch (error) {
          console.error('💥 Error fetching profile:', error);
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

    // Initialize auth state
    const initializeAuth = async () => {
      try {
        console.log('🚀 Initializing auth...');
        
        // Get current session without making any user table queries
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('❌ Error getting session:', error);
          if (isMounted) {
            setLoading(false);
          }
          return;
        }
        
        console.log('📋 Initial session check:', session?.user?.email || 'No session');
        
        // Set up listener
        const { data: { subscription } } = supabase.auth.onAuthStateChange(handleAuthStateChange);
        
        // Handle initial session
        await handleAuthStateChange('initial', session);
        
        return () => {
          subscription.unsubscribe();
        };
      } catch (error) {
        console.error('💥 Error initializing auth:', error);
        if (isMounted) {
          setLoading(false);
          setCompanyError('Failed to initialize authentication.');
        }
      }
    };

    initializeAuth();

    return () => {
      console.log('🧹 Cleaning up auth listener');
      isMounted = false;
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
