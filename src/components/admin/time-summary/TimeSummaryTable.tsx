import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, Users } from 'lucide-react';
import { EmployeeTimeSummaryRow } from './EmployeeTimeSummaryRow';
import { JobsiteSummary } from '@/hooks/useTimeSummaryData';
import { RuleBasedTimeSummaryNote } from './RuleBasedTimeSummaryNote';
import { cn } from '@/lib/utils';

interface TimeSummaryTableProps {
  data: JobsiteSummary[];
  isLoading: boolean;
  startDate: Date;
  endDate: Date;
}

export const TimeSummaryTable: React.FC<TimeSummaryTableProps> = ({ 
  data, 
  isLoading,
  startDate,
  endDate 
}) => {
  if (isLoading) {
    return (
      <Card className="p-8">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <p className="ml-3 text-muted-foreground">Loading time summary...</p>
        </div>
      </Card>
    );
  }

  if (!data || data.length === 0) {
    return (
      <Card className="p-8">
        <div className="text-center">
          <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Data Found</h3>
          <p className="text-muted-foreground">
            No timesheet data matches your current filters. Try adjusting your date range or filters.
          </p>
        </div>
      </Card>
    );
  }

  // Helper to safely get numeric value
  const safeNumber = (value: any): number => {
    if (value === undefined || value === null || isNaN(value)) return 0;
    return Number(value);
  };

  // Calculate grand totals with paid hours
  const grandTotalPaidHours = data.reduce((sum, jobsite) => {
    return sum + jobsite.employees.reduce((empSum, emp) => 
      empSum + safeNumber(emp.total_paid_hours !== undefined ? emp.total_paid_hours : emp.total_hours), 0
    );
  }, 0);

  const grandTotalRawHours = data.reduce((sum, jobsite) => {
    return sum + jobsite.employees.reduce((empSum, emp) => 
      empSum + safeNumber(emp.total_raw_hours !== undefined ? emp.total_raw_hours : emp.total_hours), 0
    );
  }, 0);

  const grandTotalEmployees = data.reduce((sum, jobsite) => sum + jobsite.employees.length, 0);
  
  const grandTotalIssues = data.reduce((sum, jobsite) => {
    return sum + jobsite.employees.reduce((empSum, emp) => 
      empSum + safeNumber(emp.issue_count), 0
    );
  }, 0);

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <Card className="overflow-hidden shadow-md hover:shadow-lg transition-shadow duration-200">
          <div className="bg-gradient-to-br from-blue-500/10 via-blue-500/5 to-transparent p-4 md:p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 rounded-lg bg-blue-500/10">
                <MapPin className="h-5 w-5 text-blue-600" />
              </div>
              <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Locations</div>
            </div>
            <p className="text-3xl md:text-4xl font-bold text-foreground">{data.length}</p>
            <p className="text-xs text-muted-foreground mt-1">Active locations</p>
          </div>
        </Card>
        <Card className="overflow-hidden shadow-md hover:shadow-lg transition-shadow duration-200">
          <div className="bg-gradient-to-br from-green-500/10 via-green-500/5 to-transparent p-4 md:p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 rounded-lg bg-green-500/10">
                <Users className="h-5 w-5 text-green-600" />
              </div>
              <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Team</div>
            </div>
            <p className="text-3xl md:text-4xl font-bold text-foreground">{grandTotalEmployees}</p>
            <p className="text-xs text-muted-foreground mt-1">Team members</p>
          </div>
        </Card>
        <Card className="overflow-hidden shadow-md hover:shadow-lg transition-shadow duration-200">
          <div className="bg-gradient-to-br from-purple-500/10 via-purple-500/5 to-transparent p-4 md:p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 rounded-lg bg-purple-500/10">
                <MapPin className="h-5 w-5 text-purple-600" />
              </div>
              <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Paid Hours</div>
            </div>
            <p className="text-3xl md:text-4xl font-bold text-foreground">{grandTotalPaidHours.toFixed(2)}</p>
            {grandTotalRawHours !== grandTotalPaidHours && (
              <p className="text-xs text-muted-foreground/70 mt-1">
                Raw: {grandTotalRawHours.toFixed(2)} hrs
              </p>
            )}
            <div className="mt-2">
              <RuleBasedTimeSummaryNote />
            </div>
          </div>
        </Card>
        <Card className={cn(
          "overflow-hidden shadow-md hover:shadow-lg transition-shadow duration-200",
          grandTotalIssues > 0 ? "border-red-200 dark:border-red-900" : ""
        )}>
          <div className={cn(
            "p-4 md:p-5",
            grandTotalIssues > 0 
              ? "bg-gradient-to-br from-red-500/10 via-red-500/5 to-transparent" 
              : "bg-gradient-to-br from-green-500/10 via-green-500/5 to-transparent"
          )}>
            <div className="flex items-center justify-between mb-3">
              <div className={cn(
                "p-2 rounded-lg",
                grandTotalIssues > 0 ? "bg-red-500/10" : "bg-green-500/10"
              )}>
                {grandTotalIssues > 0 ? (
                  <Users className="h-5 w-5 text-red-600" />
                ) : (
                  <Users className="h-5 w-5 text-green-600" />
                )}
              </div>
              <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Issues</div>
            </div>
            <p className={cn(
              "text-3xl md:text-4xl font-bold",
              grandTotalIssues > 0 ? "text-red-600" : "text-green-600"
            )}>{grandTotalIssues}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {grandTotalIssues > 0 ? 'Punches needing review' : 'All punches OK'}
            </p>
          </div>
        </Card>
      </div>

      {/* Jobsite Groups */}
      {data.map((jobsite) => {
        const jobsiteTotalPaidHours = jobsite.employees.reduce((sum, emp) => 
          sum + safeNumber(emp.total_paid_hours !== undefined ? emp.total_paid_hours : emp.total_hours), 0
        );
        
        const jobsiteTotalRawHours = jobsite.employees.reduce((sum, emp) => 
          sum + safeNumber(emp.total_raw_hours !== undefined ? emp.total_raw_hours : emp.total_hours), 0
        );
        
        const jobsiteIssueCount = jobsite.employees.reduce((sum, emp) => 
          sum + safeNumber(emp.issue_count), 0
        );

        return (
          <Card key={jobsite.jobsite_id} className="overflow-hidden shadow-md hover:shadow-lg transition-all duration-200">
            {/* Jobsite Header */}
            <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-4 md:p-5 border-b">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-primary/15 shadow-sm">
                    <MapPin className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-lg md:text-xl font-bold text-foreground">{jobsite.jobsite_name}</h3>
                    <p className="text-sm text-muted-foreground flex items-center gap-1 mt-0.5">
                      <Users className="h-3.5 w-3.5" />
                      {jobsite.employees.length} {jobsite.employees.length === 1 ? 'employee' : 'employees'}
                    </p>
                  </div>
                </div>
                <div className="flex flex-col md:items-end gap-2">
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">Jobsite Total Paid Hours</p>
                    <p className="text-2xl md:text-3xl font-bold text-primary mt-0.5">
                      {jobsiteTotalPaidHours.toFixed(2)} <span className="text-sm font-normal text-muted-foreground">hrs</span>
                    </p>
                    {jobsiteTotalRawHours !== jobsiteTotalPaidHours && (
                      <p className="text-xs text-muted-foreground/70 mt-1">
                        Raw: {jobsiteTotalRawHours.toFixed(2)} hrs
                      </p>
                    )}
                  </div>
                  {jobsiteIssueCount > 0 ? (
                    <Badge variant="secondary" className="bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900/20 dark:text-orange-400 dark:border-orange-800">
                      {jobsiteIssueCount} {jobsiteIssueCount === 1 ? 'issue' : 'issues'} to review
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="bg-green-100 text-green-800 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800">
                      All punches OK
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            {/* Employee Rows */}
            <div className="p-3 md:p-4 space-y-2">
              {jobsite.employees.map((employee) => (
                <EmployeeTimeSummaryRow 
                  key={`${employee.employee_id}-${startDate.toISOString()}-${endDate.toISOString()}`}
                  employee={employee}
                  jobsiteId={jobsite.jobsite_id}
                  startDate={startDate}
                  endDate={endDate}
                />
              ))}
            </div>
          </Card>
        );
      })}
    </div>
  );
};
