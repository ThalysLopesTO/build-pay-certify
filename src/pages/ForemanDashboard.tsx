
import React from 'react';
import Header from '../components/Header';
import ForemanSidebar from '../components/foreman/ForemanSidebar';
import ForemanTimesheetForm from '../components/foreman/ForemanTimesheetForm';
import MaterialRequestForm from '../components/foreman/MaterialRequestForm';
import MyMaterialRequests from '../components/foreman/MyMaterialRequests';
import EmployeeDirectory from '../components/foreman/EmployeeDirectory';
import EmployeeReports from '../components/foreman/EmployeeReports';
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
      case 'employee-reports':
        return <EmployeeReports />;
      case 'company-rules':
        return <CompanyRules />;
      case 'settings':
        return <UserSettings />;
      default:
        return <ForemanTimesheetForm />;
    }
  };

  return (
    <SidebarProvider>
      <div className="flex min-h-screen bg-white w-full">
        <ForemanSidebar activeTab={activeTab} setActiveTab={setActiveTab} />
        <SidebarInset className="flex flex-col flex-1 min-w-0">
          <Header />
          <main className="flex-1 flex flex-col">
            <div className="flex-1 w-full">
              <div className="w-full p-6">
                <div className="flex items-center mb-6 w-full">
                  <SidebarTrigger className="mr-4 text-black hover:bg-gray-100" />
                </div>
                
                {/* License Warning Banner */}
                <div className="w-full mb-6">
                  <LicenseWarningBanner />
                </div>
                
                <div className="w-full">
                  {renderContent()}
                </div>
              </div>
            </div>
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};

export default ForemanDashboard;
