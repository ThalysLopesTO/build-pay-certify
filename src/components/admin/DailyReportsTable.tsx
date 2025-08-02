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
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Card, CardContent } from '@/components/ui/card';
import { Eye, Camera, Download, FileText, MapPin, Clock, User } from 'lucide-react';
import { DailyReport } from '@/hooks/useDailyReports';
import DailyReportDetailsModal from './DailyReportDetailsModal';

interface DailyReportsTableProps {
  reports: DailyReport[];
  isLoading: boolean;
}

const DailyReportsTable: React.FC<DailyReportsTableProps> = ({ reports, isLoading }) => {
  const [selectedReport, setSelectedReport] = useState<DailyReport | null>(null);

  const truncateText = (text: string, maxLength: number = 100) => {
    return text.length > maxLength ? `${text.substring(0, maxLength)}...` : text;
  };

  const getJobsiteInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  if (isLoading) {
    return (
      <Card className="bg-background border shadow-sm">
        <CardContent className="py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading daily reports...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (reports.length === 0) {
    return (
      <Card className="bg-background border shadow-sm">
        <CardContent className="py-12">
          <div className="text-center space-y-3">
            <div className="mx-auto w-12 h-12 bg-muted rounded-full flex items-center justify-center">
              <FileText className="h-6 w-6 text-muted-foreground" />
            </div>
            <div>
              <h3 className="font-medium">No reports found</h3>
              <p className="text-sm text-muted-foreground mt-1">
                No daily reports found. Create your first report to get started.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="bg-background border shadow-sm">
        <CardContent className="p-0">
          <div className="overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="border-b bg-muted/30">
                  <TableHead className="font-semibold text-xs uppercase tracking-wide py-4 px-6">
                    Jobsite
                  </TableHead>
                  <TableHead className="font-semibold text-xs uppercase tracking-wide py-4">
                    Submitted By
                  </TableHead>
                  <TableHead className="font-semibold text-xs uppercase tracking-wide py-4">
                    Date & Time
                  </TableHead>
                  <TableHead className="font-semibold text-xs uppercase tracking-wide py-4">
                    Summary
                  </TableHead>
                  <TableHead className="font-semibold text-xs uppercase tracking-wide py-4">
                    Photos
                  </TableHead>
                  <TableHead className="font-semibold text-xs uppercase tracking-wide py-4 text-right px-6">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reports.map((report, index) => (
                  <TableRow 
                    key={report.id} 
                    className="hover:bg-muted/40 transition-colors duration-150 group border-b last:border-b-0"
                  >
                    <TableCell className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8 bg-primary/10">
                          <AvatarFallback className="text-xs font-medium bg-primary/10 text-primary">
                            {getJobsiteInitials(report.jobsites?.name || 'UK')}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium text-sm">
                            {report.jobsites?.name || 'Unknown Jobsite'}
                          </div>
                          {report.jobsites?.address && (
                            <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                              <MapPin className="h-3 w-3" />
                              {report.jobsites.address.split(',')[0]}
                            </div>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    
                    <TableCell className="py-4">
                      <div className="flex items-center gap-2">
                        <Avatar className="h-7 w-7 bg-secondary">
                          <AvatarFallback className="text-xs bg-secondary">
                            {report.user_profiles ? 
                              `${report.user_profiles.first_name?.charAt(0) || ''}${report.user_profiles.last_name?.charAt(0) || ''}` : 
                              'UU'
                            }
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="text-sm font-medium">
                            {report.user_profiles ? 
                              `${report.user_profiles.first_name} ${report.user_profiles.last_name}` : 
                              'Unknown User'
                            }
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    
                    <TableCell className="py-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-1 text-sm font-medium">
                          <Clock className="h-3 w-3 text-muted-foreground" />
                          {format(new Date(report.report_date), 'MMM dd, yyyy')}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Submitted {format(new Date(report.created_at), 'h:mm a')}
                        </div>
                      </div>
                    </TableCell>
                    
                    <TableCell className="py-4">
                      <div className="max-w-sm">
                        <p className="text-sm text-foreground leading-relaxed">
                          {truncateText(report.summary)}
                        </p>
                      </div>
                    </TableCell>
                    
                    <TableCell className="py-4">
                      {report.photos && report.photos.length > 0 ? (
                        <Badge variant="secondary" className="flex items-center gap-1 w-fit bg-primary/10 text-primary border-primary/20 hover:bg-primary/20">
                          <Camera className="h-3 w-3" />
                          {report.photos.length} photo{report.photos.length !== 1 ? 's' : ''}
                        </Badge>
                      ) : (
                        <span className="text-xs text-muted-foreground">No photos</span>
                      )}
                    </TableCell>
                    
                    <TableCell className="py-4 px-6">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedReport(report)}
                          className="h-9 w-9 p-0 hover:bg-primary/10 hover:text-primary group/btn"
                          title="View details"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-9 w-9 p-0 hover:bg-primary/10 hover:text-primary group/btn"
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
          </div>
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