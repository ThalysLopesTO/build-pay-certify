import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { 
  Clock, 
  DollarSign, 
  MapPin, 
  ChevronDown, 
  ChevronUp, 
  Receipt,
  User,
  Calendar,
  TrendingUp
} from 'lucide-react';
import { formatCurrency, formatTaxBreakdown } from '@/utils/formatters';
import { useIsMobile } from '@/hooks/use-mobile';
import { TimesheetHistoryEntry } from '@/hooks/useMyTimesheetHistory';

interface TimesheetCardProps {
  timesheet: TimesheetHistoryEntry;
}

const TimesheetCard: React.FC<TimesheetCardProps> = ({ timesheet }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const isMobile = useIsMobile();

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'approved':
        return 'default';
      case 'pending':
        return 'secondary';
      case 'rejected':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'text-green-600';
      case 'pending':
        return 'text-amber-600';
      case 'rejected':
        return 'text-red-600';
      default:
        return 'text-muted-foreground';
    }
  };

  const formatDateRange = (startDate: string, endDate: string) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    return isMobile 
      ? `${format(start, 'MMM dd')} - ${format(end, 'MMM dd')}`
      : `${format(start, 'MMM dd')} - ${format(end, 'MMM dd, yyyy')}`;
  };

  const taxBreakdown = timesheet.calculated_tax && timesheet.calculated_tax > 0 
    ? formatTaxBreakdown(timesheet.gross_pay, timesheet.net_pay || timesheet.gross_pay, timesheet.calculated_tax)
    : null;

  return (
    <Card className={`timesheet-card border-l-4 border-l-primary/20 ${isMobile ? 'mobile-card' : ''}`}>
      <CardHeader className={`${isMobile ? 'mobile-spacing pb-2' : 'pb-3'}`}>
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <CardTitle className={`${isMobile ? 'text-lg' : 'text-xl'} font-semibold`}>
              {formatDateRange(timesheet.week_start_date, timesheet.week_end_date)}
            </CardTitle>
            <div className="flex items-center mt-1 text-sm text-muted-foreground">
              <MapPin className="h-3 w-3 mr-1" />
              {timesheet.jobsite_name}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge 
              variant={getStatusVariant(timesheet.status)} 
              className={`capitalize status-${timesheet.status}`}
            >
              {timesheet.status}
            </Badge>
            {isMobile && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsExpanded(!isExpanded)}
                className="h-8 w-8 p-0 touch-target"
              >
                {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className={`${isMobile ? 'mobile-spacing pt-0' : 'pt-0'}`}>
        {/* Primary Stats - Always Visible */}
        <div className={`grid ${isMobile ? 'grid-cols-2' : 'grid-cols-4'} gap-4`}>
          <div className="flex items-center space-x-2">
            <Clock className="h-4 w-4 text-primary" />
            <div>
              <p className="text-xs text-muted-foreground">Total Hours</p>
              <p className="font-semibold">{timesheet.total_hours.toFixed(1)}h</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <DollarSign className="h-4 w-4 text-primary" />
            <div>
              <p className="text-xs text-muted-foreground">
                {timesheet.tax_included ? 'Gross Pay' : 'Pay'}
              </p>
              <p className="font-semibold">{formatCurrency(timesheet.gross_pay)}</p>
              {timesheet.tax_included && (
                <p className="text-xs text-muted-foreground">incl. taxes</p>
              )}
            </div>
          </div>
          
          {!isMobile && (
            <>
              <div>
                <p className="text-xs text-muted-foreground">Hourly Rate</p>
                <p className="font-semibold">{formatCurrency(timesheet.hourly_rate)}</p>
              </div>
              
              <div>
                <p className="text-xs text-muted-foreground">Worker Type</p>
                <p className="font-semibold capitalize">{timesheet.worker_type}</p>
              </div>
            </>
          )}
        </div>

        {/* Expandable Content for Mobile or Always Visible for Desktop */}
        {(!isMobile || isExpanded) && (
          <div className="mt-4 space-y-4" style={{ animation: 'slide-in-from-top 0.2s ease-out' }}>
            {/* Tax Breakdown */}
            {taxBreakdown && (
              <div className="p-3 bg-muted/50 rounded-lg border">
                <div className="flex items-center gap-2 mb-2">
                  <Receipt className="h-4 w-4 text-primary" />
                  <p className="text-sm font-medium">Tax Breakdown</p>
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-muted-foreground">Gross Pay: </span>
                    <span className="font-medium">{taxBreakdown.gross}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Tax ({taxBreakdown.taxPercentage}%): </span>
                    <span className="font-medium text-red-600">-{taxBreakdown.tax}</span>
                  </div>
                  <div className="col-span-2 pt-2 border-t">
                    <span className="text-muted-foreground">Net Pay: </span>
                    <span className="font-semibold text-green-600">{taxBreakdown.net}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Mobile Additional Details */}
            {isMobile && (
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center space-x-2">
                  <TrendingUp className="h-4 w-4 text-primary" />
                  <div>
                    <p className="text-xs text-muted-foreground">Hourly Rate</p>
                    <p className="font-semibold">{formatCurrency(timesheet.hourly_rate)}</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <User className="h-4 w-4 text-primary" />
                  <div>
                    <p className="text-xs text-muted-foreground">Type</p>
                    <p className="font-semibold capitalize">{timesheet.worker_type}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Bi-Weekly Breakdown */}
            {timesheet.biWeeklyData && (
              <div className="p-3 bg-accent/50 rounded-lg border">
                <div className="flex items-center gap-2 mb-2">
                  <Calendar className="h-4 w-4 text-primary" />
                  <p className="text-sm font-medium">Bi-Weekly Breakdown</p>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Week 1: </span>
                    <span className="font-medium">
                      {(timesheet.biWeeklyData.week1?.totalHours || 0).toFixed(1)}h
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Week 2: </span>
                    <span className="font-medium">
                      {(timesheet.biWeeklyData.week2?.totalHours || 0).toFixed(1)}h
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Timestamps */}
            <div className="flex justify-between items-center pt-3 border-t text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <span>Submitted:</span>
                <span>{format(new Date(timesheet.created_at), isMobile ? 'MMM dd' : 'PPP')}</span>
              </div>
              {timesheet.updated_at && timesheet.updated_at !== timesheet.created_at && (
                <div className="flex items-center gap-1">
                  <span>Updated:</span>
                  <span>{format(new Date(timesheet.updated_at), isMobile ? 'MMM dd' : 'PPP')}</span>
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default TimesheetCard;