/* eslint-disable @typescript-eslint/no-explicit-any */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { toast } from 'sonner';

const BUCKET = 'expense-attachments';
const FOLDER = 'site-inspections';

export interface SiteInspectionSignature {
  dataUrl?: string | null;
  printedName?: string | null;
  date?: string | null;
}

export interface SiteInspectionSignatures {
  supervisor?: SiteInspectionSignature;
  crewLeader?: SiteInspectionSignature;
  client?: SiteInspectionSignature;
}

export interface SiteInspectionQualityControl {
  moisture_meter?: string;
  final_moisture_reading?: string;
  photos_uploaded?: 'yes' | 'no' | '';
  customer_walkthrough?: 'yes' | 'no' | '';
  deficiencies_found?: 'yes' | 'no' | '';
  corrective_actions?: 'yes' | 'no' | '';
}

export interface SiteInspectionPhoto {
  id: string;
  inspection_id: string;
  file_name: string;
  file_path: string;
  caption: string | null;
  sort_order: number;
  uploaded_by: string | null;
  created_at: string;
}

export interface SiteInspection {
  id: string;
  company_id: string;
  jobsite_id: string | null;
  inspection_date: string;
  client_name: string | null;
  client_email: string | null;
  insurance_company: string | null;
  adjuster: string | null;
  claim_number: string | null;
  job_number: string | null;
  property_address: string | null;
  supervisor: string | null;
  crew_members: string | null;
  builder_company: string | null;
  checklist: Record<string, boolean>;
  quality_control: SiteInspectionQualityControl;
  comments: string | null;
  signatures: SiteInspectionSignatures;
  status: 'draft' | 'submitted';
  created_by: string;
  created_by_name: string | null;
  created_at: string;
  updated_at: string;
  photos?: SiteInspectionPhoto[];
}

export interface SiteInspectionInput {
  jobsite_id?: string | null;
  inspection_date: string;
  client_name?: string | null;
  client_email?: string | null;
  insurance_company?: string | null;
  adjuster?: string | null;
  claim_number?: string | null;
  job_number?: string | null;
  property_address?: string | null;
  supervisor?: string | null;
  crew_members?: string | null;
  builder_company?: string | null;
  checklist: Record<string, boolean>;
  quality_control: SiteInspectionQualityControl;
  comments?: string | null;
  signatures: SiteInspectionSignatures;
  status: 'draft' | 'submitted';
}

export const getInspectionPhotoUrl = (filePath: string): string => {
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(filePath);
  return data.publicUrl;
};

const QUERY_KEY = ['site-inspections'] as const;

export const useSiteInspections = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const list = useQuery({
    queryKey: [...QUERY_KEY, user?.companyId],
    queryFn: async (): Promise<SiteInspection[]> => {
      if (!user?.companyId) return [];

      const { data, error } = await supabase
        .from('site_inspections' as any)
        .select('*')
        .eq('company_id', user.companyId)
        .order('inspection_date', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) throw error;

      const inspections = (data ?? []) as unknown as SiteInspection[];
      if (inspections.length === 0) return [];

      const { data: photos } = await supabase
        .from('site_inspection_photos' as any)
        .select('*')
        .in('inspection_id', inspections.map(i => i.id))
        .order('sort_order', { ascending: true });

      const byInspection = new Map<string, SiteInspectionPhoto[]>();
      ((photos ?? []) as unknown as SiteInspectionPhoto[]).forEach(p => {
        const arr = byInspection.get(p.inspection_id) ?? [];
        arr.push(p);
        byInspection.set(p.inspection_id, arr);
      });

      return inspections.map(i => ({ ...i, photos: byInspection.get(i.id) ?? [] }));
    },
    enabled: !!user?.companyId,
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: QUERY_KEY });

  const create = useMutation({
    mutationFn: async (input: SiteInspectionInput): Promise<SiteInspection> => {
      if (!user?.companyId || !user?.id) throw new Error('Not authenticated');
      const createdByName =
        [(user as any)?.firstName, (user as any)?.lastName].filter(Boolean).join(' ') || null;

      const { data, error } = await supabase
        .from('site_inspections' as any)
        .insert({
          ...input,
          company_id: user.companyId,
          created_by: user.id,
          created_by_name: createdByName,
        } as any)
        .select()
        .single();

      if (error) throw error;
      return data as unknown as SiteInspection;
    },
    onSuccess: invalidate,
    onError: (e: any) => toast.error(e?.message ?? 'Failed to save inspection'),
  });

  const update = useMutation({
    mutationFn: async ({ id, input }: { id: string; input: Partial<SiteInspectionInput> }) => {
      const { data, error } = await supabase
        .from('site_inspections' as any)
        .update(input as any)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as unknown as SiteInspection;
    },
    onSuccess: invalidate,
    onError: (e: any) => toast.error(e?.message ?? 'Failed to update inspection'),
  });

  const remove = useMutation({
    mutationFn: async (inspection: SiteInspection) => {
      const paths = (inspection.photos ?? []).map(p => p.file_path);
      if (paths.length > 0) {
        await supabase.storage.from(BUCKET).remove(paths);
      }
      const { error } = await supabase
        .from('site_inspections' as any)
        .delete()
        .eq('id', inspection.id);
      if (error) throw error;
    },
    onSuccess: () => {
      invalidate();
      toast.success('Inspection deleted');
    },
    onError: (e: any) => toast.error(e?.message ?? 'Failed to delete inspection'),
  });

  const uploadPhotos = useMutation({
    mutationFn: async ({
      inspectionId,
      files,
      startOrder = 0,
    }: {
      inspectionId: string;
      files: File[];
      startOrder?: number;
    }) => {
      if (!user?.companyId || !user?.id) throw new Error('Not authenticated');

      const uploaded: SiteInspectionPhoto[] = [];
      let order = startOrder;

      for (const file of files) {
        const ext = file.name.split('.').pop() || 'jpg';
        const path = `${FOLDER}/${user.companyId}/${inspectionId}/${Date.now()}-${Math.random()
          .toString(36)
          .slice(2, 8)}.${ext}`;

        const { error: upErr } = await supabase.storage
          .from(BUCKET)
          .upload(path, file, { cacheControl: '3600', upsert: false });
        if (upErr) throw upErr;

        const { data, error } = await supabase
          .from('site_inspection_photos' as any)
          .insert({
            inspection_id: inspectionId,
            file_name: file.name,
            file_path: path,
            sort_order: order++,
            uploaded_by: user.id,
          } as any)
          .select()
          .single();

        if (error) {
          await supabase.storage.from(BUCKET).remove([path]);
          throw error;
        }
        uploaded.push(data as unknown as SiteInspectionPhoto);
      }

      return uploaded;
    },
    onSuccess: invalidate,
    onError: (e: any) => toast.error(e?.message ?? 'Failed to upload photos'),
  });

  const deletePhoto = useMutation({
    mutationFn: async (photo: SiteInspectionPhoto) => {
      const { error } = await supabase
        .from('site_inspection_photos' as any)
        .delete()
        .eq('id', photo.id);
      if (error) throw error;
      await supabase.storage.from(BUCKET).remove([photo.file_path]);
    },
    onSuccess: invalidate,
    onError: (e: any) => toast.error(e?.message ?? 'Failed to remove photo'),
  });

  return { list, create, update, remove, uploadPhotos, deletePhoto };
};
