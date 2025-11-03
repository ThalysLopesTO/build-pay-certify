import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useToast } from '@/hooks/use-toast';
import { 
  EquipmentUsageLog, 
  AssignEquipmentInput, 
  ReturnEquipmentInput,
  UsageFilters,
  UsageStats
} from '@/types/equipment-usage';
import { fromCompanyTimezone } from '@/utils/timezone';
import { useCompanySettings } from '@/hooks/useCompanySettings';

export const useEquipmentUsage = (filters?: UsageFilters) => {
  const { user } = useAuth();
  const { settings: companySettings } = useCompanySettings();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const usageQuery = useQuery({
    queryKey: ['equipment-usage', user?.companyId, filters],
    queryFn: async () => {
      let query = supabase
        .from('equipment_usage_log')
        .select(`
          *,
          equipment:inventory!equipment_id(equipment_name, brand, sku),
          employee:user_profiles!employee_id(first_name, last_name, photo_url),
          jobsite:jobsites!jobsite_id(name),
          assigner:user_profiles!assigned_by(first_name, last_name)
        `)
        .eq('company_id', user?.companyId)
        .order('start_time', { ascending: false });

      if (filters?.status && filters.status !== 'all') {
        query = query.eq('status', filters.status);
      }
      if (filters?.jobsite_id) {
        query = query.eq('jobsite_id', filters.jobsite_id);
      }
      if (filters?.employee_id) {
        query = query.eq('employee_id', filters.employee_id);
      }
      if (filters?.date_from) {
        query = query.gte('start_time', filters.date_from);
      }
      if (filters?.date_to) {
        query = query.lte('start_time', filters.date_to);
      }

      const { data, error } = await query;
      if (error) throw error;

      let filteredData = data || [];
      if (filters?.search) {
        const searchLower = filters.search.toLowerCase();
        filteredData = filteredData.filter(log =>
          log.equipment?.equipment_name?.toLowerCase().includes(searchLower) ||
          log.employee?.first_name?.toLowerCase().includes(searchLower) ||
          log.employee?.last_name?.toLowerCase().includes(searchLower) ||
          log.jobsite?.name?.toLowerCase().includes(searchLower)
        );
      }

      return filteredData as EquipmentUsageLog[];
    },
    enabled: !!user?.companyId,
  });

  const statsQuery = useQuery({
    queryKey: ['equipment-usage-stats', user?.companyId],
    queryFn: async () => {
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      
      const { data, error } = await supabase
        .from('equipment_usage_log')
        .select('status, return_time, start_time')
        .eq('company_id', user?.companyId);

      if (error) throw error;

      const stats: UsageStats = {
        currently_assigned: data.filter(log => log.status === 'in_use').length,
        returned_today: data.filter(log => 
          log.status === 'returned' && 
          log.return_time && 
          new Date(log.return_time) >= todayStart
        ).length,
        pending_return: data.filter(log => 
          log.status === 'in_use' &&
          log.start_time &&
          new Date(log.start_time) < todayStart
        ).length,
        damaged_lost_today: data.filter(log => 
          (log.status === 'damaged' || log.status === 'lost') &&
          log.return_time &&
          new Date(log.return_time) >= todayStart
        ).length,
      };

      return stats;
    },
    enabled: !!user?.companyId,
  });

  const assignMutation = useMutation({
    mutationFn: async (input: AssignEquipmentInput) => {
      // Check if equipment is already assigned to someone
      const { data: existing, error: checkError } = await supabase
        .from('equipment_usage_log')
        .select('*, employee:user_profiles!employee_id(first_name, last_name)')
        .eq('equipment_id', input.equipment_id)
        .eq('status', 'in_use')
        .maybeSingle();

      if (checkError) throw checkError;

      if (existing) {
        const employeeName = existing.employee 
          ? `${existing.employee.first_name} ${existing.employee.last_name}`
          : 'another employee';
        throw new Error(`This equipment is already assigned to ${employeeName}`);
      }

      const { data, error } = await supabase
        .from('equipment_usage_log')
        .insert({
          company_id: user?.companyId,
          equipment_id: input.equipment_id,
          employee_id: input.employee_id,
          jobsite_id: input.jobsite_id,
          assigned_by: user?.id,
          start_time: input.start_time || (() => {
            const now = new Date();
            const timezone = companySettings?.timezone || 'America/Toronto';
            const utcDate = fromCompanyTimezone(now, timezone);
            return utcDate.toISOString();
          })(),
          notes: input.notes,
          status: 'in_use',
        })
        .select(`
          *,
          equipment:inventory!equipment_id(equipment_name, brand, sku),
          employee:user_profiles!employee_id(first_name, last_name, photo_url),
          jobsite:jobsites!jobsite_id(name),
          assigner:user_profiles!assigned_by(first_name, last_name)
        `)
        .single();

      if (error) throw error;
      return data;
    },
    onMutate: async (input) => {
      await queryClient.cancelQueries({ queryKey: ['equipment-usage', user?.companyId, filters] });
      
      const previousData = queryClient.getQueryData(['equipment-usage', user?.companyId, filters]);
      
      const optimisticRecord: EquipmentUsageLog = {
        id: `temp-${Date.now()}`,
        company_id: user?.companyId || '',
        equipment_id: input.equipment_id,
        employee_id: input.employee_id,
        jobsite_id: input.jobsite_id,
        assigned_by: user?.id || '',
        start_time: input.start_time || new Date().toISOString(),
        return_time: null,
        status: 'in_use',
        notes: input.notes || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      
      queryClient.setQueryData(['equipment-usage', user?.companyId, filters], (old: any) => {
        return [optimisticRecord, ...(old || [])];
      });
      
      return { previousData };
    },
    onError: (err, variables, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(['equipment-usage', user?.companyId, filters], context.previousData);
      }
      toast({
        title: 'Assignment Failed',
        description: err.message,
        variant: 'destructive',
      });
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['equipment-usage', user?.companyId, filters], (old: any) => {
        const filtered = (old || []).filter((item: any) => !item.id.startsWith('temp-'));
        return [data, ...filtered];
      });
      
      queryClient.invalidateQueries({ queryKey: ['equipment-usage'] });
      queryClient.invalidateQueries({ queryKey: ['equipment-usage-stats'] });
      queryClient.invalidateQueries({ queryKey: ['active-equipment-assignments'] });
      
      toast({
        title: 'Equipment Assigned',
        description: 'Equipment has been successfully assigned.',
      });
    },
  });

  const returnMutation = useMutation({
    mutationFn: async (input: ReturnEquipmentInput) => {
      const { data, error } = await supabase
        .from('equipment_usage_log')
        .update({
          status: input.status,
          return_time: input.return_time || new Date().toISOString(),
          notes: input.notes,
        })
        .eq('id', input.usage_id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['equipment-usage'] });
      queryClient.invalidateQueries({ queryKey: ['equipment-usage-stats'] });
      queryClient.invalidateQueries({ queryKey: ['active-equipment-assignments'] });
      toast({
        title: 'Equipment Returned',
        description: 'Equipment status has been updated.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Return Failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (input: { id: string; updates: Partial<AssignEquipmentInput> }) => {
      const { data, error } = await supabase
        .from('equipment_usage_log')
        .update({
          equipment_id: input.updates.equipment_id,
          employee_id: input.updates.employee_id,
          jobsite_id: input.updates.jobsite_id,
          start_time: input.updates.start_time,
          notes: input.updates.notes,
          updated_at: new Date().toISOString(),
        })
        .eq('id', input.id)
        .select(`
          *,
          equipment:inventory!equipment_id(equipment_name, brand, sku),
          employee:user_profiles!employee_id(first_name, last_name, photo_url),
          jobsite:jobsites!jobsite_id(name),
          assigner:user_profiles!assigned_by(first_name, last_name)
        `)
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['equipment-usage'] });
      toast({
        title: 'Usage Log Updated',
        description: 'Changes saved successfully.',
      });
    },
    onError: (error: Error) => {
      console.error('Update equipment usage error:', error);
      toast({
        title: 'Update Failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (usageId: string) => {
      const { error } = await supabase
        .from('equipment_usage_log')
        .delete()
        .eq('id', usageId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['equipment-usage'] });
      queryClient.invalidateQueries({ queryKey: ['equipment-usage-stats'] });
      toast({
        title: 'Usage Log Deleted',
        description: 'Record removed successfully.',
      });
    },
    onError: (error: Error) => {
      console.error('Delete equipment usage error:', error);
      toast({
        title: 'Delete Failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const getEquipmentHistory = async (equipmentId: string) => {
    const { data, error } = await supabase
      .from('equipment_usage_log')
      .select(`
        *,
        employee:user_profiles!employee_id(first_name, last_name, photo_url),
        jobsite:jobsites!jobsite_id(name)
      `)
      .eq('equipment_id', equipmentId)
      .eq('company_id', user?.companyId)
      .order('start_time', { ascending: false });

    if (error) throw error;
    return data as EquipmentUsageLog[];
  };

  return {
    usageLogs: usageQuery.data || [],
    stats: statsQuery.data,
    isLoading: usageQuery.isLoading || statsQuery.isLoading,
    isAssigning: assignMutation.isPending,
    isReturning: returnMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
    assignEquipment: (data: AssignEquipmentInput) => assignMutation.mutateAsync(data),
    returnEquipment: returnMutation.mutate,
    updateUsageLog: (id: string, updates: Partial<AssignEquipmentInput>) => 
      updateMutation.mutateAsync({ id, updates }),
    deleteUsageLog: deleteMutation.mutate,
    getEquipmentHistory,
  };
};
