import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { CalendarIcon, Search, X, Filter } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { formatInTimeZone, toZonedTime } from 'date-fns-tz';
import { useCompanySettings } from '@/hooks/useCompanySettings';
import { cn } from '@/lib/utils';
import { useActiveJobsites } from '@/hooks/useJobsites';

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
  const { data: jobsites = [] } = useActiveJobsites();
  const { settings: companySettings } = useCompanySettings();
  const timezone = companySettings?.timezone || 'America/Toronto';
  const [dateFrom, setDateFrom] = React.useState<Date | undefined>(
    filters.date_from ? new Date(filters.date_from) : undefined
  );
  const [dateTo, setDateTo] = React.useState<Date | undefined>(
    filters.date_to ? new Date(filters.date_to) : undefined
  );

  const handleDateFromChange = (date: Date | undefined) => {
    setDateFrom(date);
    // Convert the selected date to company timezone for filtering
    const dateInTimezone = date ? formatInTimeZone(date, timezone, 'yyyy-MM-dd') : undefined;
    onFiltersChange({
      ...filters,
      date_from: dateInTimezone,
    });
  };

  const handleDateToChange = (date: Date | undefined) => {
    setDateTo(date);
    // Convert the selected date to company timezone for filtering
    const dateInTimezone = date ? formatInTimeZone(date, timezone, 'yyyy-MM-dd') : undefined;
    onFiltersChange({
      ...filters,
      date_to: dateInTimezone,
    });
  };

  const hasActiveFilters = Object.values(filters).some(value => value);

  return (
    <Card className="bg-background border shadow-sm">
      <CardContent className="p-6">
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <h3 className="font-semibold text-sm">Filter Reports</h3>
            </div>
            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onClearFilters}
                className="h-8 px-3 text-muted-foreground hover:text-foreground"
              >
                <X className="h-3 w-3 mr-1" />
                Clear all
              </Button>
            )}
          </div>

          {/* Filters Grid */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <div className="space-y-2">
              <Label htmlFor="search" className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Search
              </Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Search reports..."
                  value={filters.search || ''}
                  onChange={(e) =>
                    onFiltersChange({ ...filters, search: e.target.value || undefined })
                  }
                  className="pl-9 bg-background"
                />
              </div>
            </div>

            {/* Jobsite Filter */}
            <div className="space-y-2">
              <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Jobsite
              </Label>
              <Select
                value={filters.jobsite_id || 'all'}
                onValueChange={(value) =>
                  onFiltersChange({ ...filters, jobsite_id: value === 'all' ? undefined : value })
                }
              >
                <SelectTrigger className="bg-background">
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
            </div>

            {/* Date From */}
            <div className="space-y-2">
              <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                From Date
              </Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      'w-full justify-start text-left font-normal bg-background',
                      !dateFrom && 'text-muted-foreground'
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateFrom ? format(dateFrom, 'MMM dd, yyyy') : 'From date'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={dateFrom}
                    onSelect={handleDateFromChange}
                    initialFocus
                    className="p-3 pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Date To */}
            <div className="space-y-2">
              <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                To Date
              </Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      'w-full justify-start text-left font-normal bg-background',
                      !dateTo && 'text-muted-foreground'
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateTo ? format(dateTo, 'MMM dd, yyyy') : 'To date'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={dateTo}
                    onSelect={handleDateToChange}
                    disabled={(date) => dateFrom ? date < dateFrom : false}
                    initialFocus
                    className="p-3 pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default DailyReportsFilters;