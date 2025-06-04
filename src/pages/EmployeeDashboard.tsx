
import React, { useState } from 'react';
import Header from '../components/Header';
import TimesheetForm from '../components/employee/TimesheetForm';
import CertificateStatus from '../components/employee/CertificateStatus';
import AttentionReportForm from '../components/employee/AttentionReportForm';
import MyAttentionReports from '../components/employee/MyAttentionReports';
import UserSettings from '../components/common/UserSettings';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Clock, AlertTriangle, FileText, Settings } from 'lucide-react';

const EmployeeDashboard = () => {
  const [activeTab, setActiveTab] = useState('timesheet');

  const renderContent = () => {
    switch (activeTab) {
      case 'timesheet':
        return <TimesheetForm />;
      case 'attention-report':
        return <AttentionReportForm />;
      case 'my-reports':
        return <MyAttentionReports />;
      case 'settings':
        return <UserSettings />;
      default:
        return <TimesheetForm />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Employee Dashboard</h1>
          <p className="text-slate-600">Manage your timesheets, reports, and account settings</p>
        </div>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4">
            <TabsTrigger value="timesheet" className="flex items-center space-x-2">
              <Clock className="h-4 w-4" />
              <span>Timesheet</span>
            </TabsTrigger>
            <TabsTrigger value="attention-report" className="flex items-center space-x-2">
              <AlertTriangle className="h-4 w-4" />
              <span>Attention Report</span>
            </TabsTrigger>
            <TabsTrigger value="my-reports" className="flex items-center space-x-2">
              <FileText className="h-4 w-4" />
              <span>My Reports</span>
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center space-x-2">
              <Settings className="h-4 w-4" />
              <span>Settings</span>
            </TabsTrigger>
          </TabsList>

          <div className="mt-6">
            <TabsContent value="timesheet">
              <div className="space-y-8">
                <TimesheetForm />
                <CertificateStatus />
              </div>
            </TabsContent>
            
            <TabsContent value="attention-report">
              <AttentionReportForm />
            </TabsContent>
            
            <TabsContent value="my-reports">
              <MyAttentionReports />
            </TabsContent>
            
            <TabsContent value="settings">
              <UserSettings />
            </TabsContent>
          </div>
        </Tabs>
      </main>
    </div>
  );
};

export default EmployeeDashboard;
