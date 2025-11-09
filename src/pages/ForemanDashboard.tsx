
import React, { useEffect, useMemo, useState } from 'react';
import Header from '../components/Header';
import ForemanSidebar from '../components/foreman/ForemanSidebar';
import ForemanDashboardHome from '../components/foreman/dashboard/ForemanDashboardHome';
import ForemanTimesheetForm from '../components/foreman/ForemanTimesheetForm';
import MaterialRequestForm from '../components/foreman/MaterialRequestForm';
import TimeTracker from '../components/employee/TimeTracker';
import MyMaterialRequests from '../components/foreman/MyMaterialRequests';
import EmployeeDirectory from '../components/foreman/EmployeeDirectory';
import EmployeeReports from '../components/foreman/EmployeeReports';
import JobsiteProgress from '../components/foreman/JobsiteProgress';
import EmployeeRegistration from '../components/admin/EmployeeRegistration';
import LivePunchMonitor from '../components/admin/LivePunchMonitor';
import CompanyRules from '../components/common/CompanyRules';
import UserSettings from '../components/common/UserSettings';
import LicenseWarningBanner from '../components/common/LicenseWarningBanner';
import MyTimesheetHistory from '../components/common/MyTimesheetHistory';
import ChangeOrdersPage from '@/components/admin/ChangeOrdersPage';
import ForemanDailyReports from '../components/foreman/ForemanDailyReports';
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import EquipmentManagement from '../components/admin/inventory/EquipmentManagement';
import { JobsiteSelectionScreen } from '../components/admin/tasks/JobsiteSelectionScreen';
import { useParams } from 'react-router-dom';

const ForemanDashboard = () => {
  const params = useParams();
  const preopenRequestId = params.requestId as string | undefined;
  const [activeTab, setActiveTab] = useState(preopenRequestId ? 'my-requests' : 'dashboard');

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <ForemanDashboardHome setActiveTab={setActiveTab} />;
      case 'time-tracker':
        return <TimeTracker />;
      case 'timesheet':
        return <ForemanTimesheetForm />;
      case 'material-request':
        return <MaterialRequestForm />;
      case 'my-requests':
        return <MyMaterialRequests initialOpenRequestId={preopenRequestId} />;
      case 'inventory':
        return <EquipmentManagement />;
      case 'change-orders':
        return <ChangeOrdersPage />;
      case 'daily-tasks':
        return <JobsiteSelectionScreen />;
      case 'employees':
        return <EmployeeDirectory />;
      case 'employee-registration':
        return <EmployeeRegistration />;
      case 'live-punch-monitor':
        return <LivePunchMonitor />;
      case 'my-timesheet-history':
        return <MyTimesheetHistory />;
      case 'daily-reports':
        return <ForemanDailyReports />;
      case 'employee-reports':
        return <EmployeeReports />;
      case 'jobsite-progress':
        return <JobsiteProgress />;
      case 'company-rules':
        return <CompanyRules />;
      case 'settings':
        return <UserSettings />;
      default:
        return <ForemanDashboardHome setActiveTab={setActiveTab} />;
    }
  };

  return (
    <SidebarProvider>
      <div className="flex min-h-screen bg-background w-full overflow-x-hidden">
        <ForemanSidebar activeTab={activeTab} setActiveTab={setActiveTab} />
        <SidebarInset className="flex flex-col flex-1 min-w-0">
          <Header />
          <main className="flex-1 flex flex-col bg-background">
            <div className="flex-1 w-full">
              <div className="w-full p-3 md:p-6">
                <div className="flex items-center mb-6 w-full">
                  <SidebarTrigger className="mr-4 text-foreground hover:bg-muted transition-colors" />
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
