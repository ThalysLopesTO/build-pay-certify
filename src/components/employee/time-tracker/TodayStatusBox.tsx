
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Clock, Calendar } from 'lucide-react';
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
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Calendar className="h-5 w-5" />
          <span>Today's Status</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <div className="text-sm text-blue-600 font-medium mb-1">First Clock In</div>
            <div className="text-lg font-semibold text-blue-900">
              {firstClockIn ? format(new Date(firstClockIn.check_in_time!), 'h:mm a') : '--:--'}
            </div>
          </div>
          
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <div className="text-sm text-green-600 font-medium mb-1">Last Clock Out</div>
            <div className="text-lg font-semibold text-green-900">
              {lastClockOut ? format(new Date(lastClockOut.check_out_time!), 'h:mm a') : 
               todayActiveTimesheet ? 'Still Active' : '--:--'}
            </div>
          </div>
          
          <div className="text-center p-4 bg-purple-50 rounded-lg">
            <div className="text-sm text-purple-600 font-medium mb-1">Total Time Today</div>
            <div className="text-lg font-semibold text-purple-900">
              {displayTotalHours.toFixed(1)}h
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default TodayStatusBox;
