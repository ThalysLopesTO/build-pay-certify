
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
    
    // Clear any local storage first
    localStorage.removeItem('supabase.auth.token');
    
    // Sign out from Supabase
    const { error } = await supabase.auth.signOut();
    
    if (error) {
      console.warn('⚠️ Supabase signOut error (continuing anyway):', error);
      // Don't throw error here - we still want to clear local state
    }
    
    console.log('✅ Logout completed');
    return { error: null };
  } catch (error) {
    console.error('💥 Logout error:', error);
    // Even if there's an error, we should clear local state
    return { error };
  }
};
