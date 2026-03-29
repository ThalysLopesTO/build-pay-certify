import React, { useState, useCallback, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, Users, Clock, AlertCircle, CheckCircle } from 'lucide-react';
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

  // Count unique employees across all jobsites
  const uniqueEmployeeIds = new Set<string>();
  data.forEach(jobsite => {
    jobsite.employees.forEach(emp => uniqueEmployeeIds.add(emp.employee_id));
  });
  const grandTotalEmployees = uniqueEmployeeIds.size;

  // Calculate grand totals directly from pre-calculated data (single source of truth)
  let grandTotalPaidHours = 0;
  let grandTotalRawHours = 0;
  let grandTotalIssues = 0;

  data.forEach(jobsite => {
    jobsite.employees.forEach(emp => {
      grandTotalPaidHours += safeNumber((emp as any).total_paid_hours !== undefined ? (emp as any).total_paid_hours : emp.total_hours);
      grandTotalRawHours += safeNumber((emp as any).total_raw_hours !== undefined ? (emp as any).total_raw_hours : emp.total_hours);
      grandTotalIssues += safeNumber((emp as any).issue_count);
    });
  });

  return (
    <div className="space-y-5 md:space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        {/* Locations Card */}
        <Card className="overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 border-border/50 group">
          <div className="relative bg-gradient-to-br from-blue-500/5 via-transparent to-blue-500/5 p-5 md:p-6">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-3xl -z-10 group-hover:bg-blue-500/10 transition-colors" />
            <div className="flex items-start justify-between mb-4">
              <div className="p-2.5 rounded-xl bg-gradient-to-br from-blue-500/15 to-blue-500/5 shadow-sm group-hover:scale-110 transition-transform">
                <MapPin className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
            <p className="text-4xl md:text-5xl font-bold text-foreground mb-1 group-hover:scale-105 transition-transform origin-left">{data.length}</p>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Active Locations</p>
          </div>
        </Card>

        {/* Team Card */}
        <Card className="overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 border-border/50 group">
          <div className="relative bg-gradient-to-br from-green-500/5 via-transparent to-green-500/5 p-5 md:p-6">
            <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/5 rounded-full blur-3xl -z-10 group-hover:bg-green-500/10 transition-colors" />
            <div className="flex items-start justify-between mb-4">
              <div className="p-2.5 rounded-xl bg-gradient-to-br from-green-500/15 to-green-500/5 shadow-sm group-hover:scale-110 transition-transform">
                <Users className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
            </div>
            <p className="text-4xl md:text-5xl font-bold text-foreground mb-1 group-hover:scale-105 transition-transform origin-left">{grandTotalEmployees}</p>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Team Members</p>
          </div>
        </Card>

        {/* Paid Hours Card */}
        <Card className="overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 border-border/50 group">
          <div className="relative bg-gradient-to-br from-purple-500/5 via-transparent to-purple-500/5 p-5 md:p-6">
            <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/5 rounded-full blur-3xl -z-10 group-hover:bg-purple-500/10 transition-colors" />
            <div className="flex items-start justify-between mb-4">
              <div className="p-2.5 rounded-xl bg-gradient-to-br from-purple-500/15 to-purple-500/5 shadow-sm group-hover:scale-110 transition-transform">
                <Clock className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
            <div className="flex items-baseline gap-1 mb-1">
              <p className="text-4xl md:text-5xl font-bold text-foreground group-hover:scale-105 transition-transform origin-left">
                {grandTotalPaidHours.toFixed(2)}
              </p>
              <span className="text-sm font-medium text-muted-foreground">hrs</span>
            </div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Paid Hours</p>
            {grandTotalRawHours !== grandTotalPaidHours && (
              <p className="text-xs text-muted-foreground/60 mt-2">
                Raw: {grandTotalRawHours.toFixed(2)} hrs
              </p>
            )}
            <div className="mt-3">
              <RuleBasedTimeSummaryNote />
            </div>
          </div>
        </Card>

        {/* Issues Card */}
        <Card className={cn(
          "overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 group",
          grandTotalIssues > 0 ? "border-red-500/30" : "border-green-500/30"
        )}>
          <div className={cn(
            "relative p-5 md:p-6",
            grandTotalIssues > 0 
              ? "bg-gradient-to-br from-red-500/5 via-transparent to-red-500/5" 
              : "bg-gradient-to-br from-green-500/5 via-transparent to-green-500/5"
          )}>
            <div className={cn(
              "absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl -z-10 transition-colors",
              grandTotalIssues > 0 ? "bg-red-500/5 group-hover:bg-red-500/10" : "bg-green-500/5 group-hover:bg-green-500/10"
            )} />
            <div className="flex items-start justify-between mb-4">
              <div className={cn(
                "p-2.5 rounded-xl shadow-sm group-hover:scale-110 transition-transform",
                grandTotalIssues > 0 ? "bg-gradient-to-br from-red-500/15 to-red-500/5" : "bg-gradient-to-br from-green-500/15 to-green-500/5"
              )}>
                {grandTotalIssues > 0 ? (
                  <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
                ) : (
                  <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
                )}
              </div>
            </div>
            <p className={cn(
              "text-4xl md:text-5xl font-bold mb-1 group-hover:scale-105 transition-transform origin-left",
              grandTotalIssues > 0 ? "text-red-600 dark:text-red-400" : "text-green-600 dark:text-green-400"
            )}>{grandTotalIssues}</p>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              {grandTotalIssues > 0 ? 'Needs Review' : 'All Clear'}
            </p>
          </div>
        </Card>
      </div>

      {/* Jobsite Groups */}
      {data.map((jobsite) => {
        let jobsiteTotalPaidHours = 0;
        let jobsiteTotalRawHours = 0;
        let jobsiteIssueCount = 0;

        jobsite.employees.forEach(emp => {
          jobsiteTotalPaidHours += safeNumber((emp as any).total_paid_hours !== undefined ? (emp as any).total_paid_hours : emp.total_hours);
          jobsiteTotalRawHours += safeNumber((emp as any).total_raw_hours !== undefined ? (emp as any).total_raw_hours : emp.total_hours);
          jobsiteIssueCount += safeNumber((emp as any).issue_count);
        });

        return (
          <Card key={jobsite.jobsite_id} className="overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 border-border/50">
            {/* Jobsite Header */}
            <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-5 md:p-6 border-b">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 shadow-sm">
                    <MapPin className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-xl md:text-2xl font-bold text-foreground">{jobsite.jobsite_name}</h3>
                    <p className="text-sm text-muted-foreground flex items-center gap-1.5 mt-1">
                      <Users className="h-4 w-4" />
                      {jobsite.employees.length} {jobsite.employees.length === 1 ? 'employee' : 'employees'}
                    </p>
                  </div>
                </div>
                <div className="flex flex-col md:items-end gap-2.5">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Total Paid Hours</p>
                    <div className="flex items-baseline gap-1.5">
                      <p className="text-3xl md:text-4xl font-bold text-primary">
                        {jobsiteTotalPaidHours.toFixed(2)}
                      </p>
                      <span className="text-sm font-medium text-muted-foreground">hrs</span>
                    </div>
                    {jobsiteTotalRawHours !== jobsiteTotalPaidHours && (
                      <p className="text-xs text-muted-foreground/60 mt-1.5">
                        Raw: {jobsiteTotalRawHours.toFixed(2)} hrs
                      </p>
                    )}
                  </div>
                  {jobsiteIssueCount > 0 ? (
                    <Badge variant="secondary" className="bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900/20 dark:text-orange-400 dark:border-orange-800 px-3 py-1">
                      <AlertCircle className="h-3 w-3 mr-1" />
                      {jobsiteIssueCount} {jobsiteIssueCount === 1 ? 'issue' : 'issues'}
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="bg-green-100 text-green-800 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800 px-3 py-1">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      All clear
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            {/* Employee Rows */}
            <div className="p-4 md:p-5 space-y-2">
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
