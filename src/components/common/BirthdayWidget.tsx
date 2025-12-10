import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Cake, PartyPopper } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import EmployeeAvatar from '@/components/ui/employee-avatar';

interface BirthdayPerson {
  user_id: string;
  first_name: string;
  last_name: string;
  photo_url: string | null;
}

interface BirthdayWidgetProps {
  variant?: 'orange' | 'green' | 'blue';
}

const BirthdayWidget: React.FC<BirthdayWidgetProps> = ({ variant = 'orange' }) => {
  const { user } = useAuth();

  const { data: birthdayPeople = [], isLoading } = useQuery({
    queryKey: ['birthdays-today', user?.companyId],
    queryFn: async () => {
      if (!user?.companyId) return [];

      // Get current date parts
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

      // Filter for birthdays today (matching month and day)
      const todaysBirthdays = (data || []).filter((person: any) => {
        if (!person.date_of_birth) return false;
        const dob = new Date(person.date_of_birth + 'T12:00:00'); // Add time to prevent timezone shift
        return dob.getMonth() + 1 === currentMonth && dob.getDate() === currentDay;
      });

      return todaysBirthdays as BirthdayPerson[];
    },
    enabled: !!user?.companyId,
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
  });

  // Don't render if no birthdays or loading
  if (isLoading || birthdayPeople.length === 0) {
    return null;
  }

  const gradientClasses = {
    orange: 'from-orange-100 via-pink-100 to-purple-100',
    green: 'from-emerald-100 via-teal-100 to-cyan-100',
    blue: 'from-blue-100 via-indigo-100 to-purple-100',
  };

  const accentClasses = {
    orange: 'text-orange-600',
    green: 'text-emerald-600',
    blue: 'text-blue-600',
  };

  const badgeClasses = {
    orange: 'bg-orange-500',
    green: 'bg-emerald-500',
    blue: 'bg-blue-500',
  };

  return (
    <Card className={`shadow-lg border-0 bg-gradient-to-br ${gradientClasses[variant]} rounded-2xl overflow-hidden relative`}>
      {/* Confetti decoration */}
      <div className="absolute top-2 right-2 opacity-60">
        <PartyPopper className={`h-5 w-5 ${accentClasses[variant]}`} />
      </div>
      <div className="absolute bottom-2 left-2 opacity-40 rotate-45">
        <PartyPopper className={`h-4 w-4 ${accentClasses[variant]}`} />
      </div>

      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          {/* Cake Icon */}
          <div className={`p-2 ${badgeClasses[variant]} rounded-full animate-pulse`}>
            <Cake className="h-5 w-5 text-white" />
          </div>

          {/* Birthday Content */}
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">
              🎉 Happy Birthday!
            </p>
            
            {birthdayPeople.length === 1 ? (
              <div className="flex items-center gap-2">
                <EmployeeAvatar
                  photoUrl={birthdayPeople[0].photo_url || undefined}
                  firstName={birthdayPeople[0].first_name}
                  lastName={birthdayPeople[0].last_name}
                  size="sm"
                  className="ring-2 ring-white shadow-sm"
                />
                <span className="font-semibold text-slate-800 truncate">
                  {birthdayPeople[0].first_name} {birthdayPeople[0].last_name}
                </span>
              </div>
            ) : (
              <div className="space-y-1">
                <div className="flex -space-x-2">
                  {birthdayPeople.slice(0, 4).map((person) => (
                    <EmployeeAvatar
                      key={person.user_id}
                      photoUrl={person.photo_url || undefined}
                      firstName={person.first_name}
                      lastName={person.last_name}
                      size="sm"
                      className="ring-2 ring-white shadow-sm"
                    />
                  ))}
                  {birthdayPeople.length > 4 && (
                    <div className="w-8 h-8 rounded-full bg-slate-200 ring-2 ring-white flex items-center justify-center text-xs font-medium text-slate-600">
                      +{birthdayPeople.length - 4}
                    </div>
                  )}
                </div>
                <p className="text-sm font-medium text-slate-700">
                  {birthdayPeople.map(p => p.first_name).join(', ')}
                </p>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default BirthdayWidget;
