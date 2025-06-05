
import React, { useState } from 'react';
import Header from '../components/Header';
import TimesheetForm from '../components/employee/TimesheetForm';
import AttentionReportForm from '../components/employee/AttentionReportForm';
import MyAttentionReports from '../components/employee/MyAttentionReports';
import CertificateStatus from '../components/employee/CertificateStatus';
import UserSettings from '../components/common/UserSettings';
import LicenseWarningBanner from '../components/common/LicenseWarningBanner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const EmployeeDashboard = () => {
  return (
    <div className="min-h-screen bg-slate-50">
      <Header />
      <div className="p-6">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-slate-900 mb-2">Employee Dashboard</h1>
            <p className="text-slate-600">Submit timesheets and manage your information</p>
          </div>

          {/* License Warning Banner */}
          <LicenseWarningBanner />

          <Tabs defaultValue="timesheet" className="space-y-6">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="timesheet">Timesheet</TabsTrigger>
              <TabsTrigger value="attention-report">Report Issue</TabsTrigger>
              <TabsTrigger value="my-reports">My Reports</TabsTrigger>
              <TabsTrigger value="certificates">Certificates</TabsTrigger>
              <TabsTrigger value="settings">Settings</TabsTrigger>
            </TabsList>

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
