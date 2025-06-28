
import React, { useState } from 'react';
import Header from '../components/Header';
import TimesheetForm from '../components/employee/TimesheetForm';
import AttentionReportForm from '../components/employee/AttentionReportForm';
import MyAttentionReports from '../components/employee/MyAttentionReports';
import CertificateStatus from '../components/employee/CertificateStatus';
import CompanyRules from '../components/common/CompanyRules';
import UserSettings from '../components/common/UserSettings';
import LicenseWarningBanner from '../components/common/LicenseWarningBanner';
import EmployeeDashboardHome from '../components/employee/EmployeeDashboardHome';
import TimeTracker from '../components/employee/TimeTracker';
import EmployeeBottomNav from '../components/employee/EmployeeBottomNav';
import { useIsMobile } from '@/hooks/use-mobile';

const EmployeeDashboard = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const isMobile = useIsMobile();

  const handleNavigateToTab = (tab: string) => {
    setActiveTab(tab);
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <EmployeeDashboardHome onNavigateToTab={handleNavigateToTab} />;
      case 'time-tracker':
        return <TimeTracker />;
      case 'timesheet':
        return <TimesheetForm />;
      case 'attention-report':
        return <AttentionReportForm />;
      case 'my-reports':
        return <MyAttentionReports />;
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex flex-col">
      <Header />
      <div className={`flex-1 ${isMobile ? 'pb-20' : 'pb-6'} transition-all duration-300`}>
        <div className="max-w-4xl mx-auto px-2 py-4">
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
