
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/SupabaseAuthContext';
// Geocoding removed for faster jobsite creation

interface JobsiteData {
  name: string;
  address: string;
  starting_date?: string;
  latitude?: number;
  longitude?: number;
}

export const useJobsiteActions = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const addJobsite = useMutation({
    mutationFn: async (data: JobsiteData) => {
      console.log('Adding jobsite:', data);
      console.log('User object:', user);
      console.log('User companyId:', user?.companyId);
      
      if (!user?.companyId) {
        console.error('Missing company ID in user object:', user);
        throw new Error('Company ID is required to add jobsites');
      }
      
      // Validate data before sending to database
      if (!data.name?.trim() || !data.address?.trim()) {
        throw new Error('Jobsite name and address are required');
      }

      const insertData: any = {
        name: data.name.trim(),
        address: data.address.trim(),
        company_id: user.companyId,
      };

      // Add starting_date if provided
      if (data.starting_date) {
        insertData.starting_date = data.starting_date;
      }

      // Add coordinates if provided
      if (data.latitude !== undefined && data.longitude !== undefined) {
        insertData.latitude = data.latitude;
        insertData.longitude = data.longitude;
      }

      const { data: result, error } = await supabase
        .from('jobsites')
        .insert(insertData)
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

      // Check for dependencies first
      const dependencyChecks = await Promise.all([
        supabase.from('material_requests').select('id', { count: 'exact', head: true }).eq('jobsite_id', id),
        supabase.from('timesheets').select('id', { count: 'exact', head: true }).eq('jobsite_id', id),
        supabase.from('inventory').select('id', { count: 'exact', head: true }).eq('jobsite_id', id),
      ]);

      const hasDependencies = dependencyChecks.some(check => (check.count || 0) > 0);
      if (hasDependencies) {
        throw new Error('Cannot delete jobsite: it has associated records. Please use the cascade delete option.');
      }

      const { error } = await supabase
        .from('jobsites')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting jobsite:', error);
        
        if (error.code === '23503') {
          throw new Error('Cannot delete jobsite: it has associated records. Use the enhanced delete dialog to handle dependencies.');
        } else if (error.code === '42501') {
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

  const archiveJobsite = useMutation({
    mutationFn: async (id: string) => {
      console.log('Archiving jobsite:', id);
      
      if (!id) {
        throw new Error('Jobsite ID is required for archiving');
      }

      const { error } = await supabase
        .from('jobsites')
        .update({ 
          status: 'archived',
          completion_date: new Date().toISOString().split('T')[0]
        })
        .eq('id', id);

      if (error) {
        console.error('Error archiving jobsite:', error);
        throw new Error(error.message || 'Failed to archive jobsite');
      }
    },
    onSuccess: () => {
      toast({
        title: 'Jobsite Archived',
        description: 'The jobsite has been archived and hidden from active lists.',
      });
      queryClient.invalidateQueries({ queryKey: ['jobsites', user?.companyId] });
    },
    onError: (error) => {
      console.error('Error archiving jobsite:', error);
      toast({
        title: 'Error Archiving Jobsite',
        description: error.message || 'Failed to archive jobsite. Please try again.',
        variant: 'destructive',
      });
    },
  });

  const cascadeDeleteJobsite = useMutation({
    mutationFn: async (id: string) => {
      console.log('Cascade deleting jobsite:', id);
      
      if (!id) {
        throw new Error('Jobsite ID is required for deletion');
      }

      // Delete associated records in the correct order to avoid foreign key violations
      
      // First get related record IDs
      const { data: materialRequestIds } = await supabase
        .from('material_requests')
        .select('id')
        .eq('jobsite_id', id);

      const { data: attentionReportIds } = await supabase
        .from('attention_reports')
        .select('id')
        .eq('jobsite_id', id);

      // Delete nested dependencies first
      if (materialRequestIds?.length) {
        const mrIds = materialRequestIds.map(mr => mr.id);
        await supabase.from('material_request_attachments').delete().in('material_request_id', mrIds);
      }

      if (attentionReportIds?.length) {
        const arIds = attentionReportIds.map(ar => ar.id);
        await supabase.from('attention_report_attachments').delete().in('report_id', arIds);
      }

      // Delete main associated records
      const deletions = [
        supabase.from('material_requests').delete().eq('jobsite_id', id),
        supabase.from('timesheets').delete().eq('jobsite_id', id),
        supabase.from('weekly_timesheets').delete().eq('jobsite_id', id),
        supabase.from('inventory').delete().eq('jobsite_id', id),
        supabase.from('attention_reports').delete().eq('jobsite_id', id),
        supabase.from('daily_reports').delete().eq('jobsite_id', id),
        supabase.from('missed_punch_requests').delete().eq('jobsite_id', id),
        supabase.from('material_takeoff_notes').delete().eq('jobsite_id', id),
        supabase.from('jobsite_foremen').delete().eq('jobsite_id', id),
        supabase.from('jobsite_tasks').delete().eq('jobsite_id', id),
        supabase.from('invoices').update({ jobsite_id: null }).eq('jobsite_id', id),
        supabase.from('audit_logs').delete().or(`original_jobsite_id.eq.${id},new_jobsite_id.eq.${id}`),
      ];

      // Execute all deletions
      for (const deletion of deletions) {
        const { error } = await deletion;
        if (error) {
          console.error('Error in cascade deletion:', error);
          throw new Error(`Failed to delete associated records: ${error.message}`);
        }
      }

      // Finally delete the jobsite itself
      const { error: jobsiteError } = await supabase
        .from('jobsites')
        .delete()
        .eq('id', id);

      if (jobsiteError) {
        console.error('Error deleting jobsite:', jobsiteError);
        throw new Error(jobsiteError.message || 'Failed to delete jobsite');
      }
    },
    onSuccess: () => {
      toast({
        title: 'Jobsite and All Data Deleted',
        description: 'The jobsite and all associated records have been permanently removed.',
      });
      queryClient.invalidateQueries({ queryKey: ['jobsites', user?.companyId] });
    },
    onError: (error) => {
      console.error('Error cascade deleting jobsite:', error);
      toast({
        title: 'Error Deleting Jobsite',
        description: error.message || 'Failed to delete jobsite and associated records. Please try again.',
        variant: 'destructive',
      });
    },
  });

  const markJobsiteCompleted = useMutation({
    mutationFn: async (id: string) => {
      console.log('Marking jobsite as completed:', id);
      
      if (!id) {
        throw new Error('Jobsite ID is required');
      }

      const { error } = await supabase
        .from('jobsites')
        .update({ 
          status: 'completed',
          completion_date: new Date().toISOString().split('T')[0]
        })
        .eq('id', id);

      if (error) {
        console.error('Error marking jobsite as completed:', error);
        throw new Error(error.message || 'Failed to mark jobsite as completed');
      }
    },
    onSuccess: () => {
      toast({
        title: 'Jobsite Completed',
        description: 'The jobsite has been marked as completed.',
      });
      queryClient.invalidateQueries({ queryKey: ['jobsites', user?.companyId] });
    },
    onError: (error) => {
      console.error('Error marking jobsite as completed:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to mark jobsite as completed. Please try again.',
        variant: 'destructive',
      });
    },
  });

  const reactivateJobsite = useMutation({
    mutationFn: async (id: string) => {
      console.log('Reactivating jobsite:', id);
      
      if (!id) {
        throw new Error('Jobsite ID is required');
      }

      const { error } = await supabase
        .from('jobsites')
        .update({ 
          status: 'active',
          completion_date: null
        })
        .eq('id', id);

      if (error) {
        console.error('Error reactivating jobsite:', error);
        throw new Error(error.message || 'Failed to reactivate jobsite');
      }
    },
    onSuccess: () => {
      toast({
        title: 'Jobsite Reactivated',
        description: 'The jobsite has been reactivated.',
      });
      queryClient.invalidateQueries({ queryKey: ['jobsites', user?.companyId] });
    },
    onError: (error) => {
      console.error('Error reactivating jobsite:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to reactivate jobsite. Please try again.',
        variant: 'destructive',
      });
    },
  });

  const updateJobsite = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<JobsiteData> }) => {
      console.log('Updating jobsite:', id, data);
      
      if (!id) {
        throw new Error('Jobsite ID is required for update');
      }

      const updateData: any = {};

      // Handle basic fields
      if (data.name?.trim()) {
        updateData.name = data.name.trim();
      }
      
      if (data.address?.trim()) {
        updateData.address = data.address.trim();
      }
      
      if (data.starting_date) {
        updateData.starting_date = data.starting_date;
      }

      // Handle coordinates if provided
      if (data.latitude !== undefined && data.longitude !== undefined) {
        updateData.latitude = data.latitude;
        updateData.longitude = data.longitude;
      }

      const { error } = await supabase
        .from('jobsites')
        .update(updateData)
        .eq('id', id);

      if (error) {
        console.error('Error updating jobsite:', error);
        throw new Error(error.message || 'Failed to update jobsite');
      }
    },
    onSuccess: () => {
      toast({
        title: 'Jobsite Updated',
        description: 'The jobsite has been successfully updated.',
      });
      queryClient.invalidateQueries({ queryKey: ['jobsites', user?.companyId] });
    },
    onError: (error) => {
      console.error('Error updating jobsite:', error);
      toast({
        title: 'Error Updating Jobsite',
        description: error.message || 'Failed to update jobsite. Please try again.',
        variant: 'destructive',
      });
    },
  });

  // Geocoding function removed for simpler jobsite management

  return {
    addJobsite,
    updateJobsite,
    deleteJobsite,
    archiveJobsite,
    cascadeDeleteJobsite,
    markJobsiteCompleted,
    reactivateJobsite,
  };
};
