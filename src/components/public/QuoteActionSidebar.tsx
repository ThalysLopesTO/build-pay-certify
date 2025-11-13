import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, CheckCircle2, MessageCircle, Mail, Phone, XCircle } from 'lucide-react';
import { format } from 'date-fns';

interface QuoteActionSidebarProps {
  publicStatus?: 'awaiting_response' | 'changes_requested' | 'approved' | 'declined';
  clientApprovedAt?: string;
  clientDeclinedAt?: string;
  onApprove: () => void;
  onRequestChanges: () => void;
  onDecline: () => void;
  onDownloadPDF: () => void;
  isProcessing: boolean;
  companyName: string;
  companyEmail?: string;
  companyPhone?: string;
}

export const QuoteActionSidebar: React.FC<QuoteActionSidebarProps> = ({
  publicStatus,
  clientApprovedAt,
  clientDeclinedAt,
  onApprove,
  onRequestChanges,
  onDecline,
  onDownloadPDF,
  isProcessing,
  companyName,
  companyEmail,
  companyPhone,
}) => {
  return (
    <div className="space-y-6">
      {/* Actions Card */}
      <Card className="border-2 border-primary/20 shadow-lg">
        <CardHeader>
          <CardTitle className="text-xl">Quote Actions</CardTitle>
          <CardDescription>
            {publicStatus === 'approved' && (
              <div className="flex items-center gap-2 text-green-600">
                <CheckCircle2 className="h-5 w-5" />
                <span>
                  Approved on {clientApprovedAt && format(new Date(clientApprovedAt), 'MMM dd, yyyy')}
                </span>
              </div>
            )}
            {publicStatus === 'changes_requested' && (
              <div className="flex items-center gap-2 text-blue-600">
                <MessageCircle className="h-5 w-5" />
                <span>Change request submitted</span>
              </div>
            )}
            {publicStatus === 'declined' && (
              <div className="flex items-center gap-2 text-destructive">
                <XCircle className="h-5 w-5" />
                <span>
                  Declined on {clientDeclinedAt && format(new Date(clientDeclinedAt), 'MMM dd, yyyy')}
                </span>
              </div>
            )}
            {(!publicStatus || publicStatus === 'awaiting_response') && (
              <span>Review and take action</span>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {(!publicStatus || publicStatus === 'awaiting_response') && (
            <>
              <Button
                onClick={onApprove}
                className="w-full bg-green-600 hover:bg-green-700"
                size="lg"
                disabled={isProcessing}
              >
                <CheckCircle2 className="mr-2 h-5 w-5" />
                Approve Quote
              </Button>
              <Button
                onClick={onRequestChanges}
                variant="outline"
                className="w-full"
                size="lg"
                disabled={isProcessing}
              >
                <MessageCircle className="mr-2 h-5 w-5" />
                Request Changes
              </Button>
              <Button
                onClick={onDecline}
                variant="destructive"
                className="w-full"
                size="lg"
                disabled={isProcessing}
              >
                <XCircle className="mr-2 h-5 w-5" />
                Decline Quote
              </Button>
            </>
          )}
          <Button
            onClick={onDownloadPDF}
            variant="secondary"
            className="w-full"
            size="lg"
          >
            <Download className="mr-2 h-5 w-5" />
            Download PDF
          </Button>
        </CardContent>
      </Card>

      {/* Company Contact Card */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-base">Questions?</CardTitle>
          <CardDescription className="text-sm">Contact {companyName}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {companyEmail && (
            <a
              href={`mailto:${companyEmail}`}
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
            >
              <Mail className="h-4 w-4" />
              <span>{companyEmail}</span>
            </a>
          )}
          {companyPhone && (
            <a
              href={`tel:${companyPhone}`}
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
            >
              <Phone className="h-4 w-4" />
              <span>{companyPhone}</span>
            </a>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
