
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, CheckCircle } from 'lucide-react';

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
}

interface WeekSelectorProps {
  availableWeeks: WeekOption[];
  selectedWeek: WeekOption | null;
  submittedWeeks: string[];
  onWeekSelect: (week: WeekOption) => void;
}

const WeekSelector = ({ availableWeeks, selectedWeek, submittedWeeks, onWeekSelect }: WeekSelectorProps) => {
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
          {availableWeeks.map((week) => {
            const isSubmitted = submittedWeeks.includes(week.weekStartDateString);
            const isSelected = selectedWeek?.weekStartDateString === week.weekStartDateString;
            
            return (
              <Button
                key={week.weekStartDateString}
                variant={isSelected ? "default" : "outline"}
                className={`h-auto p-4 flex flex-col items-start space-y-2 ${
                  isSubmitted ? 'opacity-60' : ''
                } ${isSelected ? 'bg-orange-600 hover:bg-orange-700' : ''}`}
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
                <div className="flex items-center space-x-2">
                  <Badge 
                    variant={week.isCurrent ? "default" : "secondary"}
                    className={week.isCurrent ? "bg-orange-100 text-orange-800" : ""}
                  >
                    {week.label}
                  </Badge>
                  {isSubmitted && (
                    <Badge variant="outline" className="text-green-700 border-green-300">
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
