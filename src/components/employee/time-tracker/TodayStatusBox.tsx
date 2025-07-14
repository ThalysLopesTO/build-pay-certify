
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Clock, Calendar, LogIn, LogOut, Timer } from 'lucide-react';
import { useTimesheets } from '@/hooks/useTimesheets';
import { format } from 'date-fns';

const TodayStatusBox = () => {
  const { weeklyTimesheets, todayActiveTimesheet } = useTimesheets();

  // Get today's timesheets (both completed and active)
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const todayTimesheets = weeklyTimesheets?.filter(timesheet => {
    const checkInDate = new Date(timesheet.check_in_time!);
    return checkInDate >= today && checkInDate < tomorrow;
  }) || [];

  // Add active timesheet if it exists and isn't already in the list
  const allTodayTimesheets = [...todayTimesheets];
  if (todayActiveTimesheet && !todayTimesheets.find(t => t.id === todayActiveTimesheet.id)) {
    allTodayTimesheets.push(todayActiveTimesheet);
  }

  // Calculate today's totals
  const firstClockIn = allTodayTimesheets.length > 0 
    ? allTodayTimesheets.reduce((earliest, current) => {
        const currentTime = new Date(current.check_in_time!);
        const earliestTime = new Date(earliest.check_in_time!);
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

  const totalHoursToday = allTodayTimesheets.reduce((total, timesheet) => {
    return total + (timesheet.hours_worked || 0);
  }, 0);

  // Calculate current session time if clocked in
  const currentSessionHours = todayActiveTimesheet?.check_in_time 
    ? (new Date().getTime() - new Date(todayActiveTimesheet.check_in_time).getTime()) / (1000 * 60 * 60)
    : 0;

  const displayTotalHours = totalHoursToday + currentSessionHours;

  return (
    <Card className="shadow-xl border-2 border-primary/10 overflow-hidden">
      <div className="bg-gradient-to-r from-slate-50 to-gray-50 p-6 border-b border-primary/10">
        <CardTitle className="flex items-center justify-center space-x-3 text-xl font-bold">
          <Calendar className="h-6 w-6 text-slate-600" />
          <span>Today's Status</span>
        </CardTitle>
      </div>
      <CardContent className="p-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center p-6 bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl shadow-md border border-blue-200/50 hover:shadow-lg transition-all duration-300">
            <div className="flex items-center justify-center mb-4">
              <div className="p-3 bg-blue-500 rounded-full shadow-lg">
                <LogIn className="h-6 w-6 text-white" />
              </div>
            </div>
            <div className="text-sm text-blue-600 font-semibold mb-2 uppercase tracking-wide">First Clock In</div>
            <div className="text-2xl font-black text-blue-900">
              {firstClockIn ? format(new Date(firstClockIn.check_in_time!), 'h:mm a') : '--:--'}
            </div>
          </div>
          
          <div className="text-center p-6 bg-gradient-to-br from-green-50 to-emerald-100 rounded-2xl shadow-md border border-green-200/50 hover:shadow-lg transition-all duration-300">
            <div className="flex items-center justify-center mb-4">
              <div className="p-3 bg-green-500 rounded-full shadow-lg">
                <LogOut className="h-6 w-6 text-white" />
              </div>
            </div>
            <div className="text-sm text-green-600 font-semibold mb-2 uppercase tracking-wide">Last Clock Out</div>
            <div className="text-2xl font-black text-green-900">
              {lastClockOut ? format(new Date(lastClockOut.check_out_time!), 'h:mm a') : 
               todayActiveTimesheet ? (
                 <span className="text-lg bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent animate-pulse">
                   Still Active
                 </span>
               ) : '--:--'}
            </div>
          </div>
          
          <div className="text-center p-6 bg-gradient-to-br from-purple-50 to-violet-100 rounded-2xl shadow-md border border-purple-200/50 hover:shadow-lg transition-all duration-300">
            <div className="flex items-center justify-center mb-4">
              <div className="p-3 bg-purple-500 rounded-full shadow-lg">
                <Timer className="h-6 w-6 text-white" />
              </div>
            </div>
            <div className="text-sm text-purple-600 font-semibold mb-2 uppercase tracking-wide">Total Time Today</div>
            <div className="text-2xl font-black text-purple-900">
              {displayTotalHours.toFixed(1)}h
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default TodayStatusBox;
