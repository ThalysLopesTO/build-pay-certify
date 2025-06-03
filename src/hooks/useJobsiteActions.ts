
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/SupabaseAuthContext';

interface JobsiteData {
  name: string;
  address: string;
}

export const useJobsiteActions = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const addJobsite = useMutation({
    mutationFn: async (data: JobsiteData) => {
      console.log('Adding jobsite:', data);
      
      if (!user?.companyId) {
        throw new Error('Company ID is required to add jobsites');
      }
      
      // Validate data before sending to database
      if (!data.name?.trim() || !data.address?.trim()) {
        throw new Error('Jobsite name and address are required');
      }

      const { data: result, error } = await supabase
        .from('jobsites')
        .insert({
          name: data.name.trim(),
          address: data.address.trim(),
          company_id: user.companyId,
        })
        .select();

      if (error) {
        console.error('Error adding jobsite:', error);
        
        // Provide more specific error messages
        if (error.code === '23505') {
          throw new Error('A jobsite with this name already exists');
        } else if (error.code === '42501') {
          throw new Error('You do not have permission to add jobsites');
        } else if (error.message?.includes('violates row-level security')) {
          throw new Error('Authentication required to add jobsites');
        } else {
          throw new Error(error.message || 'Failed to add jobsite');
        }
      }
      
      console.log('Jobsite added successfully:', result);
      return result;
    },
    onSuccess: (data) => {
      const jobsiteName = data?.[0]?.name || 'New jobsite';
      toast({
        title: 'Success!',
        description: `"${jobsiteName}" has been successfully added to the jobsites.`,
      });
      queryClient.invalidateQueries({ queryKey: ['jobsites', user?.companyId] });
    },
    onError: (error) => {
      console.error('Error adding jobsite:', error);
      toast({
        title: 'Error Adding Jobsite',
        description: error.message || 'Failed to add jobsite. Please try again.',
        variant: 'destructive',
      });
    },
  });

  const deleteJobsite = useMutation({
    mutationFn: async (id: string) => {
      console.log('Deleting jobsite:', id);
      
      if (!id) {
        throw new Error('Jobsite ID is required for deletion');
      }

      const { error } = await supabase
        .from('jobsites')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting jobsite:', error);
        
        if (error.code === '42501') {
          throw new Error('You do not have permission to delete jobsites');
        } else if (error.message?.includes('violates row-level security')) {
          throw new Error('Authentication required to delete jobsites');
        } else {
          throw new Error(error.message || 'Failed to delete jobsite');
        }
      }
    },
    onSuccess: () => {
      toast({
        title: 'Jobsite Deleted',
        description: 'The jobsite has been successfully removed.',
      });
      queryClient.invalidateQueries({ queryKey: ['jobsites', user?.companyId] });
    },
    onError: (error) => {
      console.error('Error deleting jobsite:', error);
      toast({
        title: 'Error Deleting Jobsite',
        description: error.message || 'Failed to delete jobsite. Please try again.',
        variant: 'destructive',
      });
    },
  });

  return {
    addJobsite,
    deleteJobsite,
  };
};
