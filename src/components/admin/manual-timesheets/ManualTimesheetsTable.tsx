import React, { useEffect, useMemo, useState } from 'react';
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
import { TableCard } from '@/components/ui/table-card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
  Eye,
  Pencil,
  FileDown,
  Trash2,
  Loader2,
  Search,
  CalendarIcon,
  X,
  Filter,
  FolderInput,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Wallet,
  Building2,
  ArrowRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useManualTimesheets, type ManualTimesheet } from '@/hooks/useManualTimesheets';
import { useCompanyLogo } from '@/hooks/useCompanyLogo';
import { useCompanySettings } from '@/hooks/useCompanySettings';
import { formatDateLong } from '@/utils/manualTimesheetDays';
import { generateManualTimesheetPDF, generateCombinedManualTimesheetsPDF } from '@/utils/manualTimesheetPDF';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ChevronDown, Files, FileText } from 'lucide-react';
import { ManualTimesheetViewModal } from './ManualTimesheetViewModal';
import { ManualTimesheetEditModal } from './ManualTimesheetEditModal';
import { MoveToFolderDialog } from './MoveToFolderDialog';
import { EmptyState } from './EmptyState';
import { Skeleton } from '@/components/ui/skeleton';
import { totalTimesheetPayroll } from '@/utils/manualTimesheetPayroll';

const formatCurrency = (n: number) =>
  Number(n).toLocaleString('en-US', { style: 'currency', currency: 'USD' });

const toIsoDate = (d: Date) => {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};

const parseIso = (s?: string): Date | undefined => {
  if (!s) return undefined;
  const d = new Date(`${s}T12:00:00`);
  return Number.isNaN(d.getTime()) ? undefined : d;
};

export const ManualTimesheetsTable: React.FC = () => {
  const { list, remove } = useManualTimesheets();
  const { logoUrl } = useCompanyLogo();
  const { settings: companySettings } = useCompanySettings();

  const [viewing, setViewing] = useState<ManualTimesheet | null>(null);
  const [editing, setEditing] = useState<ManualTimesheet | null>(null);
  const [deleting, setDeleting] = useState<ManualTimesheet | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState('');
  const [employeeFilter, setEmployeeFilter] = useState<string>('all');
  const [projectFilter, setProjectFilter] = useState<string>('all');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [fromDate, setFromDate] = useState<string>('');
  const [toDate, setToDate] = useState<string>('');

  // Selection + bulk download
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkProgress, setBulkProgress] = useState<{ current: number; total: number } | null>(null);
  const [moveDialogOpen, setMoveDialogOpen] = useState(false);

  const items = list.data ?? [];

  const employeeOptions = useMemo(
    () => Array.from(new Set(items.map((i) => i.employee_name).filter(Boolean))).sort(),
    [items]
  );
  const projectOptions = useMemo(
    () => Array.from(new Set(items.map((i) => i.project_name).filter(Boolean))).sort(),
    [items]
  );
  const roleOptions = useMemo(
    () =>
      Array.from(
        new Set(items.map((i) => i.employee_role).filter((r): r is string => !!r))
      ).sort(),
    [items]
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return items.filter((ts) => {
      if (q) {
        const hay = `${ts.employee_name} ${ts.employee_role ?? ''} ${ts.project_name}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      if (employeeFilter !== 'all' && ts.employee_name !== employeeFilter) return false;
      if (projectFilter !== 'all' && ts.project_name !== projectFilter) return false;
      if (roleFilter !== 'all' && (ts.employee_role ?? '') !== roleFilter) return false;
      // Inclusive overlap with [fromDate, toDate]
      if (fromDate && ts.pay_period_end < fromDate) return false;
      if (toDate && ts.pay_period_start > toDate) return false;
      return true;
    });
  }, [items, search, employeeFilter, projectFilter, roleFilter, fromDate, toDate]);

  const payrollTotal = useMemo(() => totalTimesheetPayroll(filtered), [filtered]);

  // Pagination
  const [pageSize, setPageSize] = useState<number>(20);
  const [currentPage, setCurrentPage] = useState<number>(1);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, employeeFilter, projectFilter, roleFilter, fromDate, toDate, pageSize]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [currentPage, totalPages]);

  const paginated = useMemo(
    () => filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize),
    [filtered, currentPage, pageSize]
  );

  const startItem = filtered.length === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, filtered.length);

  // Prune selection when filtered set changes
  useEffect(() => {
    setSelectedIds((prev) => {
      const visible = new Set(filtered.map((f) => f.id));
      let changed = false;
      const next = new Set<string>();
      prev.forEach((id) => {
        if (visible.has(id)) next.add(id);
        else changed = true;
      });
      return changed ? next : prev;
    });
  }, [filtered]);

  const hasFilters =
    search !== '' ||
    employeeFilter !== 'all' ||
    projectFilter !== 'all' ||
    roleFilter !== 'all' ||
    fromDate !== '' ||
    toDate !== '';

  const clearFilters = () => {
    setSearch('');
    setEmployeeFilter('all');
    setProjectFilter('all');
    setRoleFilter('all');
    setFromDate('');
    setToDate('');
  };

  const allVisibleSelected = paginated.length > 0 && paginated.every((f) => selectedIds.has(f.id));
  const someVisibleSelected = paginated.some((f) => selectedIds.has(f.id));

  const toggleSelectAll = (checked: boolean) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (checked) paginated.forEach((f) => next.add(f.id));
      else paginated.forEach((f) => next.delete(f.id));
      return next;
    });
  };

  const toggleOne = (id: string, checked: boolean) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
  };

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

  const handleBulkDownload = async () => {
    const targets = filtered.filter((f) => selectedIds.has(f.id));
    if (targets.length === 0) return;
    setBulkProgress({ current: 0, total: targets.length });
    try {
      for (let i = 0; i < targets.length; i++) {
        setBulkProgress({ current: i + 1, total: targets.length });
        // eslint-disable-next-line no-await-in-loop
        await generateManualTimesheetPDF(targets[i], {
          companyName: companySettings?.company_name ?? 'Company',
          logoUrl,
        });
        // Small gap so the browser doesn't queue/throttle downloads
        // eslint-disable-next-line no-await-in-loop
        await new Promise((r) => setTimeout(r, 250));
      }
    } finally {
      setBulkProgress(null);
    }
  };

  const handleBulkDownloadCombined = async () => {
    const targets = filtered.filter((f) => selectedIds.has(f.id));
    if (targets.length === 0) return;
    setBulkProgress({ current: 0, total: targets.length });
    try {
      await generateCombinedManualTimesheetsPDF(targets, {
        companyName: companySettings?.company_name ?? 'Company',
        logoUrl,
      });
    } finally {
      setBulkProgress(null);
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

  if (items.length === 0) return <EmptyState />;

  const selectedCount = selectedIds.size;

  return (
    <>
      <section aria-label="Payroll summary" className="mb-6 grid gap-5 border-b border-border pb-6 sm:grid-cols-[1fr_auto] sm:items-end">
        <div className="min-w-0">
          <div className="mb-3 flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <Wallet className="h-4 w-4" /> Total Payroll
          </div>
          <p className="break-words text-3xl font-semibold tabular-nums text-foreground" aria-live="polite">
            {list.isError ? 'Unavailable' : formatCurrency(payrollTotal)}
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1.5 rounded-md bg-primary/5 px-2 py-1 font-medium text-primary">
              <CalendarIcon className="h-3.5 w-3.5" />
              {fromDate || toDate
                ? `${fromDate ? formatDateLong(fromDate) : 'Any start'} – ${toDate ? formatDateLong(toDate) : 'Any end'}`
                : 'All pay periods'}
            </span>
            {hasFilters && <span>Filtered total</span>}
          </div>
        </div>
        <div className="flex items-center gap-4 sm:border-l sm:border-border sm:pl-6">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-border bg-muted/40">
            <FileText className="h-5 w-5 text-muted-foreground" />
          </div>
          <div>
            <p className="text-2xl font-semibold tabular-nums">{filtered.length}</p>
            <p className="text-xs text-muted-foreground">{hasFilters ? 'Matching timesheets' : 'Total timesheets'}</p>
          </div>
        </div>
      </section>

      {/* Filters toolbar */}
      <section aria-label="Timesheet filters" className="mb-5 space-y-4">
        <div className="flex items-center gap-2 text-sm font-medium text-foreground">
          <Filter className="h-3.5 w-3.5" />
          Filter timesheets
        </div>

        <div className="grid grid-cols-2 gap-3 lg:grid-cols-6">
          {/* Search */}
          <div className="space-y-1.5 col-span-2 lg:col-span-6">
            <Label htmlFor="timesheet-search" className="sr-only">Search timesheets</Label>
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="timesheet-search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by employee, project, or role…"
                className="pl-9 h-10 bg-background"
              />
            </div>
          </div>

          {/* Employee */}
          <div className="space-y-1.5">
            <Label className="text-xs">Employee</Label>
            <Select value={employeeFilter} onValueChange={setEmployeeFilter}>
              <SelectTrigger className="h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All employees</SelectItem>
                {employeeOptions.map((n) => (
                  <SelectItem key={n} value={n}>
                    {n}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Project */}
          <div className="space-y-1.5">
            <Label className="text-xs">Project / Jobsite</Label>
            <Select value={projectFilter} onValueChange={setProjectFilter}>
              <SelectTrigger className="h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All projects</SelectItem>
                {projectOptions.map((n) => (
                  <SelectItem key={n} value={n}>
                    {n}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Role */}
          <div className="space-y-1.5">
            <Label className="text-xs">Role / Trade</Label>
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All roles</SelectItem>
                {roleOptions.map((r) => (
                  <SelectItem key={r} value={r}>
                    {r}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* From */}
          <div className="space-y-1.5">
            <Label className="text-xs">Pay Period From</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    'w-full justify-start text-left font-normal h-9',
                    !fromDate && 'text-muted-foreground'
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {fromDate ? new Date(`${fromDate}T12:00:00`).toLocaleDateString('en-US') : 'Any'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={parseIso(fromDate)}
                  onSelect={(d) => setFromDate(d ? toIsoDate(d) : '')}
                  initialFocus
                  className={cn('p-3 pointer-events-auto')}
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* To */}
          <div className="space-y-1.5">
            <Label className="text-xs">Pay Period To</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    'w-full justify-start text-left font-normal h-9',
                    !toDate && 'text-muted-foreground'
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {toDate ? new Date(`${toDate}T12:00:00`).toLocaleDateString('en-US') : 'Any'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={parseIso(toDate)}
                  onSelect={(d) => setToDate(d ? toIsoDate(d) : '')}
                  initialFocus
                  className={cn('p-3 pointer-events-auto')}
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Clear */}
          <div className="space-y-1.5 flex items-end">
            {hasFilters ? (
              <Button variant="outline" onClick={clearFilters} className="h-9 w-full gap-2">
                <X className="h-4 w-4" /> Clear filters
              </Button>
            ) : (
              <div className="h-9" />
            )}
          </div>
        </div>

      </section>

      {/* Bulk actions bar */}
      {selectedCount > 0 && (
        <div role="region" aria-label="Selected timesheet actions" className="p-3 mb-4 flex flex-wrap items-center gap-3 rounded-lg border border-primary/20 bg-primary/5">
          <span className="text-sm font-medium">
            {selectedCount} selected
          </span>
          <div className="flex flex-wrap gap-2 sm:ml-auto">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setSelectedIds(new Set())}
              disabled={!!bulkProgress}
            >
              Clear
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setMoveDialogOpen(true)}
              disabled={!!bulkProgress}
              className="gap-2"
            >
              <FolderInput className="h-4 w-4" />
              Move to folder
            </Button>
            {bulkProgress ? (
              <Button size="sm" disabled className="gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                {bulkProgress.current === 0
                  ? 'Generating combined PDF…'
                  : `Downloading ${bulkProgress.current} of ${bulkProgress.total}…`}
              </Button>
            ) : (
              <div className="flex">
                <Button
                  size="sm"
                  onClick={handleBulkDownloadCombined}
                  className="gap-2 rounded-r-none"
                >
                  <FileText className="h-4 w-4" />
                  Download as 1 PDF
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button size="sm" aria-label="More download options" className="rounded-l-none border-l border-primary-foreground/20 px-2">
                      <ChevronDown className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={handleBulkDownloadCombined} className="gap-2">
                      <FileText className="h-4 w-4" />
                      Download as 1 combined PDF
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleBulkDownload} className="gap-2">
                      <Files className="h-4 w-4" />
                      Download {selectedCount} separate PDF{selectedCount > 1 ? 's' : ''}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            )}
          </div>
        </div>
      )}

      {filtered.length === 0 ? (
        <Card className="p-10 text-center text-sm text-muted-foreground">
          No timesheets match the selected filters.
        </Card>
      ) : (
        <TableCard.Root className="overflow-hidden rounded-lg shadow-none">
          <TableCard.Header title="All Timesheets" badge={filtered.length} className="px-4 py-4 sm:px-5" />
          {/* Desktop table */}
          <div className="hidden md:block">
            <Table size="sm" className="[&_th]:whitespace-nowrap [&_td]:px-4 [&_th]:px-4">
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10">
                    <Checkbox
                      checked={
                        allVisibleSelected
                          ? true
                          : someVisibleSelected
                          ? 'indeterminate'
                          : false
                      }
                      onCheckedChange={(v) => toggleSelectAll(!!v)}
                      aria-label="Select all visible"
                    />
                  </TableHead>
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
                {paginated.map((ts) => (
                  <TableRow key={ts.id} data-state={selectedIds.has(ts.id) ? 'selected' : undefined}>
                    <TableCell>
                      <Checkbox
                        checked={selectedIds.has(ts.id)}
                        onCheckedChange={(v) => toggleOne(ts.id, !!v)}
                        aria-label={`Select ${ts.employee_name}`}
                      />
                    </TableCell>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-3">
                        <span aria-hidden="true" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-border bg-muted text-xs font-semibold text-muted-foreground">
                          {ts.employee_name.split(' ').filter(Boolean).slice(0, 2).map((name) => name[0]).join('')}
                        </span>
                        <div className="min-w-[130px] space-y-1">
                        <div>{ts.employee_name}</div>
                        {ts.employee_role && (
                          <div className="text-xs text-muted-foreground font-normal">
                            {ts.employee_role}
                          </div>
                        )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell><div className="flex items-center gap-2"><Building2 className="h-4 w-4 shrink-0 text-muted-foreground" /><span className="min-w-[100px] max-w-[180px] break-words">{ts.project_name}</span></div></TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      <div className="whitespace-nowrap text-foreground">{formatDateLong(ts.pay_period_start)}</div>
                      <div className="mt-1 flex items-center gap-1 text-xs"><ArrowRight className="h-3 w-3" />{formatDateLong(ts.pay_period_end)}</div>
                    </TableCell>
                    <TableCell className="text-right tabular-nums whitespace-nowrap">
                      {Number(ts.total_hours).toFixed(2)} <span className="text-xs text-muted-foreground">hrs</span>
                    </TableCell>
                    <TableCell className="text-right font-semibold tabular-nums whitespace-nowrap">
                      {formatCurrency(Number(ts.total_payment))}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(ts.created_at).toLocaleDateString('en-US')}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-0.5 text-muted-foreground [&_button]:h-8 [&_button]:w-8">
                        <Button size="icon" variant="ghost" onClick={() => setViewing(ts)} title="View timesheet" aria-label="View timesheet">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button size="icon" variant="ghost" onClick={() => setEditing(ts)} title="Edit timesheet" aria-label="Edit timesheet">
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => handleDownload(ts)}
                          disabled={downloadingId === ts.id}
                          title="Download PDF" aria-label="Download PDF"
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
                          title="Delete timesheet" aria-label="Delete timesheet"
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
          </div>

          {/* Mobile cards */}
          <div className="md:hidden divide-y divide-border border-t border-border">
            {paginated.map((ts) => (
              <article key={ts.id} className={cn("p-4 space-y-3", selectedIds.has(ts.id) && "bg-muted/50")}>
                <div className="flex flex-wrap justify-between items-start gap-3">
                  <div className="flex min-w-0 flex-1 items-start gap-3">
                    <Checkbox
                      checked={selectedIds.has(ts.id)}
                      onCheckedChange={(v) => toggleOne(ts.id, !!v)}
                      aria-label={`Select ${ts.employee_name}`}
                      className="mt-1"
                    />
                    <div className="min-w-0 break-words">
                      <p className="font-semibold">{ts.employee_name}</p>
                      {ts.employee_role && (
                        <p className="text-xs text-muted-foreground">{ts.employee_role}</p>
                      )}
                      <p className="text-sm text-muted-foreground">{ts.project_name}</p>
                    </div>
                  </div>
                  <p className="font-semibold tabular-nums text-foreground">
                    {formatCurrency(Number(ts.total_payment))}
                  </p>
                </div>
                <p className="text-xs text-muted-foreground">
                  {formatDateLong(ts.pay_period_start)} – {formatDateLong(ts.pay_period_end)}
                </p>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">
                    {Number(ts.total_hours).toFixed(2)} hrs
                  </span>
                  <div className="flex gap-1">
                    <Button size="icon" variant="ghost" className="h-9 w-9" title="View timesheet" aria-label="View timesheet" onClick={() => setViewing(ts)}>
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button size="icon" variant="ghost" className="h-9 w-9" title="Edit timesheet" aria-label="Edit timesheet" onClick={() => setEditing(ts)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-9 w-9"
                      title="Download PDF" aria-label="Download PDF"
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
                      className="h-9 w-9 text-destructive"
                      title="Delete timesheet" aria-label="Delete timesheet"
                      onClick={() => setDeleting(ts)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </article>
            ))}
          </div>

          {/* Pagination footer */}
          <TableCard.Footer className="px-4 py-4 bg-muted/20">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex flex-wrap items-center justify-center gap-3">
                <div className="text-xs text-muted-foreground">
                  Showing <span className="font-medium text-foreground">{startItem}</span> to{' '}
                  <span className="font-medium text-foreground">{endItem}</span> of{' '}
                  <span className="font-medium text-foreground">{filtered.length}</span> timesheets
                </div>
                <div className="flex items-center gap-2">
                  <Label className="text-xs text-muted-foreground">Per page</Label>
                  <Select
                    value={String(pageSize)}
                    onValueChange={(v) => setPageSize(Number(v))}
                  >
                    <SelectTrigger className="h-8 w-[80px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[10, 20, 50, 100].map((n) => (
                        <SelectItem key={n} value={String(n)}>
                          {n}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {totalPages > 1 && (
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={() => setCurrentPage(1)}
                    disabled={currentPage === 1}
                    title="First page"
                  >
                    <ChevronsLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    title="Previous page"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <div className="flex items-center gap-1 px-2">
                    <span className="text-sm text-muted-foreground">Page</span>
                    <span className="text-sm font-medium min-w-[1.5rem] text-center">
                      {currentPage}
                    </span>
                    <span className="text-sm text-muted-foreground">of {totalPages}</span>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    title="Next page"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={() => setCurrentPage(totalPages)}
                    disabled={currentPage === totalPages}
                    title="Last page"
                  >
                    <ChevronsRight className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          </TableCard.Footer>
        </TableCard.Root>
      )}

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

      <MoveToFolderDialog
        open={moveDialogOpen}
        onOpenChange={setMoveDialogOpen}
        timesheetIds={Array.from(selectedIds)}
        onMoved={() => setSelectedIds(new Set())}
      />
    </>
  );
};
