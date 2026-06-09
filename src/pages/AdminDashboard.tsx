
import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import Header from '../components/Header';
import AdminSidebar from '@/components/admin/AdminSidebar';
import AdminDashboardContent from '@/components/admin/dashboard/AdminDashboardContent';
import EmployeeManagement from '@/components/admin/EmployeeManagement';
import EmployeeRegistration from '@/components/admin/EmployeeRegistration';
import JobsiteManagement from '@/components/admin/JobsiteManagement';
import CompletedJobsites from '@/components/admin/CompletedJobsites';
import SafetyTemplatesManagement from '@/components/admin/SafetyTemplatesManagement';
import InventoryIndex from '@/pages/admin/inventory/Index';
import SuppliersManagement from '@/components/admin/SuppliersManagement';
import LivePunchMonitor from '@/components/admin/LivePunchMonitor';
import EmployeeTimesheets from '@/components/admin/EmployeeTimesheets';
import PayrollSummary from '@/components/admin/PayrollSummary';
import MaterialRequestInbox from '@/components/admin/MaterialRequestInbox';
import ChangeOrdersPage from '@/components/admin/ChangeOrdersPage';
import MaterialTakeoffManagement from '@/components/admin/MaterialTakeoffManagement';
import AttentionReportsInbox from '@/components/admin/AttentionReportsInbox';
import AttentionReportDetails from '@/components/admin/AttentionReportDetails';
import DailyReportsManagement from '@/components/admin/DailyReportsManagement';
import InvoiceManagement from '@/components/admin/InvoiceManagement';
import QuotesManagement from '@/components/admin/QuotesManagement';
import CompanySettings from '@/components/admin/CompanySettings';
import UserSettings from '@/components/common/UserSettings';
import SystemSettings from '@/components/admin/SystemSettings';
import IncomeExpensesManagement from '@/components/admin/IncomeExpensesManagement';
import TimeRequestsManagement from '@/components/admin/TimeRequestsManagement';
import { TimeSummaryPage } from '@/components/admin/time-summary/TimeSummaryPage';
import { JobsiteSelectionScreen } from '@/components/admin/tasks/JobsiteSelectionScreen';
import { DailyTaskScreen } from '@/components/admin/tasks/DailyTaskScreen';
import ClientsPage from '@/pages/admin/ClientsPage';
import ManualTimesheetsPage from '@/pages/admin/ManualTimesheetsPage';
import EmployeeBillsManagement from '@/components/admin/EmployeeBillsManagement';

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const params = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  // Update activeTab based on URL path and parameters
  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam) {
      setActiveTab(tabParam);
    }
    // Don't force reset to 'dashboard' - let activeTab state persist
  }, [searchParams]);

  const renderContent = () => {
    // Handle dynamic routes first
    if (window.location.pathname.includes('/admin/attention-reports/') && params.reportId) {
      return <AttentionReportDetails />;
    }

    // Handle static routes
    switch (activeTab) {
      case 'dashboard':
        return <AdminDashboardContent setActiveTab={setActiveTab} />;
      case 'employees':
        return <EmployeeManagement onNavigateToRegistration={() => setActiveTab('employee-registration')} />;
      case 'employee-registration':
        return <EmployeeRegistration />;
      case 'jobsites':
        return <JobsiteManagement />;
      case 'safety-templates':
        return <SafetyTemplatesManagement />;
      case 'inventory':
        return <InventoryIndex />;
      case 'suppliers':
        return <SuppliersManagement />;
      case 'live-punch-monitor':
        return <LivePunchMonitor />;
      case 'manual-timesheets':
        return <ManualTimesheetsPage />;
      case 'employee-bills':
        return <EmployeeBillsManagement />;
      case 'time-summary':
        return <TimeSummaryPage />;
      case 'timesheets':
        return <EmployeeTimesheets />;
      case 'payroll-summary':
        return <PayrollSummary />;
      case 'material-requests':
        return <MaterialRequestInbox />;
      case 'change-orders':
        return <ChangeOrdersPage />;
      case 'material-takeoff':
        return <MaterialTakeoffManagement />;
      case 'daily-reports':
        return <DailyReportsManagement />;
      case 'attention-reports':
        return <AttentionReportsInbox />;
      case 'invoices':
        return <InvoiceManagement />;
      case 'quotes':
        return <QuotesManagement />;
      case 'clients':
        return <ClientsPage />;
      case 'bills-expenses':
        return <IncomeExpensesManagement />;
      case 'time-requests':
        return <TimeRequestsManagement />;
      case 'tasks':
        // Check if jobsite ID is in query params
        const jobsiteId = searchParams.get('jobsite');
        if (jobsiteId) {
          // Render task list for specific jobsite
          return <DailyTaskScreen />;
        }
        // Otherwise show jobsite selection
        return <JobsiteSelectionScreen />;
      case 'company-settings':
        return <SystemSettings />;
      case 'settings':
        return <UserSettings />;
      default:
        return <AdminDashboardContent setActiveTab={setActiveTab} />;
    }
  };

  return (
    <SidebarProvider>
      <div className="flex h-screen bg-background w-full overflow-x-hidden">
        <AdminSidebar activeTab={activeTab} setActiveTab={setActiveTab} />
        <SidebarInset className="flex flex-col flex-1 min-w-0">
          <Header />
          <main className="flex-1 overflow-auto min-w-0 bg-background">
            <div className="p-3 md:p-6 w-full max-w-full">
              <div className="flex items-center mb-6 w-full">
                <SidebarTrigger className="mr-4 text-foreground hover:bg-muted transition-colors" />
              </div>
              {renderContent()}
            </div>
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};

export default AdminDashboard;
