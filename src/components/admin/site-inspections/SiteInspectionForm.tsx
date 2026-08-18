import React, { useMemo, useRef, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  ArrowLeft,
  Camera,
  CheckCircle2,
  Download,
  ImagePlus,
  Loader2,
  Save,
  Trash2,
} from 'lucide-react';
import { toast } from 'sonner';

import { useJobsites } from '@/hooks/useJobsites';
import { useCompanyLogo } from '@/hooks/useCompanyLogo';
import { useCompanySettings } from '@/hooks/useCompanySettings';
import {
  useSiteInspections,
  getInspectionPhotoUrl,
  type SiteInspection,
  type SiteInspectionInput,
  type SiteInspectionQualityControl,
  type SiteInspectionSignatures,
} from '@/hooks/useSiteInspections';
import {
  SITE_INSPECTION_SECTIONS,
  QUALITY_CONTROL_TOGGLES,
  countChecked,
} from '@/utils/siteInspectionChecklist';
import { generateSiteInspectionPDF } from '@/utils/siteInspectionPDF';
import { SignaturePad } from './SignaturePad';

const todayISO = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
    d.getDate()
  ).padStart(2, '0')}`;
};

interface SiteInspectionFormProps {
  inspection?: SiteInspection | null;
  onDone: () => void;
}

export const SiteInspectionForm: React.FC<SiteInspectionFormProps> = ({ inspection, onDone }) => {
  const { data: jobsites = [] } = useJobsites('all');
  const { logoUrl } = useCompanyLogo();
  const { settings } = useCompanySettings();
  const { create, update, uploadPhotos, deletePhoto } = useSiteInspections();

  const [id, setId] = useState<string | null>(inspection?.id ?? null);
  const [jobsiteId, setJobsiteId] = useState(inspection?.jobsite_id ?? '');
  const [date, setDate] = useState(inspection?.inspection_date ?? todayISO());
  const [clientName, setClientName] = useState(inspection?.client_name ?? '');
  const [insuranceCompany, setInsuranceCompany] = useState(inspection?.insurance_company ?? '');
  const [adjuster, setAdjuster] = useState(inspection?.adjuster ?? '');
  const [claimNumber, setClaimNumber] = useState(inspection?.claim_number ?? '');
  const [jobNumber, setJobNumber] = useState(inspection?.job_number ?? '');
  const [propertyAddress, setPropertyAddress] = useState(inspection?.property_address ?? '');
  const [supervisor, setSupervisor] = useState(inspection?.supervisor ?? '');
  const [crewMembers, setCrewMembers] = useState(inspection?.crew_members ?? '');
  const [builderCompany, setBuilderCompany] = useState(inspection?.builder_company ?? '');
  const [checklist, setChecklist] = useState<Record<string, boolean>>(inspection?.checklist ?? {});
  const [qc, setQc] = useState<SiteInspectionQualityControl>(inspection?.quality_control ?? {});
  const [comments, setComments] = useState(inspection?.comments ?? '');
  const [signatures, setSignatures] = useState<SiteInspectionSignatures>(
    inspection?.signatures ?? {}
  );
  const [photos, setPhotos] = useState(inspection?.photos ?? []);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [busy, setBusy] = useState<'save' | 'submit' | null>(null);

  const fileRef = useRef<HTMLInputElement | null>(null);
  const cameraRef = useRef<HTMLInputElement | null>(null);

  const totalItems = useMemo(
    () => SITE_INSPECTION_SECTIONS.reduce((sum, s) => sum + s.items.length, 0),
    []
  );
  const totalChecked = useMemo(
    () => SITE_INSPECTION_SECTIONS.reduce((sum, s) => sum + countChecked(s, checklist), 0),
    [checklist]
  );

  const isLocked = inspection?.status === 'submitted';

  const onJobsiteChange = (value: string) => {
    setJobsiteId(value === 'none' ? '' : value);
    const site: any = jobsites.find((j: any) => j.id === value);
    if (site) {
      if (!propertyAddress) setPropertyAddress(site.address ?? '');
      if (!clientName) setClientName(site.client_name ?? '');
    }
  };

  const toggleSection = (sectionId: string, on: boolean) => {
    const section = SITE_INSPECTION_SECTIONS.find(s => s.id === sectionId);
    if (!section) return;
    setChecklist(prev => {
      const next = { ...prev };
      section.items.forEach(i => {
        next[i.id] = on;
      });
      return next;
    });
  };

  const addFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setPendingFiles(prev => [...prev, ...Array.from(files)]);
  };

  const buildPayload = (status: 'draft' | 'submitted'): SiteInspectionInput => ({
    jobsite_id: jobsiteId || null,
    inspection_date: date,
    client_name: clientName || null,
    insurance_company: insuranceCompany || null,
    adjuster: adjuster || null,
    claim_number: claimNumber || null,
    job_number: jobNumber || null,
    property_address: propertyAddress || null,
    supervisor: supervisor || null,
    crew_members: crewMembers || null,
    builder_company: builderCompany || null,
    checklist,
    quality_control: qc,
    comments: comments || null,
    signatures,
    status,
  });

  const persist = async (status: 'draft' | 'submitted') => {
    const payload = buildPayload(status);
    let inspectionId = id;

    if (inspectionId) {
      await update.mutateAsync({ id: inspectionId, input: payload });
    } else {
      const created = await create.mutateAsync(payload);
      inspectionId = created.id;
      setId(created.id);
    }

    if (pendingFiles.length > 0 && inspectionId) {
      const uploaded = await uploadPhotos.mutateAsync({
        inspectionId,
        files: pendingFiles,
        startOrder: photos.length,
      });
      setPhotos(prev => [...prev, ...uploaded]);
      setPendingFiles([]);
    }

    return inspectionId!;
  };

  const handleSaveDraft = async () => {
    setBusy('save');
    try {
      await persist('draft');
      toast.success('Draft saved');
    } catch {
      /* toast handled in hook */
    } finally {
      setBusy(null);
    }
  };

  const handleSubmit = async () => {
    if (!clientName.trim() && !jobNumber.trim()) {
      toast.error('Add at least a client name or job number');
      return;
    }
    setBusy('submit');
    try {
      await persist('submitted');

      const pdfPhotos = [
        ...photos.map(p => ({ url: getInspectionPhotoUrl(p.file_path), caption: p.caption })),
      ];

      await generateSiteInspectionPDF(
        {
          inspectionDate: date,
          clientName,
          insuranceCompany,
          adjuster,
          claimNumber,
          jobNumber,
          propertyAddress,
          supervisor,
          crewMembers,
          builderCompany,
          checklist,
          qualityControl: qc as Record<string, string>,
          comments,
          signatures,
          photos: pdfPhotos,
        },
        {
          companyName: settings?.company_name ?? '7 Stars Family',
          logoUrl,
          phone: settings?.company_phone ?? null,
          email: settings?.company_email ?? null,
          website: (settings as any)?.company_website ?? null,
        }
      );

      toast.success('Inspection saved & PDF downloaded');
      onDone();
    } catch (e: any) {
      toast.error(e?.message ?? 'Failed to submit inspection');
    } finally {
      setBusy(null);
    }
  };

  const field = (
    label: string,
    value: string,
    setter: (v: string) => void,
    type: string = 'text'
  ) => (
    <div className="space-y-1.5">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <Input
        type={type}
        value={value}
        disabled={isLocked}
        onChange={e => setter(e.target.value)}
        className="h-9"
      />
    </div>
  );

  return (
    <div className="space-y-4 pb-24">
      <div className="flex items-center justify-between gap-3">
        <Button variant="ghost" size="sm" onClick={onDone} className="gap-1">
          <ArrowLeft className="h-4 w-4" /> Back
        </Button>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="text-xs">
            {totalChecked}/{totalItems} items checked
          </Badge>
          {inspection?.status === 'submitted' && (
            <Badge className="text-xs">Submitted</Badge>
          )}
        </div>
      </div>

      {/* Project information */}
      <Card className="p-4 md:p-5 space-y-4">
        <h3 className="text-sm font-semibold uppercase tracking-wide">Project Information</h3>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Jobsite (optional)</Label>
            <Select value={jobsiteId || 'none'} onValueChange={onJobsiteChange} disabled={isLocked}>
              <SelectTrigger className="h-9">
                <SelectValue placeholder="Select jobsite" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No jobsite</SelectItem>
                {(jobsites as any[]).map(j => (
                  <SelectItem key={j.id} value={j.id}>
                    {j.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {field('Date', date, setDate, 'date')}
          {field('Client', clientName, setClientName)}
          {field('Insurance Company', insuranceCompany, setInsuranceCompany)}
          {field('Adjuster', adjuster, setAdjuster)}
          {field('Claim #', claimNumber, setClaimNumber)}
          {field('Job #', jobNumber, setJobNumber)}
          {field('Supervisor', supervisor, setSupervisor)}
          {field('Builder / Restoration Company', builderCompany, setBuilderCompany)}
          <div className="sm:col-span-2 lg:col-span-2">
            {field('Property Address', propertyAddress, setPropertyAddress)}
          </div>
          {field('Crew Members', crewMembers, setCrewMembers)}
        </div>
      </Card>

      {/* Checklist */}
      <div className="grid gap-4 lg:grid-cols-2">
        {SITE_INSPECTION_SECTIONS.map(section => {
          const done = countChecked(section, checklist);
          const all = done === section.items.length;
          return (
            <Card key={section.id} className="overflow-hidden">
              <div className="flex items-center justify-between gap-2 bg-foreground px-4 py-2.5">
                <span className="text-sm font-semibold text-background">
                  {section.number}. {section.title}
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-medium text-background/70">
                    {done}/{section.items.length}
                  </span>
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    className="h-6 px-2 text-[11px]"
                    disabled={isLocked}
                    onClick={() => toggleSection(section.id, !all)}
                  >
                    {all ? 'Clear' : 'Check all'}
                  </Button>
                </div>
              </div>
              <div className="divide-y divide-border">
                {section.items.map(item => (
                  <label
                    key={item.id}
                    className="flex cursor-pointer items-start gap-3 px-4 py-3 hover:bg-muted/40"
                  >
                    <Checkbox
                      checked={!!checklist[item.id]}
                      disabled={isLocked}
                      onCheckedChange={v =>
                        setChecklist(prev => ({ ...prev, [item.id]: v === true }))
                      }
                      className="mt-0.5"
                    />
                    <span className="text-sm leading-snug">
                      {item.label}
                      {item.isNew && (
                        <Badge variant="destructive" className="ml-2 h-4 px-1 text-[9px]">
                          NEW
                        </Badge>
                      )}
                    </span>
                  </label>
                ))}
              </div>
            </Card>
          );
        })}
      </div>

      {/* Quality control */}
      <Card className="p-4 md:p-5 space-y-4">
        <h3 className="text-sm font-semibold uppercase tracking-wide">Quality Control</h3>
        <div className="grid gap-3 sm:grid-cols-2">
          {field('Moisture Meter Used', qc.moisture_meter ?? '', v =>
            setQc(prev => ({ ...prev, moisture_meter: v }))
          )}
          {field('Final Moisture Reading', qc.final_moisture_reading ?? '', v =>
            setQc(prev => ({ ...prev, final_moisture_reading: v }))
          )}
        </div>
        <Separator />
        <div className="grid gap-3 sm:grid-cols-2">
          {QUALITY_CONTROL_TOGGLES.map(t => {
            const current = (qc as Record<string, string | undefined>)[t.id] ?? '';
            return (
              <div key={t.id} className="flex items-center justify-between gap-3 rounded-md border border-border px-3 py-2">
                <span className="text-sm">{t.label}</span>
                <div className="flex gap-1">
                  {(['yes', 'no'] as const).map(opt => (
                    <Button
                      key={opt}
                      type="button"
                      size="sm"
                      variant={current === opt ? 'default' : 'outline'}
                      className="h-7 px-3 text-xs capitalize"
                      disabled={isLocked}
                      onClick={() =>
                        setQc(prev => ({ ...prev, [t.id]: current === opt ? '' : opt }) as SiteInspectionQualityControl)
                      }
                    >
                      {opt}
                    </Button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Comments */}
      <Card className="p-4 md:p-5 space-y-3">
        <h3 className="text-sm font-semibold uppercase tracking-wide">
          Supervisor Comments / Additional Notes
        </h3>
        <Textarea
          rows={4}
          value={comments}
          disabled={isLocked}
          onChange={e => setComments(e.target.value)}
          placeholder="Anything the office or the client should know…"
        />
      </Card>

      {/* Photos */}
      <Card className="p-4 md:p-5 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-sm font-semibold uppercase tracking-wide">Site Photos</h3>
          <div className="flex gap-2">
            <input
              ref={cameraRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={e => {
                addFiles(e.target.files);
                e.currentTarget.value = '';
              }}
            />
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={e => {
                addFiles(e.target.files);
                e.currentTarget.value = '';
              }}
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isLocked}
              onClick={() => cameraRef.current?.click()}
            >
              <Camera className="mr-1.5 h-4 w-4" /> Camera
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isLocked}
              onClick={() => fileRef.current?.click()}
            >
              <ImagePlus className="mr-1.5 h-4 w-4" /> Upload
            </Button>
          </div>
        </div>

        {photos.length === 0 && pendingFiles.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No photos yet. Photos are added at the end of the PDF.
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
            {photos.map(p => (
              <div key={p.id} className="space-y-1.5">
                <div className="relative overflow-hidden rounded-md border border-border">
                  <img
                    src={getInspectionPhotoUrl(p.file_path)}
                    alt={p.caption || p.file_name}
                    className="aspect-square w-full object-cover"
                    loading="lazy"
                  />
                  {!isLocked && (
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="absolute right-1 top-1 h-7 w-7"
                      onClick={async () => {
                        await deletePhoto.mutateAsync(p);
                        setPhotos(prev => prev.filter(x => x.id !== p.id));
                      }}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
                <Input
                  className="h-8 text-xs"
                  placeholder="Caption"
                  defaultValue={p.caption ?? ''}
                  disabled={isLocked}
                  onBlur={e =>
                    setPhotos(prev =>
                      prev.map(x => (x.id === p.id ? { ...x, caption: e.target.value } : x))
                    )
                  }
                />
              </div>
            ))}
            {pendingFiles.map((f, i) => (
              <div key={`${f.name}-${i}`} className="space-y-1.5">
                <div className="relative overflow-hidden rounded-md border border-dashed border-border">
                  <img
                    src={URL.createObjectURL(f)}
                    alt={f.name}
                    className="aspect-square w-full object-cover"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="absolute right-1 top-1 h-7 w-7"
                    onClick={() => setPendingFiles(prev => prev.filter((_, idx) => idx !== i))}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
                <p className="truncate text-[11px] text-muted-foreground">Pending upload</p>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Signatures */}
      <Card className="p-4 md:p-5 space-y-3">
        <h3 className="text-sm font-semibold uppercase tracking-wide">Signatures</h3>
        <div className="grid gap-3 lg:grid-cols-3">
          <SignaturePad
            title="Supervisor Signature"
            value={signatures.supervisor}
            disabled={isLocked}
            onChange={v => setSignatures(prev => ({ ...prev, supervisor: v }))}
          />
          <SignaturePad
            title="Crew Leader Signature"
            value={signatures.crewLeader}
            disabled={isLocked}
            onChange={v => setSignatures(prev => ({ ...prev, crewLeader: v }))}
          />
          <SignaturePad
            title="Client / Restoration Representative"
            optional
            value={signatures.client}
            disabled={isLocked}
            onChange={v => setSignatures(prev => ({ ...prev, client: v }))}
          />
        </div>
      </Card>

      {/* Sticky actions */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-background/95 px-4 py-3 backdrop-blur md:left-[var(--sidebar-width,0)]">
        <div className="mx-auto flex max-w-5xl items-center justify-end gap-2">
          <Button variant="outline" onClick={handleSaveDraft} disabled={!!busy || isLocked}>
            {busy === 'save' ? (
              <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-1.5 h-4 w-4" />
            )}
            Save draft
          </Button>
          <Button onClick={handleSubmit} disabled={!!busy}>
            {busy === 'submit' ? (
              <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
            ) : isLocked ? (
              <Download className="mr-1.5 h-4 w-4" />
            ) : (
              <CheckCircle2 className="mr-1.5 h-4 w-4" />
            )}
            {isLocked ? 'Download PDF' : 'Submit & download PDF'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default SiteInspectionForm;
