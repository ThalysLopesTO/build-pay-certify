
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useTimesheets } from '@/hooks/useTimesheets';
import { useGeolocation } from '@/hooks/useGeolocation';
import { useJobsites } from '@/hooks/useJobsites';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { Clock, MapPin, Play, Square, CheckCircle, XCircle, Download } from 'lucide-react';
import { format } from 'date-fns';
import TodayStatusBox from './time-tracker/TodayStatusBox';
import WeeklyHistorySection from './time-tracker/WeeklyHistorySection';
import DigitalClock from './time-tracker/DigitalClock';

const TimeTracker = () => {
  const { user } = useAuth();
  const [selectedJobsiteId, setSelectedJobsiteId] = useState<string>('');
  const { data: jobsites, isLoading: jobsitesLoading } = useJobsites();
  const { getCurrentLocation, isGettingLocation } = useGeolocation();
  const {
    todayActiveTimesheet,
    totalWeeklyHours,
    clockIn,
    clockOut,
    isClockingIn,
    isClockingOut,
  } = useTimesheets();

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

  const handleClockOut = async () => {
    if (!todayActiveTimesheet) {
      return;
    }

    try {
      const location = await getCurrentLocation();
      clockOut({ timesheetId: todayActiveTimesheet.id, location });
    } catch (error) {
      console.error('Error getting location for clock out:', error);
    }
  };

  const isLoading = isClockingIn || isClockingOut || isGettingLocation;
  const isClockedIn = !!todayActiveTimesheet;

  // Get today's full date
  const todayDate = format(new Date(), 'EEEE, MMMM dd, yyyy');

  return (
    <div className="space-y-6">
      {/* Top Bar Header */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
        <CardContent className="p-6">
          <div className="text-center space-y-2">
            <h1 className="text-2xl font-bold text-slate-900">
              Welcome, {user?.first_name || 'Employee'} {user?.last_name || ''}
            </h1>
            <p className="text-slate-600 text-lg">{todayDate}</p>
          </div>
        </CardContent>
      </Card>

      {/* Clock-In Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Clock className="h-5 w-5" />
            <span>Time Clock</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Digital Clock */}
          <div className="text-center">
            <DigitalClock />
          </div>

          {isClockedIn ? (
            <div className="space-y-4">
              <div className="bg-green-50 border border-green-200 rounded-xl p-6">
                <div className="flex items-center justify-center space-x-3 text-green-700 mb-4">
                  <CheckCircle className="h-6 w-6" />
                  <span className="font-semibold text-lg">Currently Clocked In</span>
                </div>
                <div className="text-center text-green-600 space-y-2">
                  <p className="text-lg">Started: {format(new Date(todayActiveTimesheet.check_in_time!), 'h:mm a')}</p>
                  <div className="flex items-center justify-center space-x-2">
                    <MapPin className="h-4 w-4" />
                    <span>{todayActiveTimesheet.check_in_location}</span>
                  </div>
                </div>
              </div>
              
              <Button 
                onClick={handleClockOut}
                disabled={isLoading}
                size="lg"
                variant="destructive"
                className="w-full h-14 text-lg rounded-xl"
              >
                <Square className="h-5 w-5 mr-3" />
                {isLoading ? 'Clocking Out...' : 'Clock Out'}
              </Button>
            </div>
          ) : (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Select Jobsite
                </label>
                <Select value={selectedJobsiteId} onValueChange={setSelectedJobsiteId}>
                  <SelectTrigger className="h-12 text-lg">
                    <SelectValue placeholder="Choose a jobsite" />
                  </SelectTrigger>
                  <SelectContent>
                    {jobsitesLoading ? (
                      <SelectItem value="loading" disabled>Loading jobsites...</SelectItem>
                    ) : (
                      jobsites?.map((jobsite) => (
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
                className="w-full h-14 text-lg bg-green-600 hover:bg-green-700 rounded-xl"
              >
                <Play className="h-5 w-5 mr-3" />
                {isLoading ? 'Clocking In...' : 'Clock In'}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Today's Status Box */}
      <TodayStatusBox />

      {/* Weekly Hours Summary */}
      <Card>
        <CardHeader>
          <CardTitle>This Week's Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center">
            <div className="text-4xl font-bold text-blue-600 mb-2">
              {totalWeeklyHours.toFixed(1)}
            </div>
            <div className="text-sm text-gray-500">Total Hours This Week</div>
          </div>
        </CardContent>
      </Card>

      {/* Weekly History Section */}
      <WeeklyHistorySection />

      {/* Location Permission Info */}
      {!navigator.geolocation && (
        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2 text-orange-700">
              <MapPin className="h-4 w-4" />
              <span className="text-sm">
                Location services are not available on this device. Clock in/out will work without GPS tracking.
              </span>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default TimeTracker;
