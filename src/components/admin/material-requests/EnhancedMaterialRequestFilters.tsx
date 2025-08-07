import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Search, Filter, Calendar, MapPin, X } from 'lucide-react';
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
    <div className="sticky top-16 z-40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b shadow-sm">
      <div className="container max-w-4xl mx-auto py-4 px-4">
        <Card className="shadow-sm border-0 bg-card/80">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center space-x-2 text-base">
                <Filter className="h-4 w-4 text-primary" />
                <span>Filter Requests</span>
              </CardTitle>
              
              {hasActiveFilters && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onClearFilters}
                  className="flex items-center gap-1 h-8 text-xs hover:bg-destructive/10 hover:border-destructive/20 hover:text-destructive"
                >
                  <X className="h-3 w-3" />
                  Clear All
                </Button>
              )}
            </div>
          </CardHeader>
          
          <CardContent className="pt-0">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
              {/* Search */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Search</label>
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search requests..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 h-9 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  />
                </div>
              </div>

              {/* Status Filter */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Status</label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="h-9 text-sm focus:ring-2 focus:ring-primary/20">
                    <SelectValue placeholder="All statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All statuses</SelectItem>
                    <SelectItem value="pending">🟡 Pending</SelectItem>
                    <SelectItem value="ordered">🔵 Ordered</SelectItem>
                    <SelectItem value="delivered">🟢 Delivered</SelectItem>
                    <SelectItem value="archived">⚫ Archived</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Jobsite Filter */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Jobsite</label>
                <Select value={jobsiteFilter} onValueChange={setJobsiteFilter}>
                  <SelectTrigger className="h-9 text-sm focus:ring-2 focus:ring-primary/20">
                    <SelectValue placeholder="All jobsites" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-3 w-3" />
                        All jobsites
                      </div>
                    </SelectItem>
                    {jobsites.map((jobsite) => (
                      <SelectItem key={jobsite.id} value={jobsite.id}>
                        <div className="flex items-center gap-2">
                          <MapPin className="h-3 w-3 text-muted-foreground" />
                          {jobsite.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Date Range */}
              <div className="space-y-1.5 lg:col-span-2">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Delivery Date Range</label>
                <div className="flex gap-2">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "flex-1 justify-start text-left font-normal h-9 text-sm focus:ring-2 focus:ring-primary/20",
                          !dateFrom && "text-muted-foreground"
                        )}
                      >
                        <Calendar className="mr-2 h-3 w-3" />
                        {dateFrom ? format(dateFrom, "MMM dd") : "From"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <CalendarComponent
                        mode="single"
                        selected={dateFrom}
                        onSelect={setDateFrom}
                        initialFocus
                        className="pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>

                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "flex-1 justify-start text-left font-normal h-9 text-sm focus:ring-2 focus:ring-primary/20",
                          !dateTo && "text-muted-foreground"
                        )}
                      >
                        <Calendar className="mr-2 h-3 w-3" />
                        {dateTo ? format(dateTo, "MMM dd") : "To"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <CalendarComponent
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
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default EnhancedMaterialRequestFilters;