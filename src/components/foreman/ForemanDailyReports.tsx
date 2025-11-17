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
    return (
      <div className="space-y-6 p-4 md:p-6">
        <h1 className="text-2xl md:text-3xl font-bold">Daily Reports</h1>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Connection Error</AlertTitle>
          <AlertDescription>
            Unable to load daily reports: {error?.message || 'Unknown error'}
            <Button onClick={handleRefresh} variant="outline" size="sm" className="mt-2">
              Try Again
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 md:p-6 overflow-x-hidden">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight truncate">Daily Reports</h1>
          <p className="text-muted-foreground mt-1 text-sm md:text-base">
            View and manage your daily reports
          </p>
        </div>
        <Button onClick={() => setIsFormOpen(true)} size={isMobile ? 'icon' : 'default'} className="shrink-0">
          <Plus className={isMobile ? 'h-4 w-4' : 'mr-2 h-4 w-4'} />
          {!isMobile && 'Create Daily Report'}
        </Button>
      </div>

      {/* Filters */}
      {isMobile ? (
        <DailyReportsMobileFilters
          filters={filters}
          onFiltersChange={handleFiltersChange}
          onClearFilters={handleClearFilters}
        />
      ) : (
        <DailyReportsFilters
          filters={filters}
          onFiltersChange={handleFiltersChange}
          onClearFilters={handleClearFilters}
        />
      )}

      {/* Content */}
      {isMobile ? (
        <DailyReportsMobileList
          reports={filteredReports}
          isLoading={isLoading}
          onView={setSelectedReport}
          onEdit={setEditingReport}
          onDownload={handleDownloadPDF}
          onDelete={handleDeleteReport}
          canEdit={canEditReport}
          canDelete={isAdmin}
          onRefresh={handleRefresh}
        />
      ) : (
        <DailyReportsTable 
          reports={filteredReports} 
          isLoading={isLoading}
        />
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <DailyReportsPagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={totalCount}
          itemsPerPage={pageSize}
          onPageChange={setCurrentPage}
        />
      )}

      {/* Create/Edit Form */}
      <DailyReportsForm
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
      />

      {/* Mobile Modals */}
      {isMobile && (
        <>
          {selectedReport && (
            <DailyReportDetailsModal
              report={selectedReport}
              open={!!selectedReport}
              onOpenChange={(open) => !open && setSelectedReport(null)}
            />
          )}
          {editingReport && (
            <DailyReportEditModal
              report={editingReport}
              open={!!editingReport}
              onOpenChange={(open) => !open && setEditingReport(null)}
            />
          )}
          {deletingReport && (
            <DailyReportDeleteConfirmDialog
              report={deletingReport}
              open={!!deletingReport}
              onOpenChange={(open) => !open && setDeletingReport(null)}
              onConfirm={handleConfirmDelete}
              isDeleting={isDeleting}
            />
          )}
        </>
      )}
    </div>
  );
};

export default ForemanDailyReports;