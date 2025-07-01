
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DollarSign, Users, Search, Filter, RefreshCw, Download } from 'lucide-react';
import { useEmployeeTimesheets } from '@/hooks/useEmployeeTimesheets';
import { useEmployeeDirectory } from '@/hooks/useEmployeeDirectory';
import { useWorkWeek } from '@/hooks/useWorkWeek';
import { Alert, AlertDescription } from '@/components/ui/alert';
import * as XLSX from 'xlsx';
import { format, startOfWeek, endOfWeek } from 'date-fns';

// Helper function to safely parse numbers
const safeParseNumber = (value: any): number => {
  if (value === null || value === undefined || value === '') return 0;
  const parsed = typeof value === 'string' ? parseFloat(value) : Number(value);
  return isNaN(parsed) ? 0 : parsed;
};

const PayrollSummary = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedWeek, setSelectedWeek] = useState('all');
  const [selectedJobSite, setSelectedJobSite] = useState('all');
  const [selectedTrade, setSelectedTrade] = useState('all');

  // Get work weeks based on company settings
  const workWeeks = useWorkWeek();

  // Fetch actual timesheet data (punch records)
  const { data: timesheets = [], isLoading, error, refetch } = useEmployeeTimesheets({});
  const { data: employees = [] } = useEmployeeDirectory();

  // Filter out rejected timesheets - only approved timesheets count toward payroll
  const approvedTimesheets = timesheets.filter(timesheet => 
    timesheet.status === 'approved'
  );

  // Group timesheets by employee and week, then calculate totals
  const payrollEntries = React.useMemo(() => {
    const groupedByEmployeeWeek = approvedTimesheets.reduce((acc, timesheet) => {
      if (!timesheet.check_in_time) return acc;
      
      const checkInDate = new Date(timesheet.check_in_time);
      const weekStart = startOfWeek(checkInDate, { weekStartsOn: 1 });
      const weekKey = `${timesheet.employee_name}-${weekStart.toISOString()}`;
      
      if (!acc[weekKey]) {
        const employee = employees.find(emp => 
          `${emp.first_name || ''} ${emp.last_name || ''}`.trim() === timesheet.employee_name
        );
        
        acc[weekKey] = {
          employeeName: timesheet.employee_name,
          trade: employee?.trade || 'General',
          position: employee?.position || 'Worker',
          jobSite: timesheet.jobsite_name,
          weekStartDate: weekStart.toISOString(),
          weekEndDate: format(endOfWeek(weekStart, { weekStartsOn: 1 }), 'MMM dd, yyyy'),
          totalHours: 0,
          hourlyRate: safeParseNumber(employee?.hourly_rate) || 25, // Default rate
          additionalExpense: 0,
          timesheets: []
        };
      }
      
      acc[weekKey].totalHours += safeParseNumber(timesheet.hours_worked);
      acc[weekKey].timesheets.push(timesheet);
      
      return acc;
    }, {} as Record<string, any>);

    return Object.values(groupedByEmployeeWeek).map((entry: any) => ({
      ...entry,
      grossPay: entry.totalHours * entry.hourlyRate + entry.additionalExpense,
      project: entry.jobSite // Using jobsite as project for now
    }));
  }, [approvedTimesheets, employees]);

  const filteredEntries = payrollEntries.filter(entry => {
    return (
      (searchTerm === '' || entry.employeeName.toLowerCase().includes(searchTerm.toLowerCase())) &&
      (selectedWeek === 'all' || entry.weekStartDate === selectedWeek) &&
      (selectedJobSite === 'all' || entry.jobSite === selectedJobSite) &&
      (selectedTrade === 'all' || entry.trade === selectedTrade)
    );
  });

  const totalPayroll = filteredEntries.reduce((sum, entry) => sum + entry.grossPay, 0);
  const totalHours = filteredEntries.reduce((sum, entry) => sum + entry.totalHours, 0);
  const totalEmployees = new Set(filteredEntries.map(entry => entry.employeeName)).size;

  // Get unique values for filters
  const jobSites = [...new Set(payrollEntries.map(entry => entry.jobSite))].filter(Boolean);
  const trades = [...new Set(payrollEntries.map(entry => entry.trade))].filter(Boolean);

  // Download Excel function
  const downloadPayrollExcel = () => {
    if (filteredEntries.length === 0) {
      alert('No data to export');
      return;
    }

    // Calculate total expenses for summary
    const totalExpenses = filteredEntries.reduce((sum, entry) => sum + entry.additionalExpense, 0);

    // Prepare data for Excel
    const excelData = filteredEntries.map(entry => ({
      'Employee': entry.employeeName,
      'Trade/Position': `${entry.trade} - ${entry.position}`,
      'Job Site': entry.jobSite,
      'Project': entry.project,
      'Week Ending': entry.weekEndDate,
      'Hours': entry.totalHours,
      'Hourly Rate': entry.hourlyRate,
      'Expenses': entry.additionalExpense,
      'Gross Pay': entry.grossPay
    }));

    // Add summary row with proper types
    excelData.push({
      'Employee': 'TOTALS',
      'Trade/Position': '',
      'Job Site': '',
      'Project': '',
      'Week Ending': '',
      'Hours': totalHours,
      'Hourly Rate': 0, // Use 0 instead of empty string for numeric field
      'Expenses': totalExpenses,
      'Gross Pay': totalPayroll
    });

    // Create workbook and worksheet
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(excelData);

    // Format currency columns
    const range = XLSX.utils.decode_range(ws['!ref'] || 'A1');
    for (let R = range.s.r; R <= range.e.r; ++R) {
      const hourlyRateCell = XLSX.utils.encode_cell({ r: R, c: 6 }); // Hourly Rate column
      const expensesCell = XLSX.utils.encode_cell({ r: R, c: 7 }); // Expenses column
      const grossPayCell = XLSX.utils.encode_cell({ r: R, c: 8 }); // Gross Pay column
      
      if (ws[hourlyRateCell] && ws[hourlyRateCell].v !== 'Hourly Rate' && ws[hourlyRateCell].v !== '') {
        ws[hourlyRateCell].z = '"$"#,##0.00';
      }
      if (ws[expensesCell] && ws[expensesCell].v !== 'Expenses') {
        ws[expensesCell].z = '"$"#,##0.00';
      }
      if (ws[grossPayCell] && ws[grossPayCell].v !== 'Gross Pay') {
        ws[grossPayCell].z = '"$"#,##0.00';
      }
    }

    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(wb, ws, 'Payroll Summary');

    // Generate filename based on selected week
    let filename = 'Payroll-Summary';
    if (selectedWeek !== 'all' && workWeeks) {
      const selectedWeekData = workWeeks.availableWeeks.find(week => week.weekStartDateString === selectedWeek);
      if (selectedWeekData) {
        filename = `Payroll-Summary-${selectedWeekData.startDateFormatted.replace(' ', '-')}-to-${selectedWeekData.endDateFormatted.replace(' ', '-')}`;
      }
    } else {
      filename += `-${format(new Date(), 'MMM-dd-yyyy')}`;
    }

    // Download file
    XLSX.writeFile(wb, `${filename}.xlsx`);
  };

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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
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
              <label className="text-sm font-medium">Week Range</label>
              <Select value={selectedWeek} onValueChange={setSelectedWeek}>
                <SelectTrigger>
                  <SelectValue placeholder="All weeks" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All weeks</SelectItem>
                  {workWeeks?.availableWeeks.map((week) => (
                    <SelectItem key={week.weekStartDateString} value={week.weekStartDateString}>
                      {week.rangeFormatted}
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

            <div className="space-y-2">
              <label className="text-sm font-medium">Export</label>
              <Button 
                onClick={downloadPayrollExcel}
                disabled={filteredEntries.length === 0}
                className="w-full bg-green-600 hover:bg-green-700"
              >
                <Download className="h-4 w-4 mr-2" />
                Download (.xlsx)
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
                    <th className="text-left p-3 font-semibold">Week Ending</th>
                    <th className="text-right p-3 font-semibold">Hours</th>
                    <th className="text-right p-3 font-semibold">Rate</th>
                    <th className="text-right p-3 font-semibold">Expenses</th>
                    <th className="text-right p-3 font-semibold">Gross Pay</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredEntries.map((entry, index) => (
                    <tr key={index} className="border-b hover:bg-slate-50">
                      <td className="p-3 font-medium">{entry.employeeName}</td>
                      <td className="p-3">
                        <div>
                          <Badge variant="outline" className="mb-1">{entry.trade}</Badge>
                          <p className="text-sm text-slate-600">{entry.position}</p>
                        </div>
                      </td>
                      <td className="p-3 text-sm">{entry.jobSite}</td>
                      <td className="p-3 text-sm">{entry.project}</td>
                      <td className="p-3 text-sm">{entry.weekEndDate}</td>
                      <td className="p-3 text-right font-mono">{entry.totalHours.toFixed(2)}</td>
                      <td className="p-3 text-right font-mono">${entry.hourlyRate.toFixed(2)}</td>
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
