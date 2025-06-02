
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface JobsiteData {
  name: string;
  address: string;
}

export const useJobsiteActions = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const addJobsite = useMutation({
    mutationFn: async (data: JobsiteData) => {
      console.log('Adding jobsite:', data);
      const { error } = await supabase
        .from('jobsites')
        .insert({
          name: data.name,
          address: data.address,
        });

      if (error) {
        console.error('Error adding jobsite:', error);
        throw error;
      }
    },
    onSuccess: () => {
      toast({
        title: 'Jobsite Added',
        description: 'The new jobsite has been successfully added.',
      });
      queryClient.invalidateQueries({ queryKey: ['jobsites'] });
    },
    onError: (error) => {
      console.error('Error adding jobsite:', error);
      toast({
        title: 'Error',
        description: 'Failed to add jobsite. Please try again.',
        variant: 'destructive',
      });
    },
  });

  const deleteJobsite = useMutation({
    mutationFn: async (id: string) => {
      console.log('Deleting jobsite:', id);
      const { error } = await supabase
        .from('jobsites')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting jobsite:', error);
        throw error;
      }
    },
    onSuccess: () => {
      toast({
        title: 'Jobsite Deleted',
        description: 'The jobsite has been successfully deleted.',
      });
      queryClient.invalidateQueries({ queryKey: ['jobsites'] });
    },
    onError: (error) => {
      console.error('Error deleting jobsite:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete jobsite. Please try again.',
        variant: 'destructive',
      });
    },
  });

  return {
    addJobsite,
    deleteJobsite,
  };
};
