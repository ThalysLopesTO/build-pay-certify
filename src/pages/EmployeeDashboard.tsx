
import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import Header from '../components/Header';
import TimesheetForm from '../components/employee/TimesheetForm';
import AttentionReportForm from '../components/employee/AttentionReportForm';
import MyReports from '../components/employee/MyReports';
import CertificateStatus from '../components/employee/CertificateStatus';
import MissedPunchRequests from '../components/employee/MissedPunchRequests';
import CompanyRules from '../components/common/CompanyRules';
import UserSettings from '../components/common/UserSettings';
import LicenseWarningBanner from '../components/common/LicenseWarningBanner';
import EmployeeDashboardHome from '../components/employee/EmployeeDashboardHome';
import TimeTracker from '../components/employee/TimeTracker';
import EmployeeBottomNav from '../components/employee/EmployeeBottomNav';
import EmployeeDesktopNav from '../components/employee/EmployeeDesktopNav';
import { JobsiteSelectionScreen } from '../components/admin/tasks/JobsiteSelectionScreen';
import { DailyTaskScreen } from '../components/admin/tasks/DailyTaskScreen';
import { useIsMobile } from '@/hooks/use-mobile';
import ErrorBoundary from '@/components/common/ErrorBoundary';


const EmployeeDashboard = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [searchParams] = useSearchParams();
  const isMobile = useIsMobile();

  const handleNavigateToTab = (tab: string) => {
    setActiveTab(tab);
  };

  const renderContent = () => {
    const jobsiteId = searchParams.get('jobsite');
    
    switch (activeTab) {
      case 'dashboard':
        return <EmployeeDashboardHome onNavigateToTab={handleNavigateToTab} />;
      case 'tasks':
      case 'daily-tasks':
        return jobsiteId ? <DailyTaskScreen /> : <JobsiteSelectionScreen />;
      case 'time-tracker':
        return <TimeTracker />;
      case 'timesheet':
        return <TimesheetForm />;
      case 'missed-punch-requests':
        return <MissedPunchRequests />;
      case 'attention-report':
        return <AttentionReportForm />;
      case 'my-reports':
        return <MyReports />;
      case 'certificates':
        return <CertificateStatus />;
      case 'company-rules':
        return <CompanyRules />;
      case 'settings':
        return <UserSettings />;
      default:
        return <EmployeeDashboardHome onNavigateToTab={handleNavigateToTab} />;
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col transition-colors overflow-x-hidden">
      <ErrorBoundary fallbackMinimal><Header /></ErrorBoundary>
      <ErrorBoundary fallbackMinimal><EmployeeDesktopNav activeTab={activeTab} onTabChange={setActiveTab} /></ErrorBoundary>
      <div className={`flex-1 ${isMobile ? 'pb-20' : 'pb-6'} transition-all duration-300`}>
        <div className="max-w-4xl mx-auto px-2 md:px-4 py-4 max-w-full">
          <LicenseWarningBanner />
          <div className="space-y-6">
            {renderContent()}
          </div>
        </div>
      </div>
      {isMobile && (
        <EmployeeBottomNav 
          activeTab={activeTab} 
          onTabChange={setActiveTab} 
        />
      )}
    </div>
  );
};

export default EmployeeDashboard;
