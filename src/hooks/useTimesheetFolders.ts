/* eslint-disable @typescript-eslint/no-explicit-any */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { toast } from 'sonner';
import type { ManualTimesheet } from './useManualTimesheets';

export interface TimesheetFolder {
  id: string;
  company_id: string;
  name: string;
  description: string | null;
  color: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
  item_count?: number;
}

const FOLDERS_KEY = ['manual-timesheet-folders'] as const;
const ITEMS_KEY = ['manual-timesheet-folder-items'] as const;

export const useTimesheetFolders = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const list = useQuery({
    queryKey: [...FOLDERS_KEY, user?.companyId],
    queryFn: async (): Promise<TimesheetFolder[]> => {
      if (!user?.companyId) return [];
      const { data: folders, error } = await supabase
        .from('manual_timesheet_folders' as any)
        .select('*')
        .eq('company_id', user.companyId)
        .order('created_at', { ascending: false });
      if (error) throw error;

      const { data: items } = await supabase
        .from('manual_timesheet_folder_items' as any)
        .select('folder_id')
        .eq('company_id', user.companyId);

      const counts = new Map<string, number>();
      ((items ?? []) as any[]).forEach((it) => {
        counts.set(it.folder_id, (counts.get(it.folder_id) ?? 0) + 1);
      });

      return ((folders ?? []) as any[]).map((f) => ({
        ...f,
        item_count: counts.get(f.id) ?? 0,
      })) as TimesheetFolder[];
    },
    enabled: !!user?.companyId,
  });

  const create = useMutation({
    mutationFn: async (input: { name: string; description?: string; color?: string }) => {
      if (!user?.companyId || !user?.id) throw new Error('Not authenticated');
      const { data, error } = await supabase
        .from('manual_timesheet_folders' as any)
        .insert({
          name: input.name,
          description: input.description || null,
          color: input.color || null,
          company_id: user.companyId,
          created_by: user.id,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: FOLDERS_KEY });
      toast.success('Folder created');
    },
    onError: (e: any) => toast.error('Failed to create folder', { description: e.message }),
  });

  const rename = useMutation({
    mutationFn: async ({ id, name, description, color }: { id: string; name: string; description?: string; color?: string }) => {
      const { error } = await supabase
        .from('manual_timesheet_folders' as any)
        .update({ name, description: description ?? null, color: color ?? null })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: FOLDERS_KEY });
      toast.success('Folder updated');
    },
    onError: (e: any) => toast.error('Failed to update folder', { description: e.message }),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('manual_timesheet_folders' as any)
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: FOLDERS_KEY });
      queryClient.invalidateQueries({ queryKey: ITEMS_KEY });
      toast.success('Folder deleted');
    },
    onError: (e: any) => toast.error('Failed to delete folder', { description: e.message }),
  });

  const moveTimesheets = useMutation({
    mutationFn: async ({ folderId, timesheetIds }: { folderId: string; timesheetIds: string[] }) => {
      if (!user?.companyId || !user?.id) throw new Error('Not authenticated');
      // Remove any existing memberships for these timesheets first
      await supabase
        .from('manual_timesheet_folder_items' as any)
        .delete()
        .in('timesheet_id', timesheetIds);
      const rows = timesheetIds.map((tid) => ({
        folder_id: folderId,
        timesheet_id: tid,
        company_id: user.companyId,
        moved_by: user.id,
      }));
      const { error } = await supabase
        .from('manual_timesheet_folder_items' as any)
        .insert(rows);
      if (error) throw error;
    },
    onSuccess: (_d, vars) => {
      queryClient.invalidateQueries({ queryKey: FOLDERS_KEY });
      queryClient.invalidateQueries({ queryKey: ITEMS_KEY });
      toast.success(`Moved ${vars.timesheetIds.length} timesheet${vars.timesheetIds.length > 1 ? 's' : ''} to folder`);
    },
    onError: (e: any) => toast.error('Failed to move timesheets', { description: e.message }),
  });

  return { list, create, rename, remove, moveTimesheets };
};

export const useFolderItems = (folderId: string | null) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const list = useQuery({
    queryKey: [...ITEMS_KEY, folderId],
    queryFn: async (): Promise<ManualTimesheet[]> => {
      if (!folderId || !user?.companyId) return [];
      const { data, error } = await supabase
        .from('manual_timesheet_folder_items' as any)
        .select('timesheet_id, manual_timesheets:timesheet_id(*)')
        .eq('folder_id', folderId);
      if (error) throw error;
      return ((data ?? []) as any[])
        .map((r) => r.manual_timesheets)
        .filter(Boolean) as ManualTimesheet[];
    },
    enabled: !!folderId && !!user?.companyId,
  });

  const removeItem = useMutation({
    mutationFn: async (timesheetId: string) => {
      const { error } = await supabase
        .from('manual_timesheet_folder_items' as any)
        .delete()
        .eq('timesheet_id', timesheetId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ITEMS_KEY });
      queryClient.invalidateQueries({ queryKey: FOLDERS_KEY });
      toast.success('Removed from folder');
    },
    onError: (e: any) => toast.error('Failed to remove', { description: e.message }),
  });

  return { list, removeItem };
};
