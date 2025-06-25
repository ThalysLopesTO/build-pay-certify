
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useTimesheets } from '@/hooks/useTimesheets';
import { useGeolocation } from '@/hooks/useGeolocation';
import { useJobsites } from '@/hooks/useJobsites';
import { Clock, MapPin, Play, Square } from 'lucide-react';
import { format } from 'date-fns';

const TimeTracker = () => {
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

  return (
    <div className="space-y-6">
      {/* Current Status Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Clock className="h-5 w-5" />
            <span>Time Tracker</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {isClockedIn ? (
            <div className="space-y-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center space-x-2 text-green-700 mb-2">
                  <Play className="h-4 w-4" />
                  <span className="font-medium">Currently Clocked In</span>
                </div>
                <div className="text-sm text-green-600 space-y-1">
                  <p>Started: {format(new Date(todayActiveTimesheet.check_in_time!), 'HH:mm')}</p>
                  <div className="flex items-center space-x-1">
                    <MapPin className="h-3 w-3" />
                    <span>{todayActiveTimesheet.check_in_location}</span>
                  </div>
                </div>
              </div>
              
              <Button 
                onClick={handleClockOut}
                disabled={isLoading}
                size="lg"
                variant="destructive"
                className="w-full"
              >
                <Square className="h-4 w-4 mr-2" />
                {isLoading ? 'Clocking Out...' : 'Clock Out'}
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Jobsite
                </label>
                <Select value={selectedJobsiteId} onValueChange={setSelectedJobsiteId}>
                  <SelectTrigger>
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
                className="w-full bg-green-600 hover:bg-green-700"
              >
                <Play className="h-4 w-4 mr-2" />
                {isLoading ? 'Clocking In...' : 'Clock In'}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Weekly Hours Summary */}
      <Card>
        <CardHeader>
          <CardTitle>This Week's Hours</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-600">
              {totalWeeklyHours.toFixed(1)}
            </div>
            <div className="text-sm text-gray-500">Total Hours</div>
          </div>
        </CardContent>
      </Card>

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
