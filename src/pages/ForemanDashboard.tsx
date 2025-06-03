
import React, { useState } from 'react';
import Header from '../components/Header';
import MaterialRequestForm from '../components/foreman/MaterialRequestForm';
import ForemanTimesheetForm from '../components/foreman/ForemanTimesheetForm';
import EmployeeDirectory from '../components/foreman/EmployeeDirectory';
import ForemanSidebar from '../components/foreman/ForemanSidebar';
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import { Inbox } from 'lucide-react';

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
        return (
          <div className="text-center py-12">
            <Inbox className="h-16 w-16 mx-auto mb-4 text-slate-300" />
            <h3 className="text-xl font-semibold mb-2">My Material Requests</h3>
            <p className="text-slate-600">View and track your submitted material requests</p>
          </div>
        );
      default:
        return <ForemanTimesheetForm />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Header />
      
      <SidebarProvider>
        <div className="flex w-full">
          <ForemanSidebar activeTab={activeTab} setActiveTab={setActiveTab} />
          <SidebarInset>
            <div className="container mx-auto px-4 py-8">
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
      </SidebarProvider>
    </div>
  );
};

export default ForemanDashboard;
