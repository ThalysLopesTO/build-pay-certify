
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { geocodeAddress, validateCoordinates } from '@/services/geocoding';

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

      // Handle coordinates (manual or geocoded)
      if (data.latitude !== undefined && data.longitude !== undefined) {
        // Manual coordinates provided - validate them
        if (validateCoordinates(data.latitude, data.longitude)) {
          insertData.latitude = data.latitude;
          insertData.longitude = data.longitude;
        } else {
          console.warn('Invalid coordinates provided, will attempt geocoding');
        }
      }

      // If no valid coordinates provided, try geocoding the address
      if (insertData.latitude === undefined || insertData.longitude === undefined) {
        try {
          console.log('Attempting to geocode address:', data.address);
          const geocodeResult = await geocodeAddress(data.address.trim());
          
          if ('latitude' in geocodeResult && 'longitude' in geocodeResult) {
            insertData.latitude = geocodeResult.latitude;
            insertData.longitude = geocodeResult.longitude;
            console.log('Geocoding successful:', geocodeResult);
          } else {
            console.warn('Geocoding failed:', geocodeResult.error);
            // Don't throw error - just save without coordinates
          }
        } catch (geocodeError) {
          console.warn('Geocoding error:', geocodeError);
          // Continue without coordinates - don't fail the entire operation
        }
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

      // Handle coordinates
      if (data.latitude !== undefined && data.longitude !== undefined) {
        if (validateCoordinates(data.latitude, data.longitude)) {
          updateData.latitude = data.latitude;
          updateData.longitude = data.longitude;
        } else {
          throw new Error('Invalid coordinates provided');
        }
      }

      // If address is being updated and no coordinates provided, try geocoding
      if (data.address?.trim() && data.latitude === undefined && data.longitude === undefined) {
        try {
          console.log('Address updated, attempting to geocode:', data.address);
          const geocodeResult = await geocodeAddress(data.address.trim());
          
          if ('latitude' in geocodeResult && 'longitude' in geocodeResult) {
            updateData.latitude = geocodeResult.latitude;
            updateData.longitude = geocodeResult.longitude;
            console.log('Geocoding successful for address update:', geocodeResult);
          } else {
            console.warn('Geocoding failed for address update:', geocodeResult.error);
          }
        } catch (geocodeError) {
          console.warn('Geocoding error during address update:', geocodeError);
        }
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

  const geocodeJobsiteAddress = useMutation({
    mutationFn: async ({ id, address }: { id: string; address: string }) => {
      console.log('Re-geocoding jobsite address:', id, address);
      
      if (!id || !address?.trim()) {
        throw new Error('Jobsite ID and address are required for geocoding');
      }

      const geocodeResult = await geocodeAddress(address.trim());
      
      if ('error' in geocodeResult) {
        throw new Error(geocodeResult.error);
      }

      // Update the jobsite with new coordinates
      const { error } = await supabase
        .from('jobsites')
        .update({
          latitude: geocodeResult.latitude,
          longitude: geocodeResult.longitude,
        })
        .eq('id', id);

      if (error) {
        console.error('Error updating jobsite coordinates:', error);
        throw new Error(error.message || 'Failed to update coordinates');
      }

      return geocodeResult;
    },
    onSuccess: (data) => {
      toast({
        title: 'Address Geocoded',
        description: `Coordinates updated: ${data.latitude.toFixed(6)}, ${data.longitude.toFixed(6)}`,
      });
      queryClient.invalidateQueries({ queryKey: ['jobsites', user?.companyId] });
    },
    onError: (error) => {
      console.error('Error geocoding address:', error);
      toast({
        title: 'Geocoding Failed',
        description: error.message || 'Failed to geocode address. Please try again.',
        variant: 'destructive',
      });
    },
  });

  return {
    addJobsite,
    updateJobsite,
    deleteJobsite,
    markJobsiteCompleted,
    reactivateJobsite,
    geocodeJobsiteAddress,
  };
};
