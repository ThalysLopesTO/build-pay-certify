import React, { useState, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Plus, AlertCircle } from 'lucide-react';
import { useDailyReports, DailyReport } from '@/hooks/useDailyReports';
import DailyReportsTable from '../admin/DailyReportsTable';
import DailyReportsFilters from '../admin/DailyReportsFilters';
import { DailyReportsPagination } from '../admin/daily-reports/DailyReportsPagination';
import DailyReportsForm from '../admin/DailyReportsForm';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useIsMobile } from '@/hooks/use-mobile';
import { DailyReportsMobileFilters } from '../admin/daily-reports/DailyReportsMobileFilters';
import { DailyReportsMobileList } from '../admin/daily-reports/DailyReportsMobileList';
import DailyReportDetailsModal from '../admin/DailyReportDetailsModal';
import DailyReportEditModal from '../admin/DailyReportEditModal';
import { DailyReportDeleteConfirmDialog } from '../admin/DailyReportDeleteConfirmDialog';
import { useDailyReportPDF } from '@/hooks/useDailyReportPDF';
import { useDailyReportDelete } from '@/hooks/useDailyReportDelete';
import { useToast } from '@/hooks/use-toast';

const ForemanDailyReports: React.FC = () => {
  const { user } = useAuth();
  const isMobile = useIsMobile();
  const { toast } = useToast();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);
  const [filters, setFilters] = useState<{
    jobsite_id?: string;
    date_from?: string;
    date_to?: string;
    submitted_by?: string;
    search?: string;
  }>({});
  const [debouncedFilters, setDebouncedFilters] = useState(filters);
  const [selectedReport, setSelectedReport] = useState<DailyReport | null>(null);
  const [editingReport, setEditingReport] = useState<DailyReport | null>(null);
  const [deletingReport, setDeletingReport] = useState<DailyReport | null>(null);
  
  const { generateDailyReportPDF } = useDailyReportPDF();
  const { mutate: deleteReport, isPending: isDeleting } = useDailyReportDelete();
  const isAdmin = user?.role === 'admin' || user?.role === 'super_admin';

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedFilters(filters);
    }, 300);

    return () => clearTimeout(timer);
  }, [filters]);

  const { data, isLoading, error, refetch } = useDailyReports(debouncedFilters, { page: currentPage, pageSize });
  const reports = data?.data || [];
  const totalCount = data?.totalCount || 0;
  const totalPages = Math.ceil(totalCount / pageSize);

  const handleFiltersChange = useCallback((newFilters: typeof filters) => {
    setFilters(newFilters);
    setCurrentPage(1); // Reset to first page when filters change
  }, []);

  const handleClearFilters = useCallback(() => {
    setFilters({});
    setCurrentPage(1);
  }, []);

  const handleRefresh = async () => {
    await refetch();
  };

  const handleDownloadPDF = async (report: DailyReport) => {
    try {
      const pdfData = {
        jobsite: report.jobsites?.name,
        address: report.jobsites?.address,
        reportDate: report.report_date,
        submittedBy: `${report.user_profiles?.first_name} ${report.user_profiles?.last_name}`,
        submittedTime: report.created_at,
        summary: report.summary,
        photos: report.photos?.map(url => ({ src: url })),
      };
      await generateDailyReportPDF({ report: pdfData });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to generate PDF',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteReport = (report: DailyReport) => {
    setDeletingReport(report);
  };

  const handleConfirmDelete = () => {
    if (deletingReport) {
      deleteReport(deletingReport.id);
      setDeletingReport(null);
    }
  };

  const canEditReport = (report: DailyReport) => {
    return isAdmin || report.submitted_by === user?.id;
  };

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
              <h1 className="text-3xl font-bold tracking-tight mb-2">Daily Reports</h1>
              <p className="text-muted-foreground">
                Submit and manage your daily progress reports
              </p>
            </div>
            <Button 
              onClick={() => setIsFormOpen(true)} 
              size="lg"
              className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg hover:shadow-xl transition-all duration-200 rounded-xl px-6 py-3"
            >
              <PlusCircle className="h-5 w-5 mr-2" />
              Create Daily Report
            </Button>
          </div>
        </div>

        {/* Filters Section */}
        <DailyReportsFilters
          filters={filters}
          onFiltersChange={handleFiltersChange}
          onClearFilters={handleClearFilters}
        />

        {/* Reports Table */}
        <DailyReportsTable reports={filteredReports} isLoading={isLoading} />

        {/* Pagination */}
        {!isLoading && totalCount > 0 && (
          <DailyReportsPagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={totalCount}
            itemsPerPage={pageSize}
            onPageChange={setCurrentPage}
          />
        )}

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