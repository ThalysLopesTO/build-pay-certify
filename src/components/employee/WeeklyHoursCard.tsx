
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Clock, TrendingUp } from 'lucide-react';
import { useTimesheets } from '@/hooks/useTimesheets';

const WeeklyHoursCard = () => {
  const { totalWeeklyHours, isLoading } = useTimesheets();

  if (isLoading) {
    return (
      <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
        <CardContent className="p-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-white/20 rounded-full">
              <Clock className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-medium mb-1">This Week's Hours</h3>
              <div className="text-xl font-bold">Loading...</div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
      <CardContent className="p-4">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-white/20 rounded-full">
            <Clock className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-medium mb-1">This Week's Hours</h3>
            <div className="text-xl font-bold">{totalWeeklyHours.toFixed(1)} hrs</div>
            <div className="flex items-center text-xs opacity-90 mt-1">
              <TrendingUp className="h-3 w-3 mr-1" />
              <span>Track your progress</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default WeeklyHoursCard;
