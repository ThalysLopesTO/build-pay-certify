import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { format } from 'date-fns';
import { 
  Clock, 
  DollarSign, 
  MapPin, 
  ChevronDown, 
  Receipt,
  User,
  Calendar,
  TrendingUp
} from 'lucide-react';
import { formatCurrency, formatTaxBreakdown } from '@/utils/formatters';
import { useIsMobile } from '@/hooks/use-mobile';
import { TimesheetHistoryEntry } from '@/hooks/useMyTimesheetHistory';

interface TimesheetCollapsibleItemProps {
  timesheet: TimesheetHistoryEntry;
}

const TimesheetCollapsibleItem: React.FC<TimesheetCollapsibleItemProps> = ({ timesheet }) => {
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

  const formatDateRange = (startDate: string, endDate: string) => {
    // Parse as local date to avoid timezone issues
    const startParts = startDate.split('-');
    const start = new Date(
      parseInt(startParts[0]), 
      parseInt(startParts[1]) - 1, 
      parseInt(startParts[2])
    );
    
    const endParts = endDate.split('-');
    const end = new Date(
      parseInt(endParts[0]), 
      parseInt(endParts[1]) - 1, 
      parseInt(endParts[2])
    );
    
    return isMobile 
      ? `${format(start, 'MMM dd')} - ${format(end, 'MMM dd')}`
      : `${format(start, 'MMM dd')} - ${format(end, 'MMM dd, yyyy')}`;
  };

  const isSubcontractor = timesheet.worker_type === 'subcontractor';
  const taxBreakdown = timesheet.calculated_tax && timesheet.calculated_tax > 0 
    ? formatTaxBreakdown(
        timesheet.gross_pay, 
        timesheet.net_pay || timesheet.gross_pay, 
        timesheet.calculated_tax,
        isSubcontractor,
        timesheet.tax_included
      )
    : null;

  return (
    <Collapsible className="border rounded-lg bg-card">
      <CollapsibleTrigger className="w-full p-4 hover:bg-muted/50 transition-colors">
        <div className="flex items-center justify-between">
          <div className="flex-1 text-left">
            <div className="flex items-center gap-3 mb-2">
              <h3 className="font-semibold text-lg">
                {formatDateRange(timesheet.week_start_date, timesheet.week_end_date)}
              </h3>
              <Badge 
                variant={getStatusVariant(timesheet.status)} 
                className="capitalize"
              >
                {timesheet.status}
              </Badge>
            </div>
            
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                <span>{timesheet.jobsite_name}</span>
              </div>
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                <span>{timesheet.total_hours.toFixed(1)}h</span>
              </div>
              <div className="flex items-center gap-1">
                <DollarSign className="h-3 w-3" />
                <span>
                  {isSubcontractor && timesheet.tax_included 
                    ? formatCurrency(timesheet.net_pay || timesheet.gross_pay)
                    : formatCurrency(timesheet.gross_pay)
                  }
                </span>
              </div>
            </div>
          </div>
          
          <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform duration-200 group-data-[state=open]:rotate-180" />
        </div>
      </CollapsibleTrigger>

      <CollapsibleContent className="border-t bg-muted/20">
        <div className="p-4 space-y-4">
          {/* Detailed Stats Grid */}
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
                  {isSubcontractor && timesheet.tax_included ? 'Total Pay' : 'Gross Pay'}
                </p>
                <p className="font-semibold">
                  {isSubcontractor && timesheet.tax_included 
                    ? formatCurrency(timesheet.net_pay || timesheet.gross_pay)
                    : formatCurrency(timesheet.gross_pay)
                  }
                </p>
                {isSubcontractor && timesheet.tax_included && (
                  <p className="text-xs text-muted-foreground">incl. HST</p>
                )}
              </div>
            </div>
            
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
                <p className="text-xs text-muted-foreground">Worker Type</p>
                <p className="font-semibold capitalize">{timesheet.worker_type}</p>
              </div>
            </div>
          </div>

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
                  <span className="text-muted-foreground">
                    HST ({taxBreakdown.taxPercentage}%): 
                  </span>
                  <span className={`font-medium ${taxBreakdown.isAddition ? 'text-green-600' : 'text-red-600'}`}>
                    {taxBreakdown.isAddition ? '+' : '-'}{taxBreakdown.tax}
                  </span>
                </div>
                <div className="col-span-2 pt-2 border-t">
                  <span className="text-muted-foreground">{taxBreakdown.netLabel}: </span>
                  <span className="font-semibold text-green-600">{taxBreakdown.net}</span>
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
      </CollapsibleContent>
    </Collapsible>
  );
};

export default TimesheetCollapsibleItem;