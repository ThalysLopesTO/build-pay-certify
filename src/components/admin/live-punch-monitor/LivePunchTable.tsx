
import React, { useState, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableHeadSortable, TableRow } from '@/components/ui/table';
import { TableCard } from '@/components/ui/table-card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { MapPin, Flag, Edit, Trash2, Clock, ChevronLeft, ChevronRight } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import WorkNoteDisplay from './WorkNoteDisplay';
import EmployeeAvatar from '@/components/ui/employee-avatar';
import { useAuth } from '@/contexts/SupabaseAuthContext';

declare global {
  interface Window {
    google: any;
  }
}

interface PunchEntry {
  id: string;
  user_id: string;
  jobsite_id: string;
  check_in_time: string | null;
  check_out_time: string | null;
  check_in_location: string | null;
  check_out_location: string | null;
  work_note: string | null;
  status: string;
  break_minutes?: number | null;
  user_profiles: {
    first_name: string;
    last_name: string;
    photo_url: string | null;
  } | null;
  jobsites: {
    name: string;
    latitude: number | null;
    longitude: number | null;
  } | null;
}

interface LivePunchTableProps {
  filteredEntries: PunchEntry[];
  selectedDate: Date;
  flaggedEntries: Set<string>;
  onToggleFlag: (entryId: string) => void;
  onViewLocation: (entry: PunchEntry) => void;
  onEdit?: (entry: PunchEntry) => void;
  onDelete?: (entry: PunchEntry) => void;
  isLoading?: boolean;
  currentPage?: number;
  totalPages?: number;
  totalItems?: number;
  itemsPerPage?: number;
  onPageChange?: (page: number) => void;
  selectionEnabled?: boolean;
  selectedIds?: Set<string>;
  onToggleSelect?: (id: string) => void;
  onToggleSelectAll?: () => void;
  allVisibleSelected?: boolean;
}

type SortColumn = 'employee' | 'jobsite' | 'check_in' | 'check_out' | 'duration' | 'break' | 'status';
type SortDirection = 'ascending' | 'descending';

const LivePunchTable: React.FC<LivePunchTableProps> = ({
  filteredEntries,
  selectedDate,
  flaggedEntries,
  onToggleFlag,
  onViewLocation,
  onEdit,
  onDelete,
  isLoading = false,
  currentPage = 1,
  totalPages = 1,
  totalItems = 0,
  itemsPerPage = 10,
  onPageChange,
  selectionEnabled = false,
  selectedIds = new Set(),
  onToggleSelect,
  onToggleSelectAll,
  allVisibleSelected = false,
}) => {
  const isMobile = useIsMobile();
  const { user } = useAuth();
  const [sortColumn, setSortColumn] = useState<SortColumn | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>('ascending');

  const handleSort = (column: SortColumn) => {
    if (sortColumn === column) {
      setSortDirection(prev => prev === 'ascending' ? 'descending' : 'ascending');
    } else {
      setSortColumn(column);
      setSortDirection('ascending');
    }
  };

  const getSortValue = (entry: PunchEntry, col: SortColumn): string | number => {
    switch (col) {
      case 'employee':
        return entry.user_profiles ? `${entry.user_profiles.first_name} ${entry.user_profiles.last_name}` : '';
      case 'jobsite':
        return entry.jobsites?.name || '';
      case 'check_in':
        return entry.check_in_time || '';
      case 'check_out':
        return entry.check_out_time || '';
      case 'duration':
        return getDurationMinutes(entry.check_in_time, entry.check_out_time);
      case 'break':
        return entry.break_minutes || 0;
      case 'status':
        return entry.check_out_time ? 1 : 0;
      default:
        return '';
    }
  };

  const sortedEntries = useMemo(() => {
    if (!sortColumn) return filteredEntries;
    return [...filteredEntries].sort((a, b) => {
      const valA = getSortValue(a, sortColumn);
      const valB = getSortValue(b, sortColumn);
      let cmp = 0;
      if (typeof valA === 'number' && typeof valB === 'number') {
        cmp = valA - valB;
      } else {
        cmp = String(valA).localeCompare(String(valB));
      }
      return sortDirection === 'descending' ? -cmp : cmp;
    });
  }, [filteredEntries, sortColumn, sortDirection]);

  const getDurationMinutes = (checkIn: string | null, checkOut: string | null): number => {
    if (!checkIn) return 0;
    const start = new Date(checkIn).getTime();
    const end = checkOut ? new Date(checkOut).getTime() : Date.now();
    return Math.floor((end - start) / 60000);
  };

  const formatDuration = (checkIn: string | null, checkOut: string | null): string => {
    if (!checkIn) return '0h 0m';
    const mins = getDurationMinutes(checkIn, checkOut);
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return `${h}h ${m}m`;
  };

  const formatBreakTime = (minutes: number | null | undefined): string => {
    if (!minutes) return '0m';
    if (minutes < 60) return `${minutes}m`;
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return m > 0 ? `${h}h ${String(m).padStart(2, '0')}m` : `${h}h`;
  };

  const isDateToday = (date: Date | null) => {
    if (!date) return false;
    return date.toDateString() === new Date().toDateString();
  };

  const getSorted = (col: SortColumn): 'ascending' | 'descending' | false => {
    if (sortColumn !== col) return false;
    return sortDirection;
  };

  // Mobile card layout
  if (isMobile) {
    return (
      <TooltipProvider>
        <TableCard.Root>
          <TableCard.Header
            title={isDateToday(selectedDate) ? "Live Punch Monitor" : `Punch Records`}
            badge={filteredEntries.length}
            trailing={
              isDateToday(selectedDate) ? (
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 dark:bg-green-950 dark:text-green-400 dark:border-green-800">
                  <div className="w-1.5 h-1.5 bg-green-500 rounded-full mr-1.5 animate-pulse" />
                  Live
                </Badge>
              ) : (
                <span className="text-xs text-muted-foreground">{format(selectedDate, 'MMM dd, yyyy')}</span>
              )
            }
          />

          <div className="p-3 space-y-2">
            {sortedEntries.length === 0 ? (
              <div className="text-center py-12">
                <div className="flex flex-col items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                    <Clock className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="font-medium text-sm text-foreground">No punch records found</p>
                    <p className="text-xs text-muted-foreground mt-1">{format(selectedDate, 'MMMM dd, yyyy')}</p>
                  </div>
                </div>
              </div>
            ) : (
              sortedEntries.map((entry) => (
                <div
                  key={entry.id}
                  className={cn(
                    "rounded-lg border p-3 space-y-2.5 transition-colors",
                    selectedIds.has(entry.id) && 'ring-2 ring-primary/30 bg-primary/5',
                    flaggedEntries.has(entry.id) && 'border-l-4 border-l-destructive bg-destructive/5'
                  )}
                >
                  {/* Employee Header */}
                  <div className="flex items-start gap-3">
                    {selectionEnabled && onToggleSelect && (
                      <Checkbox
                        checked={selectedIds.has(entry.id)}
                        onCheckedChange={() => onToggleSelect(entry.id)}
                        className="mt-1 flex-shrink-0"
                      />
                    )}
                    <EmployeeAvatar
                      photoUrl={entry.user_profiles?.photo_url}
                      firstName={entry.user_profiles?.first_name}
                      lastName={entry.user_profiles?.last_name}
                      size="sm"
                      className="flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">
                        {entry.user_profiles ? `${entry.user_profiles.first_name} ${entry.user_profiles.last_name}` : 'Unknown'}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">{entry.jobsites?.name || 'Unknown Jobsite'}</p>
                    </div>
                    <div className="flex-shrink-0">
                      {!entry.check_out_time ? (
                        <Badge variant="outline" className="text-green-700 border-green-300 bg-green-50 dark:bg-green-950 dark:text-green-400 text-[10px]">
                          <div className="w-1.5 h-1.5 bg-green-500 rounded-full mr-1 animate-pulse" />
                          Active
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-muted-foreground border-border text-[10px]">
                          <div className="w-1.5 h-1.5 bg-muted-foreground rounded-full mr-1" />
                          Complete
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Time Grid */}
                  <div className="grid grid-cols-4 gap-2 p-2 bg-muted/40 rounded-md">
                    <div className="text-center">
                      <p className="text-[10px] text-muted-foreground font-medium uppercase">In</p>
                      <p className="font-mono text-xs font-semibold text-foreground">
                        {entry.check_in_time ? format(new Date(entry.check_in_time), 'h:mm a') : 'N/A'}
                      </p>
                    </div>
                    <div className="text-center border-x border-border/40">
                      <p className="text-[10px] text-muted-foreground font-medium uppercase">Out</p>
                      {entry.check_out_time ? (
                        <p className="font-mono text-xs font-semibold text-foreground">{format(new Date(entry.check_out_time), 'h:mm a')}</p>
                      ) : (
                        <p className="text-[10px] text-green-600 font-semibold">Live</p>
                      )}
                    </div>
                    <div className="text-center border-r border-border/40">
                      <p className="text-[10px] text-muted-foreground font-medium uppercase">Worked</p>
                      <p className="font-mono text-xs font-semibold text-foreground">{formatDuration(entry.check_in_time, entry.check_out_time)}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-[10px] text-muted-foreground font-medium uppercase">Break</p>
                      <p className="font-mono text-xs font-medium text-muted-foreground">{formatBreakTime(entry.break_minutes)}</p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-between pt-1 border-t border-border/40">
                    <div className="flex items-center gap-1">
                      <WorkNoteDisplay note={entry.work_note} variant="icon" />
                      {entry.check_in_location && (
                        <Button variant="ghost" size="sm" onClick={() => onViewLocation(entry)} className="h-7 w-7 p-0">
                          <MapPin className="h-3.5 w-3.5 text-blue-500" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onToggleFlag(entry.id)}
                        className={cn("h-7 w-7 p-0", flaggedEntries.has(entry.id) ? "text-destructive" : "text-muted-foreground")}
                      >
                        <Flag className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                    <div className="flex items-center gap-1">
                      {onEdit && (
                        <Button variant="ghost" size="sm" onClick={() => onEdit(entry)} className="h-7 w-7 p-0">
                          <Edit className="h-3.5 w-3.5 text-blue-500" />
                        </Button>
                      )}
                      {onDelete && (
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                              <Trash2 className="h-3.5 w-3.5 text-destructive" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent className="max-w-[90vw] sm:max-w-md">
                            <AlertDialogHeader>
                              <AlertDialogTitle className="text-base">Delete Punch Record</AlertDialogTitle>
                              <AlertDialogDescription className="text-sm">
                                Delete punch record for{' '}
                                <strong className="text-foreground">
                                  {entry.user_profiles ? `${entry.user_profiles.first_name} ${entry.user_profiles.last_name}` : 'Unknown'}
                                </strong>? This cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter className="flex-col sm:flex-row gap-2">
                              <AlertDialogCancel className="m-0">Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => onDelete(entry)} className="bg-destructive hover:bg-destructive/90 m-0">Delete</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Mobile Pagination */}
          {totalPages > 1 && onPageChange && (
            <TableCard.Footer className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">
                {Math.min((currentPage - 1) * itemsPerPage + 1, totalItems)}–{Math.min(currentPage * itemsPerPage, totalItems)} of {totalItems}
              </span>
              <div className="flex items-center gap-1">
                <Button variant="outline" size="sm" onClick={() => onPageChange(currentPage - 1)} disabled={currentPage === 1} className="h-7 px-2 text-xs">Prev</Button>
                <Button variant="outline" size="sm" onClick={() => onPageChange(currentPage + 1)} disabled={currentPage === totalPages} className="h-7 px-2 text-xs">Next</Button>
              </div>
            </TableCard.Footer>
          )}
        </TableCard.Root>
      </TooltipProvider>
    );
  }

  // Desktop table layout
  return (
    <TooltipProvider>
      <TableCard.Root>
        <TableCard.Header
          title={isDateToday(selectedDate) ? "Live Punch Monitor" : `Punch Records – ${format(selectedDate, 'MMM dd, yyyy')}`}
          badge={`${filteredEntries.length} ${filteredEntries.length === 1 ? 'record' : 'records'}`}
          trailing={
            <div className="flex items-center gap-2">
              {selectionEnabled && selectedIds.size > 0 && (
                <Badge variant="secondary" className="text-xs">{selectedIds.size} selected</Badge>
              )}
              {isDateToday(selectedDate) && (
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 dark:bg-green-950 dark:text-green-400 dark:border-green-800">
                  <div className="w-1.5 h-1.5 bg-green-500 rounded-full mr-1.5 animate-pulse" />
                  Live
                </Badge>
              )}
            </div>
          }
        />

        <Table size="sm">
          <TableHeader>
            <TableRow>
              {selectionEnabled && onToggleSelectAll && (
                <TableHead className="w-10">
                  <Checkbox
                    checked={allVisibleSelected && filteredEntries.length > 0}
                    onCheckedChange={() => onToggleSelectAll()}
                  />
                </TableHead>
              )}
              <TableHeadSortable sorted={getSorted('employee')} onSort={() => handleSort('employee')}>Employee</TableHeadSortable>
              <TableHeadSortable sorted={getSorted('jobsite')} onSort={() => handleSort('jobsite')}>Jobsite</TableHeadSortable>
              <TableHeadSortable sorted={getSorted('check_in')} onSort={() => handleSort('check_in')}>Check-in</TableHeadSortable>
              <TableHeadSortable sorted={getSorted('check_out')} onSort={() => handleSort('check_out')}>Check-out</TableHeadSortable>
              <TableHeadSortable sorted={getSorted('duration')} onSort={() => handleSort('duration')}>Worked</TableHeadSortable>
              <TableHeadSortable sorted={getSorted('break')} onSort={() => handleSort('break')}>Break</TableHeadSortable>
              <TableHeadSortable sorted={getSorted('status')} onSort={() => handleSort('status')}>Status</TableHeadSortable>
              <TableHead>Note</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedEntries.length === 0 ? (
              <TableRow>
                <TableCell colSpan={selectionEnabled ? 10 : 9} className="text-center py-12">
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                      <Clock className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">No punch records found</p>
                      <p className="text-sm text-muted-foreground mt-1">{format(selectedDate, 'MMMM dd, yyyy')}</p>
                    </div>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              sortedEntries.map((entry, index) => (
                <TableRow
                  key={entry.id}
                  className={cn(
                    selectedIds.has(entry.id) && 'bg-primary/5',
                    flaggedEntries.has(entry.id) && 'bg-destructive/5 border-l-2 border-l-destructive'
                  )}
                >
                  {selectionEnabled && onToggleSelect && (
                    <TableCell className="w-10">
                      <Checkbox
                        checked={selectedIds.has(entry.id)}
                        onCheckedChange={() => onToggleSelect(entry.id)}
                      />
                    </TableCell>
                  )}

                  {/* Employee */}
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <EmployeeAvatar
                        photoUrl={entry.user_profiles?.photo_url}
                        firstName={entry.user_profiles?.first_name}
                        lastName={entry.user_profiles?.last_name}
                        size="sm"
                      />
                      <div>
                        <p className="text-sm font-medium text-foreground">
                          {entry.user_profiles ? `${entry.user_profiles.first_name} ${entry.user_profiles.last_name}` : 'Unknown'}
                        </p>
                        {entry.check_in_time && (
                          <p className="text-xs text-muted-foreground">{format(new Date(entry.check_in_time), 'EEE, MMM dd')}</p>
                        )}
                      </div>
                    </div>
                  </TableCell>

                  {/* Jobsite */}
                  <TableCell>
                    <span className="text-sm text-foreground">{entry.jobsites?.name || 'Unknown'}</span>
                  </TableCell>

                  {/* Check-in */}
                  <TableCell>
                    {entry.check_in_time ? (
                      <div>
                        <p className="font-mono text-sm font-medium text-foreground">{format(new Date(entry.check_in_time), 'h:mm a')}</p>
                        <p className="text-xs text-muted-foreground">{format(new Date(entry.check_in_time), 'MMM dd')}</p>
                      </div>
                    ) : (
                      <span className="text-sm text-muted-foreground">N/A</span>
                    )}
                  </TableCell>

                  {/* Check-out */}
                  <TableCell>
                    {entry.check_out_time ? (
                      <div>
                        <p className="font-mono text-sm font-medium text-foreground">{format(new Date(entry.check_out_time), 'h:mm a')}</p>
                        <p className="text-xs text-muted-foreground">{format(new Date(entry.check_out_time), 'MMM dd')}</p>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5">
                        <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                        <span className="text-xs font-medium text-green-600">Active</span>
                      </div>
                    )}
                  </TableCell>

                  {/* Worked Duration */}
                  <TableCell>
                    <span className="font-mono text-sm font-medium text-foreground">
                      {formatDuration(entry.check_in_time, entry.check_out_time)}
                    </span>
                  </TableCell>

                  {/* Break */}
                  <TableCell>
                    <span className="font-mono text-sm text-muted-foreground">
                      {formatBreakTime(entry.break_minutes)}
                    </span>
                  </TableCell>

                  {/* Status */}
                  <TableCell>
                    {!entry.check_out_time ? (
                      <Badge variant="outline" className="text-green-700 border-green-300 bg-green-50 dark:bg-green-950 dark:text-green-400">
                        <div className="w-1.5 h-1.5 bg-green-500 rounded-full mr-1.5 animate-pulse" />
                        Active
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-muted-foreground border-border">
                        <div className="w-1.5 h-1.5 bg-muted-foreground rounded-full mr-1.5" />
                        Complete
                      </Badge>
                    )}
                  </TableCell>

                  {/* Note */}
                  <TableCell>
                    <WorkNoteDisplay note={entry.work_note} variant="icon" />
                  </TableCell>

                  {/* Actions */}
                  <TableCell>
                    <div className="flex items-center justify-end gap-1">
                      {entry.check_in_location && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button variant="ghost" size="sm" onClick={() => onViewLocation(entry)} className="h-8 w-8 p-0">
                              <MapPin className="h-4 w-4 text-muted-foreground hover:text-blue-500" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent><p className="text-xs">View location</p></TooltipContent>
                        </Tooltip>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onToggleFlag(entry.id)}
                        className={cn("h-8 w-8 p-0", flaggedEntries.has(entry.id) ? "text-destructive bg-destructive/10" : "text-muted-foreground")}
                      >
                        <Flag className="h-4 w-4" />
                      </Button>
                      {onEdit && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button variant="ghost" size="sm" onClick={() => onEdit(entry)} className="h-8 w-8 p-0">
                              <Edit className="h-4 w-4 text-muted-foreground hover:text-blue-500" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent><p className="text-xs">Edit</p></TooltipContent>
                        </Tooltip>
                      )}
                      {onDelete && (
                        <AlertDialog>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                  <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                                </Button>
                              </AlertDialogTrigger>
                            </TooltipTrigger>
                            <TooltipContent><p className="text-xs">Delete</p></TooltipContent>
                          </Tooltip>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Punch Record</AlertDialogTitle>
                              <AlertDialogDescription>
                                Delete punch record for{' '}
                                <strong>{entry.user_profiles ? `${entry.user_profiles.first_name} ${entry.user_profiles.last_name}` : 'Unknown'}</strong>? This cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => onDelete(entry)} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        {/* Pagination */}
        {onPageChange && (
          <TableCard.Footer className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-sm text-muted-foreground">
                Page {currentPage} of {totalPages}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => onPageChange(currentPage - 1)} disabled={currentPage === 1} className="h-8 px-3 text-xs gap-1">
                <ChevronLeft className="h-4 w-4" />
                Previous
              </Button>
              <Button variant="outline" size="sm" onClick={() => onPageChange(currentPage + 1)} disabled={currentPage === totalPages} className="h-8 px-3 text-xs gap-1">
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </TableCard.Footer>
        )}
      </TableCard.Root>
    </TooltipProvider>
  );
};

export default LivePunchTable;
