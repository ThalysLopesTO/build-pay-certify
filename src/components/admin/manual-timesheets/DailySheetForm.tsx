import React, { useMemo, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { CalendarIcon, ChevronsUpDown, Download, Loader2, Plus, Users, X } from 'lucide-react';

import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useEmployeeDirectory } from '@/hooks/useEmployeeDirectory';
import { useJobsites } from '@/hooks/useJobsites';
import { useCompanyLogo } from '@/hooks/useCompanyLogo';
import { useCompanySettings } from '@/hooks/useCompanySettings';
import { useDailySheets, type DailySheet } from '@/hooks/useDailySheets';
import { calcHours, formatDateLongLocal, todayLocalISO } from '@/utils/dailySheetTime';
import { generateDailySheetPDF } from '@/utils/dailySheetPDF';
import { DailySheetCrewTable } from './DailySheetCrewTable';


export interface CrewMember {
  id: string;
  name: string;
  role?: string | null;
  start: string;
  end: string;
  breakMinutes: number;
  notes?: string | null;
}


const initials = (first?: string | null, last?: string | null) => {
  const f = (first ?? '').trim().charAt(0);
  const l = (last ?? '').trim().charAt(0);
  return (f + l).toUpperCase() || '?';
};

const parseDate = (s?: string): Date | undefined => {
  if (!s) return undefined;
  const d = new Date(`${s}T12:00:00`);
  return Number.isNaN(d.getTime()) ? undefined : d;
};

const formatISO = (d: Date) => {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};

interface DailySheetFormProps {
  editingSheet?: DailySheet | null;
  onSaved?: () => void;
}

export const DailySheetForm: React.FC<DailySheetFormProps> = ({ editingSheet, onSaved }) => {
  const { data: employees = [], isLoading: employeesLoading } = useEmployeeDirectory();
  const { data: jobsites = [], isLoading: jobsitesLoading } = useJobsites('all');
  const { logoUrl } = useCompanyLogo();
  const { settings: companySettings } = useCompanySettings();
  const { create, update } = useDailySheets();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [jobsiteId, setJobsiteId] = useState('');
  const [useCustomProject, setUseCustomProject] = useState(false);
  const [customProject, setCustomProject] = useState('');
  const [date, setDate] = useState<string>(todayLocalISO());
  const [dateOpen, setDateOpen] = useState(false);
  const [crewStart, setCrewStart] = useState('07:00');
  const [crewEnd, setCrewEnd] = useState('15:30');
  const [crewBreak, setCrewBreak] = useState(30);
  const [crew, setCrew] = useState<CrewMember[]>([]);
  const [search, setSearch] = useState('');
  const [employeeOpen, setEmployeeOpen] = useState(false);

  const [customName, setCustomName] = useState('');
  const [notes, setNotes] = useState('');
  const [generating, setGenerating] = useState(false);

  // Optional job details for the PDF header
  const [showDetails, setShowDetails] = useState(false);
  const [poBuilder, setPoBuilder] = useState('');
  const [jobName, setJobName] = useState('');
  const [siteAddress, setSiteAddress] = useState('');
  const [supervisor, setSupervisor] = useState('');
  const [weather, setWeather] = useState<'sunny' | 'partly' | 'cloudy' | 'rain' | ''>('');
  const [safetyMeeting, setSafetyMeeting] = useState<'yes' | 'no' | ''>('');
  const [meetingTime, setMeetingTime] = useState('');

  // Prefill when a saved sheet is opened for editing
  useEffect(() => {
    if (!editingSheet) return;
    const d = editingSheet.job_details ?? {};
    setEditingId(editingSheet.id);
    setJobsiteId(editingSheet.jobsite_id ?? '');
    setUseCustomProject(!editingSheet.jobsite_id);
    setCustomProject(editingSheet.jobsite_id ? '' : editingSheet.project_name);
    setDate(editingSheet.sheet_date);
    setCrew((editingSheet.crew ?? []) as CrewMember[]);
    setNotes(editingSheet.notes ?? '');
    setPoBuilder(d.poBuilder ?? '');
    setJobName(d.jobName ?? '');
    setSiteAddress(d.siteAddress ?? '');
    setSupervisor(d.supervisor ?? '');
    setWeather((d.weather ?? '') as any);
    setSafetyMeeting((d.safetyMeeting ?? '') as any);
    setMeetingTime(d.meetingTime ?? '');
    setShowDetails(
      Boolean(d.poBuilder || d.jobName || d.siteAddress || d.supervisor || d.weather || d.safetyMeeting)
    );
  }, [editingSheet]);

  const resetForm = () => {
    setEditingId(null);
    setJobsiteId('');
    setUseCustomProject(false);
    setCustomProject('');
    setDate(todayLocalISO());
    setCrew([]);
    setNotes('');
    setPoBuilder('');
    setJobName('');
    setSiteAddress('');
    setSupervisor('');
    setWeather('');
    setSafetyMeeting('');
    setMeetingTime('');
  };




  const projectName = useCustomProject
    ? customProject.trim()
    : (jobsites as any[]).find(j => j.id === jobsiteId)?.name ?? '';

  const selectedIds = useMemo(() => new Set(crew.map(c => c.id)), [crew]);

  const filteredEmployees = useMemo(() => {
    const term = search.trim().toLowerCase();
    return (employees as any[]).filter(e => {
      if (!term) return true;
      const full = `${e.first_name ?? ''} ${e.last_name ?? ''}`.toLowerCase();
      return full.includes(term) || (e.role ?? '').toLowerCase().includes(term);
    });
  }, [employees, search]);

  const totalHours = crew.reduce((acc, r) => acc + calcHours(r.start, r.end, r.breakMinutes), 0);

  const toggleEmployee = (emp: any) => {
    const id = emp.user_id;
    setCrew(prev => {
      if (prev.some(c => c.id === id)) return prev.filter(c => c.id !== id);
      const name = `${emp.first_name ?? ''} ${emp.last_name ?? ''}`.trim() || 'Unknown';
      return [
        ...prev,
        {
          id,
          name,
          role: emp.trade || emp.position || emp.role || '',
          start: crewStart,
          end: crewEnd,
          breakMinutes: crewBreak,
        },
      ];
    });
  };

  const addCustomMember = () => {
    const name = customName.trim();
    if (!name) return;
    setCrew(prev => [
      ...prev,
      {
        id: `custom-${Date.now()}`,
        name,
        role: '',
        start: crewStart,
        end: crewEnd,
        breakMinutes: crewBreak,
      },
    ]);
    setCustomName('');
  };

  const applyCrewDefaults = () => {
    if (!crew.length) {
      toast.info('Select employees first');
      return;
    }
    setCrew(prev =>
      prev.map(c => ({ ...c, start: crewStart, end: crewEnd, breakMinutes: crewBreak }))
    );
    toast.success('Crew times applied to all rows');
  };

  const updateMember = (id: string, patch: Partial<CrewMember>) =>
    setCrew(prev => prev.map(c => (c.id === id ? { ...c, ...patch } : c)));

  const removeMember = (id: string) => setCrew(prev => prev.filter(c => c.id !== id));

  const handleDownload = async () => {
    if (!projectName) {
      toast.error('Select a project');
      return;
    }
    if (!date) {
      toast.error('Select a day');
      return;
    }
    if (!crew.length) {
      toast.error('Add at least one employee');
      return;
    }
    setGenerating(true);
    try {
      await generateDailySheetPDF(
        {
          projectName,
          date,
          crew,
          notes,
          poBuilder,
          jobName,
          siteAddress,
          supervisor,
          weather,
          safetyMeeting,
          meetingTime,
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
      setGenerating(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* ===== Project & Day */}
      <Card className="p-4 md:p-5 space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>
                Project <span className="text-destructive">*</span>
              </Label>
              <button
                type="button"
                className="text-xs text-primary hover:underline"
                onClick={() => setUseCustomProject(v => !v)}
              >
                {useCustomProject ? 'Choose jobsite' : 'Enter custom name'}
              </button>
            </div>
            {useCustomProject ? (
              <Input
                value={customProject}
                onChange={e => setCustomProject(e.target.value)}
                placeholder="Project name"
              />
            ) : (
              <Select value={jobsiteId} onValueChange={setJobsiteId} disabled={jobsitesLoading}>
                <SelectTrigger>
                  <SelectValue placeholder={jobsitesLoading ? 'Loading…' : 'Choose jobsite'} />
                </SelectTrigger>
                <SelectContent>
                  {(jobsites as any[]).map(j => (
                    <SelectItem key={j.id} value={j.id}>
                      {j.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          <div className="space-y-2">
            <Label>
              Day <span className="text-destructive">*</span>
            </Label>
            <Popover open={dateOpen} onOpenChange={setDateOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    'w-full justify-start text-left font-normal',
                    !date && 'text-muted-foreground'
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date ? formatDateLongLocal(date) : 'Pick a day'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={parseDate(date)}
                  onSelect={d => {
                    if (d) setDate(formatISO(d));
                    setDateOpen(false);
                  }}
                  initialFocus
                  className={cn('p-3 pointer-events-auto')}
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>

        {/* Crew default times */}
        <div className="rounded-lg border bg-muted/30 p-3 md:p-4">
          <p className="text-xs uppercase tracking-wide text-muted-foreground mb-3">
            Crew default times
          </p>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 items-end">
            <div className="space-y-1.5">
              <Label className="text-xs">Start</Label>
              <Input type="time" value={crewStart} onChange={e => setCrewStart(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">End</Label>
              <Input type="time" value={crewEnd} onChange={e => setCrewEnd(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Break (min)</Label>
              <Input
                type="number"
                min={0}
                step={5}
                value={crewBreak === 0 ? '' : crewBreak}
                placeholder="0"
                onChange={e => setCrewBreak(Number(e.target.value) || 0)}
              />
            </div>
            <Button type="button" variant="outline" onClick={applyCrewDefaults}>
              Apply to all rows
            </Button>
          </div>
        </div>

        {/* Optional job details for the PDF header */}
        <div className="rounded-lg border">
          <button
            type="button"
            onClick={() => setShowDetails(v => !v)}
            className="w-full flex items-center justify-between px-3 py-2.5 text-sm font-medium"
          >
            Optional job details (PDF header)
            <ChevronsUpDown className="h-4 w-4 opacity-50" />
          </button>
          {showDetails && (
            <div className="grid gap-3 border-t p-3 md:grid-cols-2">
              <div className="space-y-1.5">
                <Label className="text-xs">PO / Builder</Label>
                <Input value={poBuilder} onChange={e => setPoBuilder(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Job name</Label>
                <Input
                  value={jobName}
                  onChange={e => setJobName(e.target.value)}
                  placeholder={projectName || 'Job name'}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Site address</Label>
                <Input value={siteAddress} onChange={e => setSiteAddress(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Supervisor</Label>
                <Input value={supervisor} onChange={e => setSupervisor(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Weather</Label>
                <Select value={weather || 'none'} onValueChange={v => setWeather(v === 'none' ? '' : (v as typeof weather))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Not set" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Not set</SelectItem>
                    <SelectItem value="sunny">Sunny</SelectItem>
                    <SelectItem value="partly">Partly cloudy</SelectItem>
                    <SelectItem value="cloudy">Cloudy</SelectItem>
                    <SelectItem value="rain">Rain</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Safety meeting</Label>
                  <Select
                    value={safetyMeeting || 'none'}
                    onValueChange={v => setSafetyMeeting(v === 'none' ? '' : (v as 'yes' | 'no'))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Not set" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Not set</SelectItem>
                      <SelectItem value="yes">Yes</SelectItem>
                      <SelectItem value="no">No</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Meeting time</Label>
                  <Input
                    type="time"
                    value={meetingTime}
                    onChange={e => setMeetingTime(e.target.value)}
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </Card>


      {/* ===== Employee selection */}
      <Card className="p-4 md:p-5 space-y-3">
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-primary" />
          <Label className="text-sm font-semibold">Select employees</Label>
          <span className="text-xs text-muted-foreground">{crew.length} selected</span>
        </div>

        <Popover open={employeeOpen} onOpenChange={setEmployeeOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={employeeOpen}
              className="w-full justify-between font-normal"
            >
              <span className={cn('truncate', !crew.length && 'text-muted-foreground')}>
                {crew.length
                  ? `${crew.length} employee${crew.length === 1 ? '' : 's'} selected`
                  : 'Choose employees'}
              </span>
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent
            className="w-[--radix-popover-trigger-width] p-0 pointer-events-auto"
            align="start"
          >
            <div className="p-2 border-b">
              <Input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search employees…"
                className="h-9"
              />
            </div>
            <div className="max-h-64 overflow-y-auto divide-y">
              {employeesLoading && (
                <div className="p-4 text-sm text-muted-foreground flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" /> Loading employees…
                </div>
              )}
              {!employeesLoading && filteredEmployees.length === 0 && (
                <div className="p-4 text-sm text-muted-foreground">No employees found.</div>
              )}
              {filteredEmployees.map((emp: any) => {
                const name = `${emp.first_name ?? ''} ${emp.last_name ?? ''}`.trim() || 'Unknown';
                const checked = selectedIds.has(emp.user_id);
                return (
                  <label
                    key={emp.user_id}
                    className="flex items-center gap-3 px-3 py-2 cursor-pointer hover:bg-muted/50"
                  >
                    <Checkbox checked={checked} onCheckedChange={() => toggleEmployee(emp)} />
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={emp.profile_photo_url ?? undefined} alt={name} />
                      <AvatarFallback className="text-xs">
                        {initials(emp.first_name, emp.last_name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{name}</p>
                      <p className="text-xs text-muted-foreground capitalize">{emp.role}</p>
                    </div>
                  </label>
                );
              })}
            </div>
          </PopoverContent>
        </Popover>

        {crew.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {crew.map(m => (
              <Badge key={m.id} variant="secondary" className="gap-1 pr-1">
                {m.name}
                <button
                  type="button"
                  onClick={() => removeMember(m.id)}
                  className="rounded-full p-0.5 hover:bg-background/70"
                  aria-label={`Remove ${m.name}`}
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
        )}


        <div className="flex flex-col sm:flex-row gap-2">
          <Input
            value={customName}
            onChange={e => setCustomName(e.target.value)}
            placeholder="Add worker without an account (name)"
            onKeyDown={e => {
              if (e.key === 'Enter') {
                e.preventDefault();
                addCustomMember();
              }
            }}
          />
          <Button type="button" variant="outline" onClick={addCustomMember} className="gap-2">
            <Plus className="h-4 w-4" /> Add
          </Button>
        </div>
      </Card>

      {/* ===== Crew rows */}
      {crew.length > 0 && (
        <Card className="p-4 md:p-5 space-y-3">
          <Label className="text-sm font-semibold">Crew hours</Label>
          <DailySheetCrewTable crew={crew} onChange={updateMember} onRemove={removeMember} />
        </Card>
      )}

      {/* ===== Notes & export */}
      <Card className="p-4 md:p-5 space-y-4">
        <div className="space-y-2">
          <Label>Notes (optional)</Label>
          <Textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="Weather, scope of work performed, delays…"
            rows={3}
          />
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-2 border-t">
          <div className="text-sm">
            <span className="text-muted-foreground">Total crew hours: </span>
            <span className="font-bold tabular-nums">{totalHours.toFixed(2)}</span>
          </div>
          <Button onClick={handleDownload} disabled={generating} className="gap-2">
            {generating ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Download className="h-4 w-4" />
            )}
            Download PDF
          </Button>
        </div>
      </Card>
    </div>
  );
};
