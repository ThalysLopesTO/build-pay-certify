import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/SupabaseAuthContext';

export interface BillReminder {
  id: string;
  expense_title: string;
  vendor_payee: string;
  amount: number;
  expense_date: string;
  payment_status: string;
  daysUntilDue: number;
}

export const useBillReminders = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['bill-reminders', user?.companyId],
    queryFn: async (): Promise<BillReminder[]> => {
      if (!user?.companyId) return [];

      const sevenDaysFromNow = new Date();
      sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);

      const { data, error } = await supabase
        .from('bills_expenses')
        .select('id, expense_title, vendor_payee, amount, expense_date, payment_status')
        .eq('company_id', user.companyId)
        .neq('payment_status', 'paid')
        .gte('expense_date', new Date().toISOString().split('T')[0])
        .lte('expense_date', sevenDaysFromNow.toISOString().split('T')[0])
        .order('expense_date', { ascending: true });

      if (error) throw error;

      return (data || []).map(bill => ({
        ...bill,
        daysUntilDue: Math.ceil((new Date(bill.expense_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
      }));
    },
    enabled: !!user?.companyId,
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
  });
};