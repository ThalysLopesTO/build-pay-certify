
import React, { useState } from 'react';
import { SidebarProvider } from '@/components/ui/sidebar';
import AdminSidebar from '@/components/admin/AdminSidebar';
import AdminDashboardContent from '@/components/admin/dashboard/AdminDashboardContent';
import EmployeeManagement from '@/components/admin/EmployeeManagement';
import EmployeeRegistration from '@/components/admin/EmployeeRegistration';
import JobsiteManagement from '@/components/admin/JobsiteManagement';
import SafetyTemplatesManagement from '@/components/admin/SafetyTemplatesManagement';
import InventoryManagement from '@/components/admin/InventoryManagement';
import SuppliersManagement from '@/components/admin/SuppliersManagement';
import EmployeeTimesheets from '@/components/admin/EmployeeTimesheets';
import PayrollSummary from '@/components/admin/PayrollSummary';
import MaterialRequestInbox from '@/components/admin/MaterialRequestInbox';
import AttentionReportsInbox from '@/components/admin/AttentionReportsInbox';
import InvoiceManagement from '@/components/admin/InvoiceManagement';
import CompanySettings from '@/components/admin/CompanySettings';
import UserSettings from '@/components/common/UserSettings';
import SystemSettings from '@/components/admin/SystemSettings';

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('dashboard');

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <AdminDashboardContent setActiveTab={setActiveTab} />;
      case 'employees':
        return <EmployeeManagement />;
      case 'employee-registration':
        return <EmployeeRegistration />;
      case 'jobsites':
        return <JobsiteManagement />;
      case 'safety-templates':
        return <SafetyTemplatesManagement />;
      case 'inventory':
        return <InventoryManagement />;
      case 'suppliers':
        return <SuppliersManagement />;
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
      <div className="flex h-screen bg-gray-50 w-full">
        <AdminSidebar activeTab={activeTab} setActiveTab={setActiveTab} />
        <main className="flex-1 overflow-auto min-w-0">
          <div className="p-6 w-full">
            {renderContent()}
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
};

export default AdminDashboard;
