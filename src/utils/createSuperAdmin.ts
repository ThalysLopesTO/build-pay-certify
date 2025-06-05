
import { supabase } from '@/integrations/supabase/client';

export const createSuperAdminUser = async () => {
  try {
    const { data, error } = await supabase.functions.invoke('create-super-admin', {
      body: { 
        email: 'testsuperadmin@groundzero.ca', 
        password: 'Test1234!' 
      }
    });

    if (error) {
      console.error('Error invoking create-super-admin function:', error);
      return { error: error.message };
    }

    if (data.error) {
      console.error('Error from create-super-admin function:', data.error);
      return { error: data.error };
    }

    console.log('Super Admin user created successfully:', data);
    return { success: true, data };
  } catch (error) {
    console.error('Unexpected error creating super admin:', error);
    return { error: 'Failed to create Super Admin user' };
  }
};
