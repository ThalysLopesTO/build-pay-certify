import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useToast } from '@/hooks/use-toast';

const BUCKET_NAME = 'expense-attachments';
const BILL_FOLDER = 'employee-bills';

export interface EmployeeBillPhoto {
  id: string;
  bill_id: string;
  file_name: string;
  file_path: string;
  file_size: number | null;
  uploaded_by: string | null;
  created_at: string;
}

export interface EmployeeBill {
  id: string;
  user_id: string;
  company_id: string;
  jobsite_id: string | null;
  timesheet_id: string | null;
  amount: number | null;
  description: string | null;
  status: string;
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface EmployeeBillWithDetails extends EmployeeBill {
  photos: EmployeeBillPhoto[];
  employee_name: string;
  employee_photo_url: string | null;
  employee_first_name: string | null;
  employee_last_name: string | null;
  jobsite_name: string | null;
}

export const getBillPhotoUrl = (filePath: string): string => {
  const { data } = supabase.storage.from(BUCKET_NAME).getPublicUrl(filePath);
  return data.publicUrl;
};

export interface SubmitBillInput {
  amount: number | null;
  description: string | null;
  jobsiteId?: string | null;
  timesheetId?: string | null;
  files: File[];
}

/**
 * Submit a reimbursement bill (used by employees at punch-out).
 */
export const submitEmployeeBill = async (
  input: SubmitBillInput,
  userId: string,
  companyId: string
): Promise<EmployeeBill> => {
  // 1. Create the bill record
  const { data: bill, error: billError } = await supabase
    .from('employee_bills')
    .insert({
      user_id: userId,
      company_id: companyId,
      jobsite_id: input.jobsiteId || null,
      timesheet_id: input.timesheetId || null,
      amount: input.amount,
      description: input.description?.trim() ? input.description.trim() : null,
      status: 'pending',
    })
    .select()
    .single();

  if (billError) {
    console.error('Error creating bill record:', billError);
    throw billError;
  }

  // 2. Upload photos and create photo records
  for (const file of input.files) {
    const fileExt = file.name.split('.').pop();
    const fileName = `${BILL_FOLDER}/${userId}/${bill.id}/${Date.now()}-${Math.random()
      .toString(36)
      .substring(7)}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(fileName, file, { cacheControl: '3600', upsert: false });

    if (uploadError) {
      console.error('Error uploading bill photo:', uploadError);
      throw uploadError;
    }

    const { error: photoError } = await supabase.from('employee_bill_photos').insert({
      bill_id: bill.id,
      file_name: file.name,
      file_path: fileName,
      file_size: file.size,
      uploaded_by: userId,
    });

    if (photoError) {
      console.error('Error creating bill photo record:', photoError);
      await supabase.storage.from(BUCKET_NAME).remove([fileName]);
      throw photoError;
    }
  }

  return bill as EmployeeBill;
};

/**
 * Admin/manager hook to list, review and delete employee bills for the company.
 */
export const useEmployeeBills = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const billsQuery = useQuery({
    queryKey: ['employee-bills', user?.companyId],
    queryFn: async (): Promise<EmployeeBillWithDetails[]> => {
      if (!user?.companyId) return [];

      const { data: bills, error } = await supabase
        .from('employee_bills')
        .select('*')
        .eq('company_id', user.companyId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching employee bills:', error);
        throw error;
      }

      if (!bills || bills.length === 0) return [];

      const billIds = bills.map((b) => b.id);
      const userIds = Array.from(new Set(bills.map((b) => b.user_id)));
      const jobsiteIds = Array.from(
        new Set(bills.map((b) => b.jobsite_id).filter(Boolean) as string[])
      );

      const [photosRes, profilesRes, jobsitesRes] = await Promise.all([
        supabase.from('employee_bill_photos').select('*').in('bill_id', billIds),
        supabase
          .from('user_profiles')
          .select('user_id, first_name, last_name, photo_url')
          .in('user_id', userIds),
        jobsiteIds.length
          ? supabase.from('jobsites').select('id, name').in('id', jobsiteIds)
          : Promise.resolve({ data: [], error: null }),
      ]);

      const photos = (photosRes.data || []) as EmployeeBillPhoto[];
      const profiles = profilesRes.data || [];
      const jobsites = jobsitesRes.data || [];

      const profileMap = new Map(profiles.map((p: any) => [p.user_id, p]));
      const jobsiteMap = new Map(jobsites.map((j: any) => [j.id, j.name]));

      return bills.map((bill) => {
        const profile = profileMap.get(bill.user_id);
        const first = profile?.first_name || '';
        const last = profile?.last_name || '';
        const fullName = `${first} ${last}`.trim() || 'Unknown Employee';
        return {
          ...(bill as EmployeeBill),
          photos: photos.filter((p) => p.bill_id === bill.id),
          employee_name: fullName,
          employee_photo_url: profile?.photo_url || null,
          employee_first_name: first || null,
          employee_last_name: last || null,
          jobsite_name: bill.jobsite_id ? jobsiteMap.get(bill.jobsite_id) || null : null,
        };
      });
    },
    enabled: !!user?.companyId,
  });

  const reviewMutation = useMutation({
    mutationFn: async ({ billId, status }: { billId: string; status: 'approved' | 'declined' }) => {
      if (!user?.id) throw new Error('User not authenticated');
      const { data, error } = await supabase
        .from('employee_bills')
        .update({
          status,
          reviewed_by: user.id,
          reviewed_at: new Date().toISOString(),
        })
        .eq('id', billId)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['employee-bills'] });
      toast({
        title: variables.status === 'approved' ? 'Bill approved' : 'Bill declined',
        description:
          variables.status === 'approved'
            ? 'The reimbursement has been approved.'
            : 'The reimbursement has been declined.',
      });
    },
    onError: (error) => {
      console.error('Error reviewing bill:', error);
      toast({
        title: 'Error',
        description: 'Failed to update the bill. Please try again.',
        variant: 'destructive',
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (bill: EmployeeBillWithDetails) => {
      const paths = bill.photos.map((p) => p.file_path);
      if (paths.length) {
        await supabase.storage.from(BUCKET_NAME).remove(paths);
      }
      const { data, error } = await supabase
        .from('employee_bills')
        .delete()
        .eq('id', bill.id)
        .select('id');
      if (error) throw error;
      if (!data || data.length === 0) {
        throw new Error('Bill could not be deleted (permission denied).');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employee-bills'] });
      toast({ title: 'Bill deleted', description: 'The bill has been removed.' });
    },
    onError: (error) => {
      console.error('Error deleting bill:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete the bill. Please try again.',
        variant: 'destructive',
      });
    },
  });

  return {
    bills: billsQuery.data || [],
    isLoading: billsQuery.isLoading,
    error: billsQuery.error,
    reviewBill: reviewMutation.mutate,
    isReviewing: reviewMutation.isPending,
    deleteBill: deleteMutation.mutate,
    isDeleting: deleteMutation.isPending,
  };
};
