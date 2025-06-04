
import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import CreateInvoiceForm from './CreateInvoiceForm';
import InvoiceTracker from './InvoiceTracker';
import ProjectBillingOverview from './ProjectBillingOverview';
import { FileText, Plus, BarChart3 } from 'lucide-react';

const InvoiceManagement = () => {
  const [activeTab, setActiveTab] = useState('create');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Invoice Management</h1>
          <p className="text-slate-600">Create, track, and manage client invoices for your construction projects</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="create" className="flex items-center space-x-2">
            <Plus className="h-4 w-4" />
            <span>Create Invoice</span>
          </TabsTrigger>
          <TabsTrigger value="tracker" className="flex items-center space-x-2">
            <FileText className="h-4 w-4" />
            <span>Invoice Tracker</span>
          </TabsTrigger>
          <TabsTrigger value="overview" className="flex items-center space-x-2">
            <BarChart3 className="h-4 w-4" />
            <span>Project Budgets</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="create">
          <CreateInvoiceForm />
        </TabsContent>

        <TabsContent value="tracker">
          <InvoiceTracker />
        </TabsContent>

        <TabsContent value="overview">
          <ProjectBillingOverview />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default InvoiceManagement;
