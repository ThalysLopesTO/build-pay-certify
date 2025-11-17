import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MapPin, Clock, User, MoreVertical, Camera } from 'lucide-react';
import { DailyReport } from '@/hooks/useDailyReports';
import { getReportDisplayDate, getSubmissionDisplayDateTime } from '@/utils/timezone';
import EmployeeAvatar from '@/components/ui/employee-avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface DailyReportsMobileCardProps {
  report: DailyReport;
  onView: (report: DailyReport) => void;
  onEdit?: (report: DailyReport) => void;
  onDownload?: (report: DailyReport) => void;
  onDelete?: (report: DailyReport) => void;
  canEdit: boolean;
  canDelete: boolean;
}

export const DailyReportsMobileCard: React.FC<DailyReportsMobileCardProps> = ({
  report,
  onView,
  onEdit,
  onDownload,
  onDelete,
  canEdit,
  canDelete,
}) => {
  const reportDate = getReportDisplayDate(report.report_date);
  const submissionDateTime = getSubmissionDisplayDateTime(report.created_at);
  const photoCount = report.photos?.length || 0;

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-4 space-y-3">
        {/* Header with jobsite and actions */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-base truncate">
              {report.jobsites?.name || 'Unknown Jobsite'}
            </h3>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onView(report)}>
                View Details
              </DropdownMenuItem>
              {canEdit && onEdit && (
                <DropdownMenuItem onClick={() => onEdit(report)}>
                  Edit Report
                </DropdownMenuItem>
              )}
              {onDownload && (
                <DropdownMenuItem onClick={() => onDownload(report)}>
                  Download PDF
                </DropdownMenuItem>
              )}
              {canDelete && onDelete && (
                <DropdownMenuItem onClick={() => onDelete(report)} className="text-destructive">
                  Delete Report
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Address */}
        {report.jobsites?.address && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <MapPin className="h-4 w-4 shrink-0" />
            <span className="truncate">{report.jobsites.address}</span>
          </div>
        )}

        {/* Submitter */}
        <div className="flex items-center gap-2">
          <User className="h-4 w-4 text-muted-foreground shrink-0" />
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <EmployeeAvatar
              firstName={report.user_profiles?.first_name}
              lastName={report.user_profiles?.last_name}
              size="sm"
            />
            <span className="text-sm truncate">
              {report.user_profiles?.first_name} {report.user_profiles?.last_name}
            </span>
          </div>
        </div>

        {/* Date and time */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Clock className="h-4 w-4 shrink-0" />
          <span>{reportDate} at {submissionDateTime.split(' at ')[1]}</span>
        </div>

        {/* Photos count */}
        {photoCount > 0 && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Camera className="h-4 w-4 shrink-0" />
            <span>{photoCount} {photoCount === 1 ? 'photo' : 'photos'}</span>
          </div>
        )}

        {/* Summary preview */}
        {report.summary && (
          <p className="text-sm text-muted-foreground line-clamp-2">
            {report.summary}
          </p>
        )}

        {/* View Details Button */}
        <Button
          variant="outline"
          className="w-full"
          onClick={() => onView(report)}
        >
          View Details
        </Button>
      </CardContent>
    </Card>
  );
};
