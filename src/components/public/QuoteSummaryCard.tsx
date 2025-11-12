import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Calendar, Eye } from 'lucide-react';
import { format, differenceInDays } from 'date-fns';
import QuoteStatusBadge from '@/components/admin/quotes/QuoteStatusBadge';

interface QuoteSummaryCardProps {
  total: number;
  status: 'draft' | 'sent' | 'accepted' | 'declined' | 'invoiced';
  publicStatus?: 'awaiting_response' | 'changes_requested' | 'approved' | 'declined';
  quoteNumber: string;
  expiryDate?: string;
  viewedAt?: string;
  sentDate?: string;
  createdAt: string;
}

export const QuoteSummaryCard: React.FC<QuoteSummaryCardProps> = ({
  total,
  status,
  publicStatus,
  quoteNumber,
  expiryDate,
  viewedAt,
  sentDate,
  createdAt,
}) => {
  const daysUntilExpiry = expiryDate ? differenceInDays(new Date(expiryDate), new Date()) : null;
  const isExpiringSoon = daysUntilExpiry !== null && daysUntilExpiry <= 7 && daysUntilExpiry >= 0;
  const isExpired = daysUntilExpiry !== null && daysUntilExpiry < 0;

  return (
    <Card className="shadow-lg">
      <CardHeader className="bg-muted/30">
        <CardTitle className="text-lg">Quote Summary</CardTitle>
      </CardHeader>
      <CardContent className="pt-6 space-y-4">
        {/* Total Amount */}
        <div className="text-center py-4">
          <p className="text-sm text-muted-foreground mb-1">Total Amount</p>
          <p className="text-4xl font-bold text-primary">${total.toFixed(2)}</p>
        </div>

        <Separator />

        {/* Quote Details */}
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Quote #</span>
            <span className="text-sm font-medium">{quoteNumber}</span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Status</span>
            <QuoteStatusBadge status={status} publicStatus={publicStatus} />
          </div>

          {(sentDate || createdAt) && (
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Sent On</span>
              <div className="flex items-center gap-1 text-sm">
                <Calendar className="h-3 w-3" />
                <span>
                  {sentDate 
                    ? format(new Date(sentDate), 'MMM dd, yyyy')
                    : format(new Date(createdAt), 'MMM dd, yyyy')}
                </span>
              </div>
            </div>
          )}

          {expiryDate && (
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Expires</span>
              <span 
                className={`text-sm font-medium ${
                  isExpired ? 'text-red-600' : 
                  isExpiringSoon ? 'text-amber-600' : 
                  ''
                }`}
              >
                {format(new Date(expiryDate), 'MMM dd, yyyy')}
                {isExpiringSoon && !isExpired && ` (${daysUntilExpiry} days)`}
                {isExpired && ' (Expired)'}
              </span>
            </div>
          )}

          {viewedAt && (
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">First Viewed</span>
              <div className="flex items-center gap-1 text-sm">
                <Eye className="h-3 w-3" />
                <span>{format(new Date(viewedAt), 'MMM dd, yyyy')}</span>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
