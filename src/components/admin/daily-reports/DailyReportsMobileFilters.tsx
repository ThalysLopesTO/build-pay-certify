import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CalendarIcon, Search, X, Filter } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { formatInTimeZone } from 'date-fns-tz';
import { useCompanySettings } from '@/hooks/useCompanySettings';
import { cn } from '@/lib/utils';
import { useActiveJobsites } from '@/hooks/useJobsites';
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@/components/ui/drawer';

interface DailyReportsMobileFiltersProps {
  filters: {
    jobsite_id?: string;
    date_from?: string;
    date_to?: string;
    search?: string;
  };
  onFiltersChange: (filters: any) => void;
  onClearFilters: () => void;
}

export const DailyReportsMobileFilters: React.FC<DailyReportsMobileFiltersProps> = ({
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
  const [open, setOpen] = React.useState(false);

  const handleDateFromChange = (date: Date | undefined) => {
    setDateFrom(date);
    const dateInTimezone = date ? formatInTimeZone(date, timezone, 'yyyy-MM-dd') : undefined;
    onFiltersChange({
      ...filters,
      date_from: dateInTimezone,
    });
  };

  const handleDateToChange = (date: Date | undefined) => {
    setDateTo(date);
    const dateInTimezone = date ? formatInTimeZone(date, timezone, 'yyyy-MM-dd') : undefined;
    onFiltersChange({
      ...filters,
      date_to: dateInTimezone,
    });
  };

  const activeFilterCount = Object.values(filters).filter(v => v).length;

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerTrigger asChild>
        <Button variant="outline" className="w-full justify-start gap-2">
          <Filter className="h-4 w-4" />
          Filter
          {activeFilterCount > 0 && (
            <span className="ml-auto flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">
              {activeFilterCount}
            </span>
          )}
        </Button>
      </DrawerTrigger>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>Filter Reports</DrawerTitle>
        </DrawerHeader>
        <div className="px-4 pb-4 space-y-4 max-h-[60vh] overflow-y-auto">
          {/* Search */}
          <div className="space-y-2">
            <Label htmlFor="mobile-search" className="text-sm font-medium">
              Search
            </Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="mobile-search"
                placeholder="Search reports..."
                value={filters.search || ''}
                onChange={(e) =>
                  onFiltersChange({ ...filters, search: e.target.value || undefined })
                }
                className="pl-9 h-11"
              />
            </div>
          </div>

          {/* Jobsite */}
          <div className="space-y-2">
            <Label htmlFor="mobile-jobsite" className="text-sm font-medium">
              Jobsite
            </Label>
            <Select
              value={filters.jobsite_id || 'all'}
              onValueChange={(value) =>
                onFiltersChange({ ...filters, jobsite_id: value === 'all' ? undefined : value })
              }
            >
              <SelectTrigger id="mobile-jobsite" className="h-11">
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

          {/* From Date */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">From Date</Label>
            <Popover modal={false}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    'w-full justify-start text-left font-normal h-11',
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
                  className="p-3 pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* To Date */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">To Date</Label>
            <Popover modal={false}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    'w-full justify-start text-left font-normal h-11',
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
                  initialFocus
                  className="p-3 pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>
        <DrawerFooter className="flex-row gap-2">
          <Button
            variant="outline"
            onClick={() => {
              onClearFilters();
              setDateFrom(undefined);
              setDateTo(undefined);
            }}
            className="flex-1"
          >
            Clear All
          </Button>
          <DrawerClose asChild>
            <Button className="flex-1">Apply</Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
};
