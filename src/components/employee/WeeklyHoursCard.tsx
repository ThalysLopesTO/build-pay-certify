
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { useWeeklyHoursSummary } from '@/hooks/useWeeklyHoursSummary';
import { useWorkWeek } from '@/hooks/useWorkWeek';

const WeeklyHoursCard: React.FC = () => {
  const { data: totalHours, isLoading } = useWeeklyHoursSummary();
  const workWeek = useWorkWeek();

  if (isLoading || !workWeek) {
    return (
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
        <CardContent className="p-6">
          <div className="animate-pulse">
            <div className="h-6 bg-slate-200 rounded mb-2"></div>
            <div className="h-4 bg-slate-200 rounded mb-4 w-2/3"></div>
            <div className="h-8 bg-slate-200 rounded w-16 mx-auto"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
      <CardContent className="p-6">
        <div className="text-center">
          <h3 className="text-lg font-semibold text-slate-900 mb-1">This Week's Hours</h3>
          <p className="text-slate-600 mb-1">Track your weekly progress</p>
          <p className="text-sm text-slate-500 mb-4">{workWeek.currentWeek.rangeFormatted}</p>
          <div className="text-4xl font-bold text-blue-600">
            {totalHours || 0}h
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default WeeklyHoursCard;
