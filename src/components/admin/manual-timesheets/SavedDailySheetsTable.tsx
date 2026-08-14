import React, { useMemo, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
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
import { CalendarDays, Download, Loader2, Pencil, Search, Trash2, Users } from 'lucide-react';
import { toast } from 'sonner';

import { useDailySheets, type DailySheet } from '@/hooks/useDailySheets';
import { useCompanyLogo } from '@/hooks/useCompanyLogo';
import { useCompanySettings } from '@/hooks/useCompanySettings';
import { generateDailySheetPDF } from '@/utils/dailySheetPDF';
import { formatDateLongLocal } from '@/utils/dailySheetTime';

interface Props {
  onLoadSheet?: (sheet: DailySheet) => void;
}

export const SavedDailySheetsTable: React.FC<Props> = ({ onLoadSheet }) => {
  const { list, remove } = useDailySheets();
  const { logoUrl } = useCompanyLogo();
  const { settings: companySettings } = useCompanySettings();

  const [search, setSearch] = useState('');
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<DailySheet | null>(null);

  const sheets = useMemo(() => {
    const term = search.trim().toLowerCase();
    const rows = list.data ?? [];
    if (!term) return rows;
    return rows.filter(
      s =>
        s.project_name.toLowerCase().includes(term) ||
        (s.crew ?? []).some(c => (c.name ?? '').toLowerCase().includes(term))
    );
  }, [list.data, search]);

  const handleDownload = async (sheet: DailySheet) => {
    setDownloadingId(sheet.id);
    try {
      const d = sheet.job_details ?? {};
      await generateDailySheetPDF(
        {
          projectName: sheet.project_name,
          date: sheet.sheet_date,
          crew: sheet.crew ?? [],
          notes: sheet.notes ?? '',
          poBuilder: d.poBuilder ?? '',
          jobName: d.jobName ?? '',
          siteAddress: d.siteAddress ?? '',
          supervisor: d.supervisor ?? '',
          weather: (d.weather ?? '') as any,
          safetyMeeting: (d.safetyMeeting ?? '') as any,
          meetingTime: d.meetingTime ?? '',
        },
        {
          companyName: companySettings?.company_name ?? 'Company',
          logoUrl,
          phone: companySettings?.company_phone ?? null,
          email: companySettings?.company_email ?? null,
        }
      );
      toast.success('Daily sheet PDF downloaded');
    } catch (e: any) {
      toast.error('Failed to generate PDF', { description: e?.message });
    } finally {
      setDownloadingId(null);
    }
  };

  if (list.isLoading) {
    return (
      <Card className="p-10 flex items-center justify-center text-muted-foreground gap-2">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading daily sheets…
      </Card>
    );
  }

  if (!(list.data ?? []).length) {
    return (
      <Card className="p-10 text-center bg-muted/30 border-dashed">
        <CalendarDays className="h-10 w-10 mx-auto mb-3 text-muted-foreground opacity-40" />
        <h3 className="font-semibold mb-1">No daily sheets saved yet</h3>
        <p className="text-sm text-muted-foreground">
          Create a Daily Sheet and download its PDF — it will be saved here automatically.
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by project or worker…"
          className="pl-9"
        />
      </div>

      {/* Desktop table */}
      <Card className="hidden md:block overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="text-left font-medium px-4 py-3">Project</th>
              <th className="text-left font-medium px-4 py-3">Day</th>
              <th className="text-left font-medium px-4 py-3">Workers</th>
              <th className="text-left font-medium px-4 py-3">Total hours</th>
              <th className="text-left font-medium px-4 py-3">Created by</th>
              <th className="text-right font-medium px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {sheets.map(s => (
              <tr key={s.id} className="hover:bg-muted/30">
                <td className="px-4 py-3 font-medium">{s.project_name || '—'}</td>
                <td className="px-4 py-3">{formatDateLongLocal(s.sheet_date)}</td>
                <td className="px-4 py-3">
                  <Badge variant="secondary" className="gap-1">
                    <Users className="h-3 w-3" />
                    {(s.crew ?? []).length}
                  </Badge>
                </td>
                <td className="px-4 py-3 font-semibold tabular-nums">
                  {Number(s.total_hours ?? 0).toFixed(2)}
                </td>
                <td className="px-4 py-3 text-muted-foreground">{s.created_by_name ?? '—'}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-1">
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-1.5"
                      disabled={downloadingId === s.id}
                      onClick={() => handleDownload(s)}
                    >
                      {downloadingId === s.id ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Download className="h-3.5 w-3.5" />
                      )}
                      PDF
                    </Button>
                    {onLoadSheet && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="gap-1.5"
                        onClick={() => onLoadSheet(s)}
                      >
                        <Pencil className="h-3.5 w-3.5" /> Edit
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-destructive hover:text-destructive"
                      onClick={() => setDeleting(s)}
                      aria-label="Delete daily sheet"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {sheets.length === 0 && (
          <div className="p-6 text-center text-sm text-muted-foreground">No matches found.</div>
        )}
      </Card>

      {/* Mobile cards */}
      <div className="grid gap-3 md:hidden">
        {sheets.map(s => (
          <Card key={s.id} className="p-4 space-y-3">
            <div>
              <p className="font-semibold">{s.project_name || '—'}</p>
              <p className="text-xs text-muted-foreground">{formatDateLongLocal(s.sheet_date)}</p>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Badge variant="secondary" className="gap-1">
                <Users className="h-3 w-3" />
                {(s.crew ?? []).length} workers
              </Badge>
              <span className="font-semibold tabular-nums">
                {Number(s.total_hours ?? 0).toFixed(2)} h
              </span>
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                className="flex-1 gap-1.5"
                disabled={downloadingId === s.id}
                onClick={() => handleDownload(s)}
              >
                {downloadingId === s.id ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Download className="h-3.5 w-3.5" />
                )}
                PDF
              </Button>
              {onLoadSheet && (
                <Button size="sm" variant="ghost" onClick={() => onLoadSheet(s)}>
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
              )}
              <Button
                size="sm"
                variant="ghost"
                className="text-destructive hover:text-destructive"
                onClick={() => setDeleting(s)}
                aria-label="Delete daily sheet"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          </Card>
        ))}
        {sheets.length === 0 && (
          <p className="text-center text-sm text-muted-foreground py-6">No matches found.</p>
        )}
      </div>

      <AlertDialog open={!!deleting} onOpenChange={open => !open && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this daily sheet?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleting?.project_name} — {deleting ? formatDateLongLocal(deleting.sheet_date) : ''}.
              This cannot be undone.
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
    </div>
  );
};
