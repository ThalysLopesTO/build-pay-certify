import React from 'react';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Calendar as CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface RecurringBillFormProps {
  isRecurring: boolean;
  onRecurringChange: (checked: boolean) => void;
  frequency: string;
  onFrequencyChange: (value: string) => void;
  startDate: Date | undefined;
  onStartDateChange: (date: Date | undefined) => void;
  endDate: Date | undefined;
  onEndDateChange: (date: Date | undefined) => void;
  isIndefinite: boolean;
  onIndefiniteChange: (checked: boolean) => void;
}

export const RecurringBillForm = ({
  isRecurring,
  onRecurringChange,
  frequency,
  onFrequencyChange,
  startDate,
  onStartDateChange,
  endDate,
  onEndDateChange,
  isIndefinite,
  onIndefiniteChange,
}: RecurringBillFormProps) => {
  return (
    <div className="space-y-4">
      {/* Recurring Toggle */}
      <div className="flex items-center space-x-2">
        <Switch
          id="recurring"
          checked={isRecurring}
          onCheckedChange={onRecurringChange}
        />
        <Label htmlFor="recurring">Make this a recurring expense</Label>
      </div>

      {/* Recurring Options */}
      {isRecurring && (
        <div className="space-y-4 p-4 border rounded-lg bg-gray-50">
          <div className="grid grid-cols-2 gap-4">
            {/* Frequency */}
            <div>
              <Label htmlFor="frequency">Recurrence Frequency</Label>
              <Select value={frequency} onValueChange={onFrequencyChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select frequency" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="bi-weekly">Bi-weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="yearly">Yearly</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Start Date */}
            <div>
              <Label htmlFor="start-date">Start Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !startDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {startDate ? format(startDate, 'PPP') : <span>Pick start date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={startDate}
                    onSelect={onStartDateChange}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* End Date or Indefinite */}
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Switch
                id="indefinite"
                checked={isIndefinite}
                onCheckedChange={onIndefiniteChange}
              />
              <Label htmlFor="indefinite">Continue indefinitely</Label>
            </div>

            {!isIndefinite && (
              <div>
                <Label htmlFor="end-date">End Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !endDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {endDate ? format(endDate, 'PPP') : <span>Pick end date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={endDate}
                      onSelect={onEndDateChange}
                      initialFocus
                      disabled={(date) => startDate ? date < startDate : false}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};