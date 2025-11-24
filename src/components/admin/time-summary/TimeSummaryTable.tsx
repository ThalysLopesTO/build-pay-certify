import React from 'react';
import { Card } from '@/components/ui/card';
import { MapPin, Users } from 'lucide-react';
import { EmployeeTimeSummaryRow } from './EmployeeTimeSummaryRow';
import { JobsiteSummary } from '@/hooks/useTimeSummaryData';
import { RuleBasedTimeSummaryNote } from './RuleBasedTimeSummaryNote';

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

  // Calculate grand totals
  const grandTotalHours = data.reduce((sum, jobsite) => {
    return sum + jobsite.employees.reduce((empSum, emp) => empSum + emp.total_hours, 0);
  }, 0);

  const grandTotalEmployees = data.reduce((sum, jobsite) => sum + jobsite.employees.length, 0);

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4">
        <Card className="overflow-hidden shadow-md hover:shadow-lg transition-shadow duration-200">
          <div className="bg-gradient-to-br from-blue-500/10 via-blue-500/5 to-transparent p-4 md:p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 rounded-lg bg-blue-500/10">
                <MapPin className="h-5 w-5 text-blue-600" />
              </div>
              <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Jobsites</div>
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
              <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Employees</div>
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
              <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Total Hours</div>
            </div>
            <p className="text-3xl md:text-4xl font-bold text-foreground">{grandTotalHours.toFixed(2)}</p>
            <div className="flex items-center justify-between mt-1">
              <p className="text-xs text-muted-foreground">Hours worked</p>
            </div>
            <div className="mt-2">
              <RuleBasedTimeSummaryNote />
            </div>
          </div>
        </Card>
      </div>

      {/* Jobsite Groups */}
      {data.map((jobsite) => {
        const jobsiteTotalHours = jobsite.employees.reduce((sum, emp) => sum + emp.total_hours, 0);

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
                <div className="flex items-center gap-2 md:text-right">
                  <div className="p-2 rounded-lg bg-primary/10 md:hidden">
                    <MapPin className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">Jobsite Total</p>
                    <p className="text-2xl md:text-3xl font-bold text-primary mt-0.5">{jobsiteTotalHours.toFixed(2)} <span className="text-sm font-normal text-muted-foreground">hrs</span></p>
                  </div>
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
