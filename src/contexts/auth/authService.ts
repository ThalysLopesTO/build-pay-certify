
import { supabase } from '@/integrations/supabase/client';

export const login = async (email: string, password: string, expectedRole?: 'employee' | 'admin') => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  });

  if (error) {
    return { error };
  }

  // If role verification is requested, check the user's role
  if (expectedRole && data.user) {
    try {
      console.log('🔍 Verifying user role for:', data.user.email, 'Expected role:', expectedRole);
      
      const { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .select('role, company_id')
        .eq('user_id', data.user.id)
        .single();

      console.log('📊 Profile query result:', { profile, profileError });

      if (profileError) {
        console.error('❌ Profile error details:', profileError);
        // Sign out the user since they shouldn't be logged in
        await supabase.auth.signOut();
        return { 
          error: { 
            message: `Profile access error: ${profileError.message}. Please contact your administrator.` 
          } 
        };
      }

      if (!profile) {
        console.error('❌ No profile found for user');
        // Sign out the user since they shouldn't be logged in
        await supabase.auth.signOut();
        return { 
          error: { 
            message: "User profile not found. Please contact your administrator." 
          } 
        };
      }

      console.log('✅ User profile found:', profile);

      // Check role compatibility
      if (expectedRole === 'employee' && profile.role !== 'employee') {
        await supabase.auth.signOut();
        return { 
          error: { 
            message: "This login page is for employees only. Please use the Company Login page." 
          } 
        };
      }

      if (expectedRole === 'admin' && profile.role === 'employee') {
        await supabase.auth.signOut();
        return { 
          error: { 
            message: "This login page is for company/admin users only. Please use the Employee Login page." 
          } 
        };
      }
    } catch (err) {
      await supabase.auth.signOut();
      return { 
        error: { 
          message: "Authentication verification failed. Please try again." 
        } 
      };
    }
  }

  return { error: null };
};

export const loginWithUsername = async (username: string, password: string, expectedRole?: 'employee' | 'admin') => {
  try {
    const { data, error } = await supabase.functions.invoke('authenticate-username', {
      body: {
        username,
        password,
        expectedRole
      }
    });

    if (error) {
      console.error('Username authentication error:', error);
      return { error: { message: 'Authentication failed. Please try again.' } };
    }

    if (!data.success) {
      return { error: { message: data.error || 'Authentication failed' } };
    }

    // Set the session from the response
    if (data.session) {
      console.log('🔄 Setting session from username login response');
      const { error: sessionError } = await supabase.auth.setSession(data.session);
      if (sessionError) {
        console.error('Error setting session:', sessionError);
        return { error: { message: 'Session setup failed. Please try again.' } };
      }
      
      // Force a session refresh to trigger auth state change
      console.log('🔄 Refreshing session to trigger auth state change');
      const { error: refreshError } = await supabase.auth.refreshSession();
      if (refreshError) {
        console.warn('Session refresh warning:', refreshError);
      }
      
      // Wait a moment for the auth state to update
      await new Promise(resolve => setTimeout(resolve, 200));
      
      console.log('✅ Session setup completed');
    }

    return { error: null };
  } catch (err) {
    console.error('Username login error:', err);
    return { 
      error: { 
        message: "Authentication failed. Please check your credentials and try again." 
      } 
    };
  }
};

export const signUp = async (email: string, password: string) => {
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

export const logout = async () => {
  try {
    console.log('🚪 Starting logout process...');
    
    // Check if we have a session first
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      console.log('📝 No active session found, treating as successful logout');
      return { error: null };
    }
    
    // Sign out from Supabase
    const { error } = await supabase.auth.signOut();
    
    if (error) {
      console.warn('⚠️ Supabase signOut error:', error);
      // Don't throw error if it's just a session issue - user should still be logged out
      if (error.message?.includes('session_not_found') || error.message?.includes('invalid_session')) {
        console.log('📝 Session already expired, treating as successful logout');
        return { error: null };
      }
      // For other errors, still return success but log the warning
      console.warn('🔄 Continuing logout despite error');
    }
    
    console.log('✅ Logout completed successfully');
    return { error: null };

  } catch (error) {
    console.warn('💥 Logout error (continuing anyway):', error);
    // Always return success for logout - user should not be stuck
    return { error: null };
  }
};

// New function to check subscription status after login
export const checkSubscriptionStatus = async () => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return null;

    const { data, error } = await supabase.functions.invoke('check-subscription', {
      headers: {
        Authorization: `Bearer ${session.access_token}`,
      },
    });

    if (error) {
      console.warn('Failed to check subscription status:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error checking subscription status:', error);
    return null;
  }
};
