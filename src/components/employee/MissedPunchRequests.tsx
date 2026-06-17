import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, AlertCircle } from 'lucide-react';
import MissedPunchRequestForm from './MissedPunchRequestForm';
import MissedPunchRequestsList from './MissedPunchRequestsList';
import EmployeePageHeader from './EmployeePageHeader';

const MissedPunchRequests = () => {
  const [activeTab, setActiveTab] = useState('list');

  const handleSubmitSuccess = () => {
    setActiveTab('list');
  };

  return (
    <div className="max-w-2xl mx-auto space-y-4 animate-fade-in">
      <EmployeePageHeader
        title="Missed Punch"
        subtitle="Request a clock correction"
        icon={AlertCircle}
        tone="red"
      />

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 h-11 rounded-xl bg-slate-100 p-1">
          <TabsTrigger value="list" className="rounded-lg text-sm">My Requests</TabsTrigger>
          <TabsTrigger value="new" className="rounded-lg text-sm">
            <Plus className="h-4 w-4 mr-1.5" />
            New
          </TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="mt-4">
          <section className="rounded-3xl bg-white border border-slate-200/70 shadow-sm p-4">
            <MissedPunchRequestsList />
          </section>
        </TabsContent>

        <TabsContent value="new" className="mt-4">
          <MissedPunchRequestForm onSuccess={handleSubmitSuccess} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default MissedPunchRequests;