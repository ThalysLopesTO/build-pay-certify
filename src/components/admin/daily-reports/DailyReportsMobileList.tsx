import React from 'react';
import { DailyReport } from '@/hooks/useDailyReports';
import { DailyReportsMobileCard } from './DailyReportsMobileCard';
import { Loader2 } from 'lucide-react';
import PullToRefresh from 'react-simple-pull-to-refresh';

interface DailyReportsMobileListProps {
  reports: DailyReport[];
  isLoading: boolean;
  onView: (report: DailyReport) => void;
  onEdit?: (report: DailyReport) => void;
  onDownload?: (report: DailyReport) => void;
  onDelete?: (report: DailyReport) => void;
  canEdit: (report: DailyReport) => boolean;
  canDelete: boolean;
  onRefresh?: () => Promise<void>;
}

export const DailyReportsMobileList: React.FC<DailyReportsMobileListProps> = ({
  reports,
  isLoading,
  onView,
  onEdit,
  onDownload,
  onDelete,
  canEdit,
  canDelete,
  onRefresh,
}) => {
  const handleRefresh = async () => {
    if (onRefresh) {
      await onRefresh();
    }
  };

  if (isLoading && reports.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (reports.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <p className="text-muted-foreground">No daily reports found</p>
        <p className="text-sm text-muted-foreground mt-1">
          Try adjusting your filters or create a new report
        </p>
      </div>
    );
  }

  const content = (
    <div className="space-y-3 pb-4">
      {reports.map((report) => (
        <DailyReportsMobileCard
          key={report.id}
          report={report}
          onView={onView}
          onEdit={onEdit}
          onDownload={onDownload}
          onDelete={onDelete}
          canEdit={canEdit(report)}
          canDelete={canDelete}
        />
      ))}
    </div>
  );

  if (onRefresh) {
    return (
      <PullToRefresh
        onRefresh={handleRefresh}
        pullingContent=""
        refreshingContent={
          <div className="flex justify-center py-4">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        }
      >
        {content}
      </PullToRefresh>
    );
  }

  return content;
};
