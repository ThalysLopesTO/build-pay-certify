import React, { useState } from 'react';
import { ChevronDown, ChevronUp, AlertTriangle, MapPin, Clock } from 'lucide-react';
import EmployeeAvatar from '@/components/ui/employee-avatar';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { EmployeeSummary } from '@/hooks/useTimeSummaryData';
import { cn } from '@/lib/utils';

interface EmployeeTimeSummaryRowProps {
  employee: EmployeeSummary;
}

export const EmployeeTimeSummaryRow: React.FC<EmployeeTimeSummaryRowProps> = ({ employee }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  // Get first and last name for avatar
  const nameParts = employee.employee_name.split(' ');
  const firstName = nameParts[0] || '';
  const lastName = nameParts[1] || '';

  return (
    <div className="mb-2">
      {/* Main Row - Matching Live Punch Monitor Style */}
      <div
        className="flex items-center gap-3 p-2 bg-gradient-to-r from-card to-card/50 rounded-lg border border-border shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        {/* Avatar */}
        <div className="flex-shrink-0">
          <EmployeeAvatar
            photoUrl={employee.employee_photo}
            firstName={firstName}
            lastName={lastName}
            size="sm"
          />
        </div>

        {/* Main Content */}
        <div className="flex-1 min-w-0 flex items-center justify-between">
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold text-foreground truncate">
              {employee.employee_name}
            </h3>
            <p className="text-xs text-muted-foreground truncate">
              {employee.total_punches} {employee.total_punches === 1 ? 'punch' : 'punches'}
            </p>
          </div>

          {/* Right Side: Hours and Issues Badge */}
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-foreground">
              {employee.total_hours.toFixed(2)} hrs
            </span>
            
            {employee.has_flags && (
              <Badge variant="destructive" className="flex items-center gap-1">
                <AlertTriangle className="h-3 w-3" />
                Issues
              </Badge>
            )}

            {/* Expand Icon */}
            <div className="flex-shrink-0 ml-1">
              {isExpanded ? (
                <ChevronUp className="h-4 w-4 text-muted-foreground" />
              ) : (
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Expanded Daily Breakdown */}
      {isExpanded && (
        <div className="mt-2 ml-11 border-l-2 border-border pl-4 space-y-2">
          <h4 className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">
            Daily Breakdown
          </h4>
          <div className="space-y-2">
            {employee.daily_punches.map((punch) => (
              <div
                key={punch.id}
                className="flex items-center justify-between p-2 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-3 flex-1">
                  {/* Date */}
                  <div className="min-w-[90px]">
                    <p className="font-medium text-xs">
                      {punch.date ? format(new Date(punch.date), 'MMM dd, yyyy') : 'N/A'}
                    </p>
                  </div>

                  {/* Time In/Out */}
                  <div className="flex items-center gap-2 flex-1">
                    <div className="flex items-center gap-1 text-xs">
                      <Clock className="h-3 w-3 text-green-600" />
                      <span className="text-muted-foreground">In:</span>
                      <span className="font-medium">
                        {punch.check_in_time ? format(new Date(punch.check_in_time), 'HH:mm') : '--:--'}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 text-xs">
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
                      'text-xs',
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
                <div className="text-right ml-3 min-w-[60px]">
                  <p className="text-sm font-bold text-foreground">
                    {punch.hours_worked.toFixed(2)}h
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Notes Section */}
          {employee.daily_punches.some(p => p.notes) && (
            <div className="mt-3 pt-3 border-t border-border">
              <h5 className="text-xs font-semibold text-muted-foreground mb-2">Notes</h5>
              <div className="space-y-1">
                {employee.daily_punches
                  .filter(p => p.notes)
                  .map((punch) => (
                    <div key={punch.id} className="text-xs">
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
      )}
    </div>
  );
};
