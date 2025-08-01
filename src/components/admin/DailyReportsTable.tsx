import React, { useState } from 'react';
import { format } from 'date-fns';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Eye, Camera, Download } from 'lucide-react';
import { DailyReport } from '@/hooks/useDailyReports';
import DailyReportDetailsModal from './DailyReportDetailsModal';

interface DailyReportsTableProps {
  reports: DailyReport[];
  isLoading: boolean;
}

const DailyReportsTable: React.FC<DailyReportsTableProps> = ({ reports, isLoading }) => {
  const [selectedReport, setSelectedReport] = useState<DailyReport | null>(null);

  const truncateText = (text: string, maxLength: number = 80) => {
    return text.length > maxLength ? `${text.substring(0, maxLength)}...` : text;
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="text-center text-muted-foreground">Loading daily reports...</div>
        </CardContent>
      </Card>
    );
  }

  if (reports.length === 0) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="text-center text-muted-foreground">
            No daily reports found. Create your first report to get started.
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Daily Reports</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Jobsite</TableHead>
                <TableHead>Submitted By</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Summary</TableHead>
                <TableHead>Photos</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reports.map((report) => (
                <TableRow key={report.id}>
                  <TableCell className="font-medium">
                    {report.jobsites?.name || 'Unknown Jobsite'}
                  </TableCell>
                  <TableCell>
                    {report.user_profiles ? 
                      `${report.user_profiles.first_name} ${report.user_profiles.last_name}` : 
                      'Unknown User'
                    }
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span>{format(new Date(report.report_date), 'MMM dd, yyyy')}</span>
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(report.created_at), 'h:mm a')}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="max-w-xs">
                      {truncateText(report.summary)}
                    </div>
                  </TableCell>
                  <TableCell>
                    {report.photos && report.photos.length > 0 ? (
                      <Badge variant="secondary" className="flex items-center gap-1">
                        <Camera className="h-3 w-3" />
                        {report.photos.length}
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground text-sm">No photos</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedReport(report)}
                        className="h-8 w-8 p-0"
                        title="View details"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        title="Download PDF"
                        onClick={() => {
                          // TODO: Implement PDF download
                          console.log('Download PDF for report:', report.id);
                        }}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <DailyReportDetailsModal
        report={selectedReport}
        open={!!selectedReport}
        onOpenChange={(open) => !open && setSelectedReport(null)}
      />
    </>
  );
};

export default DailyReportsTable;