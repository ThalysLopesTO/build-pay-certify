
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
          <div className="flex-1 flex flex-col">
            <Header />
            <SidebarInset className="flex-1">
              <div className="p-6">
                <div className="flex items-center mb-8">
                  <SidebarTrigger className="mr-4" />
                  <div>
                    <h1 className="text-3xl font-bold text-black mb-2">Foreman Dashboard</h1>
                    <p className="text-gray-600">Manage your crew and submit requests</p>
                  </div>
                </div>
                
                {/* License Warning Banner */}
                <LicenseWarningBanner />
                
                <div className="card-modern p-6">
                  {renderContent()}
                </div>
              </div>
            </SidebarInset>
          </div>
        </div>
      </SidebarProvider>
    </div>
  );
};

export default ForemanDashboard;
