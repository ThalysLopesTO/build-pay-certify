import React, { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Eye, Pencil, FileDown, Trash2, Loader2 } from 'lucide-react';
import { useManualTimesheets, type ManualTimesheet } from '@/hooks/useManualTimesheets';
import { useCompanyLogo } from '@/hooks/useCompanyLogo';
import { useCompanySettings } from '@/hooks/useCompanySettings';
import { formatDateLong } from '@/utils/manualTimesheetDays';
import { generateManualTimesheetPDF } from '@/utils/manualTimesheetPDF';
import { ManualTimesheetViewModal } from './ManualTimesheetViewModal';
import { ManualTimesheetEditModal } from './ManualTimesheetEditModal';
import { EmptyState } from './EmptyState';
import { Skeleton } from '@/components/ui/skeleton';

const formatCurrency = (n: number) =>
  Number(n).toLocaleString('en-US', { style: 'currency', currency: 'USD' });

export const ManualTimesheetsTable: React.FC = () => {
  const { list, remove } = useManualTimesheets();
  const { logoUrl } = useCompanyLogo();
  const { settings: companySettings } = useCompanySettings();

  const [viewing, setViewing] = useState<ManualTimesheet | null>(null);
  const [editing, setEditing] = useState<ManualTimesheet | null>(null);
  const [deleting, setDeleting] = useState<ManualTimesheet | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const handleDownload = async (ts: ManualTimesheet) => {
    setDownloadingId(ts.id);
    try {
      await generateManualTimesheetPDF(ts, {
        companyName: companySettings?.company_name ?? 'Company',
        logoUrl,
      });
    } finally {
      setDownloadingId(null);
    }
  };

  if (list.isLoading) {
    return (
      <Card className="p-4 space-y-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </Card>
    );
  }

  const items = list.data ?? [];
  if (items.length === 0) return <EmptyState />;

  return (
    <>
      {/* Desktop table */}
      <Card className="hidden md:block overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Employee</TableHead>
              <TableHead>Project</TableHead>
              <TableHead>Pay Period</TableHead>
              <TableHead className="text-right">Total Hours</TableHead>
              <TableHead className="text-right">Total Payment</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((ts) => (
              <TableRow key={ts.id}>
                <TableCell className="font-medium">
                  <div className="leading-tight">
                    <div>{ts.employee_name}</div>
                    {ts.employee_role && (
                      <div className="text-xs text-muted-foreground font-normal">{ts.employee_role}</div>
                    )}
                  </div>
                </TableCell>
                <TableCell>{ts.project_name}</TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {formatDateLong(ts.pay_period_start)} – {formatDateLong(ts.pay_period_end)}
                </TableCell>
                <TableCell className="text-right font-mono">
                  {Number(ts.total_hours).toFixed(2)}
                </TableCell>
                <TableCell className="text-right font-semibold">
                  {formatCurrency(Number(ts.total_payment))}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {new Date(ts.created_at).toLocaleDateString('en-US')}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    <Button size="icon" variant="ghost" onClick={() => setViewing(ts)} title="View">
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button size="icon" variant="ghost" onClick={() => setEditing(ts)} title="Edit">
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => handleDownload(ts)}
                      disabled={downloadingId === ts.id}
                      title="Download PDF"
                    >
                      {downloadingId === ts.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <FileDown className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => setDeleting(ts)}
                      title="Delete"
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      {/* Mobile cards */}
      <div className="md:hidden space-y-3">
        {items.map((ts) => (
          <Card key={ts.id} className="p-4 space-y-2">
            <div className="flex justify-between items-start">
              <div>
                <p className="font-semibold">{ts.employee_name}</p>
                {ts.employee_role && (
                  <p className="text-xs text-muted-foreground">{ts.employee_role}</p>
                )}
                <p className="text-sm text-muted-foreground">{ts.project_name}</p>
              </div>
              <p className="font-bold text-primary">{formatCurrency(Number(ts.total_payment))}</p>
            </div>
            <p className="text-xs text-muted-foreground">
              {formatDateLong(ts.pay_period_start)} – {formatDateLong(ts.pay_period_end)}
            </p>
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground">{Number(ts.total_hours).toFixed(2)} hrs</span>
              <div className="flex gap-1">
                <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setViewing(ts)}>
                  <Eye className="h-4 w-4" />
                </Button>
                <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setEditing(ts)}>
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8"
                  onClick={() => handleDownload(ts)}
                  disabled={downloadingId === ts.id}
                >
                  {downloadingId === ts.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <FileDown className="h-4 w-4" />
                  )}
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8 text-destructive"
                  onClick={() => setDeleting(ts)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <ManualTimesheetViewModal timesheet={viewing} onClose={() => setViewing(null)} />
      <ManualTimesheetEditModal timesheet={editing} onClose={() => setEditing(null)} />

      <AlertDialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this timesheet?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The record for{' '}
              <strong>{deleting?.employee_name}</strong> will be permanently deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (deleting) remove.mutate(deleting.id);
                setDeleting(null);
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
