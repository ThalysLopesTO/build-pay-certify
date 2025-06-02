
import React, { useState } from 'react';
import Header from '../components/Header';
import PayrollSummary from '../components/admin/PayrollSummary';
import EmployeeManagement from '../components/admin/EmployeeManagement';
import MaterialRequestInbox from '../components/admin/MaterialRequestInbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DollarSign, Users, Building, Settings, Inbox } from 'lucide-react';

const AdminDashboard = () => {
  return (
    <div className="min-h-screen bg-slate-50">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Admin Dashboard</h1>
          <p className="text-slate-600">Manage payroll, employees, material requests, and project assignments</p>
        </div>
        
        <Tabs defaultValue="payroll" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5 lg:w-auto lg:grid-cols-5">
            <TabsTrigger value="payroll" className="flex items-center space-x-2">
              <DollarSign className="h-4 w-4" />
              <span>Payroll</span>
            </TabsTrigger>
            <TabsTrigger value="employees" className="flex items-center space-x-2">
              <Users className="h-4 w-4" />
              <span>Employees</span>
            </TabsTrigger>
            <TabsTrigger value="materials" className="flex items-center space-x-2">
              <Inbox className="h-4 w-4" />
              <span>Materials</span>
            </TabsTrigger>
            <TabsTrigger value="projects" className="flex items-center space-x-2">
              <Building className="h-4 w-4" />
              <span>Projects</span>
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center space-x-2">
              <Settings className="h-4 w-4" />
              <span>Settings</span>
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="payroll">
            <PayrollSummary />
          </TabsContent>
          
          <TabsContent value="employees">
            <EmployeeManagement />
          </TabsContent>
          
          <TabsContent value="materials">
            <MaterialRequestInbox />
          </TabsContent>
          
          <TabsContent value="projects">
            <div className="text-center py-12">
              <Building className="h-16 w-16 mx-auto mb-4 text-slate-300" />
              <h3 className="text-xl font-semibold mb-2">Project Management</h3>
              <p className="text-slate-600">Job site and project management features coming soon</p>
            </div>
          </TabsContent>
          
          <TabsContent value="settings">
            <div className="text-center py-12">
              <Settings className="h-16 w-16 mx-auto mb-4 text-slate-300" />
              <h3 className="text-xl font-semibold mb-2">System Settings</h3>
              <p className="text-slate-600">Application settings and configuration options coming soon</p>
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default AdminDashboard;
