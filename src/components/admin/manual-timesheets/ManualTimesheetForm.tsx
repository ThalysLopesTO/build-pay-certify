import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Clock, Briefcase } from 'lucide-react';
import { HourlyTimesheetForm } from './HourlyTimesheetForm';

export const ManualTimesheetForm: React.FC = () => {
  const [type, setType] = useState<'hourly' | 'project'>('hourly');

  return (
    <div className="space-y-4">
      <Card className="p-4 md:p-5">
        <Label className="text-xs text-muted-foreground uppercase tracking-wide mb-3 block">
          Timesheet Type
        </Label>
        <Tabs value={type} onValueChange={(v) => setType(v as 'hourly' | 'project')}>
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="hourly" className="gap-2">
              <Clock className="h-4 w-4" /> Hourly
            </TabsTrigger>
            <TabsTrigger value="project" className="gap-2">
              <Briefcase className="h-4 w-4" /> Project
            </TabsTrigger>
          </TabsList>

          <TabsContent value="hourly" className="mt-6">
            <HourlyTimesheetForm />
          </TabsContent>

          <TabsContent value="project" className="mt-6">
            <Card className="p-10 text-center bg-muted/30 border-dashed">
              <Briefcase className="h-10 w-10 mx-auto mb-3 text-muted-foreground opacity-40" />
              <h3 className="font-semibold mb-1">Project Timesheets — Coming Soon</h3>
              <p className="text-sm text-muted-foreground">
                Project-based timesheet creation will be available in an upcoming release.
              </p>
            </Card>
          </TabsContent>
        </Tabs>
      </Card>
    </div>
  );
};
