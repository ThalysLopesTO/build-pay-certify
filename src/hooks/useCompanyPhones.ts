import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { getActiveCompanyId } from '@/lib/auth/activeCompany';
import { useToast } from '@/hooks/use-toast';

export interface CompanyPhone {
  id: string;
  name: string;
  category: string;
  phone_number: string;
  extension?: string;
  notes?: string;
  company_id: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
  is_active: boolean;
}

export interface CreateCompanyPhone {
  name: string;
  category: string;
  phone_number: string;
  extension?: string;
  notes?: string;
}

export const useCompanyPhones = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const phonesQuery = useQuery({
    queryKey: ['company-phones'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('company_phones')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching company phones:', error);
        throw error;
      }

      return data as CompanyPhone[];
    },
  });

  const createPhoneMutation = useMutation({
    mutationFn: async (phoneData: CreateCompanyPhone) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const activeCompanyId = await getActiveCompanyId();

      if (!activeCompanyId) throw new Error('User profile not found');

      const { data, error } = await supabase
        .from('company_phones')
        .insert({
          ...phoneData,
          company_id: activeCompanyId,
          created_by: user.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['company-phones'] });
      toast({
        title: 'Success',
        description: 'Phone contact added successfully',
      });
    },
    onError: (error) => {
      console.error('Error creating phone contact:', error);
      toast({
        title: 'Error',
        description: 'Failed to add phone contact',
        variant: 'destructive',
      });
    },
  });

  const updatePhoneMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<CreateCompanyPhone> }) => {
      const { data, error } = await supabase
        .from('company_phones')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['company-phones'] });
      toast({
        title: 'Success',
        description: 'Phone contact updated successfully',
      });
    },
    onError: (error) => {
      console.error('Error updating phone contact:', error);
      toast({
        title: 'Error',
        description: 'Failed to update phone contact',
        variant: 'destructive',
      });
    },
  });

  const deletePhoneMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('company_phones')
        .update({ is_active: false })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['company-phones'] });
      toast({
        title: 'Success',
        description: 'Phone contact deleted successfully',
      });
    },
    onError: (error) => {
      console.error('Error deleting phone contact:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete phone contact',
        variant: 'destructive',
      });
    },
  });

  return {
    phones: phonesQuery.data || [],
    isLoading: phonesQuery.isLoading,
    isError: phonesQuery.isError,
    error: phonesQuery.error,
    createPhone: createPhoneMutation.mutateAsync,
    updatePhone: updatePhoneMutation.mutateAsync,
    deletePhone: deletePhoneMutation.mutateAsync,
    isCreating: createPhoneMutation.isPending,
    isUpdating: updatePhoneMutation.isPending,
    isDeleting: deletePhoneMutation.isPending,
  };
};