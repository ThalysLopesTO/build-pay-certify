import React, { useState, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { PlusCircle, ClipboardList, Wifi, WifiOff } from 'lucide-react';
import { useDailyReports } from '@/hooks/useDailyReports';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import DailyReportsForm from '@/components/admin/DailyReportsForm';
import DailyReportsTable from '@/components/admin/DailyReportsTable';
import DailyReportsFilters from '@/components/admin/DailyReportsFilters';
import { useToast } from '@/hooks/use-toast';

const ForemanDailyReports = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [filters, setFilters] = useState<{
    jobsite_id?: string;
    date_from?: string;
    date_to?: string;
    submitted_by?: string;
    search?: string;
  }>({
    // Default to current user's reports for foremen
    submitted_by: user?.id || undefined,
  });

  // Connection status monitoring
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      toast({
        title: "Connection restored",
        description: "You're back online. Your data will sync automatically.",
      });
    };

    const handleOffline = () => {
      setIsOnline(false);
      toast({
        title: "Connection lost",
        description: "You're offline. Your work will be saved when connection is restored.",
        variant: "destructive",
      });
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [toast]);

  // Use debounced filters to prevent too many queries
  const [debouncedFilters, setDebouncedFilters] = useState(filters);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedFilters(filters);
    }, 300); // 300ms debounce

    return () => clearTimeout(timer);
  }, [filters]);

  const { data: reports = [], isLoading, error, refetch } = useDailyReports(debouncedFilters);

  const handleFiltersChange = useCallback((newFilters: typeof filters) => {
    setFilters(newFilters);
  }, []);

  const handleClearFilters = useCallback(() => {
    setFilters({
      submitted_by: user?.id || undefined, // Keep user filter for foremen
    });
  }, [user?.id]);

  // Manual refresh for when connection is restored
  const handleRefresh = useCallback(() => {
    refetch();
  }, [refetch]);

  // Filter reports by search term if provided
  const filteredReports = filters.search
    ? reports.filter(report => {
        const summary = report.summary?.toLowerCase() || '';
        const jobsiteName = report.jobsites?.name?.toLowerCase() || '';
        const submitterName = report.user_profiles 
          ? `${report.user_profiles.first_name || ''} ${report.user_profiles.last_name || ''}`.toLowerCase()
          : '';
        const searchTerm = filters.search!.toLowerCase();
        
        return summary.includes(searchTerm) || 
               jobsiteName.includes(searchTerm) || 
               submitterName.includes(searchTerm);
      })
    : reports;

  if (error) {
    console.error('Daily reports error:', error);
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-2">
          <ClipboardList className="h-6 w-6" />
          <h2 className="text-2xl font-bold">Daily Reports</h2>
        </div>
        <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
          <h3 className="font-semibold text-destructive mb-2">Connection Error</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Unable to load daily reports: {error?.message || 'Unknown error'}
          </p>
          <Button onClick={handleRefresh} variant="outline" size="sm">
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header Section with Connection Status */}
        <div className="flex flex-col space-y-2">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-bold tracking-tight">Daily Reports</h1>
                <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                  isOnline 
                    ? 'bg-green-100 text-green-700 border border-green-200' 
                    : 'bg-red-100 text-red-700 border border-red-200'
                }`}>
                  {isOnline ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
                  {isOnline ? 'Online' : 'Offline'}
                </div>
              </div>
              <p className="text-muted-foreground">
                Submit and manage your daily progress reports
              </p>
            </div>
            <Button 
              onClick={() => setIsFormOpen(true)} 
              size="lg"
              disabled={!isOnline} // Disable when offline
              className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg hover:shadow-xl transition-all duration-200 rounded-xl px-6 py-3"
            >
              <PlusCircle className="h-5 w-5 mr-2" />
              Create Daily Report
            </Button>
          </div>
        </div>

        {/* Connection Warning */}
        {!isOnline && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <WifiOff className="h-5 w-5 text-amber-600 mt-0.5" />
              <div>
                <h3 className="font-semibold text-amber-800 mb-1">You're currently offline</h3>
                <p className="text-sm text-amber-700">
                  You can view existing reports, but you'll need an internet connection to submit new ones.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Filters Section */}
        <DailyReportsFilters
          filters={filters}
          onFiltersChange={handleFiltersChange}
          onClearFilters={handleClearFilters}
        />

        {/* Reports Table */}
        <DailyReportsTable reports={filteredReports} isLoading={isLoading} />

        {/* Form Modal */}
        <DailyReportsForm
          open={isFormOpen}
          onOpenChange={setIsFormOpen}
        />
      </div>
    </div>
  );
};

export default ForemanDailyReports;