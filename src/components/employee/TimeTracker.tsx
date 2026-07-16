
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useTimesheets } from '@/hooks/useTimesheets';
import { useGeolocation } from '@/hooks/useGeolocation';
import { useActiveJobsites } from '@/hooks/useJobsites';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useIsMobile } from '@/hooks/use-mobile';
import { Clock, MapPin, Play, Square, CheckCircle } from 'lucide-react';
import EmployeePageHeader from './EmployeePageHeader';
import { useElapsedTime } from '@/hooks/useActiveClockSession';
import { useClockSession } from '@/hooks/useOfflineClock';
import { enqueueClockAction, newLocalId } from '@/lib/offline/clockQueue';
import { useTranslation } from 'react-i18next';
import NotificationsToggle from './NotificationsToggle';
import { format } from 'date-fns';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import EmployeeAvatar from '@/components/ui/employee-avatar';
import ErrorBoundary from '@/components/common/ErrorBoundary';
import TodayStatusBox from './time-tracker/TodayStatusBox';
import WeeklyHistorySection from './time-tracker/WeeklyHistorySection';
import WeekSelector from './time-tracker/WeekSelector';
import DigitalClock from './time-tracker/DigitalClock';
import ClockOutNoteModal, { ClockOutBillPayload } from './ClockOutNoteModal';
import { submitEmployeeBill } from '@/hooks/useEmployeeBills';
import { useToast } from '@/hooks/use-toast';

const TimeTracker = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedJobsiteId, setSelectedJobsiteId] = useState<string>('');
  const [selectedWeek, setSelectedWeek] = useState<Date>(new Date());
  const [showClockOutModal, setShowClockOutModal] = useState(false);
  const [isSubmittingBill, setIsSubmittingBill] = useState(false);
  const { data: jobsites, isLoading: jobsitesLoading } = useActiveJobsites();
  const { getCurrentLocation, isGettingLocation } = useGeolocation();

  // Fetch user profile for photo
  const { data: userProfile } = useQuery({
    queryKey: ['user-profile', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      let profileQuery = supabase
        .from('user_profiles')
        .select('photo_url, first_name, last_name')
        .eq('user_id', user.id);
      if (user.companyId) {
        profileQuery = profileQuery.eq('company_id', user.companyId);
      }
      const { data, error } = await profileQuery.limit(1).maybeSingle();
      if (error) {
        console.warn('Profile fetch error (non-fatal):', error.message);
        return null;
      }
      return data;
    },
    enabled: !!user?.id,
  });
  
  const {
    todayActiveTimesheet,
    totalWeeklyHours,
    totalRawHours,
    totalBreakMinutes,
    totalPaidHours,
    weeklyTimesheets,
    clockIn,
    clockOut,
    isClockingIn,
    isClockingOut,
  } = useTimesheets(selectedWeek);

  // Merged server + offline clock session (single source of truth for "clocked in").
  const { session, isPending } = useClockSession();

  const safeLocation = async (): Promise<string> => {
    try {
      return await getCurrentLocation();
    } catch (error) {
      console.error('Error getting location:', error);
      return 'Location unavailable';
    }
  };

  const handleClockIn = async () => {
    if (!selectedJobsiteId) {
      return;
    }

    const location = await safeLocation();

    // Offline → queue the punch; it syncs automatically on reconnect.
    if (!navigator.onLine) {
      if (!user?.id || !user?.companyId) return;
      enqueueClockAction({
        type: 'clock_in',
        localId: newLocalId(),
        createdAt: new Date().toISOString(),
        userId: user.id,
        companyId: user.companyId,
        jobsiteId: selectedJobsiteId,
        jobsiteName: jobsites?.find((j) => j.id === selectedJobsiteId)?.name ?? null,
        location,
        checkInTime: new Date().toISOString(),
      });
      toast({ title: t('offline.savedOfflineTitle'), description: t('offline.savedOfflineIn') });
      return;
    }

    clockIn({ jobsiteId: selectedJobsiteId, location });
  };

  const handleClockOut = () => {
    setShowClockOutModal(true);
  };

  const handleClockOutWithNote = async (breakMinutes: number, note: string, bill?: ClockOutBillPayload) => {
    if (!session) {
      return;
    }

    const location = await safeLocation();

    // Offline, or clocking out a punch whose clock-in hasn't synced yet → queue it.
    if (!navigator.onLine || isPending) {
      enqueueClockAction({
        type: 'clock_out',
        localId: newLocalId(),
        createdAt: new Date().toISOString(),
        timesheetId: isPending ? null : session.id,
        pendingClockInLocalId: isPending ? session.id : null,
        location,
        checkOutTime: new Date().toISOString(),
        breakMinutes,
        workNote: note,
      });
      toast({ title: t('offline.savedOfflineTitle'), description: t('offline.savedOfflineOut') });
      setShowClockOutModal(false);
      if (bill && bill.files.length > 0) {
        toast({ title: 'Receipt not uploaded', description: 'Reimbursement receipts can only be sent while online — please resubmit later.', variant: 'destructive' });
      }
      return;
    }

    try {
      clockOut({ timesheetId: session.id, location, workNote: note, breakMinutes });

      // Submit reimbursement bill (optional) after clocking out
      if (bill && bill.files.length > 0 && user?.id && user?.companyId) {
        setIsSubmittingBill(true);
        try {
          await submitEmployeeBill(
            {
              files: bill.files,
              amount: bill.amount,
              description: bill.description,
              jobsiteId: session.jobsite_id ?? undefined,
              timesheetId: session.id,
            },
            user.id,
            user.companyId
          );
          toast({
            title: 'Bill submitted',
            description: 'Your reimbursement bill was sent for review.',
          });
        } catch (billError) {
          console.error('Error submitting reimbursement bill:', billError);
          toast({
            title: 'Bill not submitted',
            description: 'You were clocked out, but the bill upload failed. Please try again later.',
            variant: 'destructive',
          });
        } finally {
          setIsSubmittingBill(false);
        }
      }

      setShowClockOutModal(false);
    } catch (error) {
      console.error('Error getting location for clock out:', error);
    }
  };

  const isLoading = isClockingIn || isClockingOut || isGettingLocation || isSubmittingBill;
  const isClockedIn = !!session;
  const elapsed = useElapsedTime(session?.check_in_time);

  // Get today's full date
  const todayDate = format(new Date(), 'EEEE, MMMM dd, yyyy');


  const paidPct = Math.min(100, ((totalPaidHours || 0) / 40) * 100);

  return (
    <div className="space-y-4 max-w-2xl mx-auto animate-fade-in">
      <EmployeePageHeader title={t('clock.title')} subtitle={todayDate} icon={Clock} tone="emerald" />

      {/* Primary clock card */}
      <section className="rounded-3xl bg-white border border-slate-200/70 shadow-sm p-5">
        <div className="flex justify-center pb-1">
          <DigitalClock />
        </div>

        {isClockedIn ? (
          <div className="space-y-4">
            <div className="rounded-2xl bg-emerald-50 border border-emerald-100 p-4">
              <div className="flex items-center gap-2 text-emerald-700">
                <span className="relative grid h-6 w-6 place-items-center">
                  <span className="absolute inline-flex h-3 w-3 rounded-full bg-emerald-400 opacity-60 animate-ping" />
                  <CheckCircle className="h-5 w-5" />
                </span>
                <span className="font-bold">{t('clock.currentlyClockedIn')}</span>
                {isPending && (
                  <span className="ml-auto rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-700">
                    {t('clock.pendingSync')}
                  </span>
                )}
              </div>

              <div className="mt-3 text-center">
                <div className="text-4xl font-bold tabular-nums tracking-tight text-emerald-700">
                  {elapsed?.long ?? '00:00:00'}
                </div>
                <div className="mt-0.5 text-xs font-medium uppercase tracking-wide text-emerald-600/80">{t('clock.elapsed')}</div>
              </div>

              <div className="mt-3 space-y-2 border-t border-emerald-100 pt-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">{t('clock.started')}</span>
                  <span className="font-semibold text-slate-800">
                    {session?.check_in_time ? format(new Date(session.check_in_time), 'h:mm a') : '--:--'}
                  </span>
                </div>
                {session?.jobsiteName && (
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-slate-500 shrink-0">{t('clock.jobsite')}</span>
                    <span className="font-medium text-slate-700 truncate">{session.jobsiteName}</span>
                  </div>
                )}
                <div className="flex items-center justify-between gap-3">
                  <span className="text-slate-500 shrink-0">{t('clock.location')}</span>
                  <span className="flex items-center gap-1.5 font-medium text-slate-700 truncate">
                    <MapPin className="h-4 w-4 shrink-0 text-slate-400" />
                    <span className="truncate">{session?.check_in_location || t('clock.notAvailable')}</span>
                  </span>
                </div>
              </div>
            </div>

            <Button
              onClick={handleClockOut}
              disabled={isLoading}
              variant="destructive"
              className="w-full h-14 text-base font-semibold rounded-2xl shadow-sm active:scale-[0.98] transition-transform"
            >
              <Square className="h-5 w-5 mr-2" />
              {isLoading ? t('clock.clockingOut') : t('clock.clockOut')}
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-slate-700">{t('clock.selectJobsite')}</label>
              <Select value={selectedJobsiteId} onValueChange={setSelectedJobsiteId}>
                <SelectTrigger className="h-12 rounded-xl">
                  <SelectValue placeholder={t('clock.chooseJobsite')} />
                </SelectTrigger>
                <SelectContent className="bg-background z-50">
                  {jobsitesLoading ? (
                    <SelectItem value="loading-placeholder" disabled>{t('common.loading')}</SelectItem>
                  ) : !user?.companyId ? (
                    <SelectItem value="auth-loading-placeholder" disabled>{t('common.loading')}</SelectItem>
                  ) : !jobsites || jobsites.length === 0 ? (
                    <SelectItem value="empty-placeholder" disabled>{t('clock.noJobsites')}</SelectItem>
                  ) : (
                    jobsites.map((jobsite) => (
                      <SelectItem key={jobsite.id} value={jobsite.id}>
                        {jobsite.name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            <Button
              onClick={handleClockIn}
              disabled={!selectedJobsiteId || isLoading}
              className="w-full h-14 text-base font-semibold rounded-2xl bg-emerald-600 hover:bg-emerald-700 shadow-sm active:scale-[0.98] transition-transform disabled:opacity-60"
            >
              <Play className="h-5 w-5 mr-2" />
              {isLoading ? t('clock.clockingIn') : t('clock.clockIn')}
            </Button>
          </div>
        )}
      </section>

      <NotificationsToggle />

      {/* Today's Status Box */}
      <ErrorBoundary fallbackMinimal>
        <TodayStatusBox
          weeklyTimesheets={weeklyTimesheets}
          todayActiveTimesheet={todayActiveTimesheet}
        />
      </ErrorBoundary>

      {/* Weekly summary */}
      <ErrorBoundary fallbackMinimal>
        <section className="rounded-3xl bg-white border border-slate-200/70 shadow-sm p-5">
          <h2 className="text-sm font-bold uppercase tracking-wide text-slate-400">{t('clock.weekSummary')}</h2>
          <div className="mt-3 grid grid-cols-3 gap-2.5">
            {[
              { label: t('clock.raw'), value: isNaN(totalRawHours) ? '0.0' : totalRawHours.toFixed(1), chip: 'bg-slate-50', text: 'text-slate-800' },
              { label: t('clock.breaks'), value: totalBreakMinutes >= 60 ? `${(totalBreakMinutes / 60).toFixed(1)}h` : `${totalBreakMinutes || 0}m`, chip: 'bg-amber-50', text: 'text-amber-700' },
              { label: t('clock.paid'), value: isNaN(totalPaidHours) ? '0.0' : totalPaidHours.toFixed(1), chip: 'bg-orange-50', text: 'text-orange-700' },
            ].map((s) => (
              <div key={s.label} className={`rounded-2xl ${s.chip} p-3 text-center`}>
                <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">{s.label}</div>
                <div className={`mt-0.5 text-2xl font-bold tabular-nums ${s.text}`}>{s.value}</div>
              </div>
            ))}
          </div>
          <div className="mt-4">
            <div className="flex justify-between text-xs font-medium text-slate-500">
              <span>{t('clock.paidTowardGoal')}</span>
              <span>{paidPct.toFixed(0)}%</span>
            </div>
            <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-gradient-to-r from-orange-500 to-amber-400 transition-all duration-700"
                style={{ width: `${paidPct}%` }}
              />
            </div>
          </div>
        </section>
      </ErrorBoundary>

      {/* Week Selector */}
      <WeekSelector
        selectedWeek={selectedWeek}
        onWeekChange={setSelectedWeek}
      />

      {/* Weekly History Section */}
      <ErrorBoundary fallbackMinimal>
        <WeeklyHistorySection
          weeklyTimesheets={weeklyTimesheets}
          selectedWeek={selectedWeek}
        />
      </ErrorBoundary>

      {/* Location Permission Info */}
      {!navigator.geolocation && (
        <div className="rounded-2xl border border-orange-200 bg-orange-50 p-4">
          <div className="flex items-center gap-3 text-orange-700">
            <MapPin className="h-5 w-5 flex-shrink-0" />
            <span className="text-sm font-medium">{t('clock.noGps')}</span>
          </div>
        </div>
      )}

      <ClockOutNoteModal
        isOpen={showClockOutModal}
        onClose={() => setShowClockOutModal(false)}
        onClockOut={handleClockOutWithNote}
        isLoading={isClockingOut || isGettingLocation || isSubmittingBill}
      />
    </div>
  );
};

export default TimeTracker;
