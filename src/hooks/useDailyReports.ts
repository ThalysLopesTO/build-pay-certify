import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useToast } from '@/hooks/use-toast';
import { fetchProfilesByUserIds } from '@/lib/users/fetchProfiles';

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

// Optimized hook with pagination support
export const useDailyReports = (
  filters?: {
    jobsite_id?: string;
    date_from?: string;
    date_to?: string;
    submitted_by?: string;
  },
  pagination?: {
    page: number;
    pageSize: number;
  }
) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['daily-reports', user?.companyId, filters, pagination],
    queryFn: async () => {
      if (!user?.companyId) return { data: [], totalCount: 0 };

      // First, get the total count
      let countQuery = supabase
        .from('daily_reports')
        .select('*', { count: 'exact', head: true })
        .eq('company_id', user.companyId);

      // Apply filters to count query
      if (filters?.jobsite_id) {
        countQuery = countQuery.eq('jobsite_id', filters.jobsite_id);
      }
      if (filters?.date_from) {
        countQuery = countQuery.gte('report_date', filters.date_from);
      }
      if (filters?.date_to) {
        countQuery = countQuery.lte('report_date', filters.date_to);
      }
      if (filters?.submitted_by) {
        countQuery = countQuery.eq('submitted_by', filters.submitted_by);
      }

      const { count: totalCount, error: countError } = await countQuery;

      if (countError) {
        console.error('Daily reports count error:', countError);
        throw countError;
      }

      // Now get the paginated data. Submitter profiles are fetched separately
      // (see fetchProfilesByUserIds) because the submitted_by FK no longer
      // points at user_profiles after multi-company repointing.
      let query = supabase
        .from('daily_reports')
        .select(`
          *,
          jobsites (
            name,
            address
          )
        `)
        .eq('company_id', user.companyId)
        .order('created_at', { ascending: false });

      // Apply filters to data query
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

      // Apply pagination
      if (pagination) {
        const { page, pageSize } = pagination;
        const from = (page - 1) * pageSize;
        const to = from + pageSize - 1;
        query = query.range(from, to);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Daily reports query error:', error);
        throw error;
      }
      
      // Attach submitter profiles (name/photo) fetched separately
      const profileMap = await fetchProfilesByUserIds((data || []).map((r) => r.submitted_by));

      // Add canEdit field based on 24-hour window and ownership
      const reportsWithCanEdit = (data || []).map(report => {
        const createdAt = new Date(report.created_at);
        const now = new Date();
        const hoursSinceCreation = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60);
        const canEdit = report.submitted_by === user.id && hoursSinceCreation < 24;

        const profile = profileMap[report.submitted_by];
        return {
          ...report,
          user_profiles: profile
            ? { first_name: profile.first_name, last_name: profile.last_name, photo_url: profile.photo_url }
            : null,
          canEdit
        };
      });

      return { data: reportsWithCanEdit, totalCount: totalCount || 0 };
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
      console.log('🔍 Starting daily report submission...', {
        userId: user?.id,
        companyId: user?.companyId,
        role: user?.role,
        jobsiteId: data.jobsite_id,
        photoCount: data.photos?.length || 0,
        reportDate: data.report_date
      });

      // Enhanced authentication and permission checks
      if (!user) {
        console.error('❌ No user found in context');
        throw new Error('AUTHENTICATION_REQUIRED|Please log in to submit reports');
      }

      if (!user.id) {
        console.error('❌ No user ID found');
        throw new Error('AUTHENTICATION_INVALID|User session is invalid. Please log out and log back in.');
      }

      if (!user.companyId) {
        console.error('❌ No company ID found for user', user.id);
        throw new Error('COMPANY_NOT_FOUND|No company assigned to your account. Please contact your administrator.');
      }

      if (!user.role || !['foreman', 'admin', 'super_admin'].includes(user.role)) {
        console.error('❌ User role check failed', { userRole: user.role, userId: user.id });
        throw new Error('PERMISSION_DENIED|You do not have permission to submit daily reports. Contact your administrator.');
      }

      // Note: User activity status is checked at the database level via RLS policies

      // Validate required data
      if (!data.jobsite_id || !data.summary || !data.report_date) {
        console.error('❌ Missing required fields', { 
          hasJobsite: !!data.jobsite_id,
          hasSummary: !!data.summary,
          hasDate: !!data.report_date
        });
        throw new Error('VALIDATION_ERROR|Please fill in all required fields');
      }

      console.log('✅ All validations passed, starting photo upload...');

      // Upload photos with enhanced error handling
      const photoUrls: string[] = [];
      
      if (data.photos && data.photos.length > 0) {
        for (let i = 0; i < data.photos.length; i++) {
          const photo = data.photos[i];
          console.log(`📸 Uploading photo ${i + 1}/${data.photos.length}:`, {
            name: photo.name,
            size: photo.size,
            type: photo.type
          });

          const fileExt = photo.name.split('.').pop();
          const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
          const filePath = `${user.companyId}/${fileName}`;

          let uploadAttempts = 0;
          const maxAttempts = 3;
          
          while (uploadAttempts < maxAttempts) {
            try {
              console.log(`📤 Upload attempt ${uploadAttempts + 1} for photo ${i + 1}`);
              
              const { error: uploadError } = await supabase.storage
                .from('daily-report-photos')
                .upload(filePath, photo);

              if (uploadError) {
                console.error(`❌ Storage upload error (attempt ${uploadAttempts + 1}):`, uploadError);
                throw new Error(`STORAGE_UPLOAD_FAILED|Photo upload failed: ${uploadError.message}`);
              }

              const { data: urlData } = supabase.storage
                .from('daily-report-photos')
                .getPublicUrl(filePath);

              console.log(`✅ Photo ${i + 1} uploaded successfully:`, urlData.publicUrl);
              photoUrls.push(urlData.publicUrl);
              break; // Success, exit retry loop
              
            } catch (error) {
              uploadAttempts++;
              console.warn(`⚠️ Photo upload attempt ${uploadAttempts} failed:`, error);
              
              if (uploadAttempts >= maxAttempts) {
                console.error(`❌ Photo upload failed after ${maxAttempts} attempts:`, error);
                throw new Error(`STORAGE_UPLOAD_FAILED|Failed to upload photo "${photo.name}" after ${maxAttempts} attempts. ${error instanceof Error ? error.message : 'Unknown error'}`);
              }
              
              // Exponential backoff
              const delay = 1000 * Math.pow(2, uploadAttempts - 1);
              console.log(`⏱️ Waiting ${delay}ms before retry...`);
              await new Promise(resolve => setTimeout(resolve, delay));
            }
          }
        }
      }

      console.log('✅ All photos uploaded successfully, creating database record...');

      // Create the daily report with proper date formatting
      const year = data.report_date.getFullYear();
      const month = String(data.report_date.getMonth() + 1).padStart(2, '0');
      const day = String(data.report_date.getDate()).padStart(2, '0');
      const reportDateString = `${year}-${month}-${day}`;
      
      const reportData = {
        jobsite_id: data.jobsite_id,
        submitted_by: user.id,
        company_id: user.companyId,
        summary: data.summary,
        photos: photoUrls,
        report_date: reportDateString,
      };

      console.log('💾 Inserting daily report into database:', reportData);
      
      const { data: report, error } = await supabase
        .from('daily_reports')
        .insert(reportData)
        .select()
        .single();

      if (error) {
        console.error('❌ Database error inserting daily report:', {
          error,
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint,
          reportData
        });
        
        // Provide specific error messages based on error type
        if (error.code === '42501') {
          throw new Error('PERMISSION_DENIED|Permission denied. Please ensure you are logged in and have the correct role.');
        } else if (error.code === '23505') {
          throw new Error('DUPLICATE_REPORT|A report for this date and jobsite already exists.');
        } else if (error.message?.includes('violates row-level security')) {
          throw new Error('RLS_VIOLATION|Security policy violation. Please log out and log back in, then try again.');
        } else if (error.message?.includes('foreign key')) {
          throw new Error('INVALID_JOBSITE|Invalid jobsite selected. Please refresh and try again.');
        } else {
          throw new Error(`DATABASE_ERROR|Database error: ${error.message}`);
        }
      }

      console.log('✅ Daily report created successfully:', report);
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
      console.error('❌ Daily report submission failed:', error);
      
      // Parse error messages with specific codes
      const errorMessage = error.message || 'Unknown error occurred';
      const [errorCode, userMessage] = errorMessage.includes('|') 
        ? errorMessage.split('|') 
        : ['GENERIC_ERROR', errorMessage];

      let title = "Submission Failed";
      let description = userMessage;

      switch (errorCode) {
        case 'AUTHENTICATION_REQUIRED':
          title = "Login Required";
          description = "Please log in to submit daily reports";
          break;
        case 'AUTHENTICATION_INVALID':
          title = "Session Expired";
          description = "Your session has expired. Please log out and log back in.";
          break;
        case 'COMPANY_NOT_FOUND':
          title = "Company Not Assigned";
          description = "No company assigned to your account. Please contact your administrator.";
          break;
        case 'PERMISSION_DENIED':
          title = "Access Denied";
          description = "You do not have permission to submit daily reports. Contact your administrator.";
          break;
        case 'ACCOUNT_INACTIVE':
          title = "Account Inactive";
          description = "Your account is inactive. Please contact your administrator.";
          break;
        case 'VALIDATION_ERROR':
          title = "Form Incomplete";
          description = "Please fill in all required fields before submitting.";
          break;
        case 'STORAGE_UPLOAD_FAILED':
          title = "Photo Upload Failed";
          description = userMessage || "Failed to upload photos. Please check your connection and try again.";
          break;
        case 'DUPLICATE_REPORT':
          title = "Report Already Exists";
          description = "A report for this date and jobsite already exists.";
          break;
        case 'RLS_VIOLATION':
          title = "Security Error";
          description = "Security policy violation. Please log out and log back in, then try again.";
          break;
        case 'INVALID_JOBSITE':
          title = "Invalid Jobsite";
          description = "Invalid jobsite selected. Please refresh the page and try again.";
          break;
        case 'DATABASE_ERROR':
          title = "Database Error";
          description = userMessage || "Database connection failed. Please try again.";
          break;
        default:
          title = "Submission Failed";
          description = userMessage || "Failed to submit daily report. Please check your connection and try again.";
      }
      
      toast({
        title,
        description,
        variant: "destructive",
      });
    },
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 5000),
  });
};