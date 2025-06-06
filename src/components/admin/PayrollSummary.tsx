
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DollarSign, Users, Search, Filter, RefreshCw } from 'lucide-react';
import { useEmployeeTimesheets } from '@/hooks/useEmployeeTimesheets';
import { useEmployeeDirectory } from '@/hooks/useEmployeeDirectory';
import { Alert, AlertDescription } from '@/components/ui/alert';

const PayrollSummary = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedWeek, setSelectedWeek] = useState('all');
  const [selectedJobSite, setSelectedJobSite] = useState('all');
  const [selectedTrade, setSelectedTrade] = useState('all');

  // Fetch actual timesheet data
  const { data: timesheets = [], isLoading, error, refetch } = useEmployeeTimesheets({});
  const { data: employees = [] } = useEmployeeDirectory();

  // Filter out rejected timesheets - only approved timesheets count toward payroll
  const approvedTimesheets = timesheets.filter(timesheet => 
    timesheet.status === 'approved'
  );

  // Transform timesheet data to match the expected format
  const timesheetEntries = approvedTimesheets.map(timesheet => {
    const employee = employees.find(emp => 
      `${emp.first_name || ''} ${emp.last_name || ''}`.trim() === timesheet.employee_name
    );

    return {
      id: timesheet.id,
      employeeName: timesheet.employee_name,
      trade: employee?.trade || 'General',
      position: employee?.position || 'Worker',
      jobSite: timesheet.jobsite_name,
      project: timesheet.jobsite_name, // Using jobsite as project for now
      totalHours: Number(timesheet.total_hours) || 0,
      hourlyRate: Number(timesheet.hourly_rate) || 0,
      grossPay: Number(timesheet.gross_pay) || 0,
      weekEnding: timesheet.week_start_date,
      additionalExpense: Number(timesheet.additional_expense) || 0
    };
  });

  const filteredEntries = timesheetEntries.filter(entry => {
    return (
      (searchTerm === '' || entry.employeeName.toLowerCase().includes(searchTerm.toLowerCase())) &&
      (selectedWeek === 'all' || entry.weekEnding === selectedWeek) &&
      (selectedJobSite === 'all' || entry.jobSite === selectedJobSite) &&
      (selectedTrade === 'all' || entry.trade === selectedTrade)
    );
  });

  const totalPayroll = filteredEntries.reduce((sum, entry) => sum + entry.grossPay, 0);
  const totalHours = filteredEntries.reduce((sum, entry) => sum + entry.totalHours, 0);
  const totalEmployees = new Set(filteredEntries.map(entry => entry.employeeName)).size;

  // Get unique values for filters
  const weeks = [...new Set(timesheetEntries.map(entry => entry.weekEnding))].sort().reverse();
  const jobSites = [...new Set(timesheetEntries.map(entry => entry.jobSite))].filter(Boolean);
  const trades = [...new Set(timesheetEntries.map(entry => entry.trade))].filter(Boolean);

  if (error) {
    return (
      <div className="space-y-6">
        <Alert variant="destructive">
          <AlertDescription>
            Failed to load payroll data: {error.message}
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => refetch()} 
              className="ml-2"
            >
              <RefreshCw className="h-4 w-4 mr-1" />
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-green-100 rounded-lg">
                <DollarSign className="h-8 w-8 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-slate-600">Total Approved Payroll</p>
                <p className="text-2xl font-bold text-green-600">${totalPayroll.toLocaleString()}</p>
                <p className="text-xs text-slate-500 mt-1">Excludes rejected timesheets</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-blue-100 rounded-lg">
                <Users className="h-8 w-8 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-slate-600">Active Employees</p>
                <p className="text-2xl font-bold text-blue-600">{totalEmployees}</p>
                <p className="text-xs text-slate-500 mt-1">With approved timesheets</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-orange-100 rounded-lg">
                <DollarSign className="h-8 w-8 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-slate-600">Total Approved Hours</p>
                <p className="text-2xl font-bold text-orange-600">{totalHours.toFixed(1)}</p>
                <p className="text-xs text-slate-500 mt-1">From approved timesheets only</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Filter className="h-5 w-5" />
            <span>Filters</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Search Employee</label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Employee name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Week Ending</label>
              <Select value={selectedWeek} onValueChange={setSelectedWeek}>
                <SelectTrigger>
                  <SelectValue placeholder="All weeks" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All weeks</SelectItem>
                  {weeks.map((week) => (
                    <SelectItem key={week} value={week}>
                      {new Date(week).toLocaleDateString()}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Job Site</label>
              <Select value={selectedJobSite} onValueChange={setSelectedJobSite}>
                <SelectTrigger>
                  <SelectValue placeholder="All sites" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All sites</SelectItem>
                  {jobSites.map((site) => (
                    <SelectItem key={site} value={site}>{site}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Trade</label>
              <Select value={selectedTrade} onValueChange={setSelectedTrade}>
                <SelectTrigger>
                  <SelectValue placeholder="All trades" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All trades</SelectItem>
                  {trades.map((trade) => (
                    <SelectItem key={trade} value={trade}>{trade}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Actions</label>
              <Button 
                variant="outline" 
                onClick={() => refetch()}
                disabled={isLoading}
                className="w-full"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payroll Table */}
      <Card>
        <CardHeader>
          <CardTitle>Weekly Payroll Summary (Approved Only)</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="h-6 w-6 animate-spin mr-2" />
              Loading payroll data...
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b bg-slate-50">
                    <th className="text-left p-3 font-semibold">Employee</th>
                    <th className="text-left p-3 font-semibold">Trade/Position</th>
                    <th className="text-left p-3 font-semibold">Job Site</th>
                    <th className="text-left p-3 font-semibold">Project</th>
                    <th className="text-right p-3 font-semibold">Hours</th>
                    <th className="text-right p-3 font-semibold">Rate</th>
                    <th className="text-right p-3 font-semibold">Expenses</th>
                    <th className="text-right p-3 font-semibold">Gross Pay</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredEntries.map((entry) => (
                    <tr key={entry.id} className="border-b hover:bg-slate-50">
                      <td className="p-3 font-medium">{entry.employeeName}</td>
                      <td className="p-3">
                        <div>
                          <Badge variant="outline" className="mb-1">{entry.trade}</Badge>
                          <p className="text-sm text-slate-600">{entry.position}</p>
                        </div>
                      </td>
                      <td className="p-3 text-sm">{entry.jobSite}</td>
                      <td className="p-3 text-sm">{entry.project}</td>
                      <td className="p-3 text-right font-mono">{entry.totalHours}</td>
                      <td className="p-3 text-right font-mono">${entry.hourlyRate}</td>
                      <td className="p-3 text-right font-mono">${entry.additionalExpense.toFixed(2)}</td>
                      <td className="p-3 text-right font-mono font-semibold text-green-600">
                        ${entry.grossPay.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          
          {!isLoading && filteredEntries.length === 0 && (
            <div className="text-center py-8 text-slate-500">
              <p>No approved timesheet entries found for the selected filters</p>
              <p className="text-sm mt-2">Only approved timesheets are included in payroll calculations</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default PayrollSummary;
