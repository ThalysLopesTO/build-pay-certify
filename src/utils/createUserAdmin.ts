
import { supabase } from '@/integrations/supabase/client';

export const createUserWithAdmin = async (email: string, password: string) => {
  try {
    const { data, error } = await supabase.functions.invoke('create-user-admin', {
      body: { email, password }
    });

    if (error) {
      console.error('Error invoking create-user-admin function:', error);
      return { error: error.message };
    }

    if (data.error) {
      console.error('Error from create-user-admin function:', data.error);
      return { error: data.error };
    }

    console.log('User created successfully:', data);
    return { success: true, user: data.user };
  } catch (error) {
    console.error('Unexpected error creating user:', error);
    return { error: 'Failed to create user' };
  }
};
