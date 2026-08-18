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
import {
  ClipboardCheck,
  Download,
  ImageIcon,
  Loader2,
  Pencil,
  Plus,
  Search,
  Trash2,
} from 'lucide-react';
import { toast } from 'sonner';

import { useCompanyLogo } from '@/hooks/useCompanyLogo';
import { useCompanySettings } from '@/hooks/useCompanySettings';
import {
  useSiteInspections,
  getInspectionPhotoUrl,
  type SiteInspection,
} from '@/hooks/useSiteInspections';
import { SITE_INSPECTION_SECTIONS, countChecked } from '@/utils/siteInspectionChecklist';
import { generateSiteInspectionPDF } from '@/utils/siteInspectionPDF';
import { SiteInspectionForm } from './SiteInspectionForm';

const formatDate = (iso: string) =>
  new Date(`${iso}T12:00:00`).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

const totalItems = SITE_INSPECTION_SECTIONS.reduce((s, sec) => s + sec.items.length, 0);

export const SiteInspectionsPage: React.FC = () => {
  const { list, remove } = useSiteInspections();
  const { logoUrl } = useCompanyLogo();
  const { settings } = useCompanySettings();

  const [mode, setMode] = useState<'list' | 'form'>('list');
  const [editing, setEditing] = useState<SiteInspection | null>(null);
  const [search, setSearch] = useState('');
  const [toDelete, setToDelete] = useState<SiteInspection | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const inspections = list.data ?? [];

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return inspections;
    return inspections.filter(i =>
      [i.client_name, i.job_number, i.claim_number, i.property_address, i.supervisor]
        .filter(Boolean)
        .some(v => String(v).toLowerCase().includes(q))
    );
  }, [inspections, search]);

  const handleDownload = async (inspection: SiteInspection) => {
    setDownloadingId(inspection.id);
    try {
      await generateSiteInspectionPDF(
        {
          inspectionDate: inspection.inspection_date,
          clientName: inspection.client_name,
          insuranceCompany: inspection.insurance_company,
          adjuster: inspection.adjuster,
          claimNumber: inspection.claim_number,
          jobNumber: inspection.job_number,
          propertyAddress: inspection.property_address,
          supervisor: inspection.supervisor,
          crewMembers: inspection.crew_members,
          builderCompany: inspection.builder_company,
          checklist: inspection.checklist ?? {},
          qualityControl: (inspection.quality_control ?? {}) as Record<string, string>,
          comments: inspection.comments,
          signatures: inspection.signatures ?? {},
          photos: (inspection.photos ?? []).map(p => ({
            url: getInspectionPhotoUrl(p.file_path),
            caption: p.caption,
          })),
        },
        {
          companyName: settings?.company_name ?? '7 Stars Family',
          logoUrl,
          phone: settings?.company_phone ?? null,
          email: settings?.company_email ?? null,
        }
      );
    } catch (e: any) {
      toast.error(e?.message ?? 'Failed to generate PDF');
    } finally {
      setDownloadingId(null);
    }
  };

  if (mode === 'form') {
    return (
      <SiteInspectionForm
        inspection={editing}
        onDone={() => {
          setEditing(null);
          setMode('list');
        }}
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-lg font-semibold">Final Site Inspection Reports</h1>
          <p className="text-sm text-muted-foreground">
            Complete the daily site checklist and export a signed PDF report.
          </p>
        </div>
        <Button
          onClick={() => {
            setEditing(null);
            setMode('form');
          }}
        >
          <Plus className="mr-1.5 h-4 w-4" /> New Inspection
        </Button>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search client, job #, claim #…"
          className="pl-9"
        />
      </div>

      {list.isLoading ? (
        <div className="flex items-center justify-center py-16 text-muted-foreground">
          <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Loading inspections…
        </div>
      ) : filtered.length === 0 ? (
        <Card className="flex flex-col items-center justify-center gap-3 py-16 text-center">
          <div className="rounded-full bg-muted p-3">
            <ClipboardCheck className="h-6 w-6 text-muted-foreground" />
          </div>
          <div>
            <p className="font-medium">No inspection reports yet</p>
            <p className="text-sm text-muted-foreground">
              Start a new inspection to build your first record.
            </p>
          </div>
        </Card>
      ) : (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map(inspection => {
            const checked = SITE_INSPECTION_SECTIONS.reduce(
              (sum, s) => sum + countChecked(s, inspection.checklist ?? {}),
              0
            );
            const photoCount = inspection.photos?.length ?? 0;
            return (
              <Card key={inspection.id} className="flex flex-col gap-3 p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate font-medium">
                      {inspection.client_name || 'Untitled inspection'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(inspection.inspection_date)}
                      {inspection.job_number ? ` · Job #${inspection.job_number}` : ''}
                    </p>
                  </div>
                  <Badge variant={inspection.status === 'submitted' ? 'default' : 'secondary'}>
                    {inspection.status === 'submitted' ? 'Submitted' : 'Draft'}
                  </Badge>
                </div>

                {inspection.property_address && (
                  <p className="truncate text-sm text-muted-foreground">
                    {inspection.property_address}
                  </p>
                )}

                <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                  <span className="rounded-full bg-muted px-2 py-0.5">
                    {checked}/{totalItems} checked
                  </span>
                  {photoCount > 0 && (
                    <span className="flex items-center gap-1 rounded-full bg-muted px-2 py-0.5">
                      <ImageIcon className="h-3 w-3" /> {photoCount}
                    </span>
                  )}
                  {inspection.supervisor && <span>Sup. {inspection.supervisor}</span>}
                </div>

                <div className="mt-auto flex gap-2 pt-1">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => {
                      setEditing(inspection);
                      setMode('form');
                    }}
                  >
                    <Pencil className="mr-1.5 h-3.5 w-3.5" />
                    {inspection.status === 'submitted' ? 'View' : 'Edit'}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDownload(inspection)}
                    disabled={downloadingId === inspection.id}
                  >
                    {downloadingId === inspection.id ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Download className="h-3.5 w-3.5" />
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-destructive hover:text-destructive"
                    onClick={() => setToDelete(inspection)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <AlertDialog open={!!toDelete} onOpenChange={open => !open && setToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this inspection?</AlertDialogTitle>
            <AlertDialogDescription>
              The report and its photos will be permanently removed. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                if (toDelete) await remove.mutateAsync(toDelete);
                setToDelete(null);
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

export default SiteInspectionsPage;
