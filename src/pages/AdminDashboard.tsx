
import React, { useState } from 'react';
import Header from '../components/Header';
import PayrollSummary from '../components/admin/PayrollSummary';
import EmployeeManagement from '../components/admin/EmployeeManagement';
import EmployeeRegistration from '../components/admin/EmployeeRegistration';
import MaterialRequestInbox from '../components/admin/MaterialRequestInbox';
import JobsiteManagement from '../components/admin/JobsiteManagement';
import InvoiceManagement from '../components/admin/InvoiceManagement';
import SystemSettings from '../components/admin/SystemSettings';
import AdminSidebar from '../components/admin/AdminSidebar';
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import { Building, Settings, Award, Home, AlertCircle } from 'lucide-react';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { Alert, AlertDescription } from '@/components/ui/alert';

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const { user } = useAuth();

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <div className="space-y-6">
            {/* Company Info Display */}
            {user?.companyName && (
              <div className="bg-white rounded-lg p-6 border">
                <div className="flex items-center space-x-3">
                  <Building className="h-6 w-6 text-orange-600" />
                  <div>
                    <h3 className="text-lg font-semibold">{user.companyName}</h3>
                    <p className="text-sm text-slate-600">Company ID: {user.companyId}</p>
                  </div>
                </div>
              </div>
            )}
            
            <div className="text-center py-12">
              <Home className="h-16 w-16 mx-auto mb-4 text-orange-600" />
              <h3 className="text-2xl font-semibold mb-2">Welcome to Admin Dashboard</h3>
              <p className="text-slate-600">Select an option from the sidebar to get started</p>
              {user?.companyName && (
                <p className="text-sm text-slate-500 mt-2">Managing: {user.companyName}</p>
              )}
            </div>
          </div>
        );
      case 'payroll':
        return <PayrollSummary />;
      case 'employees':
        return <EmployeeManagement />;
      case 'register':
        return <EmployeeRegistration />;
      case 'materials':
        return <MaterialRequestInbox />;
      case 'jobsites':
        return <JobsiteManagement />;
      case 'invoices':
        return <InvoiceManagement />;
      case 'certificates':
        return (
          <div className="text-center py-12">
            <Award className="h-16 w-16 mx-auto mb-4 text-slate-300" />
            <h3 className="text-xl font-semibold mb-2">Certificate Tracker</h3>
            <p className="text-slate-600">Employee certification tracking and management coming soon</p>
          </div>
        );
      case 'projects':
        return (
          <div className="text-center py-12">
            <Building className="h-16 w-16 mx-auto mb-4 text-slate-300" />
            <h3 className="text-xl font-semibold mb-2">Project Management</h3>
            <p className="text-slate-600">Job site and project management features coming soon</p>
          </div>
        );
      case 'settings':
        return <SystemSettings />;
      default:
        return (
          <div className="text-center py-12">
            <Home className="h-16 w-16 mx-auto mb-4 text-orange-600" />
            <h3 className="text-2xl font-semibold mb-2">Welcome to Admin Dashboard</h3>
            <p className="text-slate-600">Select an option from the sidebar to get started</p>
          </div>
        );
    }
  };

  // Show warning if company data is missing
  if (!user?.companyId || !user?.companyName) {
    return (
      <div className="min-h-screen bg-slate-50 p-6">
        <div className="max-w-2xl mx-auto">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-2">
                <p className="font-semibold">Company Information Missing</p>
                <p>Your account is not properly configured with company information. This may be due to:</p>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  <li>Missing company assignment in your user profile</li>
                  <li>Database migration issues</li>
                  <li>Incomplete user setup process</li>
                </ul>
                <p className="text-sm mt-2">Please contact your system administrator to resolve this issue.</p>
              </div>
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

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
                    <p className="text-slate-600">Manage payroll, employees, material requests, and jobsites</p>
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
