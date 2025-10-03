import React, { useState } from 'react';
import { ChevronDown, ChevronUp, AlertTriangle, Clock, Briefcase, Calendar } from 'lucide-react';
import EmployeeAvatar from '@/components/ui/employee-avatar';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { EmployeeSummary } from '@/hooks/useTimeSummaryData';
import { useTimeSummaryDetails } from '@/hooks/useTimeSummaryDetails';
import { cn } from '@/lib/utils';
import { RoleBadge } from './RoleBadge';

interface EmployeeTimeSummaryRowProps {
  employee: EmployeeSummary;
  jobsiteId: string;
  startDate: Date;
  endDate: Date;
}

export const EmployeeTimeSummaryRow: React.FC<EmployeeTimeSummaryRowProps> = ({ 
  employee,
  jobsiteId,
  startDate,
  endDate 
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  
  // Fetch daily details when row is expanded
  const { data: dailyPunches, isLoading } = useTimeSummaryDetails({
    employeeId: employee.employee_id,
    jobsiteId,
    startDate,
    endDate,
    enabled: isExpanded,
  });

  // Get first and last name for avatar
  const nameParts = employee.employee_name.split(' ');
  const firstName = nameParts[0] || '';
  const lastName = nameParts[nameParts.length - 1] || '';

  // Determine subtitle
  const subtitle = [
    employee.employee_position || employee.employee_trade || employee.employee_role,
    `${employee.total_punches} ${employee.total_punches === 1 ? 'punch' : 'punches'}`
  ].filter(Boolean).join(' · ');

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
            size="md"
          />
        </div>

        {/* Main Content */}
        <div className="flex-1 min-w-0 flex items-center justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <h3 className="text-sm font-semibold text-foreground truncate">
                {employee.employee_name}
              </h3>
              <RoleBadge 
                role={employee.employee_role}
                position={employee.employee_position}
                trade={employee.employee_trade}
              />
            </div>
            {subtitle && (
              <p className="text-xs text-muted-foreground truncate">
                {subtitle}
              </p>
            )}
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
        <div className="mt-2 px-4 py-4 bg-muted/30 border-t rounded-b-lg">
          <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
            <Calendar className="h-4 w-4" />
            DAILY BREAKDOWN
          </div>

          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">
              Loading details...
            </div>
          ) : !dailyPunches || dailyPunches.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No punch records found
            </div>
          ) : (
            <div className="space-y-2">
              {/* Table Header */}
              <div className="grid grid-cols-[120px_1fr_100px_100px_100px] gap-3 px-3 py-2 bg-background/50 rounded-md text-xs font-medium text-muted-foreground border">
                <div>Date</div>
                <div>Project</div>
                <div>Time In</div>
                <div>Time Out</div>
                <div className="text-right">Hours</div>
              </div>

              {/* Table Rows */}
              {dailyPunches.map((punch, index) => (
                <div key={index} className="space-y-2">
                  <div className="grid grid-cols-[120px_1fr_100px_100px_100px] gap-3 px-3 py-3 bg-background rounded-md border hover:bg-accent/50 transition-colors">
                    <div className="text-sm font-medium">
                      {format(new Date(punch.date), "MMM dd, yyyy")}
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Briefcase className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="truncate">{punch.jobsite_name}</span>
                    </div>
                    <div className="text-sm flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5 text-green-600" />
                      {punch.check_in_time || "—"}
                    </div>
                    <div className="text-sm flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5 text-red-600" />
                      {punch.check_out_time ? (
                        punch.check_out_time
                      ) : punch.status === "active" ? (
                        <Badge variant="secondary" className="text-xs">
                          Active
                        </Badge>
                      ) : (
                        "—"
                      )}
                    </div>
                    <div className="text-sm font-semibold text-right">
                      {punch.hours_worked.toFixed(2)} hrs
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
