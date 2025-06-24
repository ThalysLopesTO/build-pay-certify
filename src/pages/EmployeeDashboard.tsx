
import React, { useState } from 'react';
import Header from '../components/Header';
import TimesheetForm from '../components/employee/TimesheetForm';
import AttentionReportForm from '../components/employee/AttentionReportForm';
import MyAttentionReports from '../components/employee/MyAttentionReports';
import CertificateStatus from '../components/employee/CertificateStatus';
import CompanyRules from '../components/common/CompanyRules';
import UserSettings from '../components/common/UserSettings';
import LicenseWarningBanner from '../components/common/LicenseWarningBanner';
import CompanyHandbook from './CompanyHandbook';
import EmployeeDashboardHome from '../components/employee/EmployeeDashboardHome';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const EmployeeDashboard = () => {
  const [activeTab, setActiveTab] = useState('dashboard');

  const handleNavigateToTab = (tab: string) => {
    setActiveTab(tab);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Header />
      <div className="p-6">
        <div className="max-w-6xl mx-auto">
          {/* License Warning Banner */}
          <LicenseWarningBanner />

          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-8">
              <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
              <TabsTrigger value="timesheet">Timesheet</TabsTrigger>
              <TabsTrigger value="attention-report">Report Issue</TabsTrigger>
              <TabsTrigger value="my-reports">My Reports</TabsTrigger>
              <TabsTrigger value="certificates">Certificates</TabsTrigger>
              <TabsTrigger value="handbook">📘 Handbook</TabsTrigger>
              <TabsTrigger value="company-rules">Company Rules</TabsTrigger>
              <TabsTrigger value="settings">Settings</TabsTrigger>
            </TabsList>

            <TabsContent value="dashboard" className="space-y-6">
              <EmployeeDashboardHome onNavigateToTab={handleNavigateToTab} />
            </TabsContent>

            <TabsContent value="timesheet" className="space-y-6">
              <TimesheetForm />
            </TabsContent>

            <TabsContent value="attention-report" className="space-y-6">
              <AttentionReportForm />
            </TabsContent>

            <TabsContent value="my-reports" className="space-y-6">
              <MyAttentionReports />
            </TabsContent>

            <TabsContent value="certificates" className="space-y-6">
              <CertificateStatus />
            </TabsContent>

            <TabsContent value="handbook" className="space-y-6">
              <CompanyHandbook />
            </TabsContent>

            <TabsContent value="company-rules" className="space-y-6">
              <CompanyRules />
            </TabsContent>

            <TabsContent value="settings" className="space-y-6">
              <UserSettings />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default EmployeeDashboard;
