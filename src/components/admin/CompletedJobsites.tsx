import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Search, Filter, Calendar, Building, Archive, ChevronDown, ChevronUp } from 'lucide-react';
import { useCompletedJobsites } from '@/hooks/useJobsites';
import JobsiteDetailedCard from './jobsite/JobsiteDetailedCard';

const CompletedJobsites = () => {
  const { data: completedJobsites = [], isLoading, error } = useCompletedJobsites();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('completion_date');
  const [groupBy, setGroupBy] = useState('month');
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set(['current']));

  // Group and filter jobsites
  const { groupedJobsites, totalCount } = useMemo(() => {
    let filtered = completedJobsites.filter(jobsite =>
      jobsite.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      jobsite.address.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Sort jobsites
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'completion_date':
          return new Date(b.completion_date || b.created_at).getTime() - new Date(a.completion_date || a.created_at).getTime();
        case 'name':
          return a.name.localeCompare(b.name);
        case 'created_date':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        default:
          return 0;
      }
    });

    // Group jobsites
    const groups: { [key: string]: any[] } = {};
    const now = new Date();
    
    filtered.forEach(jobsite => {
      const completionDate = new Date(jobsite.completion_date || jobsite.created_at);
      let groupKey = '';
      
      if (groupBy === 'month') {
        const isThisMonth = completionDate.getMonth() === now.getMonth() && completionDate.getFullYear() === now.getFullYear();
        const isLastMonth = completionDate.getMonth() === (now.getMonth() - 1 + 12) % 12 && 
          (completionDate.getFullYear() === now.getFullYear() || (now.getMonth() === 0 && completionDate.getFullYear() === now.getFullYear() - 1));
        
        if (isThisMonth) {
          groupKey = 'current';
        } else if (isLastMonth) {
          groupKey = 'last_month';
        } else {
          groupKey = completionDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
        }
      } else if (groupBy === 'year') {
        groupKey = completionDate.getFullYear().toString();
      } else {
        groupKey = 'all';
      }
      
      if (!groups[groupKey]) {
        groups[groupKey] = [];
      }
      groups[groupKey].push(jobsite);
    });

    return { groupedJobsites: groups, totalCount: filtered.length };
  }, [completedJobsites, searchQuery, sortBy, groupBy]);

  const toggleGroup = (groupKey: string) => {
    const newExpanded = new Set(expandedGroups);
    if (newExpanded.has(groupKey)) {
      newExpanded.delete(groupKey);
    } else {
      newExpanded.add(groupKey);
    }
    setExpandedGroups(newExpanded);
  };

  const getGroupTitle = (groupKey: string, count: number) => {
    const titles: { [key: string]: string } = {
      'current': 'This Month',
      'last_month': 'Last Month',
      'all': 'All Completed Jobsites'
    };
    return titles[groupKey] || groupKey;
  };

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-red-600">
            <p>Error loading completed jobsites: {error.message}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-foreground">Completed Jobsites</h2>
          <p className="text-sm text-muted-foreground mt-1">
            View and manage completed project records
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="text-sm">
            {totalCount} Total
          </Badge>
        </div>
      </div>

        {/* Filters and Search */}
        <Card className="shadow-sm">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search jobsites..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <div className="flex gap-2 items-center">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="completion_date">Completion Date</SelectItem>
                    <SelectItem value="name">Name</SelectItem>
                    <SelectItem value="created_date">Created Date</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={groupBy} onValueChange={setGroupBy}>
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="Group by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="month">By Month</SelectItem>
                    <SelectItem value="year">By Year</SelectItem>
                    <SelectItem value="none">No Grouping</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Content */}
        <div className="space-y-4">
          {isLoading ? (
            <Card>
              <CardContent className="p-6">
                <div className="text-center py-12 text-muted-foreground">
                  <div className="animate-pulse text-sm sm:text-base">Loading completed jobsites...</div>
                </div>
              </CardContent>
            </Card>
          ) : totalCount === 0 ? (
            <Card>
              <CardContent className="p-6">
                <div className="text-center py-12 text-muted-foreground">
                  <Archive className="h-8 sm:h-12 w-8 sm:w-12 mx-auto mb-4 opacity-50" />
                  <p className="text-base sm:text-lg font-medium mb-2">
                    {searchQuery ? 'No jobsites match your search' : 'No completed jobsites found'}
                  </p>
                  <p className="text-xs sm:text-sm">
                    {searchQuery ? 'Try adjusting your search terms' : 'Completed jobsites will appear here once marked as finished'}
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            Object.entries(groupedJobsites).map(([groupKey, jobsites]) => (
              <Card key={groupKey} className="shadow-sm">
                <CardHeader 
                  className="pb-2 cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => toggleGroup(groupKey)}
                >
                  <CardTitle className="text-lg font-semibold flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-5 w-5 text-muted-foreground" />
                      {getGroupTitle(groupKey, jobsites.length)}
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        {jobsites.length} {jobsites.length === 1 ? 'jobsite' : 'jobsites'}
                      </Badge>
                      {expandedGroups.has(groupKey) ? (
                        <ChevronUp className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                      )}
                    </div>
                  </CardTitle>
                </CardHeader>
                
                {expandedGroups.has(groupKey) && (
                  <CardContent className="pt-0">
                    <div className="space-y-4">
                      {jobsites.map((jobsite) => (
                        <div key={jobsite.id} className="opacity-90 hover:opacity-100 transition-opacity">
                          <JobsiteDetailedCard jobsite={jobsite} />
                        </div>
                      ))}
                    </div>
                  </CardContent>
                )}
              </Card>
            ))
          )}
        </div>
    </div>
  );
};

export default CompletedJobsites;