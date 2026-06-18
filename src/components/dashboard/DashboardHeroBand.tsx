import React from 'react';
import { useTranslation } from 'react-i18next';
import { Building, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import EmployeeAvatar from '@/components/ui/employee-avatar';
import WeatherChip from './WeatherChip';

type Accent = 'orange' | 'emerald';

const GRAD: Record<Accent, string> = {
  orange:  'from-orange-600 via-orange-500 to-amber-500',
  emerald: 'from-emerald-600 via-emerald-500 to-teal-500',
};

interface DashboardHeroBandProps {
  firstName?: string | null;
  lastName?: string | null;
  photoUrl?: string | null;
  roleLabel: string;
  companyName?: string | null;
  accent?: Accent;
  onViewProfile: () => void;
  /** Stat cards rendered overlapping the bottom of the band (Argon signature). */
  children?: React.ReactNode;
}

/**
 * Argon-style gradient hero band shared by every role dashboard: greeting,
 * avatar, role chip, company, weather chip and a profile button, with an
 * optional row of stat cards that overlap the bottom edge.
 */
export const DashboardHeroBand: React.FC<DashboardHeroBandProps> = ({
  firstName,
  lastName,
  photoUrl,
  roleLabel,
  companyName,
  accent = 'orange',
  onViewProfile,
  children,
}) => {
  const { t, i18n } = useTranslation();
  const hour = new Date().getHours();
  const greeting = t(hour < 12 ? 'home.goodMorning' : hour < 18 ? 'home.goodAfternoon' : 'home.goodEvening');
  const localeMap: Record<string, string> = { en: 'en-US', pt: 'pt-BR', es: 'es-ES' };
  const today = new Date().toLocaleDateString(localeMap[i18n.resolvedLanguage ?? 'en'] ?? 'en-US', {
    weekday: 'long', month: 'long', day: 'numeric',
  });

  return (
    <div>
      <div className={`relative rounded-2xl bg-gradient-to-br ${GRAD[accent]} shadow-lg p-5 sm:p-6 pb-16 lg:pb-20 overflow-hidden`}>
        <div className="absolute -top-24 -right-10 w-72 h-72 bg-white/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 left-1/3 w-64 h-64 bg-white/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex items-center gap-4">
          <div className="rounded-full p-0.5 bg-white/25 flex-shrink-0">
            <EmployeeAvatar
              photoUrl={photoUrl ?? undefined}
              firstName={firstName ?? undefined}
              lastName={lastName ?? undefined}
              size="lg"
            />
          </div>

          <div className="flex-1 min-w-0">
            <p className="text-[11px] font-medium uppercase tracking-wide text-white/70">{today}</p>
            <h1 className="text-xl sm:text-2xl font-bold text-white truncate">
              {greeting}, {firstName || t('common.there', { defaultValue: 'there' })} 👋
            </h1>
            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
              <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold bg-white/20 text-white capitalize">
                <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                {roleLabel}
              </span>
              {companyName && (
                <span className="inline-flex items-center gap-1 text-xs text-white/80">
                  <Building className="h-3.5 w-3.5" />
                  {companyName}
                </span>
              )}
            </div>
          </div>

          <div className="hidden sm:flex items-center gap-2.5 flex-shrink-0">
            <WeatherChip />
            <Button
              variant="ghost"
              className="h-9 text-white bg-white/15 hover:bg-white/25 hover:text-white border border-white/25"
              onClick={onViewProfile}
            >
              <Eye className="h-4 w-4 mr-2" /> {t('home.profile')}
            </Button>
          </div>
        </div>
      </div>

      {children && (
        <div className="relative z-20 -mt-10 lg:-mt-12 px-1 grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {children}
        </div>
      )}
    </div>
  );
};

export default DashboardHeroBand;
