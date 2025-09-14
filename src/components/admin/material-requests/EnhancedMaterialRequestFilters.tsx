import React from 'react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Search, Calendar, MapPin, X } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/SupabaseAuthContext';

interface EnhancedMaterialRequestFiltersProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  statusFilter: string;
  setStatusFilter: (status: string) => void;
  dateFrom: Date | null;
  setDateFrom: (date: Date | null) => void;
  dateTo: Date | null;
  setDateTo: (date: Date | null) => void;
  jobsiteFilter: string;
  setJobsiteFilter: (jobsite: string) => void;
  onClearFilters: () => void;
}

const EnhancedMaterialRequestFilters = ({
  searchTerm,
  setSearchTerm,
  statusFilter,
  setStatusFilter,
  dateFrom,
  setDateFrom,
  dateTo,
  setDateTo,
  jobsiteFilter,
  setJobsiteFilter,
  onClearFilters
}: EnhancedMaterialRequestFiltersProps) => {
  const { user } = useAuth();

  // Fetch jobsites for filter dropdown
  const { data: jobsites = [] } = useQuery({
    queryKey: ['jobsites-filter', user?.companyId],
    queryFn: async () => {
      if (!user?.companyId) return [];
      
      const { data, error } = await supabase
        .from('jobsites')
        .select('id, name')
        .eq('company_id', user.companyId)
        .eq('status', 'active')
        .order('name');
      
      if (error) throw error;
      return data;
    },
    enabled: !!user?.companyId,
  });

  const hasActiveFilters = searchTerm || statusFilter !== 'all' || dateFrom || dateTo || jobsiteFilter !== 'all';

  return (
    <div className="sticky top-20 z-40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b py-3 px-4">
      <div className="flex flex-wrap items-center gap-3">
        {/* Search Input */}
        <div className="flex-1 min-w-64">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search requests..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 h-9"
            />
          </div>
        </div>

        {/* Status Filter */}
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="h-9 w-32">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="ordered">Ordered</SelectItem>
            <SelectItem value="delivered">Delivered</SelectItem>
            <SelectItem value="archived">Archived</SelectItem>
          </SelectContent>
        </Select>

        {/* Jobsite Filter */}
        <Select value={jobsiteFilter} onValueChange={setJobsiteFilter}>
          <SelectTrigger className="h-9 w-40">
            <SelectValue placeholder="Jobsite" />
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

        {/* Date Range */}
        <div className="flex gap-1">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className={cn(
                  "h-9 w-24 justify-start text-left font-normal",
                  !dateFrom && "text-muted-foreground"
                )}
              >
                <Calendar className="mr-1 h-3 w-3" />
                {dateFrom ? format(dateFrom, "MMM dd") : "Start"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <CalendarComponent
                mode="single"
                selected={dateFrom}
                onSelect={setDateFrom}
                initialFocus
              />
            </PopoverContent>
          </Popover>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className={cn(
                  "h-9 w-24 justify-start text-left font-normal",
                  !dateTo && "text-muted-foreground"
                )}
              >
                <Calendar className="mr-1 h-3 w-3" />
                {dateTo ? format(dateTo, "MMM dd") : "End"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <CalendarComponent
                mode="single"
                selected={dateTo}
                onSelect={setDateTo}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>

        {/* Clear All Button */}
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearFilters}
            className="h-9 px-2 text-muted-foreground hover:text-foreground"
          >
            <X className="h-3 w-3 mr-1" />
            Clear
          </Button>
        )}
      </div>
    </div>
  );
};

export default EnhancedMaterialRequestFilters;