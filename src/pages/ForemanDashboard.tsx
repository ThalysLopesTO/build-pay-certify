
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
import { useCompanyLogo } from '@/hooks/useCompanyLogo';
import { Building } from 'lucide-react';

const ForemanDashboard = () => {
  const [activeTab, setActiveTab] = useState('timesheet');
  const { logoUrl, isLoading } = useCompanyLogo();

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
    <SidebarProvider>
      <div className="flex min-h-screen bg-white w-full">
        <ForemanSidebar activeTab={activeTab} setActiveTab={setActiveTab} />
        <SidebarInset className="flex flex-col flex-1 min-w-0">
          <Header />
          <main className="flex-1 flex flex-col">
            {/* Company Logo Section */}
            {!isLoading && logoUrl && (
              <div className="w-full border-b border-gray-200 bg-white">
                <div className="flex justify-center py-6 px-6">
                  <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-4 max-w-md">
                    <img
                      src={logoUrl}
                      alt="Company Logo"
                      className="max-w-[400px] max-h-[70px] w-auto h-auto object-contain mx-auto"
                      style={{ maxWidth: '400px', maxHeight: '70px' }}
                    />
                  </div>
                </div>
              </div>
            )}
            
            <div className="flex-1 w-full">
              <div className="w-full p-6">
                <div className="flex items-center mb-8 w-full">
                  <SidebarTrigger className="mr-4 text-black hover:bg-gray-100" />
                  <div className="flex-1">
                    <h1 className="text-3xl font-bold text-black mb-2">Foreman Dashboard</h1>
                    <p className="text-gray-600">Manage your crew and submit requests</p>
                  </div>
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
