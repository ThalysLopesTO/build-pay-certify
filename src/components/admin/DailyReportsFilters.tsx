import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { CalendarIcon, Search, X } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useJobsites } from '@/hooks/useJobsites';

interface DailyReportsFiltersProps {
  filters: {
    jobsite_id?: string;
    date_from?: string;
    date_to?: string;
    submitted_by?: string;
    search?: string;
  };
  onFiltersChange: (filters: any) => void;
  onClearFilters: () => void;
}

const DailyReportsFilters: React.FC<DailyReportsFiltersProps> = ({
  filters,
  onFiltersChange,
  onClearFilters,
}) => {
  const { data: jobsites = [] } = useJobsites();
  const [dateFrom, setDateFrom] = React.useState<Date | undefined>(
    filters.date_from ? new Date(filters.date_from) : undefined
  );
  const [dateTo, setDateTo] = React.useState<Date | undefined>(
    filters.date_to ? new Date(filters.date_to) : undefined
  );

  const handleDateFromChange = (date: Date | undefined) => {
    setDateFrom(date);
    onFiltersChange({
      ...filters,
      date_from: date ? format(date, 'yyyy-MM-dd') : undefined,
    });
  };

  const handleDateToChange = (date: Date | undefined) => {
    setDateTo(date);
    onFiltersChange({
      ...filters,
      date_to: date ? format(date, 'yyyy-MM-dd') : undefined,
    });
  };

  const hasActiveFilters = Object.values(filters).some(value => value);

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h3 className="font-medium">Filters</h3>
            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onClearFilters}
                className="h-8 px-2 text-muted-foreground"
              >
                <X className="h-3 w-3 mr-1" />
                Clear all
              </Button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search reports..."
                value={filters.search || ''}
                onChange={(e) =>
                  onFiltersChange({ ...filters, search: e.target.value || undefined })
                }
                className="pl-9"
              />
            </div>

            {/* Jobsite Filter */}
            <Select
              value={filters.jobsite_id || 'all'}
              onValueChange={(value) =>
                onFiltersChange({ ...filters, jobsite_id: value === 'all' ? undefined : value })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="All jobsites" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All jobsites</SelectItem>
                {jobsites.map((jobsite) => (
                  <SelectItem key={jobsite.id} value={jobsite.id}>
                    {jobsite.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Date From */}
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    'w-full justify-start text-left font-normal',
                    !dateFrom && 'text-muted-foreground'
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateFrom ? format(dateFrom, 'PPP') : 'From date'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={dateFrom}
                  onSelect={handleDateFromChange}
                  initialFocus
                />
              </PopoverContent>
            </Popover>

            {/* Date To */}
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    'w-full justify-start text-left font-normal',
                    !dateTo && 'text-muted-foreground'
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateTo ? format(dateTo, 'PPP') : 'To date'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={dateTo}
                  onSelect={handleDateToChange}
                  disabled={(date) => dateFrom ? date < dateFrom : false}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default DailyReportsFilters;