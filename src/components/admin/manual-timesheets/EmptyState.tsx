import React from 'react';
import { Card } from '@/components/ui/card';
import { ClipboardList } from 'lucide-react';

export const EmptyState: React.FC = () => (
  <Card className="p-10 text-center bg-muted/30 border-dashed">
    <ClipboardList className="h-10 w-10 mx-auto mb-3 text-muted-foreground opacity-40" />
    <h3 className="font-semibold mb-1">No timesheets yet</h3>
    <p className="text-sm text-muted-foreground">
      Use the form above to create your first manual timesheet.
    </p>
  </Card>
);
