import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Drawer, DrawerClose, DrawerContent, DrawerFooter, DrawerHeader, DrawerTitle, DrawerTrigger } from '@/components/ui/drawer';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Filter, Calendar as CalendarIcon, Briefcase, Users, CheckCircle, X } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useEmployees } from '@/hooks/new/useUsers';

interface LivePunchMobileFiltersProps {
  selectedDate: Date | null;
  setSelectedDate: (date: Date | null) => void;
  selectedJobsite: string;
  setSelectedJobsite: (jobsite: string) => void;
  selectedEmployee: string;
  setSelectedEmployee: (employee: string) => void;
  statusFilter: string;
  setStatusFilter: (status: string) => void;
  jobsites?: Array<{ id: string; name: string }>;
  onClearFilters: () => void;
  hasActiveFilters: boolean;
}

const LivePunchMobileFilters: React.FC<LivePunchMobileFiltersProps> = ({
  selectedDate,
  setSelectedDate,
  selectedJobsite,
  setSelectedJobsite,
  selectedEmployee,
  setSelectedEmployee,
  statusFilter,
  setStatusFilter,
  jobsites = [],
  onClearFilters,
  hasActiveFilters,
}) => {
  const [open, setOpen] = useState(false);
  const { data } = useEmployees();
  const employees = data?.activeEmployees ?? [];

  const activeFilterCount = [
    selectedDate !== null,
    selectedJobsite !== 'all',
    selectedEmployee !== 'all',
    statusFilter !== 'all',
  ].filter(Boolean).length;

  const handleClearAll = () => {
    onClearFilters();
    setOpen(false);
  };

  const handleApply = () => {
    setOpen(false);
  };

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerTrigger asChild>
        <Button 
          variant="outline" 
          className="w-full h-12 relative shadow-sm hover:shadow-md transition-shadow"
        >
          <Filter className="h-4 w-4 mr-2" />
          Filters
          {activeFilterCount > 0 && (
            <Badge 
              className="ml-2 bg-primary text-primary-foreground h-5 min-w-5 px-1.5 rounded-full"
            >
              {activeFilterCount}
            </Badge>
          )}
        </Button>
      </DrawerTrigger>
      
      <DrawerContent className="max-h-[85vh]">
        <DrawerHeader className="border-b">
          <DrawerTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filter Punches
          </DrawerTitle>
        </DrawerHeader>
        
        <div className="overflow-y-auto p-4 space-y-6">
          {/* Date Filter */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="flex items-center gap-2 text-base">
                <CalendarIcon className="h-4 w-4" />
                Date
              </Label>
              {selectedDate && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedDate(null)}
                  className="h-7 px-2 text-xs"
                >
                  Clear
                </Button>
              )}
            </div>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full h-12 justify-start text-left font-normal",
                    !selectedDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {selectedDate ? format(selectedDate, 'PPP') : 'All Dates'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={selectedDate || undefined}
                  onSelect={(date) => setSelectedDate(date || null)}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Jobsite Filter */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2 text-base">
              <Briefcase className="h-4 w-4" />
              Jobsite
            </Label>
            <Select value={selectedJobsite} onValueChange={setSelectedJobsite}>
              <SelectTrigger className="w-full h-12">
                <SelectValue placeholder="All Jobsites" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Jobsites</SelectItem>
                {jobsites.map((jobsite) => (
                  <SelectItem key={jobsite.id} value={jobsite.id}>
                    {jobsite.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Employee Filter */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2 text-base">
              <Users className="h-4 w-4" />
              Employee
            </Label>
            <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
              <SelectTrigger className="w-full h-12">
                <SelectValue placeholder="All Employees" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Employees</SelectItem>
                {employees.map((employee) => (
                  <SelectItem key={employee.user_id} value={employee.user_id}>
                    {employee.first_name} {employee.last_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Status Filter */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2 text-base">
              <CheckCircle className="h-4 w-4" />
              Status
            </Label>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full h-12">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active (Clocked In)</SelectItem>
                <SelectItem value="complete">Complete (Clocked Out)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Active Filters Display */}
          {hasActiveFilters && (
            <div className="space-y-2 pt-4 border-t">
              <Label className="text-sm text-muted-foreground">Active Filters:</Label>
              <div className="flex flex-wrap gap-2">
                {selectedDate && (
                  <Badge variant="secondary" className="gap-1">
                    Date: {format(selectedDate, 'MMM d, yyyy')}
                    <button
                      onClick={() => setSelectedDate(null)}
                      className="ml-1 hover:bg-background/80 rounded-full p-0.5"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                )}
                {selectedJobsite !== 'all' && (
                  <Badge variant="secondary" className="gap-1">
                    Jobsite: {jobsites.find(j => j.id === selectedJobsite)?.name || selectedJobsite}
                    <button
                      onClick={() => setSelectedJobsite('all')}
                      className="ml-1 hover:bg-background/80 rounded-full p-0.5"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                )}
                {selectedEmployee !== 'all' && (
                  <Badge variant="secondary" className="gap-1">
                    Employee: {employees.find(e => e.user_id === selectedEmployee)?.first_name} {employees.find(e => e.user_id === selectedEmployee)?.last_name}
                    <button
                      onClick={() => setSelectedEmployee('all')}
                      className="ml-1 hover:bg-background/80 rounded-full p-0.5"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                )}
                {statusFilter !== 'all' && (
                  <Badge variant="secondary" className="gap-1">
                    Status: {statusFilter === 'active' ? 'Active' : 'Complete'}
                    <button
                      onClick={() => setStatusFilter('all')}
                      className="ml-1 hover:bg-background/80 rounded-full p-0.5"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                )}
              </div>
            </div>
          )}
        </div>

        <DrawerFooter className="border-t flex-row gap-2 pt-4">
          {hasActiveFilters && (
            <Button
              variant="outline"
              onClick={handleClearAll}
              className="flex-1 h-12"
            >
              Clear All
            </Button>
          )}
          <DrawerClose asChild>
            <Button onClick={handleApply} className="flex-1 h-12">
              Apply Filters
            </Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
};

export default LivePunchMobileFilters;
