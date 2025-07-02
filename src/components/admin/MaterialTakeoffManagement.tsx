
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText } from 'lucide-react';
import MaterialTakeoffNotesTable from './material-takeoff/MaterialTakeoffNotesTable';

const MaterialTakeoffManagement = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Material Takeoff Management</h1>
          <p className="text-muted-foreground">
            Manage material takeoff notes for your jobsites with free-form text entries
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <FileText className="h-5 w-5" />
            <span>Material Takeoff Notes</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <MaterialTakeoffNotesTable />
        </CardContent>
      </Card>
    </div>
  );
};

export default MaterialTakeoffManagement;
