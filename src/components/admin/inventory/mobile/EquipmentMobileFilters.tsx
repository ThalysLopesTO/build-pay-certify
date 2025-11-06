import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Filter, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';

interface EquipmentMobileFiltersProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  statusFilter: string;
  onStatusChange: (value: string) => void;
  jobsiteFilter: string;
  onJobsiteChange: (value: string) => void;
  dateRange: { from: Date | undefined; to: Date | undefined };
  onDateRangeChange: (range: { from: Date | undefined; to: Date | undefined }) => void;
  jobsites: Array<{ id: string; name: string }>;
  onClearFilters: () => void;
}

const EquipmentMobileFilters: React.FC<EquipmentMobileFiltersProps> = ({
  searchTerm,
  onSearchChange,
  statusFilter,
  onStatusChange,
  jobsiteFilter,
  onJobsiteChange,
  dateRange,
  onDateRangeChange,
  jobsites,
  onClearFilters,
}) => {
  const [isMoreFiltersOpen, setIsMoreFiltersOpen] = useState(false);

  const statusOptions = [
    { value: 'all', label: 'All' },
    { value: 'available', label: 'Available' },
    { value: 'assigned', label: 'Assigned' },
    { value: 'overdue', label: 'Overdue' },
    { value: 'returned', label: 'Returned' },
  ];

  const activeFiltersCount = 
    (statusFilter !== 'all' ? 1 : 0) +
    (jobsiteFilter !== 'all' ? 1 : 0) +
    (dateRange.from ? 1 : 0);

  return (
    <div className="space-y-3">
      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
        <Input
          placeholder="Search equipment, brand, or SKU..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-10 pr-10"
        />
        {searchTerm && (
          <button
            onClick={() => onSearchChange('')}
            className="absolute right-3 top-1/2 transform -translate-y-1/2"
          >
            <X className="h-4 w-4 text-muted-foreground" />
          </button>
        )}
      </div>

      {/* Status Chips */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {statusOptions.map((option) => (
          <Badge
            key={option.value}
            variant={statusFilter === option.value ? 'default' : 'outline'}
            className={`cursor-pointer whitespace-nowrap transition-colors ${
              statusFilter === option.value
                ? 'bg-primary text-primary-foreground'
                : 'hover:bg-accent'
            }`}
            onClick={() => onStatusChange(option.value)}
          >
            {option.label}
          </Badge>
        ))}
      </div>

      {/* More Filters Button */}
      <div className="flex gap-2">
        <Sheet open={isMoreFiltersOpen} onOpenChange={setIsMoreFiltersOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" size="sm" className="relative">
              <Filter className="h-4 w-4 mr-2" />
              More Filters
              {activeFiltersCount > 0 && (
                <Badge className="ml-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs">
                  {activeFiltersCount}
                </Badge>
              )}
            </Button>
          </SheetTrigger>
          <SheetContent side="bottom" className="h-[400px]">
            <SheetHeader>
              <SheetTitle>Filter Equipment</SheetTitle>
              <SheetDescription>
                Apply additional filters to narrow down results
              </SheetDescription>
            </SheetHeader>
            
            <div className="space-y-4 mt-6">
              {/* Jobsite Filter */}
              <div>
                <label className="text-sm font-medium mb-2 block">Jobsite</label>
                <Select value={jobsiteFilter} onValueChange={onJobsiteChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Jobsites" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Jobsites</SelectItem>
                    <SelectItem value="unassigned">Unassigned</SelectItem>
                    {jobsites.map((jobsite) => (
                      <SelectItem key={jobsite.id} value={jobsite.id}>
                        {jobsite.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Date Range Filter */}
              <div>
                <label className="text-sm font-medium mb-2 block">Start Date Range</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left font-normal">
                      {dateRange.from ? (
                        dateRange.to ? (
                          <>
                            {format(dateRange.from, 'MMM d, yyyy')} - {format(dateRange.to, 'MMM d, yyyy')}
                          </>
                        ) : (
                          format(dateRange.from, 'MMM d, yyyy')
                        )
                      ) : (
                        <span className="text-muted-foreground">Pick a date range</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="range"
                      selected={{
                        from: dateRange.from,
                        to: dateRange.to,
                      }}
                      onSelect={(range) => {
                        if (range) {
                          onDateRangeChange({
                            from: range.from,
                            to: range.to,
                          });
                        } else {
                          onDateRangeChange({ from: undefined, to: undefined });
                        }
                      }}
                      numberOfMonths={1}
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {/* Clear Filters */}
              <Button
                variant="outline"
                onClick={() => {
                  onClearFilters();
                  setIsMoreFiltersOpen(false);
                }}
                className="w-full"
              >
                Clear All Filters
              </Button>
            </div>
          </SheetContent>
        </Sheet>

        {activeFiltersCount > 0 && (
          <Button variant="ghost" size="sm" onClick={onClearFilters}>
            Clear All
          </Button>
        )}
      </div>
    </div>
  );
};

export default EquipmentMobileFilters;
