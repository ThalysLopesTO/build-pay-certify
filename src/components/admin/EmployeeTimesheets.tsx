import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useWeeklyTimesheets } from '@/hooks/useWeeklyTimesheets';
import { useWeeklyTimesheetActions } from '@/hooks/useWeeklyTimesheetActions';
import { useEmployeeDirectory } from '@/hooks/useEmployeeDirectory';
import { useCreateManualTimesheet } from '@/hooks/useCreateManualTimesheet';
import { useTimesheetPDF } from '@/hooks/useTimesheetPDF';
import { useCompanySettings } from '@/hooks/useCompanySettings';
import { useCompanyLogo } from '@/hooks/useCompanyLogo';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { Calendar, Plus, Download, RefreshCw } from 'lucide-react';
import TimesheetEditModal from '@/components/admin/timesheets/TimesheetEditModal';
import CreateManualTimesheetModal from '@/components/admin/timesheets/CreateManualTimesheetModal';
import TimesheetFilters from '@/components/admin/timesheets/TimesheetFilters';
import TimesheetTable from '@/components/admin/timesheets/TimesheetTable';
import * as XLSX from 'xlsx';
import JSZip from 'jszip';
import { format } from 'date-fns';

const EmployeeTimesheets = () => {
  const { user } = useAuth();
  const { approveTimesheet, rejectTimesheet, editTimesheet, isApproving, isRejecting, isEditing } = useWeeklyTimesheetActions();
  const { createManualTimesheet, isCreating } = useCreateManualTimesheet();
  const { generateTimesheetPDF } = useTimesheetPDF();
  const { settings } = useCompanySettings();
  const { logoUrl } = useCompanyLogo();
  
  const [filters, setFilters] = useState({
    employeeName: '',
    weekEndingDate: '',
    status: 'all',
    jobsiteId: ''
  });
  const [editingTimesheet, setEditingTimesheet] = useState<any>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedTimesheets, setSelectedTimesheets] = useState<Set<string>>(new Set());
  const [bulkAction, setBulkAction] = useState<'pdf' | 'xlsx' | ''>('');
  const [isProcessing, setIsProcessing] = useState(false);
  
  const { data: timesheets = [], isLoading, error } = useWeeklyTimesheets(filters);
  const { data: employees = [] } = useEmployeeDirectory();
  
  // Only admins, management, and super_admins can access Employee Timesheets (not foremen for payroll)
  const isAuthorized = user?.role === 'admin' || user?.role === 'super_admin' || user?.role === 'management';

  const handleApprove = (timesheetId: string) => {
    approveTimesheet(timesheetId);
  };

  const handleReject = (timesheetId: string) => {
    rejectTimesheet(timesheetId);
  };

  const handleEdit = (timesheet: any) => {
    setEditingTimesheet(timesheet);
  };

  const handleSaveEdit = (updates: any, originalData: any) => {
    if (editingTimesheet) {
      editTimesheet({
        timesheetId: editingTimesheet.id,
        updates,
        originalData
      });
      setEditingTimesheet(null);
    }
  };

  const handleCreateManualTimesheet = (data: any) => {
    createManualTimesheet(data);
    setIsCreateModalOpen(false);
  };

  // Handle select all
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedTimesheets(new Set(timesheets.map(timesheet => timesheet.id)));
    } else {
      setSelectedTimesheets(new Set());
    }
  };

  // Handle individual selection
  const handleSelectTimesheet = (id: string, checked: boolean) => {
    const newSelection = new Set(selectedTimesheets);
    if (checked) {
      newSelection.add(id);
    } else {
      newSelection.delete(id);
    }
    setSelectedTimesheets(newSelection);
  };

  // Get selected timesheets
  const selectedTimesheetsData = timesheets.filter(timesheet => selectedTimesheets.has(timesheet.id));

  // Download selected as Excel
  const downloadSelectedAsExcel = () => {
    if (selectedTimesheetsData.length === 0) {
      alert('Please select at least one timesheet to export');
      return;
    }

    const excelData = selectedTimesheetsData.map(timesheet => ({
      'Employee': timesheet.is_manual_entry ? timesheet.manual_entry_name : timesheet.employee_name,
      'Entry Type': timesheet.is_manual_entry ? 'Manual Entry' : 'Employee Submission',
      'Week Starting': timesheet.week_start_date,
      'Monday': timesheet.monday_hours || 0,
      'Tuesday': timesheet.tuesday_hours || 0,
      'Wednesday': timesheet.wednesday_hours || 0,
      'Thursday': timesheet.thursday_hours || 0,
      'Friday': timesheet.friday_hours || 0,
      'Saturday': timesheet.saturday_hours || 0,
      'Sunday': timesheet.sunday_hours || 0,
      'Total Hours': timesheet.total_hours || 0,
      'Hourly Rate': timesheet.hourly_rate || 0,
      'Additional Expenses': timesheet.additional_expense || 0,
      'Gross Pay': timesheet.gross_pay || 0,
      'Tax Included': timesheet.tax_included ? 'Yes' : 'No',
      'Status': timesheet.status,
      'Submitted Date': timesheet.created_at ? new Date(timesheet.created_at).toLocaleDateString() : '',
      'Notes': timesheet.notes || ''
    }));

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(excelData);
    XLSX.utils.book_append_sheet(wb, ws, 'Selected Timesheets');

    const filename = `Selected-Timesheets-${format(new Date(), 'MMM-dd-yyyy')}.xlsx`;
    XLSX.writeFile(wb, filename);
  };

  // Download selected as PDF
  const downloadSelectedAsPDF = async () => {
    if (selectedTimesheetsData.length === 0) {
      alert('Please select at least one timesheet to export');
      return;
    }

    setIsProcessing(true);
    try {
      for (const timesheet of selectedTimesheetsData) {
        const employeeName = timesheet.is_manual_entry 
          ? timesheet.manual_entry_name 
          : timesheet.employee_name || 'Unknown Employee';
        
        // Get jobsite name
        const jobsite = await fetch(`/api/jobsites/${timesheet.jobsite_id}`).catch(() => null);
        const jobsiteName = 'Unknown Jobsite'; // This could be enhanced with proper jobsite lookup
        
        // Determine worker type
        let workerType = 'subcontractor';
        if (timesheet.is_manual_entry) {
          workerType = (timesheet as any).worker_type || 'subcontractor';
        } else {
          // For regular employee timesheets, we could fetch from user_profiles
          // For now, default to subcontractor
        }
        
        await generateTimesheetPDF({
          timesheet,
          companySettings: settings,
          jobsiteName,
          employeeName,
          logoUrl,
          workerType
        });
        
        // Add a small delay between downloads
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      alert(`Downloaded ${selectedTimesheetsData.length} PDF files`);
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

  // Check if user can create manual timesheets (Admin and Management only)
  const canCreateManualTimesheet = user?.role === 'admin' || user?.role === 'super_admin' || user?.role === 'management';

  if (!isAuthorized) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-center text-gray-500">
            You don't have permission to view employee timesheets.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-center text-red-600">
            Error loading timesheets. Please try again.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="bg-white rounded-xl shadow-sm border border-gray-200">
        <CardHeader className="p-6 pb-4">
          <CardTitle className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Calendar className="h-6 w-6 text-orange-600" />
            Employee Weekly Timesheet Submissions
          </CardTitle>
          <p className="text-gray-600 mt-2">
            Review and approve manually submitted weekly timesheets from employees
          </p>
        </CardHeader>
      </Card>

      {/* Filters */}
      <TimesheetFilters
        filters={filters}
        onFiltersChange={setFilters}
        employees={employees}
        timesheets={timesheets}
      />

      {/* Bulk Actions */}
      {selectedTimesheets.size > 0 && (
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <span className="text-sm font-medium text-blue-900">
                  {selectedTimesheets.size} timesheet{selectedTimesheets.size !== 1 ? 's' : ''} selected
                </span>
                <Select value={bulkAction} onValueChange={(value: 'pdf' | 'xlsx' | '') => setBulkAction(value)}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Choose action..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pdf">Download as PDF</SelectItem>
                    <SelectItem value="xlsx">Download as Excel</SelectItem>
                  </SelectContent>
                </Select>
                <Button 
                  onClick={handleBulkAction}
                  disabled={!bulkAction || isProcessing}
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
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => setSelectedTimesheets(new Set())}
              >
                Clear Selection
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Timesheets Table */}
      <Card className="bg-white rounded-xl shadow-sm border border-gray-200">
        <CardHeader className="p-6 pb-4">
          <div className="flex justify-between items-center">
            <CardTitle className="text-xl font-bold text-gray-900">
              Weekly Timesheet Submissions ({timesheets.length} total)
            </CardTitle>
            {canCreateManualTimesheet && (
              <Button 
                onClick={() => setIsCreateModalOpen(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Create Timesheet
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <TimesheetTable
            timesheets={timesheets}
            isLoading={isLoading}
            onEdit={handleEdit}
            onApprove={handleApprove}
            onReject={handleReject}
            isApproving={isApproving}
            isRejecting={isRejecting}
            selectedTimesheets={selectedTimesheets}
            onSelectAll={handleSelectAll}
            onSelectTimesheet={handleSelectTimesheet}
          />
        </CardContent>
      </Card>

      {/* Edit Modal */}
      {editingTimesheet && (
        <TimesheetEditModal
          timesheet={editingTimesheet}
          onClose={() => setEditingTimesheet(null)}
          onSave={handleSaveEdit}
          isSaving={isEditing}
        />
      )}

      {/* Create Manual Timesheet Modal */}
      <CreateManualTimesheetModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSave={handleCreateManualTimesheet}
        isSaving={isCreating}
      />
    </div>
  );
};

export default EmployeeTimesheets;
