
import { supabase } from '@/integrations/supabase/client';

export const login = async (email: string, password: string) => {
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password
  });
  return { error };
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

// Enhanced function to check subscription status after login
export const checkSubscriptionStatus = async () => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return null;

    console.log('🔄 Checking subscription status post-login...');
    
    const { data, error } = await supabase.functions.invoke('sync-stripe-subscription', {
      headers: {
        Authorization: `Bearer ${session.access_token}`,
      },
    });

    if (error) {
      console.warn('Failed to sync subscription:', error);
      return null;
    }

    console.log('✅ Subscription status synced:', data);
    
    // Return subscription data for routing decisions
    return data;
  } catch (error) {
    console.error('Error checking subscription status:', error);
    return null;
  }
};
