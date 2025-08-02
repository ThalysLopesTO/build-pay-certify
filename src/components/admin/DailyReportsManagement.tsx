import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { PlusCircle, ClipboardList } from 'lucide-react';
import { useDailyReports } from '@/hooks/useDailyReports';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import DailyReportsForm from './DailyReportsForm';
import DailyReportsTable from './DailyReportsTable';
import DailyReportsFilters from './DailyReportsFilters';

const DailyReportsManagement = () => {
  const { user } = useAuth();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [filters, setFilters] = useState<{
    jobsite_id?: string;
    date_from?: string;
    date_to?: string;
    submitted_by?: string;
    search?: string;
  }>({});

  const { data: reports = [], isLoading, error } = useDailyReports(filters);

  // Early return if there's an error
  if (error) {
    console.error('Daily reports error:', error);
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-2">
          <ClipboardList className="h-6 w-6" />
          <h2 className="text-2xl font-bold">Daily Reports</h2>
        </div>
        <div className="text-red-500">
          Error loading daily reports: {error?.message || 'Unknown error'}
        </div>
      </div>
    );
  }

  console.log('DailyReportsManagement render:', { 
    user: user?.email, 
    reports: reports.length, 
    isLoading, 
    error: error?.message || error,
    hasReports: reports.length > 0,
    filters 
  });

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

  const handleClearFilters = () => {
    setFilters({});
  };

  const canCreateReports = user?.role && ['foreman', 'admin', 'super_admin'].includes(user.role);

  return (
    <div className="min-h-screen bg-muted/30 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header Section */}
        <div className="flex flex-col space-y-2">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Daily Reports</h1>
              <p className="text-muted-foreground mt-1">
                View and manage all submitted daily reports from foremen across jobsites
              </p>
            </div>
            {canCreateReports && (
              <Button 
                onClick={() => setIsFormOpen(true)} 
                size="lg"
                className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg hover:shadow-xl transition-all duration-200 rounded-xl px-6 py-3"
              >
                <PlusCircle className="h-5 w-5 mr-2" />
                Create Daily Report
              </Button>
            )}
          </div>
        </div>

        {/* Filters Section */}
        <DailyReportsFilters
          filters={filters}
          onFiltersChange={setFilters}
          onClearFilters={handleClearFilters}
        />

        {/* Reports Table */}
        <DailyReportsTable reports={filteredReports} isLoading={isLoading} />

        {canCreateReports && (
          <DailyReportsForm
            open={isFormOpen}
            onOpenChange={setIsFormOpen}
          />
        )}
      </div>
    </div>
  );
};

export default DailyReportsManagement;