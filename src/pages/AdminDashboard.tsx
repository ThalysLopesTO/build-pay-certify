
import React, { useState } from 'react';
import Header from '../components/Header';
import PayrollSummary from '../components/admin/PayrollSummary';
import EmployeeManagement from '../components/admin/EmployeeManagement';
import EmployeeRegistration from '../components/admin/EmployeeRegistration';
import MaterialRequestInbox from '../components/admin/MaterialRequestInbox';
import JobsiteManagement from '../components/admin/JobsiteManagement';
import AdminSidebar from '../components/admin/AdminSidebar';
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import { Building, Settings, Award, Home } from 'lucide-react';

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('dashboard');

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <div className="text-center py-12">
            <Home className="h-16 w-16 mx-auto mb-4 text-orange-600" />
            <h3 className="text-2xl font-semibold mb-2">Welcome to Admin Dashboard</h3>
            <p className="text-slate-600">Select an option from the sidebar to get started</p>
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
        return (
          <div className="text-center py-12">
            <Settings className="h-16 w-16 mx-auto mb-4 text-slate-300" />
            <h3 className="text-xl font-semibold mb-2">System Settings</h3>
            <p className="text-slate-600">Application settings and configuration options coming soon</p>
          </div>
        );
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
