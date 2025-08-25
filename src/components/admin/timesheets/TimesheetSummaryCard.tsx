import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatRange } from '@/lib/time/periods';
import { AlertTriangle, CheckCircle } from 'lucide-react';

interface TimesheetSummaryCardProps {
  periodStart: Date;
  periodEnd: Date;
  totalHours: number;
  calculatedHours: number;
  grossPay: number;
  totalPay: number;
  hasDiscrepancy: boolean;
  dateFixed?: boolean;
}

export const TimesheetSummaryCard: React.FC<TimesheetSummaryCardProps> = ({
  periodStart,
  periodEnd,
  totalHours,
  calculatedHours,
  grossPay,
  totalPay,
  hasDiscrepancy,
  dateFixed
}) => {
  return (
    <Card className="mb-6 bg-gradient-to-r from-background to-muted/50 border-2">
      <CardContent className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Period Info */}
          <div className="space-y-2">
            <h3 className="text-lg font-semibold text-primary">Pay Period</h3>
            <p className="text-xl font-bold">{formatRange(periodStart, periodEnd)}</p>
            {dateFixed && (
              <div className="flex items-center gap-2 text-sm text-green-600">
                <CheckCircle className="h-4 w-4" />
                <span>Period dates corrected</span>
              </div>
            )}
          </div>

          {/* Hours Summary */}
          <div className="space-y-2">
            <h3 className="text-lg font-semibold text-primary">Total Hours</h3>
            <div className="flex items-center gap-3">
              <span className="text-2xl font-bold">{totalHours}h</span>
              {hasDiscrepancy && (
                <Badge variant="destructive" className="flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" />
                  Mismatch: {calculatedHours}h
                </Badge>
              )}
            </div>
          </div>

          {/* Pay Summary */}
          <div className="space-y-2">
            <h3 className="text-lg font-semibold text-primary">Total Pay</h3>
            <div className="space-y-1">
              <p className="text-xl font-bold text-green-600">${totalPay.toFixed(2)}</p>
              <p className="text-sm text-muted-foreground">
                Gross: ${grossPay.toFixed(2)}
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};