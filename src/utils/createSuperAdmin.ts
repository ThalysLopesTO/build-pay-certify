
import { supabase } from '@/integrations/supabase/client';

interface CreateSuperAdminParams {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
}

export const createSuperAdminUser = async (params: CreateSuperAdminParams = {
  email: 'testsuperadmin@groundzero.ca',
  password: 'Test1234!'
}) => {
  try {
    const { data, error } = await supabase.functions.invoke('create-super-admin', {
      body: { 
        email: params.email, 
        password: params.password,
        firstName: params.firstName,
        lastName: params.lastName
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

// Specific function for creating Thalys's account
export const createThalysAdminUser = async () => {
  return createSuperAdminUser({
    email: 'thalyslopesdev@gmail.com',
    password: 'Admin@1234',
    firstName: 'Thalys',
    lastName: 'Lopes'
  });
};
