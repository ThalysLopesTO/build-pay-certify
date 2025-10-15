import React, { useState } from 'react';
import { format } from 'date-fns';
import { getReportDisplayDate, getSubmissionDisplayTime, getSubmissionDisplayDateTime } from '@/utils/timezone';
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
import { Checkbox } from '@/components/ui/checkbox';
import EmployeeAvatar from '@/components/ui/employee-avatar';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Card, CardContent } from '@/components/ui/card';
import { Eye, Camera, Download, FileText, MapPin, Clock, User, Edit, Lock, Trash2, Package, X } from 'lucide-react';
import { DailyReport } from '@/hooks/useDailyReports';
import { useDailyReportPDF } from '@/hooks/useDailyReportPDF';
import { useBulkDailyReportPDF } from '@/hooks/useBulkDailyReportPDF';
import { useDailyReportDelete } from '@/hooks/useDailyReportDelete';
import { useCompanySettings } from '@/hooks/useCompanySettings';
import { useCompanyLogo } from '@/hooks/useCompanyLogo';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useToast } from '@/hooks/use-toast';
import { generateZipFileName } from '@/utils/fileNaming';
import DailyReportDetailsModal from './DailyReportDetailsModal';
import DailyReportEditModal from './DailyReportEditModal';
import { DailyReportDeleteConfirmDialog } from './DailyReportDeleteConfirmDialog';

interface DailyReportsTableProps {
  reports: DailyReport[];
  isLoading: boolean;
}

const DailyReportsTable: React.FC<DailyReportsTableProps> = ({ reports, isLoading }) => {
  const [selectedReport, setSelectedReport] = useState<DailyReport | null>(null);
  const [editingReport, setEditingReport] = useState<DailyReport | null>(null);
  const [deletingReport, setDeletingReport] = useState<DailyReport | null>(null);
  const [selectedReportIds, setSelectedReportIds] = useState<Set<string>>(new Set());
  const [isGeneratingZip, setIsGeneratingZip] = useState(false);
  
  const { generateDailyReportPDF } = useDailyReportPDF();
  const { generateBulkPDFs, downloadZipFile } = useBulkDailyReportPDF();
  const { mutate: deleteReport, isPending: isDeleting } = useDailyReportDelete();
  const { settings: companySettings } = useCompanySettings();
  const { logoUrl } = useCompanyLogo();
  const { user } = useAuth();
  const { toast } = useToast();

  // Check if user is admin
  const isAdmin = user?.role === 'admin' || user?.role === 'super_admin';

  // Multi-select handlers
  const handleSelectAll = () => {
    if (isAllSelected()) {
      setSelectedReportIds(new Set());
    } else {
      const allIds = new Set(reports.map(r => r.id));
      setSelectedReportIds(allIds);
    }
  };

  const handleSelectOne = (reportId: string) => {
    const newSet = new Set(selectedReportIds);
    if (newSet.has(reportId)) {
      newSet.delete(reportId);
    } else {
      newSet.add(reportId);
    }
    setSelectedReportIds(newSet);
  };

  const handleClearSelection = () => {
    setSelectedReportIds(new Set());
  };

  const isAllSelected = () => {
    return reports.length > 0 && reports.every(r => selectedReportIds.has(r.id));
  };

  const isSomeSelected = () => {
    return selectedReportIds.size > 0 && !isAllSelected();
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

  const handleDownloadSelectedPDFs = async () => {
    if (selectedReportIds.size === 0) return;

    setIsGeneratingZip(true);

    try {
      const selectedReports = reports.filter(r => selectedReportIds.has(r.id));

      toast({
        title: "Generating PDFs",
        description: `Creating ${selectedReports.length} PDF report${selectedReports.length !== 1 ? 's' : ''}...`,
      });

      const zipBlob = await generateBulkPDFs({
        reports: selectedReports,
        companySettings: {
          company_name: companySettings?.company_name,
          company_address: companySettings?.company_address,
          company_phone: companySettings?.company_phone,
          company_email: companySettings?.company_email,
          timezone: companySettings?.timezone,
        },
        logoUrl,
        onProgress: (current, total) => {
          if (current % 5 === 0 || current === total) {
            toast({
              title: "Generating PDFs",
              description: `Progress: ${current}/${total} PDFs created`,
            });
          }
        }
      });

      const zipFileName = generateZipFileName(
        selectedReports, 
        companySettings?.company_name
      );
      
      downloadZipFile(zipBlob, zipFileName);

      toast({
        title: "Success",
        description: `✅ Downloaded ${selectedReports.length} report${selectedReports.length !== 1 ? 's' : ''} as ZIP file`,
      });

      // Clear selection after successful download
      setSelectedReportIds(new Set());

    } catch (error) {
      console.error('Error generating ZIP:', error);
      toast({
        title: "Error",
        description: "Failed to generate PDF bundle. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingZip(false);
    }
  };

  const handleDownloadPDF = async (report: DailyReport) => {
    try {
      const pdfData = {
        jobsite: report.jobsites?.name || 'Unknown Jobsite',
        address: report.jobsites?.address || 'Unknown Address',
        reportDate: getReportDisplayDate(report.report_date, companySettings?.timezone),
        submittedBy: report.user_profiles ? 
          `${report.user_profiles.first_name} ${report.user_profiles.last_name}` : 
          'Unknown User',
        submittedTime: getSubmissionDisplayTime(report.created_at, companySettings?.timezone),
        summary: report.summary,
        photos: (report.photos || []).map(photoUrl => ({
          src: photoUrl,
          caption: undefined,
          takenAt: undefined,
          mime: 'JPEG' as const
        }))
      };

      const pdfCompanySettings = {
        name: companySettings?.company_name,
        address: companySettings?.company_address,
        phone: companySettings?.company_phone,
        email: companySettings?.company_email,
        timezone: companySettings?.timezone,
      };

      await generateDailyReportPDF({
        report: pdfData,
        companySettings: pdfCompanySettings,
        logoUrl,
      });

      toast({
        title: "Success",
        description: "✅ PDF downloaded successfully",
      });
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast({
        title: "Error",
        description: "Failed to generate PDF. Please try again.",
        variant: "destructive",
      });
    }
  };

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
      {/* Selection indicator bar */}
      {selectedReportIds.size > 0 && (
        <div className="sticky top-0 z-10 bg-primary text-primary-foreground px-6 py-3 rounded-t-lg shadow-md mb-2">
          <div className="flex items-center justify-between">
            <span className="font-medium text-sm">
              {selectedReportIds.size} report{selectedReportIds.size !== 1 ? 's' : ''} selected
            </span>
            <div className="flex gap-2">
              <Button 
                onClick={handleDownloadSelectedPDFs}
                disabled={isGeneratingZip}
                size="sm"
                variant="secondary"
                className="h-8"
              >
                {isGeneratingZip ? (
                  <>
                    <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-current mr-2"></div>
                    Generating...
                  </>
                ) : (
                  <>
                    <Package className="h-4 w-4 mr-1" />
                    Download as ZIP
                  </>
                )}
              </Button>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={handleClearSelection}
                className="h-8 hover:bg-primary-foreground/20"
              >
                <X className="h-4 w-4 mr-1" />
                Clear
              </Button>
            </div>
          </div>
        </div>
      )}

      <Card className="bg-background border shadow-sm">
        <CardContent className="p-0">
          <div className="overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="border-b bg-muted/30">
                  <TableHead className="font-semibold text-xs uppercase tracking-wide py-4 px-6 w-12">
                    <Checkbox
                      checked={isAllSelected()}
                      onCheckedChange={handleSelectAll}
                      aria-label="Select all reports"
                      className="data-[state=indeterminate]:bg-primary data-[state=indeterminate]:text-primary-foreground"
                      {...(isSomeSelected() && !isAllSelected() ? { 'data-state': 'indeterminate' as any } : {})}
                    />
                  </TableHead>
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
                {reports.map((report, index) => {
                  const isSelected = selectedReportIds.has(report.id);
                  return (
                    <TableRow 
                      key={report.id} 
                      className={`hover:bg-muted/40 transition-colors duration-150 group border-b last:border-b-0 ${
                        isSelected ? 'bg-primary/5 hover:bg-primary/10' : ''
                      }`}
                    >
                      <TableCell className="py-4 px-6">
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={() => handleSelectOne(report.id)}
                          aria-label={`Select report from ${report.jobsites?.name || 'Unknown'}`}
                          onClick={(e) => e.stopPropagation()}
                        />
                      </TableCell>
                      <TableCell className="py-4 px-6">
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
                    </TableCell>
                    
                    <TableCell className="py-4">
                      <div className="flex items-center gap-2">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div className="cursor-pointer">
                                <EmployeeAvatar
                                  photoUrl={report.user_profiles?.photo_url}
                                  firstName={report.user_profiles?.first_name}
                                  lastName={report.user_profiles?.last_name}
                                  size="sm"
                                  className="h-8 w-8"
                                />
                              </div>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>
                                {report.user_profiles ? 
                                  `${report.user_profiles.first_name} ${report.user_profiles.last_name}` : 
                                  'Unknown User'
                                }
                              </p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
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
                            {getReportDisplayDate(report.report_date, companySettings?.timezone)}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Submitted {getSubmissionDisplayDateTime(report.created_at, companySettings?.timezone)}
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
                        {isAdmin && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteReport(report)}
                            className="h-9 w-9 p-0 hover:bg-destructive/10 hover:text-destructive group/btn"
                            title="Delete report"
                            disabled={isDeleting}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                        {report.canEdit ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setEditingReport(report)}
                            className="h-9 w-9 p-0 hover:bg-blue-50 hover:text-blue-600 group/btn"
                            title="Edit report"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        ) : (
                          <div className="h-9 w-9 flex items-center justify-center" title="Report locked">
                            <Lock className="h-4 w-4 text-muted-foreground/50" />
                          </div>
                        )}
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
                          onClick={() => handleDownloadPDF(report)}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                  );
                })}
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

      <DailyReportEditModal
        report={editingReport}
        open={!!editingReport}
        onOpenChange={(open) => !open && setEditingReport(null)}
      />

      <DailyReportDeleteConfirmDialog
        report={deletingReport}
        open={!!deletingReport}
        onOpenChange={(open) => !open && setDeletingReport(null)}
        onConfirm={handleConfirmDelete}
        isDeleting={isDeleting}
        timezone={companySettings?.timezone}
      />
    </>
  );
};

export default DailyReportsTable;