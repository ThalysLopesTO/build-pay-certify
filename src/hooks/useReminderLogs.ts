import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface ReminderLog {
  id: string;
  company_id: string;
  type: 'invoice' | 'quote';
  record_id: string;
  sent_at: string;
  created_at: string;
}

export const useReminderLogs = () => {
  return useQuery({
    queryKey: ['reminder-logs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('reminder_logs')
        .select('*')
        .order('sent_at', { ascending: false });

      if (error) {
        throw error;
      }

      return data as ReminderLog[];
    },
  });
};