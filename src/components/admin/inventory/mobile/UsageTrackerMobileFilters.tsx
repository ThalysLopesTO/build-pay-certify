import React, { useState, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { UsageFilters } from '@/types/equipment-usage';
import { Search, SlidersHorizontal, Download, X, Clock, AlertTriangle } from 'lucide-react';

interface UsageTrackerMobileFiltersProps {
  filters: UsageFilters;
  onFiltersChange: (filters: UsageFilters) => void;
  jobsites?: Array<{ id: string; name: string }>;
  employees?: Array<{ user_id: string; first_name: string; last_name: string }>;
  onExport?: () => void;
}

const statusOptions = [
  { value: 'all', label: 'All', icon: null },
  { value: 'in_use', label: 'In Use', icon: null },
  { value: 'returned', label: 'Returned', icon: null },
  { value: 'damaged', label: 'Damaged', icon: null },
  { value: 'lost', label: 'Lost', icon: null },
];

const smartFilters = [
  { key: 'assigned_over_24h', label: '>24 Hours', icon: Clock },
  { key: 'assigned_over_7d', label: 'Overdue', icon: AlertTriangle },
];

export const UsageTrackerMobileFilters: React.FC<UsageTrackerMobileFiltersProps> = ({
  filters,
  onFiltersChange,
  jobsites,
  employees,
  onExport,
}) => {
  const [sheetOpen, setSheetOpen] = useState(false);

  const hasActiveFilters = filters.jobsite_id || filters.employee_id;
  const hasActiveSmartFilters = filters.assigned_over_24h || filters.assigned_over_7d;

  const toggleSmartFilter = (key: 'assigned_over_24h' | 'assigned_over_7d') => {
    const currentValue = filters[key];
    const newFilters = { ...filters };
    
    if (currentValue) {
      delete newFilters[key];
    } else {
      newFilters[key] = true;
      // If selecting "overdue", deselect ">24h" and vice versa
      if (key === 'assigned_over_7d') {
        delete newFilters.assigned_over_24h;
      } else if (key === 'assigned_over_24h') {
        delete newFilters.assigned_over_7d;
      }
      // Auto-set status to in_use when smart filter is active
      newFilters.status = 'in_use';
    }
    
    onFiltersChange(newFilters);
  };

  const clearAdvancedFilters = () => {
    onFiltersChange({
      ...filters,
      jobsite_id: undefined,
      employee_id: undefined,
    });
  };

  return (
    <div className="space-y-3">
      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search equipment, employee, jobsite..."
          value={filters.search || ''}
          onChange={(e) => onFiltersChange({ ...filters, search: e.target.value })}
          className="pl-9 pr-4"
        />
      </div>

      {/* Smart Filters Row */}
      {hasActiveSmartFilters && (
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {smartFilters.map((smartFilter) => {
            const Icon = smartFilter.icon;
            const isActive = filters[smartFilter.key as keyof UsageFilters];
            return (
              <Badge
                key={smartFilter.key}
                variant={isActive ? 'default' : 'outline'}
                className={`cursor-pointer whitespace-nowrap ${
                  smartFilter.key === 'assigned_over_7d' && isActive
                    ? 'bg-red-500 hover:bg-red-600'
                    : smartFilter.key === 'assigned_over_24h' && isActive
                    ? 'bg-orange-500 hover:bg-orange-600'
                    : ''
                }`}
                onClick={() => toggleSmartFilter(smartFilter.key as 'assigned_over_24h' | 'assigned_over_7d')}
              >
                <Icon className="h-3 w-3 mr-1" />
                {smartFilter.label}
              </Badge>
            );
          })}
        </div>
      )}

      {/* Quick Status Filters + Advanced Filters Button */}
      <div className="flex items-center gap-2">
        <div className="flex-1 flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {statusOptions.map((option) => (
            <Badge
              key={option.value}
              variant={filters.status === option.value ? 'default' : 'outline'}
              className="cursor-pointer whitespace-nowrap"
              onClick={() => onFiltersChange({ ...filters, status: option.value as any })}
            >
              {option.label}
            </Badge>
          ))}
        </div>

        {/* More Filters Sheet */}
        <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" size="sm" className="relative shrink-0">
              <SlidersHorizontal className="h-4 w-4 mr-2" />
              Filters
              {hasActiveFilters && (
                <span className="absolute -top-1 -right-1 h-4 w-4 bg-primary text-primary-foreground text-xs rounded-full flex items-center justify-center">
                  {(filters.jobsite_id ? 1 : 0) + (filters.employee_id ? 1 : 0)}
                </span>
              )}
            </Button>
          </SheetTrigger>
          <SheetContent side="bottom" className="h-[80vh]">
            <SheetHeader>
              <SheetTitle>Advanced Filters</SheetTitle>
            </SheetHeader>
            <div className="space-y-4 mt-6">
              {/* Smart Filters Section */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Quick Filters</label>
                <div className="flex flex-wrap gap-2">
                  {smartFilters.map((smartFilter) => {
                    const Icon = smartFilter.icon;
                    const isActive = filters[smartFilter.key as keyof UsageFilters];
                    return (
                      <Badge
                        key={smartFilter.key}
                        variant={isActive ? 'default' : 'outline'}
                        className={`cursor-pointer ${
                          smartFilter.key === 'assigned_over_7d' && isActive
                            ? 'bg-red-500 hover:bg-red-600'
                            : smartFilter.key === 'assigned_over_24h' && isActive
                            ? 'bg-orange-500 hover:bg-orange-600'
                            : ''
                        }`}
                        onClick={() => toggleSmartFilter(smartFilter.key as 'assigned_over_24h' | 'assigned_over_7d')}
                      >
                        <Icon className="h-3 w-3 mr-1" />
                        {smartFilter.label}
                      </Badge>
                    );
                  })}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Shows only "In Use" equipment
                </p>
              </div>

              {/* Jobsite Filter */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Jobsite</label>
                <Select
                  value={filters.jobsite_id || 'all'}
                  onValueChange={(v) => 
                    onFiltersChange({ ...filters, jobsite_id: v === 'all' ? undefined : v })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All Jobsites" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Jobsites</SelectItem>
                    {jobsites?.map((site) => (
                      <SelectItem key={site.id} value={site.id}>
                        {site.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Employee Filter */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Employee</label>
                <Select
                  value={filters.employee_id || 'all'}
                  onValueChange={(v) =>
                    onFiltersChange({ ...filters, employee_id: v === 'all' ? undefined : v })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All Employees" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Employees</SelectItem>
                    {employees?.map((emp) => (
                      <SelectItem key={emp.user_id} value={emp.user_id}>
                        {emp.first_name} {emp.last_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Export Button */}
              {onExport && (
                <div className="pt-4 border-t">
                  <Button onClick={onExport} variant="outline" className="w-full">
                    <Download className="h-4 w-4 mr-2" />
                    Export to CSV
                  </Button>
                </div>
              )}

              {/* Clear Filters */}
              {hasActiveFilters && (
                <Button
                  onClick={clearAdvancedFilters}
                  variant="ghost"
                  className="w-full"
                >
                  <X className="h-4 w-4 mr-2" />
                  Clear Advanced Filters
                </Button>
              )}

              {/* Apply Button */}
              <Button onClick={() => setSheetOpen(false)} className="w-full">
                Apply Filters
              </Button>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </div>
  );
};
