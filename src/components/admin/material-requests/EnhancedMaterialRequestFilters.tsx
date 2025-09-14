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
    <div className="sticky top-20 z-40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b shadow-lg">
      <div className="container max-w-5xl mx-auto py-6 px-4">
        <Card className="shadow-xl border-0 bg-gradient-to-r from-card via-card to-muted/20 backdrop-blur rounded-xl">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center space-x-3 text-lg">
                <div className="bg-primary/10 p-2 rounded-lg">
                  <Filter className="h-5 w-5 text-primary" />
                </div>
                <span className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent font-bold">
                  Filter & Search Requests
                </span>
              </CardTitle>
              
              {hasActiveFilters && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onClearFilters}
                  className="flex items-center gap-2 h-9 text-sm font-semibold bg-gradient-to-r from-red-50 to-red-100 hover:from-red-100 hover:to-red-200 border-red-200 text-red-700 shadow-sm hover:shadow-md transition-all duration-200"
                >
                  <X className="h-4 w-4" />
                  Clear All Filters
                </Button>
              )}
            </div>
          </CardHeader>
          
          <CardContent className="pt-0">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              {/* Enhanced Search */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-foreground">Search</label>
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-primary" />
                  <Input
                    placeholder="Search by jobsite, user..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 h-11 text-sm font-medium bg-gradient-to-r from-background to-muted/30 border-2 focus:ring-2 focus:ring-primary/20 focus:border-primary shadow-sm"
                  />
                </div>
              </div>

              {/* Enhanced Status Filter */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-foreground">Status</label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="h-11 text-sm font-medium bg-gradient-to-r from-background to-muted/30 border-2 focus:ring-2 focus:ring-primary/20 shadow-sm">
                    <SelectValue placeholder="All statuses" />
                  </SelectTrigger>
                  <SelectContent className="bg-background/95 backdrop-blur border-2">
                    <SelectItem value="all" className="font-medium">All statuses</SelectItem>
                    <SelectItem value="pending" className="font-medium">🟡 Pending</SelectItem>
                    <SelectItem value="ordered" className="font-medium">🔵 Ordered</SelectItem>
                    <SelectItem value="delivered" className="font-medium">🟢 Delivered</SelectItem>
                    <SelectItem value="archived" className="font-medium">⚫ Archived</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Enhanced Jobsite Filter */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-foreground">Jobsite</label>
                <Select value={jobsiteFilter} onValueChange={setJobsiteFilter}>
                  <SelectTrigger className="h-11 text-sm font-medium bg-gradient-to-r from-background to-muted/30 border-2 focus:ring-2 focus:ring-primary/20 shadow-sm">
                    <SelectValue placeholder="All jobsites" />
                  </SelectTrigger>
                  <SelectContent className="bg-background/95 backdrop-blur border-2">
                    <SelectItem value="all" className="font-medium">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-primary" />
                        All jobsites
                      </div>
                    </SelectItem>
                    {jobsites.map((jobsite) => (
                      <SelectItem key={jobsite.id} value={jobsite.id} className="font-medium">
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                          {jobsite.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Enhanced Date Range */}
              <div className="space-y-2 lg:col-span-2">
                <label className="text-sm font-semibold text-foreground">Delivery Date Range</label>
                <div className="flex gap-3">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "flex-1 justify-start text-left font-medium h-11 text-sm bg-gradient-to-r from-background to-muted/30 border-2 shadow-sm focus:ring-2 focus:ring-primary/20",
                          !dateFrom && "text-muted-foreground"
                        )}
                      >
                        <Calendar className="mr-2 h-4 w-4 text-primary" />
                        {dateFrom ? format(dateFrom, "MMM dd, yyyy") : "Start Date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 bg-background/95 backdrop-blur border-2" align="start">
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
                          "flex-1 justify-start text-left font-medium h-11 text-sm bg-gradient-to-r from-background to-muted/30 border-2 shadow-sm focus:ring-2 focus:ring-primary/20",
                          !dateTo && "text-muted-foreground"
                        )}
                      >
                        <Calendar className="mr-2 h-4 w-4 text-primary" />
                        {dateTo ? format(dateTo, "MMM dd, yyyy") : "End Date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 bg-background/95 backdrop-blur border-2" align="start">
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