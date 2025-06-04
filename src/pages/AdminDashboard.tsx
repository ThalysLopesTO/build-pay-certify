import React, { useState } from 'react';
import Header from '../components/Header';
import AdminSidebar from '../components/admin/AdminSidebar';
import AdminDashboardContent from '../components/admin/AdminDashboardContent';
import EmployeeManagement from '../components/admin/EmployeeManagement';
import EmployeeRegistration from '../components/admin/EmployeeRegistration';
import EmployeeTimesheets from '../components/admin/EmployeeTimesheets';
import PayrollSummary from '../components/admin/PayrollSummary';
import MaterialRequestInbox from '../components/admin/MaterialRequestInbox';
import InvoiceManagement from '../components/admin/InvoiceManagement';
import JobsiteManagement from '../components/admin/JobsiteManagement';
import CompanySettings from '../components/admin/CompanySettings';
import UserSettings from '../components/common/UserSettings';
import AttentionReportsInbox from '../components/admin/AttentionReportsInbox';
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('dashboard');

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <AdminDashboardContent />;
      case 'employees':
        return <EmployeeManagement />;
      case 'employee-registration':
        return <EmployeeRegistration />;
      case 'timesheets':
        return <EmployeeTimesheets />;
      case 'payroll-summary':
        return <PayrollSummary />;
      case 'material-requests':
        return <MaterialRequestInbox />;
      case 'attention-reports':
        return <AttentionReportsInbox />;
      case 'invoices':
        return <InvoiceManagement />;
      case 'jobsites':
        return <JobsiteManagement />;
      case 'company-settings':
        return <CompanySettings />;
      case 'settings':
        return <UserSettings />;
      default:
        return <AdminDashboardContent />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <SidebarProvider>
        <div className="flex w-full min-h-screen">
          <AdminSidebar activeTab={activeTab} setActiveTab={setActiveTab} />
          <div className="flex-1 flex flex-col">
            <Header />
            <SidebarInset className="flex-1">
              <div className="p-6">
                <div className="flex items-center mb-8">
                  <SidebarTrigger className="mr-4" />
                  <div>
                    <h1 className="text-3xl font-bold text-slate-900 mb-2">Admin Dashboard</h1>
                    <p className="text-slate-600">Manage your company, employees, and payroll</p>
                  </div>
                </div>
                
                {renderContent()}
              </div>
            </SidebarInset>
          </div>
        </div>
      </SidebarProvider>
    </div>
  );
};

export default AdminDashboard;
