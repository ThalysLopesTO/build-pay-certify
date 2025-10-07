import React from 'react';
import { Card } from '@/components/ui/card';
import { MapPin, Users } from 'lucide-react';
import { EmployeeTimeSummaryRow } from './EmployeeTimeSummaryRow';
import { JobsiteSummary } from '@/hooks/useTimeSummaryData';

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
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4">
          <p className="text-sm text-muted-foreground mb-1">Total Jobsites</p>
          <p className="text-3xl font-bold text-primary">{data.length}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-muted-foreground mb-1">Total Employees</p>
          <p className="text-3xl font-bold text-primary">{grandTotalEmployees}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-muted-foreground mb-1">Total Hours</p>
          <p className="text-3xl font-bold text-primary">{grandTotalHours.toFixed(2)}</p>
        </Card>
      </div>

      {/* Jobsite Groups */}
      {data.map((jobsite) => {
        const jobsiteTotalHours = jobsite.employees.reduce((sum, emp) => sum + emp.total_hours, 0);

        return (
          <Card key={jobsite.jobsite_id} className="overflow-hidden">
            {/* Jobsite Header */}
            <div className="bg-primary/5 p-4 border-b">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <MapPin className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-foreground">{jobsite.jobsite_name}</h3>
                    <p className="text-sm text-muted-foreground">
                      {jobsite.employees.length} {jobsite.employees.length === 1 ? 'employee' : 'employees'}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground mb-1">Jobsite Total</p>
                  <p className="text-2xl font-bold text-primary">{jobsiteTotalHours.toFixed(2)} hrs</p>
                </div>
              </div>
            </div>

            {/* Employee Rows */}
            <div className="p-4">
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
