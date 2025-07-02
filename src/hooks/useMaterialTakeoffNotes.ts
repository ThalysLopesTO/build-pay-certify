
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { toast } from 'react-hot-toast';

export interface MaterialTakeoffNote {
  id: string;
  jobsite_id: string;
  company_id: string;
  takeoff_notes: string;
  created_at: string;
  updated_at: string;
  created_by: string;
  updated_by?: string;
  jobsite_name: string;
  jobsite_address?: string;
}

export const useMaterialTakeoffNotes = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: notes = [], isLoading, error } = useQuery({
    queryKey: ['material-takeoff-notes', user?.companyId],
    queryFn: async () => {
      console.log('Fetching material takeoff notes for company:', user?.companyId);
      
      if (!user?.companyId) {
        console.log('No company ID found, returning empty array');
        return [];
      }
      
      const { data, error } = await supabase.rpc('get_material_takeoff_notes', {
        p_company_id: user.companyId
      });

      if (error) {
        console.error('Error fetching material takeoff notes:', error);
        throw error;
      }
      
      console.log('Fetched material takeoff notes:', data);
      return data as MaterialTakeoffNote[];
    },
    enabled: !!user?.companyId,
  });

  const createOrUpdateNote = useMutation({
    mutationFn: async ({ jobsiteId, notes }: { jobsiteId: string; notes: string }) => {
      if (!user?.companyId || !user?.id) throw new Error('User not authenticated');

      console.log('Creating/updating note for jobsite:', jobsiteId, 'with company:', user.companyId);

      // First, check if a note already exists for this jobsite
      const { data: existing } = await supabase
        .from('material_takeoff_notes')
        .select('id')
        .eq('jobsite_id', jobsiteId)
        .eq('company_id', user.companyId)
        .single();

      if (existing) {
        console.log('Updating existing note:', existing.id);
        // Update existing note
        const { error } = await supabase
          .from('material_takeoff_notes')
          .update({ takeoff_notes: notes })
          .eq('id', existing.id);
        
        if (error) throw error;
      } else {
        console.log('Creating new note');
        // Create new note
        const { error } = await supabase
          .from('material_takeoff_notes')
          .insert({
            jobsite_id: jobsiteId,
            company_id: user.companyId,
            takeoff_notes: notes,
            created_by: user.id
          });
        
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['material-takeoff-notes'] });
      toast.success('Material takeoff notes saved successfully');
    },
    onError: (error) => {
      console.error('Error saving material takeoff notes:', error);
      toast.error('Failed to save material takeoff notes');
    },
  });

  const deleteNote = useMutation({
    mutationFn: async (id: string) => {
      console.log('Deleting note:', id);
      const { error } = await supabase
        .from('material_takeoff_notes')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['material-takeoff-notes'] });
      toast.success('Material takeoff notes deleted successfully');
    },
    onError: (error) => {
      console.error('Error deleting material takeoff notes:', error);
      toast.error('Failed to delete material takeoff notes');
    },
  });

  const getNoteByJobsite = (jobsiteId: string) => {
    return notes.find(note => note.jobsite_id === jobsiteId);
  };

  return {
    notes,
    isLoading,
    error,
    createOrUpdateNote,
    deleteNote,
    getNoteByJobsite,
  };
};
