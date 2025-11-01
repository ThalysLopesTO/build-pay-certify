import React, { useState } from 'react';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CalendarDays } from 'lucide-react';
import { useCalendarDates } from '@/hooks/daily-tasks/useCalendarDates';
import { DateBasedTaskView } from './DateBasedTaskView';
import { format } from 'date-fns';

interface DailyTaskCalendarViewProps {
  jobsiteId: string;
  companyId: string;
}

export const DailyTaskCalendarView: React.FC<DailyTaskCalendarViewProps> = ({
  jobsiteId,
  companyId,
}) => {
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const { data: datesWithTasks = [] } = useCalendarDates(
    jobsiteId,
    currentMonth.getMonth(),
    currentMonth.getFullYear()
  );

  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      setSelectedDate(date);
    }
  };

  const handleBackToCalendar = () => {
    setSelectedDate(null);
  };

  // If a date is selected, show the date-based task view
  if (selectedDate) {
    return (
      <DateBasedTaskView
        jobsiteId={jobsiteId}
        companyId={companyId}
        selectedDate={selectedDate}
        onDateChange={setSelectedDate}
        onBackToCalendar={handleBackToCalendar}
      />
    );
  }

  // Otherwise, show the calendar
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <CalendarDays className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-foreground">Select a Date</h2>
            <p className="text-sm text-muted-foreground">
              Choose a date to view and manage daily tasks
            </p>
          </div>
        </div>

        <Button onClick={() => setSelectedDate(new Date())} variant="outline">
          Today
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarDays className="h-5 w-5" />
            {format(currentMonth, 'MMMM yyyy')}
          </CardTitle>
        </CardHeader>
        <CardContent className="flex justify-center">
          <Calendar
            mode="single"
            selected={selectedDate || undefined}
            onSelect={handleDateSelect}
            month={currentMonth}
            onMonthChange={setCurrentMonth}
            className="rounded-md border"
            modifiers={{
              hasTasks: (date) => {
                const dateStr = format(date, 'yyyy-MM-dd');
                return datesWithTasks.includes(dateStr);
              },
            }}
            modifiersStyles={{
              hasTasks: {
                fontWeight: 'bold',
                textDecoration: 'underline',
              },
            }}
          />
        </CardContent>
      </Card>

      {datesWithTasks.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Quick Access</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {datesWithTasks.slice(0, 5).map((dateStr) => (
                <Badge
                  key={dateStr}
                  variant="secondary"
                  className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors"
                  onClick={() => setSelectedDate(new Date(dateStr))}
                >
                  {format(new Date(dateStr), 'MMM d')}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
