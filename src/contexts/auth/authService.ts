
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
      const { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .select('role')
        .eq('user_id', data.user.id)
        .single();

      if (profileError || !profile) {
        // Sign out the user since they shouldn't be logged in
        await supabase.auth.signOut();
        return { 
          error: { 
            message: "Unable to verify user role. Please contact your administrator." 
          } 
        };
      }

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
      
      // Wait a moment for the session to be properly set
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Verify the session is actually set
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        console.error('❌ Session not found after setting');
        return { error: { message: 'Session setup failed. Please try again.' } };
      }
      
      console.log('✅ Session successfully set and verified');
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
    
    // Sign out from Supabase first
    const { error } = await supabase.auth.signOut();
    
    if (error) {
      console.error('❌ Supabase signOut error:', error);
      throw error;
    }
    
    console.log('✅ Logout completed successfully');
    return { error: null };

  } catch (error) {
    console.error('💥 Logout error:', error);
    return { error };
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
