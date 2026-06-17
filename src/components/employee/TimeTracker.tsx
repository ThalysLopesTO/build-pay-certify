
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useTimesheets } from '@/hooks/useTimesheets';
import { useGeolocation } from '@/hooks/useGeolocation';
import { useActiveJobsites } from '@/hooks/useJobsites';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { Clock, MapPin, Play, Square, CheckCircle } from 'lucide-react';
import EmployeePageHeader from './EmployeePageHeader';
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
      const { data, error } = await supabase
        .from('user_profiles')
        .select('photo_url, first_name, last_name')
        .eq('user_id', user.id)
        .maybeSingle();
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

  const handleClockIn = async () => {
    if (!selectedJobsiteId) {
      return;
    }

    try {
      const location = await getCurrentLocation();
      clockIn({ jobsiteId: selectedJobsiteId, location });
    } catch (error) {
      console.error('Error getting location for clock in:', error);
    }
  };

  const handleClockOut = () => {
    setShowClockOutModal(true);
  };

  const handleClockOutWithNote = async (breakMinutes: number, note: string, bill?: ClockOutBillPayload) => {
    if (!todayActiveTimesheet) {
      return;
    }

    try {
      const location = await getCurrentLocation();
      clockOut({ timesheetId: todayActiveTimesheet.id, location, workNote: note, breakMinutes });

      // Submit reimbursement bill (optional) after clocking out
      if (bill && bill.files.length > 0 && user?.id && user?.companyId) {
        setIsSubmittingBill(true);
        try {
          await submitEmployeeBill(
            {
              files: bill.files,
              amount: bill.amount,
              description: bill.description,
              jobsiteId: todayActiveTimesheet.jobsite_id,
              timesheetId: todayActiveTimesheet.id,
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
  const isClockedIn = !!todayActiveTimesheet;

  // Get today's full date
  const todayDate = format(new Date(), 'EEEE, MMMM dd, yyyy');


  const paidPct = Math.min(100, ((totalPaidHours || 0) / 40) * 100);

  return (
    <div className="space-y-4 max-w-2xl mx-auto animate-fade-in">
      <EmployeePageHeader title="Time Clock" subtitle={todayDate} icon={Clock} tone="emerald" />

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
                <span className="font-bold">Currently clocked in</span>
              </div>
              <div className="mt-3 space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Started</span>
                  <span className="font-semibold text-slate-800">
                    {todayActiveTimesheet.check_in_time ? format(new Date(todayActiveTimesheet.check_in_time), 'h:mm a') : '--:--'}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-slate-500 shrink-0">Location</span>
                  <span className="flex items-center gap-1.5 font-medium text-slate-700 truncate">
                    <MapPin className="h-4 w-4 shrink-0 text-slate-400" />
                    <span className="truncate">{todayActiveTimesheet.check_in_location || 'Not available'}</span>
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
              {isLoading ? 'Clocking out…' : 'Clock Out'}
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-slate-700">Select jobsite</label>
              <Select value={selectedJobsiteId} onValueChange={setSelectedJobsiteId}>
                <SelectTrigger className="h-12 rounded-xl">
                  <SelectValue placeholder="Choose a jobsite" />
                </SelectTrigger>
                <SelectContent className="bg-background z-50">
                  {jobsitesLoading ? (
                    <SelectItem value="loading-placeholder" disabled>Loading jobsites...</SelectItem>
                  ) : !user?.companyId ? (
                    <SelectItem value="auth-loading-placeholder" disabled>Loading your profile...</SelectItem>
                  ) : !jobsites || jobsites.length === 0 ? (
                    <SelectItem value="empty-placeholder" disabled>No jobsites available</SelectItem>
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
              {isLoading ? 'Clocking in…' : 'Clock In'}
            </Button>
          </div>
        )}
      </section>

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
          <h2 className="text-sm font-bold uppercase tracking-wide text-slate-400">This week's summary</h2>
          <div className="mt-3 grid grid-cols-3 gap-2.5">
            {[
              { label: 'Raw', value: isNaN(totalRawHours) ? '0.0' : totalRawHours.toFixed(1), chip: 'bg-slate-50', text: 'text-slate-800' },
              { label: 'Breaks', value: totalBreakMinutes >= 60 ? `${(totalBreakMinutes / 60).toFixed(1)}h` : `${totalBreakMinutes || 0}m`, chip: 'bg-amber-50', text: 'text-amber-700' },
              { label: 'Paid', value: isNaN(totalPaidHours) ? '0.0' : totalPaidHours.toFixed(1), chip: 'bg-orange-50', text: 'text-orange-700' },
            ].map((s) => (
              <div key={s.label} className={`rounded-2xl ${s.chip} p-3 text-center`}>
                <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">{s.label}</div>
                <div className={`mt-0.5 text-2xl font-bold tabular-nums ${s.text}`}>{s.value}</div>
              </div>
            ))}
          </div>
          <div className="mt-4">
            <div className="flex justify-between text-xs font-medium text-slate-500">
              <span>Paid hours toward 40h</span>
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
            <span className="text-sm font-medium">
              Location services are not available on this device. Clock in/out will work without GPS tracking.
            </span>
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
