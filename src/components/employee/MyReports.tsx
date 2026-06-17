import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileText, Clock, ScrollText } from 'lucide-react';
import MyAttentionReports from './MyAttentionReports';
import MyTimesheetHistory from '../common/MyTimesheetHistory';
import EmployeePageHeader from './EmployeePageHeader';

const MyReports = () => {
  return (
    <div className="max-w-2xl mx-auto space-y-4 animate-fade-in">
      <EmployeePageHeader
        title="My Reports"
        subtitle="Timesheet & attention history"
        icon={ScrollText}
        tone="blue"
      />

      <Tabs defaultValue="timesheets" className="w-full">
        <TabsList className="grid w-full grid-cols-2 h-11 rounded-xl bg-slate-100 p-1">
          <TabsTrigger value="timesheets" className="rounded-lg text-sm">
            <Clock className="h-4 w-4 mr-1.5" />
            Timesheets
          </TabsTrigger>
          <TabsTrigger value="attention" className="rounded-lg text-sm">
            <FileText className="h-4 w-4 mr-1.5" />
            Reports
          </TabsTrigger>
        </TabsList>

        <TabsContent value="timesheets" className="mt-4">
          <MyTimesheetHistory />
        </TabsContent>

        <TabsContent value="attention" className="mt-4">
          <MyAttentionReports />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default MyReports;