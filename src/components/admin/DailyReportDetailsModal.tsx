import React, { useState } from 'react';
import { format } from 'date-fns';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Download, X, ZoomIn } from 'lucide-react';
import { DailyReport } from '@/hooks/useDailyReports';

interface DailyReportDetailsModalProps {
  report: DailyReport | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const DailyReportDetailsModal: React.FC<DailyReportDetailsModalProps> = ({
  report,
  open,
  onOpenChange,
}) => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  if (!report) return null;

  const handleDownloadPDF = () => {
    // TODO: Implement PDF download functionality
    console.log('Download PDF for report:', report.id);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle>Daily Report Details</DialogTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownloadPDF}
                className="flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                Download PDF
              </Button>
            </div>
          </DialogHeader>

          <div className="space-y-6">
            {/* Report Metadata */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h4 className="font-medium text-sm text-muted-foreground">Jobsite</h4>
                <p className="font-medium">{report.jobsites?.name || 'Unknown Jobsite'}</p>
                {report.jobsites?.address && (
                  <p className="text-sm text-muted-foreground">{report.jobsites.address}</p>
                )}
              </div>
              <div>
                <h4 className="font-medium text-sm text-muted-foreground">Submitted By</h4>
                <p className="font-medium">
                  {report.user_profiles 
                    ? `${report.user_profiles.first_name} ${report.user_profiles.last_name}`
                    : 'Unknown User'
                  }
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <h4 className="font-medium text-sm text-muted-foreground">Report Date</h4>
                <p className="font-medium">{format(new Date(report.report_date), 'PPPP')}</p>
              </div>
              <div>
                <h4 className="font-medium text-sm text-muted-foreground">Submitted Time</h4>
                <p className="font-medium">{format(new Date(report.created_at), 'h:mm a')}</p>
              </div>
            </div>

            <Separator />

            {/* Summary */}
            <div>
              <h4 className="font-medium text-sm text-muted-foreground mb-2">Summary</h4>
              <div className="bg-muted/50 rounded-lg p-4">
                <p className="whitespace-pre-wrap">{report.summary}</p>
              </div>
            </div>

            {/* Photos */}
            {report.photos && report.photos.length > 0 && (
              <>
                <Separator />
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <h4 className="font-medium text-sm text-muted-foreground">Photos</h4>
                    <Badge variant="secondary">{report.photos.length} photos</Badge>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    {report.photos.map((photoUrl, index) => (
                      <div key={index} className="relative group">
                        <div className="aspect-square rounded-lg overflow-hidden border bg-muted">
                          <img
                            src={photoUrl}
                            alt={`Report photo ${index + 1}`}
                            className="w-full h-full object-cover"
                            loading="lazy"
                          />
                        </div>
                        <Button
                          variant="secondary"
                          size="sm"
                          className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6 p-0"
                          onClick={() => setSelectedImage(photoUrl)}
                          title="View full size"
                        >
                          <ZoomIn className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Full Size Image Modal */}
      {selectedImage && (
        <Dialog open={!!selectedImage} onOpenChange={() => setSelectedImage(null)}>
          <DialogContent className="sm:max-w-4xl">
            <DialogHeader>
              <div className="flex items-center justify-between">
                <DialogTitle>Photo View</DialogTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedImage(null)}
                  className="h-6 w-6 p-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </DialogHeader>
            <div className="flex justify-center">
              <img
                src={selectedImage}
                alt="Full size report photo"
                className="max-w-full max-h-[70vh] object-contain rounded-lg"
              />
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
};

export default DailyReportDetailsModal;