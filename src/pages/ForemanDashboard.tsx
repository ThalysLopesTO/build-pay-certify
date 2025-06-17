
import React from 'react';
import Header from '../components/Header';
import ForemanSidebar from '../components/foreman/ForemanSidebar';
import ForemanTimesheetForm from '../components/foreman/ForemanTimesheetForm';
import MaterialRequestForm from '../components/foreman/MaterialRequestForm';
import MyMaterialRequests from '../components/foreman/MyMaterialRequests';
import EmployeeDirectory from '../components/foreman/EmployeeDirectory';
import CompanyRules from '../components/common/CompanyRules';
import UserSettings from '../components/common/UserSettings';
import LicenseWarningBanner from '../components/common/LicenseWarningBanner';
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import { useState } from 'react';

const ForemanDashboard = () => {
  const [activeTab, setActiveTab] = useState('timesheet');

  const renderContent = () => {
    switch (activeTab) {
      case 'timesheet':
        return <ForemanTimesheetForm />;
      case 'material-request':
        return <MaterialRequestForm />;
      case 'my-requests':
        return <MyMaterialRequests />;
      case 'employees':
        return <EmployeeDirectory />;
      case 'company-rules':
        return <CompanyRules />;
      case 'settings':
        return <UserSettings />;
      default:
        return <ForemanTimesheetForm />;
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <SidebarProvider>
        <div className="flex w-full min-h-screen">
          <ForemanSidebar activeTab={activeTab} setActiveTab={setActiveTab} />
          <SidebarInset className="flex-1 flex flex-col min-w-0">
            <Header />
            <div className="flex-1 p-6">
              <div className="flex items-center mb-8">
                <SidebarTrigger className="mr-4 text-black hover:bg-gray-100" />
                <div>
                  <h1 className="text-3xl font-bold text-black mb-2">Foreman Dashboard</h1>
                  <p className="text-gray-600">Manage your crew and submit requests</p>
                </div>
              </div>
              
              {/* License Warning Banner */}
              <LicenseWarningBanner />
              
              {renderContent()}
            </div>
          </SidebarInset>
        </div>
      </SidebarProvider>
    </div>
  );
};

export default ForemanDashboard;
