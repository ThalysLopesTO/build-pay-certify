import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileText, Clock } from 'lucide-react';
import MyAttentionReports from './MyAttentionReports';
import MyTimesheetHistory from '../common/MyTimesheetHistory';

const MyReports = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-2">
        <FileText className="h-6 w-6" />
        <h2 className="text-2xl font-bold">My Reports</h2>
      </div>

      <Tabs defaultValue="timesheets" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="timesheets" className="flex items-center space-x-2">
            <Clock className="h-4 w-4" />
            <span>Timesheet History</span>
          </TabsTrigger>
          <TabsTrigger value="attention" className="flex items-center space-x-2">
            <FileText className="h-4 w-4" />
            <span>Attention Reports</span>
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="timesheets" className="mt-6">
          <MyTimesheetHistory />
        </TabsContent>
        
        <TabsContent value="attention" className="mt-6">
          <MyAttentionReports />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default MyReports;