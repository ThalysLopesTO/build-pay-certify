import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useToast } from '@/hooks/use-toast';

export interface DailyReport {
  id: string;
  jobsite_id: string;
  submitted_by: string;
  company_id: string;
  summary: string;
  photos: string[];
  report_date: string;
  created_at: string;
  updated_at: string;
  jobsites?: {
    name: string;
    address: string;
  } | null;
  user_profiles?: {
    first_name: string | null;
    last_name: string | null;
  } | null;
}

export interface DailyReportFormData {
  jobsite_id: string;
  summary: string;
  photos: File[];
}

export const useDailyReports = (filters?: {
  jobsite_id?: string;
  date_from?: string;
  date_to?: string;
  submitted_by?: string;
}) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['daily-reports', user?.companyId, filters],
    queryFn: async () => {
      if (!user?.companyId) return [];

      let query = supabase
        .from('daily_reports')
        .select(`
          *,
          jobsites (
            name,
            address
          ),
          user_profiles!daily_reports_submitted_by_fkey (
            first_name,
            last_name
          )
        `)
        .eq('company_id', user.companyId);

      if (filters?.jobsite_id) {
        query = query.eq('jobsite_id', filters.jobsite_id);
      }

      if (filters?.date_from) {
        query = query.gte('report_date', filters.date_from);
      }

      if (filters?.date_to) {
        query = query.lte('report_date', filters.date_to);
      }

      if (filters?.submitted_by) {
        query = query.eq('submitted_by', filters.submitted_by);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.companyId,
  });
};

export const useDailyReportSubmission = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: DailyReportFormData) => {
      if (!user?.companyId) throw new Error('No company ID found');

      // Upload photos first
      const photoUrls: string[] = [];
      
      for (const photo of data.photos) {
        const fileExt = photo.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
        const filePath = `${user.companyId}/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('daily-report-photos')
          .upload(filePath, photo);

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from('daily-report-photos')
          .getPublicUrl(filePath);

        photoUrls.push(urlData.publicUrl);
      }

      // Create the daily report
      const { data: report, error } = await supabase
        .from('daily_reports')
        .insert({
          jobsite_id: data.jobsite_id,
          submitted_by: user.id,
          company_id: user.companyId,
          summary: data.summary,
          photos: photoUrls,
        })
        .select()
        .single();

      if (error) throw error;
      return report;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['daily-reports'] });
      toast({
        title: "Success",
        description: "✅ Daily report submitted successfully",
      });
    },
    onError: (error) => {
      console.error('Error submitting daily report:', error);
      toast({
        title: "Error",
        description: "Failed to submit daily report. Please try again.",
        variant: "destructive",
      });
    },
  });
};