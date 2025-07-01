
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import { format, startOfWeek, endOfWeek, subWeeks, addWeeks, isFuture } from 'date-fns';

interface WeekOption {
  startDate: Date;
  endDate: Date;
  label: string;
  value: string;
}

interface WeekSelectorProps {
  selectedWeek: Date;
  onWeekChange: (weekStart: Date) => void;
}

const WeekSelector = ({ selectedWeek, onWeekChange }: WeekSelectorProps) => {
  // Generate week options (current week + 12 previous weeks)
  const generateWeekOptions = (): WeekOption[] => {
    const options: WeekOption[] = [];
    const currentWeek = startOfWeek(new Date(), { weekStartsOn: 1 }); // Monday start
    
    for (let i = 0; i < 13; i++) {
      const weekStart = subWeeks(currentWeek, i);
      const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 });
      
      // Don't show future weeks
      if (isFuture(weekStart)) continue;
      
      const isCurrentWeek = i === 0;
      const label = isCurrentWeek 
        ? `Current Week (${format(weekStart, 'MMM dd')} – ${format(weekEnd, 'MMM dd, yyyy')})`
        : `${format(weekStart, 'MMM dd')} – ${format(weekEnd, 'MMM dd, yyyy')}`;
      
      options.push({
        startDate: weekStart,
        endDate: weekEnd,
        label,
        value: weekStart.toISOString()
      });
    }
    
    return options;
  };

  const weekOptions = generateWeekOptions();
  const selectedWeekStart = startOfWeek(selectedWeek, { weekStartsOn: 1 });
  
  const handlePrevWeek = () => {
    const prevWeek = subWeeks(selectedWeekStart, 1);
    onWeekChange(prevWeek);
  };
  
  const handleNextWeek = () => {
    const nextWeek = addWeeks(selectedWeekStart, 1);
    // Don't allow future weeks
    if (!isFuture(nextWeek)) {
      onWeekChange(nextWeek);
    }
  };
  
  const canGoNext = !isFuture(addWeeks(selectedWeekStart, 1));

  return (
    <Card className="mb-4">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium text-gray-700 flex items-center space-x-2">
          <Calendar className="h-4 w-4" />
          <span>Select Week:</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex items-center space-x-3">
          <button
            onClick={handlePrevWeek}
            className="p-2 rounded-md hover:bg-gray-100 transition-colors"
            aria-label="Previous week"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          
          <div className="flex-1">
            <Select
              value={selectedWeekStart.toISOString()}
              onValueChange={(value) => onWeekChange(new Date(value))}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a week" />
              </SelectTrigger>
              <SelectContent>
                {weekOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <button
            onClick={handleNextWeek}
            disabled={!canGoNext}
            className="p-2 rounded-md hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Next week"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </CardContent>
    </Card>
  );
};

export default WeekSelector;
