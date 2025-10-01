import React, { useState } from 'react';
import { ChevronDown, ChevronRight, AlertTriangle, MapPin, Clock } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { EmployeeSummary } from '@/hooks/useTimeSummaryData';
import { cn } from '@/lib/utils';

interface EmployeeTimeSummaryRowProps {
  employee: EmployeeSummary;
}

export const EmployeeTimeSummaryRow: React.FC<EmployeeTimeSummaryRowProps> = ({ employee }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const getInitials = (name: string) => {
    const parts = name.split(' ');
    return parts.map(p => p[0]).join('').toUpperCase();
  };

  return (
    <div className="border rounded-lg overflow-hidden mb-2">
      {/* Header Row - Always Visible */}
      <div
        className={cn(
          "flex items-center justify-between p-4 cursor-pointer hover:bg-muted/50 transition-colors",
          isExpanded && "bg-muted/30"
        )}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-4 flex-1">
          {/* Expand/Collapse Icon */}
          <button className="text-muted-foreground hover:text-foreground">
            {isExpanded ? (
              <ChevronDown className="h-5 w-5" />
            ) : (
              <ChevronRight className="h-5 w-5" />
            )}
          </button>

          {/* Employee Avatar & Name */}
          <Avatar className="h-10 w-10">
            <AvatarImage src={employee.employee_photo || undefined} />
            <AvatarFallback className="bg-primary/10 text-primary">
              {getInitials(employee.employee_name)}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="font-semibold text-foreground">{employee.employee_name}</p>
            <p className="text-sm text-muted-foreground">
              {employee.total_punches} {employee.total_punches === 1 ? 'punch' : 'punches'}
            </p>
          </div>

          {/* Flags */}
          {employee.has_flags && (
            <Badge variant="destructive" className="ml-auto">
              <AlertTriangle className="h-3 w-3 mr-1" />
              Issues
            </Badge>
          )}
        </div>

        {/* Total Hours */}
        <div className="text-right ml-4">
          <p className="text-2xl font-bold text-primary">{employee.total_hours.toFixed(2)}</p>
          <p className="text-sm text-muted-foreground">hours</p>
        </div>
      </div>

      {/* Expanded Daily Breakdown */}
      {isExpanded && (
        <div className="border-t bg-background">
          <div className="p-4">
            <h4 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wide">
              Daily Breakdown
            </h4>
            <div className="space-y-2">
              {employee.daily_punches.map((punch) => (
                <div
                  key={punch.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                >
                  <div className="flex items-center gap-4 flex-1">
                    {/* Date */}
                    <div className="min-w-[100px]">
                      <p className="font-medium text-sm">
                        {punch.date ? format(new Date(punch.date), 'MMM dd, yyyy') : 'N/A'}
                      </p>
                    </div>

                    {/* Time In/Out */}
                    <div className="flex items-center gap-3 flex-1">
                      <div className="flex items-center gap-1 text-sm">
                        <Clock className="h-3 w-3 text-green-600" />
                        <span className="text-muted-foreground">In:</span>
                        <span className="font-medium">
                          {punch.check_in_time ? format(new Date(punch.check_in_time), 'HH:mm') : '--:--'}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 text-sm">
                        <Clock className="h-3 w-3 text-red-600" />
                        <span className="text-muted-foreground">Out:</span>
                        <span className="font-medium">
                          {punch.check_out_time ? format(new Date(punch.check_out_time), 'HH:mm') : '--:--'}
                        </span>
                      </div>
                    </div>

                    {/* Status Badge */}
                    <Badge
                      variant={punch.status === 'complete' ? 'default' : 'secondary'}
                      className={cn(
                        punch.status === 'active' && 'bg-green-100 text-green-800 hover:bg-green-200'
                      )}
                    >
                      {punch.status === 'active' ? 'Live' : 'Complete'}
                    </Badge>

                    {/* Location Info */}
                    {(punch.check_in_location || punch.location_distance) && (
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <MapPin className="h-3 w-3" />
                        {punch.location_distance && (
                          <span>{punch.location_distance.toFixed(0)}m</span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Hours */}
                  <div className="text-right ml-4 min-w-[80px]">
                    <p className="text-lg font-bold text-primary">
                      {punch.hours_worked.toFixed(2)}h
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Notes Section */}
            {employee.daily_punches.some(p => p.notes) && (
              <div className="mt-4 pt-4 border-t">
                <h5 className="text-sm font-semibold text-muted-foreground mb-2">Notes</h5>
                <div className="space-y-2">
                  {employee.daily_punches
                    .filter(p => p.notes)
                    .map((punch) => (
                      <div key={punch.id} className="text-sm">
                        <span className="text-muted-foreground">
                          {punch.date ? format(new Date(punch.date), 'MMM dd') : 'N/A'}:
                        </span>
                        <span className="ml-2 text-foreground">{punch.notes}</span>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
