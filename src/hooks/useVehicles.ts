
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useToast } from '@/hooks/use-toast';

export interface Vehicle {
  id: string;
  vehicle_name: string;
  vehicle_type: string;
  make: string;
  model: string;
  year: string;
  license_plate: string;
  vin: string;
  jobsite_id: string | null;
  status: string;
  notes: string;
  company_id: string;
  created_at: string;
  updated_at: string;
  jobsites?: {
    name: string;
    address: string | null;
  };
}

export interface CreateVehicle {
  vehicle_name: string;
  vehicle_type: string;
  make: string;
  model: string;
  year: string;
  license_plate: string;
  vin: string;
  jobsite_id?: string | null;
  status: string;
  notes: string;
}

export const useVehicles = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const vehiclesQuery = useQuery({
    queryKey: ['vehicles', user?.companyId],
    queryFn: async () => {
      console.log('Fetching vehicles for company:', user?.companyId);
      
      if (!user?.companyId) {
        console.log('No company ID available');
        return [];
      }

      const { data, error } = await supabase
        .from('vehicles')
        .select(`
          *,
          jobsites (
            name,
            address
          )
        `)
        .eq('company_id', user.companyId)
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching vehicles:', error);
        throw error;
      }
      
      console.log('Vehicles fetched:', data);
      return data as Vehicle[];
    },
    enabled: !!user?.companyId,
  });

  const createVehicleMutation = useMutation({
    mutationFn: async (newVehicle: CreateVehicle) => {
      console.log('Creating vehicle:', newVehicle);
      
      const { data, error } = await supabase
        .from('vehicles')
        .insert([{
          ...newVehicle,
          jobsite_id: newVehicle.jobsite_id === 'unassigned' ? null : newVehicle.jobsite_id,
          company_id: user?.companyId,
        }])
        .select(`
          *,
          jobsites (
            name,
            address
          )
        `)
        .single();

      if (error) {
        console.error('Error creating vehicle:', error);
        throw error;
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      toast({
        title: "Success",
        description: "Vehicle added successfully",
      });
    },
    onError: (error) => {
      console.error('Failed to create vehicle:', error);
      toast({
        title: "Error",
        description: "Failed to add vehicle",
        variant: "destructive",
      });
    },
  });

  const updateVehicleMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<CreateVehicle> }) => {
      console.log('Updating vehicle:', id, updates);
      
      const { data, error } = await supabase
        .from('vehicles')
        .update(updates)
        .eq('id', id)
        .select(`
          *,
          jobsites (
            name,
            address
          )
        `)
        .single();

      if (error) {
        console.error('Error updating vehicle:', error);
        throw error;
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      toast({
        title: "Success",
        description: "Vehicle updated successfully",
      });
    },
    onError: (error) => {
      console.error('Failed to update vehicle:', error);
      toast({
        title: "Error",
        description: "Failed to update vehicle",
        variant: "destructive",
      });
    },
  });

  const deleteVehicleMutation = useMutation({
    mutationFn: async (id: string) => {
      console.log('Deleting vehicle:', id);
      
      const { error } = await supabase
        .from('vehicles')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting vehicle:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      toast({
        title: "Success",
        description: "Vehicle deleted successfully",
      });
    },
    onError: (error) => {
      console.error('Failed to delete vehicle:', error);
      toast({
        title: "Error",
        description: "Failed to delete vehicle",
        variant: "destructive",
      });
    },
  });

  return {
    vehicles: vehiclesQuery.data || [],
    isLoading: vehiclesQuery.isLoading,
    error: vehiclesQuery.error,
    createVehicle: createVehicleMutation.mutateAsync,
    updateVehicle: updateVehicleMutation.mutateAsync,
    deleteVehicle: deleteVehicleMutation.mutateAsync,
    isCreating: createVehicleMutation.isPending,
    isUpdating: updateVehicleMutation.isPending,
    isDeleting: deleteVehicleMutation.isPending,
  };
};
