import React, { useState } from 'react';
import Header from '../components/Header';
import ManagementSidebar from '../components/management/ManagementSidebar';
import EmployeeTimesheets from '../components/admin/EmployeeTimesheets';
import PayrollSummary from '../components/admin/PayrollSummary';
import BillsExpensesManagement from '../components/admin/BillsExpensesManagement';
import AttentionReportsInbox from '../components/admin/AttentionReportsInbox';
import UserSettings from '../components/common/UserSettings';
import LicenseWarningBanner from '../components/common/LicenseWarningBanner';
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import ManagementDashboardHome from '../components/management/ManagementDashboardHome';

const ManagementDashboard = () => {
  const [activeTab, setActiveTab] = useState('dashboard');

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <ManagementDashboardHome />;
      case 'timesheets':
        return <EmployeeTimesheets />;
      case 'payroll-summary':
        return <PayrollSummary />;
      case 'bills-expenses':
        return <BillsExpensesManagement />;
      case 'reports':
        return <AttentionReportsInbox />;
      case 'settings':
        return <UserSettings />;
      default:
        return <ManagementDashboardHome />;
    }
  };

  return (
    <SidebarProvider>
      <div className="flex min-h-screen bg-background w-full">
        <ManagementSidebar activeTab={activeTab} setActiveTab={setActiveTab} />
        <SidebarInset className="flex flex-col flex-1 min-w-0">
          <Header />
          <main className="flex-1 flex flex-col bg-background">
            <div className="flex-1 w-full">
              <div className="w-full p-6">
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