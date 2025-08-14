
import { useState, useEffect, useCallback, useRef } from 'react';
import { Session } from '@supabase/supabase-js';
import { getSupabase } from '@/integrations/supabase/client';
import { AuthUser } from './types';
import { fetchUserProfile } from './profileService';

export const useAuthState = () => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [companyError, setCompanyError] = useState<string | null>(null);
  const authSubscriptionRef = useRef<any>(null);
  
  // Get stable Supabase instance
  const supabase = getSupabase();

  console.log('🔍 Auth State Debug:', { 
    user: user ? { id: user.id, email: user.email, companyId: user.companyId } : null, 
    hasSession: !!session, 
    loading, 
    companyError 
  });

  // Handle window focus to refresh session
  const handleWindowFocus = useCallback(async () => {
    if (document.visibilityState === 'visible') {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          console.log('🔄 Refreshed session on window focus');
        }
      } catch (error) {
        console.warn('Failed to refresh session on focus:', error);
      }
    }
  }, [supabase]);

  useEffect(() => {
    let isMounted = true;

    const handleAuthStateChange = async (event: string, session: Session | null) => {
      if (!isMounted) return;

      // Ignore noisy events that shouldn't reset UI state
      if (event === 'TOKEN_REFRESHED') {
        setSession(session);
        if (isMounted && loading) setLoading(false);
        return;
      }
      
      console.log('🔄 Auth state changed:', event, { 
        sessionExists: !!session, 
        userEmail: session?.user?.email,
        userId: session?.user?.id 
      });
      
      setSession(session);

      const hasUser = !!session?.user;

      if (hasUser) {
        const shouldFetch =
          event === 'SIGNED_IN' ||
          event === 'USER_UPDATED' ||
          (event === 'INITIAL_SESSION' && !user);

        if (shouldFetch) {
          console.log('👤 Fetching user profile for:', session!.user!.id);
          
          try {
            const { profile, company, error } = await fetchUserProfile(session!.user!.id);
            
            if (!isMounted) return;
            
            if (error) {
              console.warn('⚠️ Profile fetch error:', error);
              setUser(null);
              setCompanyError(error);
            } else if (profile && company) {
              const authUser: AuthUser = {
                ...session!.user!,
                role: profile.role as 'super_admin' | 'admin' | 'foreman' | 'management' | 'employee',
                companyId: profile.company_id,
                companyName: company.name,
                hourlyRate: profile.hourly_rate || 25,
                trade: profile.trade || 'General',
                position: profile.position || 'Worker',
                firstName: profile.first_name || '',
                lastName: profile.last_name || '',
                pendingApproval: profile.pending_approval || false,
                workerType: (profile.worker_type as 'employee' | 'subcontractor') || 'subcontractor'
              };
              
              console.log('✅ Setting auth user:', { 
                id: authUser.id, 
                email: authUser.email, 
                role: authUser.role, 
                companyId: authUser.companyId 
              });
              setUser(authUser);
              setCompanyError(null);
            } else {
              console.warn('⚠️ No profile or company found for user:', session!.user!.id);
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
        
        // Prevent multiple subscriptions
        if (authSubscriptionRef.current) {
          console.log('⚠️ Auth subscription already exists, skipping...');
          return () => {
            console.log('🚫 Returning empty cleanup function (subscription already exists)');
          };
        }
        
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
        
        console.log('🔧 Creating auth state change listener...');
        console.log('🔍 About to call supabase.auth.onAuthStateChange...');
        const { data: { subscription } } = supabase.auth.onAuthStateChange(handleAuthStateChange);
        console.log('✅ Auth subscription created successfully');
        authSubscriptionRef.current = subscription;
        
        // Handle initial session
        await handleAuthStateChange('INITIAL_SESSION', session);
        
        
        return () => {
          console.log('🧹 Auth cleanup function returned');
          if (authSubscriptionRef.current) {
            authSubscriptionRef.current.unsubscribe();
            authSubscriptionRef.current = null;
          }
        };
      } catch (error) {
        console.error('💥 Error initializing auth:', error);
        if (isMounted) {
          setLoading(false);
          setCompanyError('Failed to initialize authentication.');
        }
      }
    };

    let authCleanup: (() => void) | undefined;
    
    const setupAuth = async () => {
      console.log('🚀 setupAuth: Starting auth setup...');
      authCleanup = await initializeAuth();
      console.log('✅ setupAuth: Auth setup complete, cleanup function:', !!authCleanup);
    };
    
    setupAuth();

    // Add window focus/visibility listeners
    window.addEventListener('focus', handleWindowFocus);
    document.addEventListener('visibilitychange', handleWindowFocus);

    return () => {
      console.log('🧹 Cleaning up auth listener');
      isMounted = false;
      
      // Clean up auth subscription
      if (authCleanup) {
        console.log('🧹 useAuthState: Calling auth cleanup function');
        authCleanup();
      } else {
        console.warn('⚠️ useAuthState: No auth cleanup function available!');
      }
      
      window.removeEventListener('focus', handleWindowFocus);
      document.removeEventListener('visibilitychange', handleWindowFocus);
    };
  }, [handleWindowFocus, supabase]);

  return {
    user,
    session,
    loading,
    companyError,
    setCompanyError
  };
};
