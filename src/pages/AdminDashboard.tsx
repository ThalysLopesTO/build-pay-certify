
import React, { useState } from 'react';
import { SidebarProvider } from '@/components/ui/sidebar';
import AdminSidebar from '@/components/admin/AdminSidebar';
import Header from '@/components/Header';
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
import LicenseRequests from '@/components/admin/LicenseRequests';
import SuperAdminDashboard from './SuperAdminDashboard';
import { useAuth } from '@/contexts/SupabaseAuthContext';

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const { user } = useAuth();

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <div className="p-6">
            <h1 className="text-2xl font-bold mb-6">Admin Dashboard</h1>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-lg font-semibold mb-2">Quick Stats</h3>
                <p className="text-gray-600">Dashboard overview coming soon...</p>
              </div>
            </div>
          </div>
        );
      case 'super-admin':
        if (user?.role === 'super_admin') {
          return <SuperAdminDashboard />;
        }
        return (
          <div className="p-6">
            <div className="text-center text-red-600">
              <h2 className="text-xl font-bold mb-2">Access Denied</h2>
              <p>You do not have permission to access the Super Admin Panel.</p>
            </div>
          </div>
        );
      case 'payroll-summary':
        return <PayrollSummary />;
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
      case 'license-requests':
        return <LicenseRequests />;
      default:
        return (
          <div className="p-6">
            <h1 className="text-2xl font-bold mb-6">Admin Dashboard</h1>
            <p>Select a section from the sidebar to get started.</p>
          </div>
        );
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
