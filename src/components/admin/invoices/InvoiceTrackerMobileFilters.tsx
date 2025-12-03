import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@/components/ui/drawer';
import { Search, SlidersHorizontal, X } from 'lucide-react';

interface Jobsite {
  id: string;
  name: string;
}

interface InvoiceTrackerMobileFiltersProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  statusFilter: string;
  onStatusFilterChange: (value: string) => void;
  jobsiteFilter: string;
  onJobsiteFilterChange: (value: string) => void;
  dateFrom: string;
  onDateFromChange: (value: string) => void;
  dateTo: string;
  onDateToChange: (value: string) => void;
  jobsites?: Jobsite[];
  onClearFilters: () => void;
}

const InvoiceTrackerMobileFilters: React.FC<InvoiceTrackerMobileFiltersProps> = ({
  searchTerm,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  jobsiteFilter,
  onJobsiteFilterChange,
  dateFrom,
  onDateFromChange,
  dateTo,
  onDateToChange,
  jobsites,
  onClearFilters,
}) => {
  const hasActiveFilters = statusFilter !== 'all' || jobsiteFilter !== 'all' || dateFrom || dateTo;

  return (
    <div className="px-4 space-y-3 md:hidden">
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search invoices..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-10 h-11 bg-background"
        />
      </div>

      {/* Filter Button + Drawer */}
      <div className="flex gap-2">
        <Drawer>
          <DrawerTrigger asChild>
            <Button variant="outline" className="flex-1 h-11 justify-center">
              <SlidersHorizontal className="h-4 w-4 mr-2" />
              Filters
              {hasActiveFilters && (
                <span className="ml-2 h-5 w-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center">
                  !
                </span>
              )}
            </Button>
          </DrawerTrigger>
          <DrawerContent className="max-h-[85vh]">
            <DrawerHeader>
              <DrawerTitle>Filter Invoices</DrawerTitle>
            </DrawerHeader>
            <div className="px-4 pb-4 space-y-4 overflow-y-auto">
              {/* Status Filter */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Status</Label>
                <Select value={statusFilter} onValueChange={onStatusFilterChange}>
                  <SelectTrigger className="h-11">
                    <SelectValue placeholder="All Statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="paid">Paid</SelectItem>
                    <SelectItem value="expired">Expired</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Jobsite Filter */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Jobsite</Label>
                <Select value={jobsiteFilter} onValueChange={onJobsiteFilterChange}>
                  <SelectTrigger className="h-11">
                    <SelectValue placeholder="All Jobsites" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Jobsites</SelectItem>
                    {jobsites?.map((jobsite) => (
                      <SelectItem key={jobsite.id} value={jobsite.id}>
                        {jobsite.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Date Range */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Date Range</Label>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs text-muted-foreground">From</Label>
                    <Input
                      type="date"
                      value={dateFrom}
                      onChange={(e) => onDateFromChange(e.target.value)}
                      className="h-11"
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">To</Label>
                    <Input
                      type="date"
                      value={dateTo}
                      onChange={(e) => onDateToChange(e.target.value)}
                      className="h-11"
                    />
                  </div>
                </div>
              </div>
            </div>
            <DrawerFooter className="border-t pt-4">
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={onClearFilters}
                  className="flex-1 h-11"
                >
                  <X className="h-4 w-4 mr-2" />
                  Clear All
                </Button>
                <DrawerClose asChild>
                  <Button className="flex-1 h-11">
                    Apply Filters
                  </Button>
                </DrawerClose>
              </div>
            </DrawerFooter>
          </DrawerContent>
        </Drawer>
      </div>
    </div>
  );
};

export default InvoiceTrackerMobileFilters;
