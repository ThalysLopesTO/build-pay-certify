import React from 'react';
import { Search, Filter, ArrowUpDown } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
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

interface JobsiteMobileFiltersProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  statusFilter: string;
  onStatusFilterChange: (value: string) => void;
  sortBy: string;
  onSortByChange: (value: string) => void;
  sortOrder: 'asc' | 'desc';
  onSortOrderChange: (value: 'asc' | 'desc') => void;
}

const JobsiteMobileFilters: React.FC<JobsiteMobileFiltersProps> = ({
  searchTerm,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  sortBy,
  onSortByChange,
  sortOrder,
  onSortOrderChange,
}) => {
  const [open, setOpen] = React.useState(false);

  const handleApply = () => {
    setOpen(false);
  };

  const handleClear = () => {
    onSearchChange('');
    onStatusFilterChange('all');
    onSortByChange('name');
    onSortOrderChange('asc');
  };

  return (
    <div className="md:hidden px-4 py-3 space-y-3 bg-background border-b">
      {/* Search Bar - Always Visible */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search jobsites..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-9 h-11"
        />
      </div>

      {/* Filter Button */}
      <Drawer open={open} onOpenChange={setOpen}>
        <DrawerTrigger asChild>
          <Button variant="outline" className="w-full h-11">
            <Filter className="h-4 w-4 mr-2" />
            Filters & Sort
          </Button>
        </DrawerTrigger>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>Filter & Sort Jobsites</DrawerTitle>
            <DrawerDescription>
              Customize how you view your jobsites
            </DrawerDescription>
          </DrawerHeader>

          <div className="px-4 py-6 space-y-6">
            {/* Status Filter */}
            <div className="space-y-3">
              <Label className="text-base font-semibold">Status</Label>
              <RadioGroup value={statusFilter} onValueChange={onStatusFilterChange}>
                <div className="flex items-center space-x-2 py-2">
                  <RadioGroupItem value="all" id="all" />
                  <Label htmlFor="all" className="font-normal cursor-pointer">All Jobsites</Label>
                </div>
                <div className="flex items-center space-x-2 py-2">
                  <RadioGroupItem value="active" id="active" />
                  <Label htmlFor="active" className="font-normal cursor-pointer">Active Only</Label>
                </div>
                <div className="flex items-center space-x-2 py-2">
                  <RadioGroupItem value="completed" id="completed" />
                  <Label htmlFor="completed" className="font-normal cursor-pointer">Completed Only</Label>
                </div>
              </RadioGroup>
            </div>

            {/* Sort By */}
            <div className="space-y-3">
              <Label className="text-base font-semibold">Sort By</Label>
              <RadioGroup value={sortBy} onValueChange={onSortByChange}>
                <div className="flex items-center space-x-2 py-2">
                  <RadioGroupItem value="name" id="name" />
                  <Label htmlFor="name" className="font-normal cursor-pointer">Name</Label>
                </div>
                <div className="flex items-center space-x-2 py-2">
                  <RadioGroupItem value="starting_date" id="starting_date" />
                  <Label htmlFor="starting_date" className="font-normal cursor-pointer">Start Date</Label>
                </div>
                <div className="flex items-center space-x-2 py-2">
                  <RadioGroupItem value="created_at" id="created_at" />
                  <Label htmlFor="created_at" className="font-normal cursor-pointer">Created Date</Label>
                </div>
              </RadioGroup>
            </div>

            {/* Sort Order */}
            <div className="space-y-3">
              <Label className="text-base font-semibold">Order</Label>
              <RadioGroup value={sortOrder} onValueChange={(v) => onSortOrderChange(v as 'asc' | 'desc')}>
                <div className="flex items-center space-x-2 py-2">
                  <RadioGroupItem value="asc" id="asc" />
                  <Label htmlFor="asc" className="font-normal cursor-pointer">Ascending</Label>
                </div>
                <div className="flex items-center space-x-2 py-2">
                  <RadioGroupItem value="desc" id="desc" />
                  <Label htmlFor="desc" className="font-normal cursor-pointer">Descending</Label>
                </div>
              </RadioGroup>
            </div>
          </div>

          <DrawerFooter>
            <Button onClick={handleApply} className="h-12">Apply Filters</Button>
            <Button variant="outline" onClick={handleClear} className="h-12">Clear All</Button>
            <DrawerClose asChild>
              <Button variant="ghost" className="h-12">Cancel</Button>
            </DrawerClose>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </div>
  );
};

export default JobsiteMobileFilters;
