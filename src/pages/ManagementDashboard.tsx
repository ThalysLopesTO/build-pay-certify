import React, { useState } from 'react';
import Header from '../components/Header';
import ManagementSidebar from '../components/management/ManagementSidebar';
import EmployeeTimesheets from '../components/admin/EmployeeTimesheets';
import PayrollSummary from '../components/admin/PayrollSummary';
import IncomeExpensesManagement from '../components/admin/IncomeExpensesManagement';
import AttentionReportsInbox from '../components/admin/AttentionReportsInbox';
import UserSettings from '../components/common/UserSettings';
import LicenseWarningBanner from '../components/common/LicenseWarningBanner';
import LivePunchMonitor from '../components/admin/LivePunchMonitor';
import InventoryIndex from './admin/inventory/Index';
import SuppliersManagement from '../components/admin/SuppliersManagement';
import QuotesManagement from '../components/admin/QuotesManagement';
import InvoiceManagement from '../components/admin/InvoiceManagement';
import EmployeeManagement from '../components/admin/EmployeeManagement';
import EmployeeRegistration from '../components/admin/EmployeeRegistration';
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import ManagementDashboardHome from '../components/management/ManagementDashboardHome';
import ManagementNotifications from '../components/management/ManagementNotifications';
import ManagementTimesheetView from '../components/management/ManagementTimesheetView';
import MyTimesheetHistory from '../components/common/MyTimesheetHistory';

const ManagementDashboard = () => {
  const [activeTab, setActiveTab] = useState('dashboard');

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <ManagementDashboardHome setActiveTab={setActiveTab} />;
      case 'live-punch-monitor':
        return <LivePunchMonitor />;
      case 'my-timesheet':
        return <ManagementTimesheetView />;
      case 'timesheets':
        return <EmployeeTimesheets />;
      case 'payroll-summary':
        return <PayrollSummary />;
      case 'bills-expenses':
        return <IncomeExpensesManagement />;
      case 'employees':
        return <EmployeeManagement onNavigateToRegistration={() => setActiveTab('employee-registration')} />;
      case 'employee-registration':
        return <EmployeeRegistration />;
      case 'inventory':
        return <InventoryIndex />;
      case 'suppliers':
        return <SuppliersManagement />;
      case 'quotes':
        return <QuotesManagement />;
      case 'invoices':
        return <InvoiceManagement />;
      case 'my-timesheet-history':
        return <MyTimesheetHistory />;
      case 'reports':
        return <AttentionReportsInbox />;
      case 'notifications':
        return <ManagementNotifications />;
      case 'settings':
        return <UserSettings />;
      default:
        return <ManagementDashboardHome setActiveTab={setActiveTab} />;
    }
  };

  return (
    <SidebarProvider>
      <div className="flex min-h-screen bg-background w-full overflow-x-hidden">
        <ManagementSidebar activeTab={activeTab} setActiveTab={setActiveTab} />
        <SidebarInset className="flex flex-col flex-1 min-w-0">
          <Header />
          <main className="flex-1 flex flex-col bg-background">
            <div className="flex-1 w-full">
              <div className="w-full p-3 md:p-6">
                <div className="flex items-center mb-6 w-full">
                  <SidebarTrigger className="mr-4 text-foreground hover:bg-muted transition-colors" />
                </div>
                
                {/* License Warning Banner */}
                <div className="w-full mb-6">
                  <LicenseWarningBanner />
                </div>
                
                <div className="w-full">
                  {renderContent()}
                </div>
              </div>
            </div>
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};

export default ManagementDashboard;