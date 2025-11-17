import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@/components/ui/drawer';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Filter, X, CalendarIcon } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface QuotesMobileFiltersProps {
  filters: {
    status: string;
    client_name: string;
    date_from: string;
    date_to: string;
  };
  onFiltersChange: (filters: any) => void;
}

const QuotesMobileFilters: React.FC<QuotesMobileFiltersProps> = ({ filters, onFiltersChange }) => {
  const [open, setOpen] = useState(false);
  const [localFilters, setLocalFilters] = useState(filters);
  const [dateFrom, setDateFrom] = useState<Date | undefined>(
    filters.date_from ? new Date(filters.date_from) : undefined
  );
  const [dateTo, setDateTo] = useState<Date | undefined>(
    filters.date_to ? new Date(filters.date_to) : undefined
  );

  const activeFilterCount = [
    filters.status !== 'all',
    filters.client_name,
    filters.date_from,
    filters.date_to,
  ].filter(Boolean).length;

  const handleApplyFilters = () => {
    onFiltersChange({
      ...localFilters,
      date_from: dateFrom ? format(dateFrom, 'yyyy-MM-dd') : '',
      date_to: dateTo ? format(dateTo, 'yyyy-MM-dd') : '',
    });
    setOpen(false);
  };

  const handleClearFilters = () => {
    const clearedFilters = {
      status: 'all',
      client_name: '',
      date_from: '',
      date_to: '',
    };
    setLocalFilters(clearedFilters);
    setDateFrom(undefined);
    setDateTo(undefined);
    onFiltersChange(clearedFilters);
    setOpen(false);
  };

  const handleRemoveFilter = (filterKey: string) => {
    const updated = { ...filters };
    if (filterKey === 'status') {
      updated.status = 'all';
    } else {
      updated[filterKey as keyof typeof filters] = '';
    }
    onFiltersChange(updated);
  };

  return (
    <div className="space-y-3">
      <Drawer open={open} onOpenChange={setOpen}>
        <DrawerTrigger asChild>
          <Button variant="outline" className="w-full h-12 text-base relative">
            <Filter className="h-5 w-5 mr-2" />
            Filter Quotes
            {activeFilterCount > 0 && (
              <Badge className="ml-2 h-5 min-w-5 rounded-full p-0 flex items-center justify-center bg-primary">
                {activeFilterCount}
              </Badge>
            )}
          </Button>
        </DrawerTrigger>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>Filter Quotes</DrawerTitle>
            <DrawerDescription>
              Apply filters to find specific quotes
            </DrawerDescription>
          </DrawerHeader>

          <div className="px-4 space-y-4 max-h-[60vh] overflow-y-auto">
            {/* Search by Client Name */}
            <div className="space-y-2">
              <Label htmlFor="client-search" className="text-base">
                Search Client Name
              </Label>
              <Input
                id="client-search"
                placeholder="Enter client name..."
                value={localFilters.client_name}
                onChange={(e) =>
                  setLocalFilters({ ...localFilters, client_name: e.target.value })
                }
                className="h-12 text-base"
              />
            </div>

            {/* Status Filter */}
            <div className="space-y-2">
              <Label htmlFor="status-filter" className="text-base">
                Status
              </Label>
              <Select
                value={localFilters.status}
                onValueChange={(value) =>
                  setLocalFilters({ ...localFilters, status: value })
                }
              >
                <SelectTrigger id="status-filter" className="h-12 text-base">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="sent">Sent</SelectItem>
                  <SelectItem value="accepted">Accepted</SelectItem>
                  <SelectItem value="declined">Declined</SelectItem>
                  <SelectItem value="invoiced">Invoiced</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Date From */}
            <div className="space-y-2">
              <Label className="text-base">From Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      'w-full h-12 justify-start text-left font-normal text-base',
                      !dateFrom && 'text-muted-foreground'
                    )}
                  >
                    <CalendarIcon className="mr-2 h-5 w-5" />
                    {dateFrom ? format(dateFrom, 'PPP') : 'Select date'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={dateFrom}
                    onSelect={setDateFrom}
                    initialFocus
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Date To */}
            <div className="space-y-2">
              <Label className="text-base">To Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      'w-full h-12 justify-start text-left font-normal text-base',
                      !dateTo && 'text-muted-foreground'
                    )}
                  >
                    <CalendarIcon className="mr-2 h-5 w-5" />
                    {dateTo ? format(dateTo, 'PPP') : 'Select date'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={dateTo}
                    onSelect={setDateTo}
                    initialFocus
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <DrawerFooter className="pt-4">
            <Button onClick={handleApplyFilters} className="h-12 text-base">
              Apply Filters
            </Button>
            <DrawerClose asChild>
              <Button variant="outline" className="h-12 text-base" onClick={handleClearFilters}>
                Clear All
              </Button>
            </DrawerClose>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>

      {/* Active Filter Pills */}
      {activeFilterCount > 0 && (
        <div className="flex flex-wrap gap-2">
          {filters.status !== 'all' && (
            <Badge variant="secondary" className="text-sm py-1 px-3">
              Status: {filters.status}
              <button
                onClick={() => handleRemoveFilter('status')}
                className="ml-2 hover:text-destructive"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          {filters.client_name && (
            <Badge variant="secondary" className="text-sm py-1 px-3">
              Client: {filters.client_name}
              <button
                onClick={() => handleRemoveFilter('client_name')}
                className="ml-2 hover:text-destructive"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          {filters.date_from && (
            <Badge variant="secondary" className="text-sm py-1 px-3">
              From: {format(new Date(filters.date_from), 'MMM dd, yyyy')}
              <button
                onClick={() => handleRemoveFilter('date_from')}
                className="ml-2 hover:text-destructive"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          {filters.date_to && (
            <Badge variant="secondary" className="text-sm py-1 px-3">
              To: {format(new Date(filters.date_to), 'MMM dd, yyyy')}
              <button
                onClick={() => handleRemoveFilter('date_to')}
                className="ml-2 hover:text-destructive"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
        </div>
      )}
    </div>
  );
};

export default QuotesMobileFilters;
