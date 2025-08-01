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

  const { data: reports = [], isLoading } = useDailyReports(filters);

  // Filter reports by search term if provided
  const filteredReports = filters.search
    ? reports.filter(report =>
        report.summary.toLowerCase().includes(filters.search!.toLowerCase()) ||
        report.jobsites?.name?.toLowerCase().includes(filters.search!.toLowerCase()) ||
        `${report.user_profiles?.first_name} ${report.user_profiles?.last_name}`
          .toLowerCase().includes(filters.search!.toLowerCase())
      )
    : reports;

  const handleClearFilters = () => {
    setFilters({});
  };

  const canCreateReports = user?.role && ['foreman', 'admin', 'super_admin'].includes(user.role);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <ClipboardList className="h-6 w-6" />
          <h2 className="text-2xl font-bold">Daily Reports</h2>
        </div>
        {canCreateReports && (
          <Button onClick={() => setIsFormOpen(true)} className="flex items-center gap-2">
            <PlusCircle className="h-4 w-4" />
            Create Daily Report
          </Button>
        )}
      </div>

      <DailyReportsFilters
        filters={filters}
        onFiltersChange={setFilters}
        onClearFilters={handleClearFilters}
      />

      <DailyReportsTable reports={filteredReports} isLoading={isLoading} />

      {canCreateReports && (
        <DailyReportsForm
          open={isFormOpen}
          onOpenChange={setIsFormOpen}
        />
      )}
    </div>
  );
};

export default DailyReportsManagement;