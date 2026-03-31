
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useTimesheets } from '@/hooks/useTimesheets';
import { useGeolocation } from '@/hooks/useGeolocation';
import { useActiveJobsites } from '@/hooks/useJobsites';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { Clock, MapPin, Play, Square, CheckCircle, Timer, Calendar, Target, TrendingUp } from 'lucide-react';
import { format } from 'date-fns';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import EmployeeAvatar from '@/components/ui/employee-avatar';
import ErrorBoundary from '@/components/common/ErrorBoundary';
import TodayStatusBox from './time-tracker/TodayStatusBox';
import WeeklyHistorySection from './time-tracker/WeeklyHistorySection';
import WeekSelector from './time-tracker/WeekSelector';
import DigitalClock from './time-tracker/DigitalClock';
import ClockOutNoteModal from './ClockOutNoteModal';

const TimeTracker = () => {
  const { user } = useAuth();
  const [selectedJobsiteId, setSelectedJobsiteId] = useState<string>('');
  const [selectedWeek, setSelectedWeek] = useState<Date>(new Date());
  const [showClockOutModal, setShowClockOutModal] = useState(false);
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

  const handleClockOutWithNote = async (note?: string) => {
    if (!todayActiveTimesheet) {
      return;
    }

    try {
      const location = await getCurrentLocation();
      clockOut({ timesheetId: todayActiveTimesheet.id, location, workNote: note });
      setShowClockOutModal(false);
    } catch (error) {
      console.error('Error getting location for clock out:', error);
    }
  };

  const isLoading = isClockingIn || isClockingOut || isGettingLocation;
  const isClockedIn = !!todayActiveTimesheet;

  // Get today's full date
  const todayDate = format(new Date(), 'EEEE, MMMM dd, yyyy');

  return (
    <div className="space-y-8 max-w-6xl mx-auto p-4">
      {/* Welcome Banner */}
      <Card className="overflow-hidden shadow-lg bg-gradient-to-br from-primary/5 via-background to-secondary/5 border-2 border-primary/10">
        <CardContent className="p-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-6">
              <EmployeeAvatar 
                photoUrl={userProfile?.photo_url}
                firstName={userProfile?.first_name || user?.firstName}
                lastName={userProfile?.last_name || user?.lastName}
                size="lg"
                className="ring-4 ring-primary/20 shadow-lg"
              />
              <div className="text-center md:text-left">
                <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
                  Welcome, {userProfile?.first_name || user?.firstName || 'Employee'}!
                </h1>
                <p className="text-lg text-muted-foreground mt-1">{todayDate}</p>
              </div>
            </div>
            <div className="text-center md:text-right">
              <div className="text-sm text-muted-foreground">Ready to clock in</div>
              <div className="text-2xl font-bold text-primary">Let's get to work!</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Time Clock Section */}
      <Card className="shadow-xl border-2 border-primary/10 overflow-hidden">
        <div className="bg-gradient-to-r from-primary/5 to-secondary/5 p-6 border-b border-primary/10">
          <CardTitle className="flex items-center justify-center space-x-3 text-2xl font-bold">
            <Clock className="h-7 w-7 text-primary animate-pulse" />
            <span className="bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">Time Clock</span>
          </CardTitle>
        </div>
        <CardContent className="space-y-8 p-8">
          {/* Digital Clock */}
          <div className="flex justify-center">
            <div className="relative">
              <div className="absolute inset-0 bg-primary/20 rounded-2xl blur-xl"></div>
              <div className="relative">
                <DigitalClock />
              </div>
            </div>
          </div>

          {isClockedIn ? (
            <div className="space-y-6">
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200/50 rounded-2xl p-8 shadow-lg">
                <div className="flex items-center justify-center space-x-4 text-green-700 mb-6">
                  <div className="relative">
                    <CheckCircle className="h-8 w-8 animate-pulse" />
                    <div className="absolute inset-0 h-8 w-8 bg-green-400/30 rounded-full animate-ping"></div>
                  </div>
                  <span className="font-bold text-xl">Currently Clocked In</span>
                </div>
                <div className="text-center text-green-600 space-y-3">
                  <p className="text-xl font-semibold">Started: {todayActiveTimesheet.check_in_time ? format(new Date(todayActiveTimesheet.check_in_time), 'h:mm a') : '--:--'}</p>
                  <div className="flex items-center justify-center space-x-2 text-lg">
                    <MapPin className="h-5 w-5" />
                    <span className="font-medium">{todayActiveTimesheet.check_in_location}</span>
                  </div>
                </div>
              </div>
              
              <Button 
                onClick={handleClockOut}
                disabled={isLoading}
                size="lg"
                variant="destructive"
                className="w-full h-16 text-xl rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02]"
              >
                <Square className="h-6 w-6 mr-4" />
                {isLoading ? 'Clocking Out...' : 'Clock Out'}
              </Button>
            </div>
          ) : (
            <div className="space-y-8">
              <div className="space-y-4">
                <label className="block text-lg font-semibold text-foreground mb-4">
                  Select Jobsite
                </label>
                <Select value={selectedJobsiteId} onValueChange={setSelectedJobsiteId}>
                  <SelectTrigger className="h-14 text-lg rounded-xl border-2 border-primary/20 hover:border-primary/40 transition-colors shadow-sm">
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
                size="lg"
                className="w-full h-16 text-xl bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02] disabled:transform-none"
              >
                <Play className="h-6 w-6 mr-4" />
                {isLoading ? 'Clocking In...' : 'Clock In'}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Today's Status Box */}
      <ErrorBoundary fallbackMinimal>
        <TodayStatusBox />
      </ErrorBoundary>

      {/* Weekly Hours Summary */}
      <ErrorBoundary fallbackMinimal>
        <Card className="shadow-xl border-2 border-primary/10 overflow-hidden">
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 border-b border-primary/10">
            <CardTitle className="flex items-center justify-center space-x-3 text-xl font-bold">
              <Target className="h-6 w-6 text-blue-600" />
              <span>This Week's Summary</span>
            </CardTitle>
          </div>
          <CardContent className="p-8">
            <div className="space-y-6">
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-4 bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl border border-slate-200">
                  <div className="text-sm text-slate-500 font-semibold uppercase tracking-wide mb-1">Raw Hours</div>
                  <div className="text-3xl font-black text-slate-700">{isNaN(totalRawHours) ? '0.0' : totalRawHours.toFixed(1)}</div>
                </div>
                <div className="text-center p-4 bg-gradient-to-br from-orange-50 to-amber-100 rounded-xl border border-orange-200">
                  <div className="text-sm text-orange-600 font-semibold uppercase tracking-wide mb-1">Breaks</div>
                  <div className="text-3xl font-black text-orange-800">
                    {totalBreakMinutes >= 60 
                      ? `${(totalBreakMinutes / 60).toFixed(1)}h` 
                      : `${totalBreakMinutes || 0}m`}
                  </div>
                </div>
                <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-indigo-100 rounded-xl border border-blue-200">
                  <div className="text-sm text-blue-600 font-semibold uppercase tracking-wide mb-1">Paid Hours</div>
                  <div className="text-3xl font-black bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">{isNaN(totalPaidHours) ? '0.0' : totalPaidHours.toFixed(1)}</div>
                </div>
              </div>
              
              <div className="space-y-3">
                <div className="flex justify-between text-sm font-medium">
                  <span>Paid hours toward 40h</span>
                  <span>{Math.min(100, ((totalPaidHours || 0) / 40) * 100).toFixed(0)}%</span>
                </div>
                <div className="w-full bg-secondary rounded-full h-3 overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full transition-all duration-1000 ease-out"
                    style={{ width: `${Math.min(100, ((totalPaidHours || 0) / 40) * 100)}%` }}
                  ></div>
                </div>
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>0h</span>
                  <span>40h</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
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
        <Card className="border-2 border-orange-200 bg-gradient-to-r from-orange-50 to-yellow-50 shadow-md">
          <CardContent className="p-6">
            <div className="flex items-center space-x-3 text-orange-700">
              <MapPin className="h-5 w-5 flex-shrink-0" />
              <span className="text-sm font-medium">
                Location services are not available on this device. Clock in/out will work without GPS tracking.
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      <ClockOutNoteModal
        isOpen={showClockOutModal}
        onClose={() => setShowClockOutModal(false)}
        onClockOut={handleClockOutWithNote}
        isLoading={isClockingOut}
      />
    </div>
  );
};

export default TimeTracker;
