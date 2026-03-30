
import React from 'react';
import { Card, CardContent, CardTitle } from '@/components/ui/card';
import { Calendar, LogIn, LogOut, Timer, Coffee } from 'lucide-react';
import { useTimesheets } from '@/hooks/useTimesheets';
import { format } from 'date-fns';

const formatBreakMinutes = (minutes: number): string => {
  if (minutes === 0) return '0m';
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
};

const TodayStatusBox = () => {
  const { weeklyTimesheets, todayActiveTimesheet } = useTimesheets();

  // Get today's timesheets (both completed and active)
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const todayTimesheets = weeklyTimesheets?.filter(timesheet => {
    if (!timesheet.check_in_time) return false;
    const checkInDate = new Date(timesheet.check_in_time);
    return checkInDate >= today && checkInDate < tomorrow;
  }) || [];

  // Add active timesheet if it exists and isn't already in the list
  const allTodayTimesheets = [...todayTimesheets];
  if (todayActiveTimesheet && !todayTimesheets.find(t => t.id === todayActiveTimesheet.id)) {
    allTodayTimesheets.push(todayActiveTimesheet);
  }

  // Calculate today's totals
  const validTimesheets = allTodayTimesheets.filter(t => t.check_in_time);
  const firstClockIn = validTimesheets.length > 0 
    ? validTimesheets.reduce((earliest, current) => {
        const currentTime = new Date(current.check_in_time);
        const earliestTime = new Date(earliest.check_in_time);
        return currentTime < earliestTime ? current : earliest;
      })
    : null;

  const lastClockOut = allTodayTimesheets
    .filter(t => t.check_out_time)
    .reduce((latest, current) => {
      if (!latest) return current;
      const currentTime = new Date(current.check_out_time!);
      const latestTime = new Date(latest.check_out_time!);
      return currentTime > latestTime ? current : latest;
    }, null as typeof allTodayTimesheets[0] | null);

  // Compute raw hours from timestamps
  const totalRawHoursToday = allTodayTimesheets.reduce((total, t) => total + t.raw_hours, 0);
  const totalBreakMinutesToday = allTodayTimesheets.reduce((total, t) => total + (t.break_minutes || 0), 0);

  // Calculate current session time if clocked in
  const currentSessionHours = todayActiveTimesheet?.check_in_time 
    ? (new Date().getTime() - new Date(todayActiveTimesheet.check_in_time).getTime()) / (1000 * 60 * 60)
    : 0;

  const displayRawHours = totalRawHoursToday + currentSessionHours;
  const displayPaidHours = Math.max(0, displayRawHours - (totalBreakMinutesToday / 60));

  return (
    <Card className="shadow-xl border-2 border-primary/10 overflow-hidden">
      <div className="bg-gradient-to-r from-slate-50 to-gray-50 p-6 border-b border-primary/10">
        <CardTitle className="flex items-center justify-center space-x-3 text-xl font-bold">
          <Calendar className="h-6 w-6 text-slate-600" />
          <span>Today's Status</span>
        </CardTitle>
      </div>
      <CardContent className="p-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
          <div className="text-center p-4 md:p-6 bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl shadow-md border border-blue-200/50 hover:shadow-lg transition-all duration-300">
            <div className="flex items-center justify-center mb-3 md:mb-4">
              <div className="p-2.5 md:p-3 bg-blue-500 rounded-full shadow-lg">
                <LogIn className="h-5 w-5 md:h-6 md:w-6 text-white" />
              </div>
            </div>
            <div className="text-xs md:text-sm text-blue-600 font-semibold mb-1 md:mb-2 uppercase tracking-wide">First Clock In</div>
            <div className="text-xl md:text-2xl font-black text-blue-900">
              {firstClockIn?.check_in_time ? format(new Date(firstClockIn.check_in_time), 'h:mm a') : '--:--'}
            </div>
          </div>
          
          <div className="text-center p-4 md:p-6 bg-gradient-to-br from-green-50 to-emerald-100 rounded-2xl shadow-md border border-green-200/50 hover:shadow-lg transition-all duration-300">
            <div className="flex items-center justify-center mb-3 md:mb-4">
              <div className="p-2.5 md:p-3 bg-green-500 rounded-full shadow-lg">
                <LogOut className="h-5 w-5 md:h-6 md:w-6 text-white" />
              </div>
            </div>
            <div className="text-xs md:text-sm text-green-600 font-semibold mb-1 md:mb-2 uppercase tracking-wide">Last Clock Out</div>
            <div className="text-xl md:text-2xl font-black text-green-900">
              {lastClockOut ? format(new Date(lastClockOut.check_out_time!), 'h:mm a') : 
               todayActiveTimesheet ? (
                 <span className="text-base md:text-lg bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent animate-pulse">
                   Still Active
                 </span>
               ) : '--:--'}
            </div>
          </div>

          <div className="text-center p-4 md:p-6 bg-gradient-to-br from-orange-50 to-amber-100 rounded-2xl shadow-md border border-orange-200/50 hover:shadow-lg transition-all duration-300">
            <div className="flex items-center justify-center mb-3 md:mb-4">
              <div className="p-2.5 md:p-3 bg-orange-500 rounded-full shadow-lg">
                <Coffee className="h-5 w-5 md:h-6 md:w-6 text-white" />
              </div>
            </div>
            <div className="text-xs md:text-sm text-orange-600 font-semibold mb-1 md:mb-2 uppercase tracking-wide">Breaks</div>
            <div className="text-xl md:text-2xl font-black text-orange-900">
              {formatBreakMinutes(totalBreakMinutesToday)}
            </div>
          </div>
          
          <div className="text-center p-4 md:p-6 bg-gradient-to-br from-purple-50 to-violet-100 rounded-2xl shadow-md border border-purple-200/50 hover:shadow-lg transition-all duration-300">
            <div className="flex items-center justify-center mb-3 md:mb-4">
              <div className="p-2.5 md:p-3 bg-purple-500 rounded-full shadow-lg">
                <Timer className="h-5 w-5 md:h-6 md:w-6 text-white" />
              </div>
            </div>
            <div className="text-xs md:text-sm text-purple-600 font-semibold mb-1 md:mb-2 uppercase tracking-wide">Paid Hours</div>
            <div className="text-xl md:text-2xl font-black text-purple-900">
              {displayPaidHours.toFixed(1)}h
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default TodayStatusBox;
