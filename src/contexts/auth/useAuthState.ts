import { useState, useEffect, useCallback, useRef } from 'react';
import { Session, User as SupabaseUser } from '@supabase/supabase-js';
import { AuthUser } from './types';
import { getSupabase } from '@/integrations/supabase/client';

export const useAuthState = () => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [companyError, setCompanyError] = useState<string | null>(null);
  const authSubscriptionRef = useRef<any>(null);
  
  // Get stable Supabase instance
  const supabase = getSupabase();
  let isMounted = true;

  const handleWindowFocus = useCallback(() => {
    console.log('🔄 Window focus detected, refreshing session');
    supabase.auth.refreshSession();
  }, [supabase]);

  // Handle auth state changes
  const handleAuthStateChange = useCallback(async (event: string, session: Session | null) => {
    console.log('🔄 Auth state change:', event, session?.user?.email || 'No user');
    
    if (!isMounted) return;

    try {
      setSession(session);

      if (!session?.user) {
        console.log('❌ No session, clearing user state');
        setUser(null);
        setLoading(false);
        return;
      }

      const supabaseUser: SupabaseUser = session.user;
      console.log('👤 Processing user:', supabaseUser.email);

      // Get user profile with company data
      const { data: userProfile, error: profileError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', supabaseUser.id)
        .single();
      
      if (profileError || !userProfile) {
        console.error('❌ Failed to get user profile');
        if (isMounted) {
          setCompanyError('Failed to load user profile. Please contact support.');
          setLoading(false);
        }
        return;
      }

      console.log('✅ User profile loaded:', userProfile.role, userProfile.company_id);

      // Create AuthUser object with minimal required fields
      const authUser: AuthUser = {
        ...supabaseUser,
        role: userProfile.role,
        companyId: userProfile.company_id,
        firstName: userProfile.first_name || '',
        lastName: userProfile.last_name || '',
      };

      if (isMounted) {
        setUser(authUser);
        setLoading(false);
        setCompanyError(null);
      }

    } catch (error) {
      console.error('💥 Error in handleAuthStateChange:', error);
      if (isMounted) {
        setCompanyError('Authentication error. Please try again.');
        setLoading(false);
      }
    }
  }, []);

  // Auth initialization effect with singleton pattern
  useEffect(() => {
    console.log('🚀 Setting up auth state listener');
    
    // Prevent multiple subscriptions (singleton pattern)
    if (authSubscriptionRef.current) {
      console.log('⚠️ Auth subscription already exists, reusing');
      return;
    }

    const initializeAuth = async () => {
      try {
        console.log('🔍 Getting initial session');
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('❌ Error getting session:', error);
          if (isMounted) setLoading(false);
          return;
        }

        console.log('📋 Initial session:', session?.user?.email || 'No session');
        
        // Create auth state change listener (singleton)
        console.log('🔧 Creating auth state change listener');
        const { data: { subscription } } = supabase.auth.onAuthStateChange(handleAuthStateChange);
        authSubscriptionRef.current = subscription;
        
        // Handle initial session
        await handleAuthStateChange('INITIAL_SESSION', session);
        
      } catch (error) {
        console.error('💥 Error initializing auth:', error);
        if (isMounted) {
          setLoading(false);
          setCompanyError('Failed to initialize authentication.');
        }
      }
    };

    initializeAuth();

    // Add window focus listeners
    window.addEventListener('focus', handleWindowFocus);
    document.addEventListener('visibilitychange', handleWindowFocus);

    return () => {
      console.log('🧹 Cleaning up auth state listener');
      isMounted = false;
      
      // Clean up auth subscription (singleton cleanup)
      if (authSubscriptionRef.current) {
        authSubscriptionRef.current.unsubscribe();
        authSubscriptionRef.current = null;
      }
      
      window.removeEventListener('focus', handleWindowFocus);
      document.removeEventListener('visibilitychange', handleWindowFocus);
    };
  }, []); // Empty dependencies - singleton pattern

  return {
    user,
    session,
    loading,
    companyError,
    setCompanyError
  };
};