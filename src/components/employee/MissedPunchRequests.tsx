import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Clock } from 'lucide-react';
import MissedPunchRequestForm from './MissedPunchRequestForm';
import MissedPunchRequestsList from './MissedPunchRequestsList';

const MissedPunchRequests = () => {
  const [activeTab, setActiveTab] = useState('list');

  const handleSubmitSuccess = () => {
    setActiveTab('list');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Clock className="h-6 w-6" />
          Missed Punch Requests
        </h1>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="list">My Requests</TabsTrigger>
          <TabsTrigger value="new">
            <Plus className="h-4 w-4 mr-2" />
            New Request
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="list" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Your Missed Punch Requests</CardTitle>
            </CardHeader>
            <CardContent>
              <MissedPunchRequestsList />
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="new" className="space-y-4">
          <MissedPunchRequestForm onSuccess={handleSubmitSuccess} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default MissedPunchRequests;