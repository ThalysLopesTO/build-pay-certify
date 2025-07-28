
import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
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
import MaterialTakeoffManagement from '@/components/admin/MaterialTakeoffManagement';
import AttentionReportsInbox from '@/components/admin/AttentionReportsInbox';
import AttentionReportDetails from '@/components/admin/AttentionReportDetails';
import InvoiceManagement from '@/components/admin/InvoiceManagement';
import QuotesManagement from '@/components/admin/QuotesManagement';
import CompanySettings from '@/components/admin/CompanySettings';
import UserSettings from '@/components/common/UserSettings';
import SystemSettings from '@/components/admin/SystemSettings';
import BillsExpensesManagement from '@/components/admin/BillsExpensesManagement';
import TimeRequestsManagement from '@/components/admin/TimeRequestsManagement';

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const params = useParams();

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
      case 'completed-jobsites':
        return <CompletedJobsites />;
      case 'safety-templates':
        return <SafetyTemplatesManagement />;
      case 'inventory':
        return <InventoryIndex />;
      case 'suppliers':
        return <SuppliersManagement />;
      case 'live-punch-monitor':
        return <LivePunchMonitor />;
      case 'timesheets':
        return <EmployeeTimesheets />;
      case 'payroll-summary':
        return <PayrollSummary />;
      case 'material-requests':
        return <MaterialRequestInbox />;
      case 'material-takeoff':
        return <MaterialTakeoffManagement />;
      case 'attention-reports':
        return <AttentionReportsInbox />;
      case 'invoices':
        return <InvoiceManagement />;
      case 'quotes':
        return <QuotesManagement />;
      case 'bills-expenses':
        return <BillsExpensesManagement />;
      case 'time-requests':
        return <TimeRequestsManagement />;
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
      <div className="flex h-screen bg-background w-full">
        <AdminSidebar activeTab={activeTab} setActiveTab={setActiveTab} />
        <SidebarInset className="flex flex-col flex-1 min-w-0">
          <Header />
          <main className="flex-1 overflow-auto min-w-0 bg-background">
            <div className="p-6 w-full">
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
