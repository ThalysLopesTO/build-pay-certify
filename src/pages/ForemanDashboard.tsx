
import React from 'react';
import Header from '../components/Header';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import MaterialRequestForm from '../components/foreman/MaterialRequestForm';
import ForemanTimesheetForm from '../components/foreman/ForemanTimesheetForm';
import EmployeeDirectory from '../components/foreman/EmployeeDirectory';
import { Clock, Users, Package } from 'lucide-react';

const ForemanDashboard = () => {
  return (
    <div className="min-h-screen bg-slate-50">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Foreman Dashboard</h1>
          <p className="text-slate-600">Manage your team, timesheets, and material requests</p>
        </div>
        
        <Tabs defaultValue="timesheet" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-8">
            <TabsTrigger value="timesheet" className="flex items-center space-x-2">
              <Clock className="h-4 w-4" />
              <span>Submit Weekly Timesheet</span>
            </TabsTrigger>
            <TabsTrigger value="employees" className="flex items-center space-x-2">
              <Users className="h-4 w-4" />
              <span>Employee Directory</span>
            </TabsTrigger>
            <TabsTrigger value="materials" className="flex items-center space-x-2">
              <Package className="h-4 w-4" />
              <span>Request Material Delivery</span>
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="timesheet">
            <ForemanTimesheetForm />
          </TabsContent>
          
          <TabsContent value="employees">
            <EmployeeDirectory />
          </TabsContent>
          
          <TabsContent value="materials">
            <div className="max-w-2xl">
              <MaterialRequestForm />
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default ForemanDashboard;
