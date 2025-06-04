import React, { useState } from 'react';
import { SidebarProvider } from '@/components/ui/sidebar';
import AdminSidebar from '@/components/admin/AdminSidebar';
import Header from '@/components/Header';
import AdminDashboardContent from '@/components/admin/dashboard/AdminDashboardContent';
import PayrollSummary from '@/components/admin/PayrollSummary';
import EmployeeManagement from '@/components/admin/EmployeeManagement';
import EmployeeRegistration from '@/components/admin/EmployeeRegistration';
import JobsiteManagement from '@/components/admin/JobsiteManagement';
import MaterialRequestInbox from '@/components/admin/MaterialRequestInbox';
import InvoiceManagement from '@/components/admin/InvoiceManagement';
import InvoiceTracker from '@/components/admin/InvoiceTracker';
import ProjectBillingOverview from '@/components/admin/ProjectBillingOverview';
import CompanySettings from '@/components/admin/CompanySettings';
import SystemSettings from '@/components/admin/SystemSettings';
import EmployeeTimesheets from '@/components/admin/EmployeeTimesheets';
import { useAuth } from '@/contexts/SupabaseAuthContext';

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const { user } = useAuth();

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <AdminDashboardContent setActiveTab={setActiveTab} />;
      case 'payroll-summary':
        return <PayrollSummary />;
      case 'employee-timesheets':
        return <EmployeeTimesheets />;
      case 'employee-management':
        return <EmployeeManagement />;
      case 'employee-registration':
        return <EmployeeRegistration />;
      case 'jobsite-management':
        return <JobsiteManagement />;
      case 'material-requests':
        return <MaterialRequestInbox />;
      case 'invoice-management':
        return <InvoiceManagement />;
      case 'invoice-tracker':
        return <InvoiceTracker />;
      case 'project-billing':
        return <ProjectBillingOverview />;
      case 'company-settings':
        return <CompanySettings />;
      case 'system-settings':
        return <SystemSettings />;
      default:
        return <AdminDashboardContent setActiveTab={setActiveTab} />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <SidebarProvider>
        <div className="flex w-full">
          <AdminSidebar activeTab={activeTab} setActiveTab={setActiveTab} />
          <div className="flex-1 flex flex-col">
            <Header />
            <main className="flex-1">
              {renderContent()}
            </main>
          </div>
        </div>
      </SidebarProvider>
    </div>
  );
};

export default AdminDashboard;
