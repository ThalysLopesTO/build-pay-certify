
import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Building, BarChart3, Package, Grid3X3, List, Smartphone, Archive, ListChecks } from 'lucide-react';
import { JobsiteTaskTab } from './tasks/JobsiteTaskTab';
import { TaskStatisticsCards } from './tasks/TaskStatisticsCards';
import CompletedJobsites from './CompletedJobsites';
import { useJobsites } from '@/hooks/useJobsites';
import { useIsMobile } from '@/hooks/use-mobile';
import JobsiteForm from './jobsite/JobsiteForm';
import JobsiteList from './jobsite/JobsiteList';
import JobsiteCard from './jobsite/JobsiteCard';
import JobsiteDetailedCard from './jobsite/JobsiteDetailedCard';
import JobsiteStatsOverview from './jobsite/JobsiteStatsOverview';
import JobsiteFilters from './jobsite/JobsiteFilters';
import JobsiteGrid from './jobsite/JobsiteGrid';
import JobsiteMobileList from './jobsite/JobsiteMobileList';

const JobsiteManagement = () => {
  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  
  const isMobile = useIsMobile();
  const { data: allJobsites = [], isLoading, error } = useJobsites(statusFilter === 'all' ? undefined : statusFilter as 'active' | 'completed');

  // Filter and sort jobsites
  const filteredAndSortedJobsites = useMemo(() => {
    let filtered = allJobsites;

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(jobsite => 
        jobsite.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        jobsite.address.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply sorting
    return filtered.sort((a, b) => {
      let aValue, bValue;
      
      switch (sortBy) {
        case 'name':
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case 'created_at':
          aValue = new Date(a.created_at).getTime();
          bValue = new Date(b.created_at).getTime();
          break;
        case 'starting_date':
          aValue = a.starting_date ? new Date(a.starting_date).getTime() : 0;
          bValue = b.starting_date ? new Date(b.starting_date).getTime() : 0;
          break;
        default:
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
      }

      if (sortOrder === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });
  }, [allJobsites, searchTerm, statusFilter, sortBy, sortOrder]);

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-red-600">
            <p>Error loading jobsites: {error.message}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Enhanced Header */}
        <div className="flex flex-col space-y-4 lg:flex-row lg:items-start lg:justify-between lg:space-y-0">
          <div className="space-y-2">
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-xl bg-primary/10">
                <Building className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Jobsite Management</h1>
                <p className="text-sm sm:text-base text-muted-foreground">Manage your company's jobsites and track progress</p>
              </div>
            </div>
          </div>
          <Button 
            onClick={() => setShowForm(true)} 
            className="w-full lg:w-auto shadow-md hover:shadow-lg transition-all duration-200"
            size={isMobile ? "lg" : "default"}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add New Jobsite
          </Button>
        </div>

        {/* Stats Overview */}
        <JobsiteStatsOverview jobsites={allJobsites} isLoading={isLoading} />

        {/* Search and Filters */}
        <JobsiteFilters
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          statusFilter={statusFilter}
          onStatusFilterChange={setStatusFilter}
          sortOrder={sortOrder}
          onSortOrderChange={setSortOrder}
          sortBy={sortBy}
          onSortByChange={setSortBy}
        />

        {/* Form Modal */}
        {showForm && (
          <JobsiteForm onCancel={() => setShowForm(false)} />
        )}

        {/* Enhanced Tabs */}
        <Card className="shadow-lg border-0">
          <Tabs defaultValue={isMobile ? "mobile" : "detailed"} className="w-full">
            <div className="border-b bg-muted/50 rounded-t-lg">
              <TabsList className="grid w-full bg-transparent h-auto p-2 gap-2" style={{
                gridTemplateColumns: isMobile ? 'repeat(6, 1fr)' : 'repeat(5, 1fr)'
              }}>
                {isMobile && (
                  <TabsTrigger 
                    value="mobile" 
                    className="flex items-center justify-center gap-2 rounded-lg px-3 py-3 text-xs font-medium transition-all hover:bg-background/80 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"
                  >
                    <Smartphone className="h-4 w-4" />
                    <span className="hidden sm:inline">Mobile</span>
                  </TabsTrigger>
                )}
                <TabsTrigger 
                  value="detailed" 
                  className="flex items-center justify-center gap-2 rounded-lg px-3 py-3 text-xs sm:text-sm font-medium transition-all hover:bg-background/80 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"
                >
                  <Package className="h-4 w-4" />
                  <span className="hidden sm:inline">Detailed View</span>
                  <span className="sm:hidden">Details</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="grid" 
                  className="flex items-center justify-center gap-2 rounded-lg px-3 py-3 text-xs sm:text-sm font-medium transition-all hover:bg-background/80 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"
                >
                  <Grid3X3 className="h-4 w-4" />
                  <span className="hidden sm:inline">Grid View</span>
                  <span className="sm:hidden">Grid</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="progress" 
                  className="flex items-center justify-center gap-2 rounded-lg px-3 py-3 text-xs sm:text-sm font-medium transition-all hover:bg-background/80 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"
                >
                  <BarChart3 className="h-4 w-4" />
                  <span className="hidden sm:inline">Progress</span>
                  <span className="sm:hidden">Progress</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="tasks" 
                  className="flex items-center justify-center gap-2 rounded-lg px-3 py-3 text-xs sm:text-sm font-medium transition-all hover:bg-background/80 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"
                >
                  <ListChecks className="h-4 w-4" />
                  <span className="hidden sm:inline">Tasks</span>
                  <span className="sm:hidden">Tasks</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="completed" 
                  className="flex items-center justify-center gap-2 rounded-lg px-3 py-3 text-xs sm:text-sm font-medium transition-all hover:bg-background/80 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"
                >
                  <Archive className="h-4 w-4" />
                  <span className="hidden sm:inline">Completed</span>
                  <span className="sm:hidden">Done</span>
                </TabsTrigger>
              </TabsList>
            </div>

            {/* Mobile List View */}
            {isMobile && (
              <TabsContent value="mobile" className="p-6">
                <JobsiteMobileList jobsites={filteredAndSortedJobsites} isLoading={isLoading} />
              </TabsContent>
            )}

            {/* Detailed View */}
            <TabsContent value="detailed" className="p-6">
              {isLoading ? (
                <div className="space-y-4">
                  {[...Array(3)].map((_, index) => (
                    <Card key={index} className="animate-pulse">
                      <div className="p-6 space-y-3">
                        <div className="h-6 bg-muted rounded w-1/3"></div>
                        <div className="h-4 bg-muted rounded w-full"></div>
                        <div className="h-4 bg-muted rounded w-2/3"></div>
                      </div>
                    </Card>
                  ))}
                </div>
              ) : filteredAndSortedJobsites.length === 0 ? (
                <div className="text-center py-16">
                  <div className="p-4 rounded-full bg-muted/50 w-fit mx-auto mb-4">
                    <Building className="h-12 w-12 text-muted-foreground" />
                  </div>
                  <h3 className="text-xl font-semibold text-foreground mb-2">No jobsites found</h3>
                  <p className="text-muted-foreground mb-6">
                    {searchTerm || statusFilter !== 'all' 
                      ? "Try adjusting your search or filters" 
                      : "Add your first jobsite to get started"
                    }
                  </p>
                  {!searchTerm && statusFilter === 'all' && (
                    <Button onClick={() => setShowForm(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Your First Jobsite
                    </Button>
                  )}
                </div>
              ) : (
                <div className="space-y-6">
                  {filteredAndSortedJobsites.map((jobsite) => (
                    <JobsiteDetailedCard 
                      key={jobsite.id} 
                      jobsite={jobsite} 
                    />
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Grid View */}
            <TabsContent value="grid" className="p-6">
              <JobsiteGrid jobsites={filteredAndSortedJobsites} isLoading={isLoading} />
            </TabsContent>

            {/* Progress View */}
            <TabsContent value="progress" className="p-6">
              {isLoading ? (
                <div className="space-y-4">
                  {[...Array(3)].map((_, index) => (
                    <Card key={index} className="animate-pulse">
                      <div className="p-6 space-y-3">
                        <div className="h-6 bg-muted rounded w-1/3"></div>
                        <div className="h-4 bg-muted rounded w-full"></div>
                        <div className="h-4 bg-muted rounded w-2/3"></div>
                      </div>
                    </Card>
                  ))}
                </div>
              ) : filteredAndSortedJobsites.length === 0 ? (
                <div className="text-center py-16">
                  <div className="p-4 rounded-full bg-muted/50 w-fit mx-auto mb-4">
                    <BarChart3 className="h-12 w-12 text-muted-foreground" />
                  </div>
                  <h3 className="text-xl font-semibold text-foreground mb-2">No progress data found</h3>
                  <p className="text-muted-foreground">
                    {searchTerm || statusFilter !== 'all' 
                      ? "Try adjusting your search or filters" 
                      : "Add jobsites to track their progress"
                    }
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  {filteredAndSortedJobsites.map((jobsite) => (
                    <JobsiteCard 
                      key={jobsite.id} 
                      jobsite={jobsite} 
                      showProgress={true}
                    />
                  ))}
                 </div>
               )}
             </TabsContent>

             {/* Tasks View */}
             <TabsContent value="tasks" className="p-6">
               {isLoading ? (
                 <div className="space-y-4">
                   {[...Array(3)].map((_, index) => (
                     <Card key={index} className="animate-pulse">
                       <div className="p-6 space-y-3">
                         <div className="h-6 bg-muted rounded w-1/3"></div>
                         <div className="h-4 bg-muted rounded w-full"></div>
                         <div className="h-4 bg-muted rounded w-2/3"></div>
                       </div>
                     </Card>
                   ))}
                 </div>
               ) : filteredAndSortedJobsites.length === 0 ? (
                 <div className="text-center py-16">
                   <div className="p-4 rounded-full bg-muted/50 w-fit mx-auto mb-4">
                     <ListChecks className="h-12 w-12 text-muted-foreground" />
                   </div>
                   <h3 className="text-xl font-semibold text-foreground mb-2">No tasks found</h3>
                   <p className="text-muted-foreground">
                     {searchTerm || statusFilter !== 'all' 
                       ? "Try adjusting your search or filters" 
                       : "Add jobsites to create tasks"
                     }
                   </p>
                 </div>
               ) : (
                 <div className="space-y-6">
                   <TaskStatisticsCards jobsites={filteredAndSortedJobsites} />
                   
                   {filteredAndSortedJobsites.map((jobsite) => (
                     <Card key={jobsite.id}>
                       <CardHeader>
                         <CardTitle className="text-lg">{jobsite.name}</CardTitle>
                       </CardHeader>
                       <CardContent>
                         <JobsiteTaskTab 
                           jobsiteId={jobsite.id}
                           isAdmin={true}
                           hideStats={true}
                           compact={true}
                         />
                       </CardContent>
                     </Card>
                   ))}
                 </div>
               )}
             </TabsContent>

             {/* Completed View */}
             <TabsContent value="completed" className="p-6">
               <CompletedJobsites />
             </TabsContent>
           </Tabs>
         </Card>
       </div>
     </div>
   );
 };
 
 export default JobsiteManagement;
