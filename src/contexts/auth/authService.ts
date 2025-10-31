
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
        .select('role, company_id, is_active')
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

      // Check if account is active
      if (profile.is_active === false) {
        console.error('❌ Account is archived/inactive');
        await supabase.auth.signOut();
        return { 
          error: { 
            message: "Your account has been deactivated. Please contact your administrator for assistance." 
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

    // Validate subscription status for username login
    if (data.session?.user) {
      const subscriptionCheck = await validateSubscriptionAtLogin(data.session.user.id, data.role);
      if (!subscriptionCheck.valid) {
        await supabase.auth.signOut();
        return {
          error: {
            message: subscriptionCheck.message || "Subscription expired. Please renew to continue."
          }
        };
      }
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
      // Clear any lingering storage
      localStorage.removeItem('supabase.auth.token');
      return { error: null };
    }
    
    // Sign out from Supabase with timeout
    try {
      const { error } = await Promise.race([
        supabase.auth.signOut(),
        new Promise<{ error: Error }>((_, reject) => 
          setTimeout(() => reject(new Error('Sign out timeout')), 3000)
        )
      ]);
      
      if (error) {
        console.warn('⚠️ Supabase signOut error:', error);
        // Don't throw error if it's just a session issue - user should still be logged out
        if (error.message?.includes('session_not_found') || error.message?.includes('invalid_session')) {
          console.log('📝 Session already expired, treating as successful logout');
        } else {
          console.warn('🔄 Continuing logout despite error');
        }
      }
    } catch (timeoutError) {
      console.warn('⏰ Logout timeout, continuing anyway:', timeoutError);
    }
    
    // Always clear storage regardless of Supabase response
    localStorage.removeItem('supabase.auth.token');
    sessionStorage.clear();
    
    console.log('✅ Logout completed successfully');
    return { error: null };

  } catch (error) {
    console.warn('💥 Logout error (continuing anyway):', error);
    // Always clear storage and return success - user should not be stuck
    localStorage.removeItem('supabase.auth.token');
    sessionStorage.clear();
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

// Validate subscription at login time
const validateSubscriptionAtLogin = async (userId: string, userRole?: string) => {
  // Super admins always have access
  if (userRole === 'super_admin') {
    return { valid: true };
  }

  try {
    const subscriptionData = await checkSubscriptionStatus();
    
    if (!subscriptionData) {
      console.warn('⚠️ Could not verify subscription status');
      return { valid: true }; // Allow access if check fails to avoid blocking users
    }

    const { 
      subscribed, 
      isTrialing, 
      isGracePeriod, 
      isSuperAdminCompany,
      subscriptionStatus 
    } = subscriptionData;

    // Allow access for super admin created companies
    if (isSuperAdminCompany) {
      console.log('✅ Super admin created company - access granted');
      return { valid: true };
    }

    // Allow access if subscription is active, trialing, or in grace period
    if (subscribed || isTrialing || isGracePeriod) {
      console.log('✅ Valid subscription status:', { subscribed, isTrialing, isGracePeriod });
      return { valid: true };
    }

    // Block access for invalid subscriptions
    console.error('❌ Invalid subscription:', subscriptionStatus);
    return { 
      valid: false, 
      message: 'Your subscription has expired. Please renew your subscription to continue using the service.' 
    };

  } catch (error) {
    console.error('Error validating subscription:', error);
    return { valid: true }; // Allow access on error to avoid blocking users
  }
};
