
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Clock, TrendingUp, Calendar } from 'lucide-react';
import { useTimesheets } from '@/hooks/useTimesheets';

const WeeklyHoursCard = () => {
  const { totalWeeklyHours, isLoading } = useTimesheets();

  if (isLoading) {
    return (
      <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white overflow-hidden">
        <CardContent className="p-6">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-white/20 rounded-full">
              <Clock className="h-6 w-6 animate-pulse" />
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-medium mb-2 opacity-90">This Week's Hours</h3>
              <div className="text-2xl font-bold">Loading...</div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white overflow-hidden hover:shadow-lg transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-center space-x-4">
          <div className="p-3 bg-white/20 rounded-full">
            <Clock className="h-6 w-6" />
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-medium mb-2 opacity-90">This Week's Hours</h3>
            <div className="text-3xl font-bold mb-1">{totalWeeklyHours.toFixed(1)} hrs</div>
            <div className="flex items-center text-xs opacity-90">
              <TrendingUp className="h-3 w-3 mr-1" />
              <span>Keep up the great work!</span>
            </div>
          </div>
          <div className="text-right">
            <Calendar className="h-5 w-5 opacity-70 mx-auto" />
            <div className="text-xs opacity-90 mt-1">Week Total</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default WeeklyHoursCard;
