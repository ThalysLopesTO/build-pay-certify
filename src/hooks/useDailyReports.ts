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
  canEdit?: boolean;
  jobsites?: {
    name: string;
    address: string;
  } | null;
  user_profiles?: {
    first_name: string | null;
    last_name: string | null;
    photo_url: string | null;
  } | null;
}

export interface DailyReportFormData {
  jobsite_id: string;
  summary: string;
  photos: File[];
  report_date: Date;
}

// Optimized hook with debouncing and better performance
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

      // Optimize query by limiting JOINs and using more efficient select
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
            last_name,
            photo_url
          )
        `)
        .eq('company_id', user.companyId)
        .order('created_at', { ascending: false })
        .limit(50); // Limit initial load for better performance

      // Apply filters efficiently
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

      const { data, error } = await query;

      if (error) {
        console.error('Daily reports query error:', error);
        throw error;
      }
      
      // Add canEdit field based on 24-hour window and ownership
      const reportsWithCanEdit = (data || []).map(report => {
        const createdAt = new Date(report.created_at);
        const now = new Date();
        const hoursSinceCreation = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60);
        const canEdit = report.submitted_by === user.id && hoursSinceCreation < 24;
        
        return {
          ...report,
          canEdit
        };
      });
      
      return reportsWithCanEdit;
    },
    enabled: !!user?.companyId,
    staleTime: 2 * 60 * 1000, // 2 minutes for daily reports
    gcTime: 5 * 60 * 1000, // 5 minutes cache
    refetchOnWindowFocus: false,
    refetchOnMount: 'always', // Always fetch fresh data on mount
  });
};

export const useDailyReportUpdate = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ reportId, data }: { reportId: string; data: DailyReportFormData }) => {
      if (!user?.companyId) throw new Error('No company ID found');

      // Check if report can be edited (24-hour window)
      const { data: report, error: fetchError } = await supabase
        .from('daily_reports')
        .select('created_at, submitted_by')
        .eq('id', reportId)
        .single();

      if (fetchError) throw fetchError;

      const createdAt = new Date(report.created_at);
      const now = new Date();
      const hoursSinceCreation = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60);

      if (report.submitted_by !== user.id) {
        throw new Error('You can only edit your own reports');
      }

      if (hoursSinceCreation >= 24) {
        throw new Error('Editing window expired. Reports can only be edited for 24 hours after submission.');
      }

      // Upload new photos if any
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

      // Update the daily report
      const { data: updatedReport, error } = await supabase
        .from('daily_reports')
        .update({
          jobsite_id: data.jobsite_id,
          summary: data.summary,
          photos: photoUrls.length > 0 ? photoUrls : undefined,
          report_date: data.report_date.toISOString().split('T')[0],
          updated_at: new Date().toISOString(),
        })
        .eq('id', reportId)
        .select()
        .single();

      if (error) throw error;
      return updatedReport;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['daily-reports'] });
      toast({
        title: "Success",
        description: "✅ Daily report updated successfully",
      });
    },
    onError: (error) => {
      console.error('Error updating daily report:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to update daily report. Please try again.",
        variant: "destructive",
      });
    },
  });
};

export const useDailyReportSubmission = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: DailyReportFormData) => {
      if (!user?.companyId) throw new Error('No company ID found');

      // Verify user has permission to submit reports
      if (!user.role || !['foreman', 'admin', 'super_admin'].includes(user.role)) {
        throw new Error('You do not have permission to submit daily reports');
      }

      // Upload photos with retry logic
      const photoUrls: string[] = [];
      
      for (const photo of data.photos) {
        const fileExt = photo.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
        const filePath = `${user.companyId}/${fileName}`;

        let uploadAttempts = 0;
        const maxAttempts = 3;
        
        while (uploadAttempts < maxAttempts) {
          try {
            const { error: uploadError } = await supabase.storage
              .from('daily-report-photos')
              .upload(filePath, photo);

            if (uploadError) throw uploadError;

            const { data: urlData } = supabase.storage
              .from('daily-report-photos')
              .getPublicUrl(filePath);

            photoUrls.push(urlData.publicUrl);
            break; // Success, exit retry loop
          } catch (error) {
            uploadAttempts++;
            if (uploadAttempts >= maxAttempts) throw error;
            // Wait before retry
            await new Promise(resolve => setTimeout(resolve, 1000 * uploadAttempts));
          }
        }
      }

      // Create the daily report with proper date formatting
      const year = data.report_date.getFullYear();
      const month = String(data.report_date.getMonth() + 1).padStart(2, '0');
      const day = String(data.report_date.getDate()).padStart(2, '0');
      const reportDateString = `${year}-${month}-${day}`;
      
      const { data: report, error } = await supabase
        .from('daily_reports')
        .insert({
          jobsite_id: data.jobsite_id,
          submitted_by: user.id,
          company_id: user.companyId,
          summary: data.summary,
          photos: photoUrls,
          report_date: reportDateString,
        })
        .select()
        .single();

      if (error) {
        console.error('Database error inserting daily report:', error);
        throw error;
      }
      return report;
    },
    onSuccess: () => {
      // Invalidate and refetch daily reports
      queryClient.invalidateQueries({ queryKey: ['daily-reports'] });
      toast({
        title: "Success",
        description: "✅ Daily report submitted successfully",
      });
    },
    onError: (error) => {
      console.error('Error submitting daily report:', error);
      const errorMessage = error.message.includes('permission') 
        ? 'You do not have permission to submit daily reports. Please contact your administrator.'
        : 'Failed to submit daily report. Please check your connection and try again.';
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    },
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 5000),
  });
};