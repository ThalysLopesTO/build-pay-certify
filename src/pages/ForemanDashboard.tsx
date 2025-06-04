
import React, { useState } from 'react';
import Header from '../components/Header';
import MaterialRequestForm from '../components/foreman/MaterialRequestForm';
import ForemanTimesheetForm from '../components/foreman/ForemanTimesheetForm';
import EmployeeDirectory from '../components/foreman/EmployeeDirectory';
import MyMaterialRequests from '../components/foreman/MyMaterialRequests';
import ForemanSidebar from '../components/foreman/ForemanSidebar';
import AttentionReportsInbox from '../components/admin/AttentionReportsInbox';
import UserSettings from '../components/common/UserSettings';
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';

const ForemanDashboard = () => {
  const [activeTab, setActiveTab] = useState('timesheet');

  const renderContent = () => {
    switch (activeTab) {
      case 'timesheet':
        return <ForemanTimesheetForm />;
      case 'employees':
        return <EmployeeDirectory />;
      case 'materials':
        return (
          <div className="max-w-2xl">
            <MaterialRequestForm />
          </div>
        );
      case 'material-requests':
        return <MyMaterialRequests />;
      case 'attention-reports':
        return <AttentionReportsInbox />;
      case 'settings':
        return <UserSettings />;
      default:
        return <ForemanTimesheetForm />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <SidebarProvider>
        <div className="flex w-full min-h-screen">
          <ForemanSidebar activeTab={activeTab} setActiveTab={setActiveTab} />
          <div className="flex-1 flex flex-col">
            <Header />
            <SidebarInset className="flex-1">
              <div className="p-6">
                <div className="flex items-center mb-8">
                  <SidebarTrigger className="mr-4" />
                  <div>
                    <h1 className="text-3xl font-bold text-slate-900 mb-2">Foreman Dashboard</h1>
                    <p className="text-slate-600">Manage your team, timesheets, and material requests</p>
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

export default ForemanDashboard;
