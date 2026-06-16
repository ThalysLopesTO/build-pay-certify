import React from 'react';
import { Cake, PartyPopper } from 'lucide-react';
import EmployeeAvatar from '@/components/ui/employee-avatar';
import { BirthdayPerson, formatBirthdayNames } from '@/hooks/useTodaysBirthdays';

interface BirthdayNotificationBannerProps {
  people: BirthdayPerson[];
}

/**
 * A celebratory, pinned item rendered at the top of every notification dropdown
 * when someone in the company has a birthday today. Purely informational — it is
 * not stored in the DB and clears itself the next day, so it has no read/dismiss
 * actions of its own.
 */
const BirthdayNotificationBanner: React.FC<BirthdayNotificationBannerProps> = ({ people }) => {
  if (people.length === 0) return null;

  const names = formatBirthdayNames(people);
  const isOne = people.length === 1;

  return (
    <div className="px-3 pt-3">
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-pink-50 via-rose-50 to-purple-50 border border-pink-100 px-4 py-3">
        {/* Confetti corners */}
        <PartyPopper className="absolute top-1.5 right-2 h-4 w-4 text-pink-400/70" />
        <PartyPopper className="absolute bottom-1.5 left-2 h-3.5 w-3.5 text-purple-300/60 rotate-45" />

        <div className="relative flex items-center gap-3">
          <div className="p-2 rounded-xl bg-pink-500 flex-shrink-0 shadow-sm">
            <Cake className="h-[18px] w-[18px] text-white" />
          </div>

          <div className="flex-1 min-w-0">
            <p className="text-[11px] font-semibold text-pink-600 uppercase tracking-wide">
              🎉 Happy Birthday
            </p>
            <p className="text-sm font-semibold text-slate-900 truncate">
              {names}
            </p>
            <p className="text-[12px] text-slate-500 mt-0.5">
              {isOne ? 'has a birthday today' : 'have birthdays today'} — send your wishes!
            </p>
          </div>

          {/* Avatar stack */}
          <div className="flex -space-x-2 flex-shrink-0">
            {people.slice(0, 3).map((person) => (
              <EmployeeAvatar
                key={person.user_id}
                photoUrl={person.photo_url || undefined}
                firstName={person.first_name}
                lastName={person.last_name}
                size="sm"
                className="ring-2 ring-white shadow-sm"
              />
            ))}
            {people.length > 3 && (
              <div className="w-8 h-8 rounded-full bg-white/80 ring-2 ring-white flex items-center justify-center text-[11px] font-semibold text-pink-600">
                +{people.length - 3}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BirthdayNotificationBanner;
