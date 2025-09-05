/* eslint-disable @typescript-eslint/no-explicit-any */

import React, { useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, CheckCircle, Clock } from 'lucide-react';
import { useNearlyTimesheet } from '@/hooks/new/useWeekly';

interface WeekOption {
  startDate: Date;
  endDate: Date;
  startDateFormatted: string;
  endDateFormatted: string;
  rangeFormatted: string;
  rangeFormattedWithLabel: string;
  weekStartDateString: string;
  label: string;
  isCurrent: boolean;
  isSubmissionOpen?: boolean;
  timesheet: any;
}

interface WeekSelectorProps {
  availableWeeks: WeekOption[];
  selectedWeek: WeekOption | null;
  // submittedWeeks: string[];
  onWeekSelect: (week: WeekOption) => void;
}

const WeekSelector = ({ availableWeeks, selectedWeek, onWeekSelect }: WeekSelectorProps) => {
  const weekStartDates = availableWeeks.map(week => week.weekStartDateString);
  const { data: timesheetData } = useNearlyTimesheet(weekStartDates);

  useEffect(() => {
  if (availableWeeks.length === 0 || !timesheetData) return;

  // Only select the first week if no week is selected yet
  if (!selectedWeek) {
    const firstWeek = availableWeeks[0];
    const timesheet = timesheetData.find(t => t.week_start_date === firstWeek.weekStartDateString);
    onWeekSelect({ ...firstWeek, timesheet });
  }
}, [availableWeeks, timesheetData, selectedWeek, onWeekSelect]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Calendar className="h-5 w-5 text-orange-600" />
          <span>Select Week</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {availableWeeks.map((week, index) => {
            const timesheet = timesheetData?.find(
              t => t.week_start_date === week.weekStartDateString
            );
            const isSubmitted = !!timesheet;
            const isSelected = selectedWeek?.weekStartDateString === week.weekStartDateString;
            const openToSubmit = !isSubmitted && week.isSubmissionOpen;
            const inProgress = !isSubmitted && !week.isSubmissionOpen;
            
            if (timesheet) {
              week.timesheet = timesheet
            }
            
            return (
              <Button
                key={week.weekStartDateString}
                variant={isSelected ? "default" : "outline"}
                className={`h-auto p-4 flex flex-col items-start space-y-2 transition-all duration-200 ${isSubmitted ? 'opacity-60' : ''
                  } ${isSelected ? 'bg-orange-600 hover:bg-orange-700 border-orange-600' : ''}`}
                onClick={() => onWeekSelect(week)}
              >
                <div className="flex items-center justify-between w-full">
                  <span className="font-medium text-sm">
                    {week.rangeFormatted}
                  </span>
                  {isSubmitted && (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  )}
                </div>
                <div className="flex items-center space-x-2 flex-wrap">
                  <Badge
                    variant={week.isCurrent ? "default" : "secondary"}
                    className={week.isCurrent ? "bg-orange-100 text-orange-800" : ""}
                  >
                    {week.label}
                  </Badge>
                  {openToSubmit && (
                    <Badge variant="outline" className="text-blue-700 border-blue-300 bg-blue-50">
                      Open to Submit
                    </Badge>
                  )}
                  {inProgress && (
                    <Badge variant="outline" className="text-amber-700 border-amber-300 bg-amber-50 flex items-center">
                      <Clock className="h-3 w-3 mr-1" /> In Progress
                    </Badge>
                  )}
                  {isSubmitted && (
                    <Badge variant="outline" className="text-green-700 border-green-300 bg-green-50">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Submitted
                    </Badge>
                  )}
                </div>
              </Button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

export default WeekSelector;
