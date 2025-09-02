import { supabase } from '@/integrations/supabase/client';

export const createGovanBrownAdmin = async () => {
  try {
    const { data, error } = await supabase.functions.invoke('create-super-admin', {
      body: { 
        email: 'jamie.pereira@govanbrown.com',
        password: 'Summer2025',
        firstName: 'Jamie',
        lastName: 'Pereira',
        companyId: 'b3a42958-37f1-42cb-8cc3-f18c4adc3520'
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

    console.log('Govan Brown admin user created successfully:', data);
    return { success: true, data };
  } catch (error) {
    console.error('Unexpected error creating Govan Brown admin:', error);
    return { error: 'Failed to create Govan Brown admin user' };
  }
};