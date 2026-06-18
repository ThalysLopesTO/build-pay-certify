import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { MapPin, ChevronRight } from 'lucide-react';
import { useElapsedTime } from '@/hooks/useActiveClockSession';
import { useClockSession } from '@/hooks/useOfflineClock';

/**
 * Always-on status strip shown across the employee panel whenever the user is
 * clocked in — a live elapsed timer + jobsite, one tap from the Time Clock.
 * Reflects offline (not-yet-synced) clock-ins too. Renders nothing when clocked out.
 */
const EmployeeClockBar: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { session, isPending } = useClockSession();
  const elapsed = useElapsedTime(session?.check_in_time);

  if (!session || !session.check_in_time) return null;

  // After a long shift, nudge them to clock out (passive — no toast spam).
  const LONG_SHIFT_HOURS = 12;
  const longShift = (elapsed?.hours ?? 0) >= LONG_SHIFT_HOURS;

  const label = longShift
    ? t('clock.longShift')
    : isPending
      ? `${t('clock.clockedIn')} · ${t('clock.pendingSync')}`
      : t('clock.clockedIn');

  return (
    <button
      onClick={() => navigate('/employee/time-tracker')}
      className={`flex w-full items-center gap-3 px-4 py-2.5 text-white transition-colors ${
        longShift ? 'bg-amber-600 active:bg-amber-700' : 'bg-emerald-600 active:bg-emerald-700'
      }`}
      aria-label="You are clocked in — open Time Clock"
    >
      <span className="relative grid h-2.5 w-2.5 place-items-center">
        <span className="absolute inline-flex h-2.5 w-2.5 rounded-full bg-white/70 animate-ping" />
        <span className="h-2 w-2 rounded-full bg-white" />
      </span>

      <span className="min-w-0 flex-1 text-left">
        <span className="block text-[11px] font-medium uppercase tracking-wide text-white/90">
          {label}
        </span>
        {session.jobsiteName && (
          <span className="flex items-center gap-1 text-xs text-white/80 truncate">
            <MapPin className="h-3 w-3 shrink-0" />
            <span className="truncate">{session.jobsiteName}</span>
          </span>
        )}
      </span>

      <span className="font-bold tabular-nums text-base">{elapsed?.short ?? '0m'}</span>
      <ChevronRight className="h-4 w-4 text-white/80" />
    </button>
  );
};

export default EmployeeClockBar;
