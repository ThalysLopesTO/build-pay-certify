import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { DollarSign, Users, Search, Filter, RefreshCw, Download, ChevronDown, ChevronUp, Clock, FileText, Package } from 'lucide-react';
import { useWeeklyTimesheets } from '@/hooks/new/useWeeklyTimesheets';
import { useEmployeeDirectory } from '@/hooks/useEmployeeDirectory';
import { useWorkWeek } from '@/hooks/useWorkWeek';
import { useCompanySettings } from '@/hooks/useCompanySettings';
import { useCompanyLogo } from '@/hooks/useCompanyLogo';
import { useTimesheetPDF } from '@/hooks/useTimesheetPDF';
import { MonthlyPayrollAnalytics } from '@/components/admin/payroll/MonthlyPayrollAnalytics';
import { Alert, AlertDescription } from '@/components/ui/alert';
import * as XLSX from 'xlsx';
import { format } from 'date-fns';
import JSZip from 'jszip';

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
  const [selectedMonth, setSelectedMonth] = useState('all');
  const [taxIncluded, setTaxIncluded] = useState(false);
  const [showFilters, setShowFilters] = useState(true);
  const [selectedTimesheets, setSelectedTimesheets] = useState<Set<number>>(new Set());
  const [bulkAction, setBulkAction] = useState<'pdf' | 'xlsx' | ''>('');
  const [isProcessing, setIsProcessing] = useState(false);

  // Get data from hooks
  const workWeeks = useWorkWeek();
  const { settings } = useCompanySettings();
  const { logoUrl } = useCompanyLogo();
  const { generateTimesheetPDF } = useTimesheetPDF();

  // Fetch approved weekly timesheets only
  const { data: timesheets = [], isLoading, error, refetch } = useWeeklyTimesheets({
    status: 'approved'
  });
  const { data: employees = [] } = useEmployeeDirectory();

  // Process approved timesheets for payroll
  const payrollEntries = useMemo(() => {
    console.log('🔍 PayrollSummary - Timesheets data:', timesheets.length, timesheets);
    console.log('🔍 PayrollSummary - Employees data:', employees.length, employees);
    const taxPercentage = settings?.tax_percentage || 13;
    const weekEndingDay = settings?.week_ending_day ?? 0; // Default to Sunday
    
    return timesheets.map((timesheet, index) => {
      const totalHours = safeParseNumber(timesheet.total_hours);
      const hourlyRate = safeParseNumber(timesheet.hourly_rate);
      const additionalExpense = safeParseNumber(timesheet.additional_expense);
      const grossPay = safeParseNumber(timesheet.gross_pay);
      
      // Use the worker type directly from the timesheet, not from user_profiles lookup
      const workerType = timesheet.worker_type || 'subcontractor';
      
      // Calculate tax for subcontractors or deductions for employees
      const hourlyPay = totalHours * hourlyRate;
      let estimatedTax = 0;
      let deductions = 0;
      let netPay = grossPay;
      
      console.log('🔍 Processing timesheet:', {
        employee_name: timesheet.employee_name,
        worker_type: workerType,
        gross_pay: grossPay,
        income_tax_rate: timesheet.income_tax_rate,
        cpp_rate: timesheet.cpp_rate,
        ei_rate: timesheet.ei_rate,
        calculated_tax: timesheet.calculated_tax,
        tax_included: timesheet.tax_included
      });

      if (workerType === 'employee') {
        // Employee deductions using rates from timesheet or defaults
        const incomeTaxRate = (safeParseNumber(timesheet.income_tax_rate) || 12) / 100;
        const cppRate = (safeParseNumber(timesheet.cpp_rate) || 5.95) / 100;
        const eiRate = (safeParseNumber(timesheet.ei_rate) || 1.63) / 100;
        
        const incomeTax = grossPay * incomeTaxRate;
        const cpp = grossPay * cppRate;
        const ei = grossPay * eiRate;
        
        deductions = incomeTax + cpp + ei;
        netPay = grossPay - deductions;
        
        console.log('🔍 Employee deductions calculated:', {
          incomeTaxRate, cppRate, eiRate,
          incomeTax, cpp, ei,
          totalDeductions: deductions,
          netPay
        });
      } else {
        // For subcontractors, use calculated tax if tax_included is true
        if (timesheet.tax_included) {
          estimatedTax = safeParseNumber(timesheet.calculated_tax) || 0;
        } else {
          // Otherwise calculate based on hourly pay (excluding expenses)
          estimatedTax = hourlyPay * (taxPercentage / 100);
        }
        
        console.log('🔍 Subcontractor tax calculated:', {
          tax_included: timesheet.tax_included,
          calculated_tax: timesheet.calculated_tax,
          estimatedTax
        });
      }
      
      // Calculate period end date from start date
      const weekStartDate = new Date(timesheet.week_start_date);
      const periodDays = ((settings as any)?.timesheet_frequency === 'bi-weekly') ? 14 : 7;
      const weekEndDate = new Date(weekStartDate);
      weekEndDate.setDate(weekStartDate.getDate() + (periodDays - 1));

      // For filtering, use the calculated period start date string
      const properWeekStartDate = weekStartDate;
      const properWeekStartDateString = format(properWeekStartDate, 'yyyy-MM-dd');
      
      return {
        id: index,
        originalTimesheet: timesheet,
        employeeName: timesheet.employee_name || 'Former Employee',
        trade: 'General', // Default since we're not looking up from user_profiles
        position: 'Worker', // Default since we're not looking up from user_profiles
        jobSite: timesheet.jobsite_name,
        project: timesheet.jobsite_name,
        weekStartDate: properWeekStartDateString, // Use the calculated week start date for filtering
        weekEndDate: format(weekEndDate, 'MMM dd, yyyy'),
        monthYear: format(weekEndDate, 'yyyy-MM'), // Add month-year for filtering
        monthYearDisplay: format(weekEndDate, 'MMM yyyy'), // Add month-year for display
        totalHours,
        hourlyRate,
        additionalExpense,
        grossPay,
        estimatedTax,
        deductions,
        netPay,
        totalPayWithTax: grossPay + estimatedTax,
        submittedAt: timesheet.created_at,
        isManualEntry: timesheet.is_manual_entry || false,
        workerType
      };
    });
  }, [timesheets, employees, settings?.tax_percentage, settings?.week_ending_day]);

  const filteredEntries = useMemo(() => {
    return payrollEntries.filter(entry => {
      return (
        (searchTerm === '' || entry.employeeName.toLowerCase().includes(searchTerm.toLowerCase())) &&
        (selectedWeek === 'all' || entry.weekStartDate === selectedWeek) &&
        (selectedJobSite === 'all' || entry.jobSite === selectedJobSite) &&
        (selectedTrade === 'all' || entry.trade === selectedTrade) &&
        (selectedMonth === 'all' || entry.monthYear === selectedMonth)
      );
    });
  }, [payrollEntries, searchTerm, selectedWeek, selectedJobSite, selectedTrade, selectedMonth]);

  const totalPayroll = filteredEntries.reduce((sum, entry) => 
    sum + (taxIncluded ? entry.totalPayWithTax : entry.grossPay), 0
  );
  const totalTax = filteredEntries.reduce((sum, entry) => sum + entry.estimatedTax, 0);
  const totalHours = filteredEntries.reduce((sum, entry) => sum + entry.totalHours, 0);
  const totalEmployees = new Set(filteredEntries.map(entry => entry.employeeName)).size;

  // Get unique values for filters
  const jobSites = [...new Set(payrollEntries.map(entry => entry.jobSite))].filter(Boolean);
  const trades = [...new Set(payrollEntries.map(entry => entry.trade))].filter(Boolean);
  const months = [...new Set(payrollEntries.map(entry => entry.monthYear))]
    .filter(Boolean)
    .sort((a, b) => b.localeCompare(a)) // Sort in descending order (newest first)
    .map(monthYear => ({
      value: monthYear,
      display: format(new Date(monthYear + '-01'), 'MMM yyyy')
    }));

  // Handle select all
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedTimesheets(new Set(filteredEntries.map(entry => entry.id)));
    } else {
      setSelectedTimesheets(new Set());
    }
  };

  // Handle individual selection
  const handleSelectTimesheet = (id: number, checked: boolean) => {
    const newSelection = new Set(selectedTimesheets);
    if (checked) {
      newSelection.add(id);
    } else {
      newSelection.delete(id);
    }
    setSelectedTimesheets(newSelection);
  };

  // Get selected entries
  const selectedEntries = filteredEntries.filter(entry => selectedTimesheets.has(entry.id));

  // Download selected as Excel
  const downloadSelectedAsExcel = () => {
    if (selectedEntries.length === 0) {
      alert('Please select at least one timesheet to export');
      return;
    }

    const totalExpenses = selectedEntries.reduce((sum, entry) => sum + entry.additionalExpense, 0);
    const selectedTotalHours = selectedEntries.reduce((sum, entry) => sum + entry.totalHours, 0);
    const selectedTotalTax = selectedEntries.reduce((sum, entry) => sum + entry.estimatedTax, 0);
    const selectedTotalPayroll = selectedEntries.reduce((sum, entry) => 
      sum + (taxIncluded ? entry.totalPayWithTax : entry.grossPay), 0
    );

    const excelData = selectedEntries.map(entry => ({
      'Employee': entry.employeeName,
      'Worker Type': entry.workerType === 'employee' ? 'Employee' : 'Subcontractor',
      'Trade/Position': `${entry.trade} - ${entry.position}`,
      'Job Site': entry.jobSite,
      'Project': entry.project,
      'Week Ending': entry.weekEndDate,
      'Hours': entry.totalHours,
      'Hourly Rate': entry.hourlyRate,
      'Expenses': entry.additionalExpense,
      'Gross Pay': entry.grossPay,
      ...(entry.workerType === 'employee' ? {
        'Deductions': entry.deductions,
        'Net Pay': entry.netPay
      } : {
        'Tax': entry.estimatedTax,
        'Total Pay': taxIncluded ? entry.totalPayWithTax : entry.grossPay
      })
    }));

    // Add summary row
    excelData.push({
      'Employee': 'SELECTED TOTALS',
      'Worker Type': '',
      'Trade/Position': '',
      'Job Site': '',
      'Project': '',
      'Week Ending': '',
      'Hours': selectedTotalHours,
      'Hourly Rate': 0,
      'Expenses': totalExpenses,
      'Gross Pay': selectedEntries.reduce((sum, entry) => sum + entry.grossPay, 0),
      'Deductions': selectedEntries.reduce((sum, entry) => sum + (entry.deductions || 0), 0),
      'Net Pay': selectedEntries.reduce((sum, entry) => sum + (entry.netPay || 0), 0),
      'Tax': selectedTotalTax,
      'Total Pay': selectedTotalPayroll
    });

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(excelData);
    XLSX.utils.book_append_sheet(wb, ws, 'Selected Payroll');

    const filename = `Selected-Payroll-${format(new Date(), 'MMM-dd-yyyy')}.xlsx`;
    XLSX.writeFile(wb, filename);
  };

  // Download selected as PDF (simple individual downloads for now)
  const downloadSelectedAsPDF = async () => {
    if (selectedEntries.length === 0) {
      alert('Please select at least one timesheet to export');
      return;
    }

    setIsProcessing(true);
    try {
      // For now, download individual PDFs
      for (const entry of selectedEntries) {
        await generateTimesheetPDF({
          timesheet: entry.originalTimesheet,
          companySettings: settings,
          jobsiteName: entry.jobSite,
          employeeName: entry.employeeName,
          logoUrl,
          workerType: entry.workerType
        });
        // Add a small delay between downloads
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      alert(`Downloaded ${selectedEntries.length} PDF files`);
    } catch (error) {
      console.error('Error generating PDF files:', error);
      alert('Error generating PDF files. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle bulk actions
  const handleBulkAction = () => {
    if (bulkAction === 'pdf') {
      downloadSelectedAsPDF();
    } else if (bulkAction === 'xlsx') {
      downloadSelectedAsExcel();
    }
  };

  // Download all as Excel (existing functionality)
  const downloadAllAsExcel = () => {
    if (filteredEntries.length === 0) {
      alert('No data to export');
      return;
    }

    const totalExpenses = filteredEntries.reduce((sum, entry) => sum + entry.additionalExpense, 0);

    const excelData = filteredEntries.map(entry => ({
      'Employee': entry.employeeName,
      'Worker Type': entry.workerType === 'employee' ? 'Employee' : 'Subcontractor',
      'Trade/Position': `${entry.trade} - ${entry.position}`,
      'Job Site': entry.jobSite,
      'Project': entry.project,
      'Week Ending': entry.weekEndDate,
      'Hours': entry.totalHours,
      'Hourly Rate': entry.hourlyRate,
      'Expenses': entry.additionalExpense,
      'Gross Pay': entry.grossPay,
      ...(entry.workerType === 'employee' ? {
        'Deductions': entry.deductions,
        'Net Pay': entry.netPay
      } : {
        'Tax': entry.estimatedTax,
        'Total Pay': taxIncluded ? entry.totalPayWithTax : entry.grossPay
      })
    }));

    excelData.push({
      'Employee': 'TOTALS',
      'Worker Type': '',
      'Trade/Position': '',
      'Job Site': '',
      'Project': '',
      'Week Ending': '',
      'Hours': totalHours,
      'Hourly Rate': 0,
      'Expenses': totalExpenses,
      'Gross Pay': filteredEntries.reduce((sum, entry) => sum + entry.grossPay, 0),
      'Deductions': filteredEntries.reduce((sum, entry) => sum + (entry.deductions || 0), 0),
      'Net Pay': filteredEntries.reduce((sum, entry) => sum + (entry.netPay || 0), 0),
      'Tax': totalTax,
      'Total Pay': totalPayroll
    });

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(excelData);
    XLSX.utils.book_append_sheet(wb, ws, 'Payroll Summary');

    let filename = 'Payroll-Summary';
    if (selectedWeek !== 'all' && workWeeks) {
      const selectedWeekData = workWeeks.availableWeeks.find(week => week.weekStartDateString === selectedWeek);
      if (selectedWeekData) {
        filename = `Payroll-Summary-${selectedWeekData.startDateFormatted.replace(' ', '-')}-to-${selectedWeekData.endDateFormatted.replace(' ', '-')}`;
      }
    } else {
      filename += `-${format(new Date(), 'MMM-dd-yyyy')}`;
    }

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
    <div className="space-y-8">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-l-4 border-l-green-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Total Approved Payroll</p>
                <p className="text-3xl font-bold text-green-600">${totalPayroll.toLocaleString()}</p>
                <p className="text-xs text-slate-500 mt-1">From approved timesheets</p>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <DollarSign className="h-8 w-8 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Active Employees</p>
                <p className="text-3xl font-bold text-blue-600">{totalEmployees}</p>
                <p className="text-xs text-slate-500 mt-1">With approved timesheets</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <Users className="h-8 w-8 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-orange-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Total Approved Hours</p>
                <p className="text-3xl font-bold text-orange-600">{totalHours.toFixed(1)}</p>
                <p className="text-xs text-slate-500 mt-1">From approved timesheets only</p>
              </div>
              <div className="p-3 bg-orange-100 rounded-full">
                <Clock className="h-8 w-8 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Monthly Payroll Analytics */}
      {payrollEntries.length > 0 && (
        <MonthlyPayrollAnalytics 
          payrollEntries={payrollEntries}
          taxIncluded={taxIncluded}
        />
      )}

      {/* Filters & Options Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center space-x-2">
              <Filter className="h-5 w-5" />
              <span>Filters & Options</span>
            </CardTitle>
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center space-x-2"
            >
              {showFilters ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              <span>{showFilters ? 'Hide' : 'Show'} Filters</span>
            </Button>
          </div>
        </CardHeader>
        
        {showFilters && (
          <CardContent className="space-y-6">
            {/* Search and Filter Controls */}
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Search Employee</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                    <Input
                      placeholder="Type employee name..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Month</label>
                  <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                    <SelectTrigger>
                      <SelectValue placeholder="All months" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All months</SelectItem>
                      {months.map((month) => (
                        <SelectItem key={month.value} value={month.value}>
                          {month.display}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Week Period</label>
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
                  <label className="text-sm font-medium text-slate-700">Job Site</label>
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
                  <label className="text-sm font-medium text-slate-700">Trade</label>
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
              </div>
            </div>

            {/* Tax Toggle */}
            <div className="flex items-center space-x-3 p-4 bg-slate-50 rounded-lg">
              <Switch
                id="tax-included"
                checked={taxIncluded}
                onCheckedChange={setTaxIncluded}
              />
              <Label htmlFor="tax-included" className="text-sm font-medium">
                Tax Included in Total Pay
              </Label>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-4 pt-4 border-t">
              <Button 
                variant="outline" 
                onClick={() => refetch()}
                disabled={isLoading}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                Refresh Data
              </Button>
              
              <Button 
                onClick={downloadAllAsExcel}
                disabled={filteredEntries.length === 0}
                className="bg-green-600 hover:bg-green-700"
              >
                <Download className="h-4 w-4 mr-2" />
                Export to Excel
              </Button>

              {/* Bulk Actions */}
              <div className="flex items-center space-x-2 ml-auto">
                <Select value={bulkAction} onValueChange={(value) => setBulkAction(value as 'pdf' | 'xlsx' | '')}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Bulk actions" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pdf">
                      <div className="flex items-center space-x-2">
                        <FileText className="h-4 w-4" />
                        <span>Download Selected as PDF</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="xlsx">
                      <div className="flex items-center space-x-2">
                        <Package className="h-4 w-4" />
                        <span>Download Selected as XLSX</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
                
                <Button 
                  onClick={handleBulkAction}
                  disabled={!bulkAction || selectedTimesheets.size === 0 || isProcessing}
                  variant="outline"
                >
                  {isProcessing ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Download className="h-4 w-4 mr-2" />
                      Apply ({selectedTimesheets.size})
                    </>
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        )}
      </Card>


      {/* Payroll Table */}
      <Card>
        <CardHeader>
          <CardTitle>Payroll Summary (Approved Timesheets Only)</CardTitle>
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
                <thead className="sticky top-0 bg-white shadow-sm z-10">
                  <tr className="border-b-2 border-slate-200">
                    <th className="text-left p-4 font-semibold bg-slate-50">
                      <Checkbox
                        checked={selectedTimesheets.size === filteredEntries.length && filteredEntries.length > 0}
                        onCheckedChange={handleSelectAll}
                      />
                    </th>
                     <th className="text-left p-4 font-semibold bg-slate-50">Employee</th>
                     <th className="text-left p-4 font-semibold bg-slate-50">Type</th>
                     <th className="text-left p-4 font-semibold bg-slate-50">Trade</th>
                     <th className="text-left p-4 font-semibold bg-slate-50">Jobsite</th>
                     <th className="text-left p-4 font-semibold bg-slate-50">Period Ending</th>
                     <th className="text-center p-4 font-semibold bg-slate-50">Hours</th>
                     <th className="text-center p-4 font-semibold bg-slate-50">Rate</th>
                     <th className="text-center p-4 font-semibold bg-slate-50 text-green-600">Gross Pay</th>
                     <th className="text-center p-4 font-semibold bg-slate-50 text-red-600">Deductions</th>
                     <th className="text-center p-4 font-semibold bg-slate-50 text-orange-600">Tax</th>
                     <th className="text-center p-4 font-semibold bg-slate-50 text-blue-600">Net Pay</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredEntries.map((entry) => (
                    <tr key={entry.id} className="border-b hover:bg-slate-50 transition-colors">
                      <td className="p-4">
                        <Checkbox
                          checked={selectedTimesheets.has(entry.id)}
                          onCheckedChange={(checked) => handleSelectTimesheet(entry.id, checked === true)}
                        />
                      </td>
                        <td className="p-4 font-medium">
                          <div className="flex items-center space-x-2">
                            <span>{entry.employeeName}</span>
                            {entry.isManualEntry && (
                              <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-800">
                                Manual Entry
                              </Badge>
                            )}
                          </div>
                        </td>
                        <td className="p-4">
                          <Badge 
                            variant={entry.workerType === 'employee' ? 'default' : 'outline'} 
                            className="text-xs"
                          >
                            {entry.workerType === 'employee' ? 'Employee' : 'Subcontractor'}
                          </Badge>
                        </td>
                        <td className="p-4">
                          <Badge variant="outline" className="text-xs">{entry.trade}</Badge>
                        </td>
                        <td className="p-4 text-sm">{entry.jobSite}</td>
                        <td className="p-4 text-sm">{entry.weekEndDate}</td>
                        <td className="p-4 text-center font-mono text-sm">{entry.totalHours.toFixed(2)}</td>
                        <td className="p-4 text-center font-mono text-sm">${entry.hourlyRate.toFixed(2)}</td>
                        <td className="p-4 text-center font-mono font-semibold text-green-600">
                          ${entry.grossPay.toFixed(2)}
                        </td>
                        <td className="p-4 text-center font-mono text-sm text-red-600">
                          ${entry.workerType === 'employee' ? entry.deductions.toFixed(2) : '-'}
                        </td>
                        <td className="p-4 text-center font-mono text-sm text-orange-600">
                          ${entry.workerType === 'subcontractor' && entry.originalTimesheet.tax_included ? entry.estimatedTax.toFixed(2) : '-'}
                        </td>
                        <td className="p-4 text-center font-mono font-semibold text-blue-600">
                          ${entry.workerType === 'employee' ? entry.netPay.toFixed(2) : 
                            (entry.originalTimesheet.tax_included ? entry.totalPayWithTax.toFixed(2) : entry.grossPay.toFixed(2))}
                        </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          
          {!isLoading && filteredEntries.length === 0 && (
            <div className="text-center py-12 text-slate-500">
              <Package className="h-12 w-12 mx-auto mb-4 text-slate-400" />
              <p className="text-lg font-medium">No approved timesheet entries found</p>
              <p className="text-sm mt-2">Only approved weekly timesheets are included in payroll calculations</p>
              <p className="text-sm mt-2 text-blue-600">
                💡 Tip: Go to Weekly Timesheets to approve pending timesheets first, then they'll appear here.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default PayrollSummary;