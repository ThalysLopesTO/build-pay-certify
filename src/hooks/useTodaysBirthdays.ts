import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/SupabaseAuthContext';

export interface BirthdayPerson {
  user_id: string;
  first_name: string;
  last_name: string;
  photo_url: string | null;
}

/**
 * Shared "who has a birthday today" query — keyed on the user's company so it is
 * deduped across the dashboard widget, the notification dropdowns and the bells.
 * Enabled for every authenticated role (not just employees).
 */
export const useTodaysBirthdays = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['birthdays-today', user?.companyId],
    queryFn: async (): Promise<BirthdayPerson[]> => {
      if (!user?.companyId) return [];

      const now = new Date();
      const currentMonth = now.getMonth() + 1; // JS months are 0-indexed
      const currentDay = now.getDate();

      const { data, error } = await supabase
        .from('user_profiles')
        .select('user_id, first_name, last_name, photo_url, date_of_birth')
        .eq('company_id', user.companyId)
        .eq('is_active', true)
        .not('date_of_birth', 'is', null);

      if (error) {
        console.error('Error fetching birthdays:', error);
        return [];
      }

      return (data || []).filter((person: any) => {
        if (!person.date_of_birth) return false;
        // Add midday time to avoid a timezone shift across the date boundary.
        const dob = new Date(person.date_of_birth + 'T12:00:00');
        return dob.getMonth() + 1 === currentMonth && dob.getDate() === currentDay;
      }) as BirthdayPerson[];
    },
    enabled: !!user?.companyId,
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
  });
};

/** Local "already saw today's birthday" flag so the bell dot pings once, not all day. */
const seenKey = () => {
  const d = new Date();
  return `bday-seen-${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
};

export const birthdaySeenToday = (): boolean => {
  try {
    return localStorage.getItem(seenKey()) === '1';
  } catch {
    return false;
  }
};

export const markBirthdaySeen = () => {
  try {
    localStorage.setItem(seenKey(), '1');
  } catch {
    /* ignore storage failures (private mode, etc.) */
  }
};

/** "Danillo", "Danillo & Josemar", "Danillo, Josemar & Rubens" */
export const formatBirthdayNames = (people: BirthdayPerson[]): string => {
  const names = people.map((p) => p.first_name).filter(Boolean);
  if (names.length === 0) return '';
  if (names.length === 1) return names[0];
  if (names.length === 2) return `${names[0]} & ${names[1]}`;
  return `${names.slice(0, -1).join(', ')} & ${names[names.length - 1]}`;
};
