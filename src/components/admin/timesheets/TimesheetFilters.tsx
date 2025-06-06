
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Filter, X } from 'lucide-react';

interface TimesheetFiltersProps {
  filters: {
    employeeName: string;
    weekEndingDate: string;
    status: string;
  };
  onFiltersChange: (filters: any) => void;
  employees: any[];
}

const TimesheetFilters: React.FC<TimesheetFiltersProps> = ({
  filters,
  onFiltersChange,
  employees
}) => {
  const handleEmployeeChange = (value: string) => {
    onFiltersChange({
      ...filters,
      employeeName: value === 'all' ? '' : value
    });
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onFiltersChange({
      ...filters,
      weekEndingDate: e.target.value
    });
  };

  const handleStatusChange = (value: string) => {
    onFiltersChange({
      ...filters,
      status: value
    });
  };

  const clearFilters = () => {
    onFiltersChange({
      employeeName: '',
      weekEndingDate: '',
      status: 'all'
    });
  };

  const hasActiveFilters = filters.employeeName || filters.weekEndingDate || filters.status !== 'all';

  // Filter employees with valid names and create display names
  const validEmployees = employees?.filter(employee => {
    const fullName = `${employee.first_name || ''} ${employee.last_name || ''}`.trim();
    return fullName.length > 0;
  }).map(employee => ({
    ...employee,
    displayName: `${employee.first_name || ''} ${employee.last_name || ''}`.trim()
  })) || [];

  return (
    <Card className="bg-white rounded-xl shadow-sm border border-gray-200">
      <CardContent className="p-4">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-gray-500" />
            <span className="text-sm font-medium text-gray-700">Filters:</span>
          </div>
          
          <div className="flex items-center gap-2">
            <Label htmlFor="employee-filter" className="text-sm text-gray-600">Employee:</Label>
            <Select value={filters.employeeName || 'all'} onValueChange={handleEmployeeChange}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="All employees" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All employees</SelectItem>
                {validEmployees.map((employee) => (
                  <SelectItem 
                    key={employee.id} 
                    value={employee.displayName}
                  >
                    {employee.displayName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2">
            <Label htmlFor="date-filter" className="text-sm text-gray-600">Week Ending:</Label>
            <Input
              id="date-filter"
              type="date"
              value={filters.weekEndingDate}
              onChange={handleDateChange}
              className="w-48"
            />
          </div>

          <div className="flex items-center gap-2">
            <Label htmlFor="status-filter" className="text-sm text-gray-600">Status:</Label>
            <Select value={filters.status} onValueChange={handleStatusChange}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="All status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="text-gray-500 hover:text-gray-700"
            >
              <X className="h-4 w-4 mr-1" />
              Clear
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default TimesheetFilters;
