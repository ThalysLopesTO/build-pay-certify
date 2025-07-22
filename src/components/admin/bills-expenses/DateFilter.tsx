import React from 'react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CalendarIcon, X } from 'lucide-react';
import { format, startOfMonth, endOfMonth, subMonths, addMonths } from 'date-fns';
import { cn } from '@/lib/utils';

interface DateFilterProps {
  dateFrom: Date | undefined;
  dateTo: Date | undefined;
  onDateFromChange: (date: Date | undefined) => void;
  onDateToChange: (date: Date | undefined) => void;
  onClear: () => void;
}

export const DateFilter = ({ 
  dateFrom, 
  dateTo, 
  onDateFromChange, 
  onDateToChange, 
  onClear 
}: DateFilterProps) => {
  const currentDate = new Date();
  const hasFilter = dateFrom || dateTo;

  const quickSelectMonth = (monthOffset: number) => {
    const targetDate = monthOffset === 0 ? currentDate : 
                      monthOffset > 0 ? addMonths(currentDate, monthOffset) :
                      subMonths(currentDate, Math.abs(monthOffset));
    
    onDateFromChange(startOfMonth(targetDate));
    onDateToChange(endOfMonth(targetDate));
  };

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 p-4 bg-white rounded-xl shadow-sm border border-slate-200">
      <div className="flex items-center gap-2">
        <CalendarIcon className="h-4 w-4 text-slate-600" />
        <span className="text-sm font-semibold text-slate-700">Date Filter:</span>
      </div>
      
      {/* Quick Month Selector */}
      <div className="flex flex-wrap gap-2">
        <Select onValueChange={(value) => quickSelectMonth(parseInt(value))}>
          <SelectTrigger className="w-32 h-9 text-xs">
            <SelectValue placeholder="Quick select" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="-2">2 Months Ago</SelectItem>
            <SelectItem value="-1">Last Month</SelectItem>
            <SelectItem value="0">This Month</SelectItem>
            <SelectItem value="1">Next Month</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Custom Date Range */}
      <div className="flex items-center gap-2">
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "h-9 px-3 text-xs justify-start text-left font-normal",
                !dateFrom && "text-muted-foreground"
              )}
            >
              {dateFrom ? format(dateFrom, 'MMM dd, yyyy') : 'From date'}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0">
            <Calendar
              mode="single"
              selected={dateFrom}
              onSelect={onDateFromChange}
              initialFocus
              className="pointer-events-auto"
            />
          </PopoverContent>
        </Popover>

        <span className="text-slate-400">to</span>

        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "h-9 px-3 text-xs justify-start text-left font-normal",
                !dateTo && "text-muted-foreground"
              )}
            >
              {dateTo ? format(dateTo, 'MMM dd, yyyy') : 'To date'}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0">
            <Calendar
              mode="single"
              selected={dateTo}
              onSelect={onDateToChange}
              initialFocus
              className="pointer-events-auto"
            />
          </PopoverContent>
        </Popover>

        {hasFilter && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onClear}
            className="h-9 px-2 text-xs text-slate-500 hover:text-slate-700"
          >
            <X className="h-3 w-3" />
            Clear
          </Button>
        )}
      </div>

      {hasFilter && (
        <div className="text-xs text-slate-600 bg-slate-50 px-3 py-1.5 rounded-md">
          {dateFrom && dateTo 
            ? `${format(dateFrom, 'MMM dd')} - ${format(dateTo, 'MMM dd, yyyy')}`
            : dateFrom 
            ? `From ${format(dateFrom, 'MMM dd, yyyy')}`
            : `Until ${format(dateTo!, 'MMM dd, yyyy')}`
          }
        </div>
      )}
    </div>
  );
};