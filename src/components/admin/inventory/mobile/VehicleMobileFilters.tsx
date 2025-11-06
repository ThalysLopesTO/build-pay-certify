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

interface VehicleMobileFiltersProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  statusFilter: string;
  onStatusChange: (value: string) => void;
  typeFilter: string;
  onTypeChange: (value: string) => void;
  jobsiteFilter: string;
  onJobsiteChange: (value: string) => void;
  jobsites: Array<{ id: string; name: string }>;
  onClearFilters: () => void;
}

const VehicleMobileFilters: React.FC<VehicleMobileFiltersProps> = ({
  searchTerm,
  onSearchChange,
  statusFilter,
  onStatusChange,
  typeFilter,
  onTypeChange,
  jobsiteFilter,
  onJobsiteChange,
  jobsites,
  onClearFilters,
}) => {
  const [isMoreFiltersOpen, setIsMoreFiltersOpen] = useState(false);

  const statusOptions = [
    { value: 'all', label: 'All' },
    { value: 'active', label: 'Active' },
    { value: 'maintenance', label: 'Maintenance' },
    { value: 'out_of_service', label: 'Out of Service' },
    { value: 'retired', label: 'Retired' },
  ];

  const activeFiltersCount = 
    (statusFilter !== 'all' ? 1 : 0) +
    (typeFilter !== 'all' ? 1 : 0) +
    (jobsiteFilter !== 'all' ? 1 : 0);

  return (
    <div className="space-y-3">
      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
        <Input
          placeholder="Search name, make, model, plate..."
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
          <SheetContent side="bottom" className="h-[350px]">
            <SheetHeader>
              <SheetTitle>Filter Vehicles</SheetTitle>
              <SheetDescription>
                Apply additional filters to narrow down results
              </SheetDescription>
            </SheetHeader>
            
            <div className="space-y-4 mt-6">
              {/* Vehicle Type Filter */}
              <div>
                <label className="text-sm font-medium mb-2 block">Vehicle Type</label>
                <Select value={typeFilter} onValueChange={onTypeChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="small_car">Small Car</SelectItem>
                    <SelectItem value="pickup_truck">Pickup Truck</SelectItem>
                    <SelectItem value="cargo_van">Cargo Van</SelectItem>
                    <SelectItem value="box_truck">Box Truck</SelectItem>
                    <SelectItem value="crane_truck">Crane Truck</SelectItem>
                    <SelectItem value="dump_truck">Dump Truck</SelectItem>
                    <SelectItem value="flatbed">Flatbed</SelectItem>
                    <SelectItem value="trailer">Trailer</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

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

export default VehicleMobileFilters;
