import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Clock, CalendarDays, List, FolderCheck, FileClock } from 'lucide-react';
import { HourlyTimesheetForm } from './HourlyTimesheetForm';
import { DailySheetForm } from './DailySheetForm';
import { SavedDailySheetsTable } from './SavedDailySheetsTable';
import { ManualTimesheetsTable } from './ManualTimesheetsTable';
import { ApprovedTimesheetsTab } from './ApprovedTimesheetsTab';
import { useManualTimesheets } from '@/hooks/useManualTimesheets';
import { useTimesheetFolders } from '@/hooks/useTimesheetFolders';
import { useDailySheets, type DailySheet } from '@/hooks/useDailySheets';

type TabValue = 'hourly' | 'daily' | 'saved-daily' | 'all' | 'approved';

export const ManualTimesheetForm: React.FC = () => {
  const [type, setType] = useState<TabValue>('hourly');
  const [editingSheet, setEditingSheet] = useState<DailySheet | null>(null);

  const { list } = useManualTimesheets();
  const { list: foldersList } = useTimesheetFolders();
  const { list: dailySheetsList } = useDailySheets();
  const count = list.data?.length ?? 0;
  const folderCount = foldersList.data?.length ?? 0;
  const dailyCount = dailySheetsList.data?.length ?? 0;

  const handleLoadSheet = (sheet: DailySheet) => {
    setEditingSheet(sheet);
    setType('daily');
  };

  return (
    <div className="space-y-4">
      <Card className="p-4 md:p-5">
        <Label className="text-xs text-muted-foreground uppercase tracking-wide mb-3 block">
          Timesheet
        </Label>
        <Tabs value={type} onValueChange={(v) => setType(v as TabValue)}>
          <TabsList className="grid w-full max-w-4xl grid-cols-2 sm:grid-cols-5 h-auto">
            <TabsTrigger value="hourly" className="gap-2">
              <Clock className="h-4 w-4" /> Hourly
            </TabsTrigger>
            <TabsTrigger value="daily" className="gap-2">
              <CalendarDays className="h-4 w-4" /> Daily Sheet
            </TabsTrigger>
            <TabsTrigger value="saved-daily" className="gap-2">
              <FileClock className="h-4 w-4" /> Saved Sheets
              {dailyCount > 0 && (
                <span className="ml-1 rounded-full bg-primary/10 text-primary text-xs px-1.5 py-0.5">
                  {dailyCount}
                </span>
              )}
            </TabsTrigger>

            <TabsTrigger value="all" className="gap-2">
              <List className="h-4 w-4" /> All Timesheets
              {count > 0 && (
                <span className="ml-1 rounded-full bg-primary/10 text-primary text-xs px-1.5 py-0.5">
                  {count}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="approved" className="gap-2">
              <FolderCheck className="h-4 w-4" /> Approved Timesheets
              {folderCount > 0 && (
                <span className="ml-1 rounded-full bg-primary/10 text-primary text-xs px-1.5 py-0.5">
                  {folderCount}
                </span>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="hourly" className="mt-6">
            <HourlyTimesheetForm />
          </TabsContent>

          <TabsContent value="daily" className="mt-6">
            <DailySheetForm
              editingSheet={editingSheet}
              onSaved={() => setEditingSheet(null)}
            />
          </TabsContent>

          <TabsContent value="saved-daily" className="mt-6">
            <SavedDailySheetsTable onLoadSheet={handleLoadSheet} />
          </TabsContent>

          <TabsContent value="all" className="mt-6">
            <ManualTimesheetsTable />
          </TabsContent>

          <TabsContent value="approved" className="mt-6">
            <ApprovedTimesheetsTab />
          </TabsContent>
        </Tabs>
      </Card>
    </div>
  );
};
