import React, { useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Clock, Coffee, AlertTriangle, ArrowRight, Pencil, Timer, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { parseLocalDate } from '@/utils/dateUtils';
import { formatDurationFromMinutes } from '@/hooks/useDailyHoursSummary';
import { useDeleteTimesheet } from '@/hooks/useDeleteTimesheet';
import type { EmployeeBreakdown, PunchRecord } from '@/hooks/useEmployeeHoursBreakdown';
import PunchEditModal from './PunchEditModal';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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

interface EmployeeHoursBreakdownProps {
  employees: EmployeeBreakdown[];
  incompleteCount: number;
  canEdit?: boolean;
}

const EmployeeHoursBreakdown: React.FC<EmployeeHoursBreakdownProps> = ({ employees, incompleteCount, canEdit = false }) => {
  const [editingPunch, setEditingPunch] = useState<PunchRecord | null>(null);
  const [editingEmployee, setEditingEmployee] = useState('');
  const [deletingPunch, setDeletingPunch] = useState<PunchRecord | null>(null);
  const [deletingEmployee, setDeletingEmployee] = useState('');

  const deleteMutation = useDeleteTimesheet();

  const handleDelete = () => {
    if (!deletingPunch) return;
    deleteMutation.mutate(deletingPunch.id, {
      onSettled: () => setDeletingPunch(null),
    });
  };

  return (
    <div className="space-y-4">
      {incompleteCount > 0 && (
        <div className="flex items-center gap-2 text-xs text-amber-600 bg-amber-50 dark:bg-amber-950/30 dark:text-amber-400 rounded-lg px-3 py-2 border border-amber-200 dark:border-amber-800">
          <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
          <span>{incompleteCount} incomplete {incompleteCount === 1 ? 'punch' : 'punches'} excluded from totals (missing clock out)</span>
        </div>
      )}

      {employees.map((emp) => (
        <div key={emp.userId} className="rounded-lg border bg-card overflow-hidden">
          {/* Employee header */}
          <div className="flex items-center justify-between px-4 py-3 bg-muted/40 border-b">
            <div className="flex items-center gap-3">
              <Avatar className="h-8 w-8">
                {emp.photoUrl && <AvatarImage src={emp.photoUrl} alt={`${emp.firstName} ${emp.lastName}`} />}
                <AvatarFallback className="text-xs font-medium bg-primary/10 text-primary">
                  {emp.firstName?.[0]}{emp.lastName?.[0]}
                </AvatarFallback>
              </Avatar>
              <span className="text-sm font-semibold text-foreground">
                {emp.firstName} {emp.lastName}
              </span>
            </div>
            <div className="flex items-center gap-4 text-right">
              <div className="flex items-center gap-1.5" title="Paid Hours">
                <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-sm font-bold text-foreground">{formatDurationFromMinutes(emp.totalNetMinutes)}</span>
              </div>
              <div className="flex items-center gap-1 text-muted-foreground" title="Raw Hours">
                <Timer className="h-3 w-3" />
                <span className="text-xs">{formatDurationFromMinutes(emp.totalGrossMinutes)}</span>
              </div>
              <div className="flex items-center gap-1 text-muted-foreground" title="Break">
                <Coffee className="h-3 w-3" />
                <span className="text-xs">{formatDurationFromMinutes(emp.totalBreakMinutes)}</span>
              </div>
            </div>
          </div>

          {/* Table layout - desktop */}
          <div className="hidden md:block">
            <Table size="sm">
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Start</TableHead>
                  <TableHead>End</TableHead>
                  <TableHead>Break</TableHead>
                  <TableHead>Raw Hours</TableHead>
                  <TableHead>Paid Hours</TableHead>
                  <TableHead>Jobsite</TableHead>
                  <TableHead>Notes</TableHead>
                  {canEdit && <TableHead className="text-right">Actions</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {emp.days.map((day) =>
                  day.punches.map((punch, pIdx) => (
                    <TableRow key={punch.id}>
                      {pIdx === 0 ? (
                        <TableCell rowSpan={day.punches.length} className="align-top font-semibold text-xs text-muted-foreground whitespace-nowrap">
                          {format(parseLocalDate(day.date), 'EEE, MMM dd')}
                        </TableCell>
                      ) : null}
                      <TableCell className="text-xs font-medium">
                        {format(new Date(punch.checkIn), 'h:mm a')}
                      </TableCell>
                      <TableCell className="text-xs font-medium">
                        {punch.isIncomplete ? (
                          <span className="text-amber-600 dark:text-amber-400 flex items-center gap-0.5">
                            <AlertTriangle className="h-3 w-3" /> Missing
                          </span>
                        ) : (
                          format(new Date(punch.checkOut!), 'h:mm a')
                        )}
                      </TableCell>
                      <TableCell className="text-xs">
                        <span className="flex items-center gap-0.5">
                          <Coffee className="h-3 w-3 text-muted-foreground" />
                          {punch.breakMinutes}m
                        </span>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {punch.isIncomplete ? '—' : formatDurationFromMinutes(punch.grossMinutes)}
                      </TableCell>
                      <TableCell className="text-xs font-medium">
                        {punch.isIncomplete ? '—' : formatDurationFromMinutes(punch.netMinutes)}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground truncate max-w-[140px]">
                        {punch.jobsiteName !== '—' ? punch.jobsiteName : '—'}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground max-w-[220px]" title={punch.note || ''}>
                        <span className="line-clamp-2 whitespace-pre-wrap">
                          {punch.note || '—'}
                        </span>
                      </TableCell>
                      {canEdit && (
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-0.5">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={() => {
                                setEditingPunch(punch);
                                setEditingEmployee(`${emp.firstName} ${emp.lastName}`);
                              }}
                            >
                              <Pencil className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 text-destructive hover:text-destructive"
                              onClick={() => {
                                setDeletingPunch(punch);
                                setDeletingEmployee(`${emp.firstName} ${emp.lastName}`);
                              }}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </TableCell>
                      )}
                    </TableRow>
                  ))
                )}
                {/* Day subtotal row */}
                {emp.days.length > 1 && (
                  <TableRow className="bg-muted/30 font-semibold">
                    <TableCell colSpan={3} className="text-xs text-right">Employee Total</TableCell>
                    <TableCell className="text-xs">
                      <span className="flex items-center gap-0.5">
                        <Coffee className="h-3 w-3" />
                        {formatDurationFromMinutes(emp.totalBreakMinutes)}
                      </span>
                    </TableCell>
                    <TableCell className="text-xs">{formatDurationFromMinutes(emp.totalGrossMinutes)}</TableCell>
                    <TableCell className="text-xs font-bold">{formatDurationFromMinutes(emp.totalNetMinutes)}</TableCell>
                    <TableCell colSpan={canEdit ? 3 : 2} />
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {/* Mobile card layout */}
          <div className="md:hidden divide-y divide-border">
            {emp.days.map((day) => (
              <div key={day.date} className="px-4 py-2.5">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    {format(parseLocalDate(day.date), 'EEE, MMM dd')}
                  </span>
                  <div className="flex items-center gap-3 text-xs">
                    <span className="text-muted-foreground">Raw: {formatDurationFromMinutes(day.dayGrossMinutes)}</span>
                    <span className="font-semibold text-foreground">Paid: {formatDurationFromMinutes(day.dayNetMinutes)}</span>
                  </div>
                </div>
                <div className="space-y-1.5">
                  {day.punches.map((punch) => (
                    <div key={punch.id} className="rounded-md border bg-muted/20 p-2.5 text-xs space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-1 font-medium text-foreground">
                          {format(new Date(punch.checkIn), 'h:mm a')}
                          <ArrowRight className="h-3 w-3 text-muted-foreground" />
                          {punch.isIncomplete ? (
                            <span className="text-amber-600 dark:text-amber-400 flex items-center gap-0.5">
                              <AlertTriangle className="h-3 w-3" /> Missing
                            </span>
                          ) : (
                            format(new Date(punch.checkOut!), 'h:mm a')
                          )}
                        </span>
                        {canEdit && (
                          <div className="flex items-center gap-0.5">
                            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => { setEditingPunch(punch); setEditingEmployee(`${emp.firstName} ${emp.lastName}`); }}>
                              <Pencil className="h-3 w-3" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive hover:text-destructive" onClick={() => { setDeletingPunch(punch); setDeletingEmployee(`${emp.firstName} ${emp.lastName}`); }}>
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-muted-foreground">
                        <span className="flex items-center gap-0.5"><Coffee className="h-3 w-3" /> {punch.breakMinutes}m</span>
                        {!punch.isIncomplete && (
                          <>
                            <span>Raw: {formatDurationFromMinutes(punch.grossMinutes)}</span>
                            <span className="font-medium text-foreground">Paid: {formatDurationFromMinutes(punch.netMinutes)}</span>
                          </>
                        )}
                        {punch.jobsiteName !== '—' && (
                          <span className="truncate max-w-[120px]">@ {punch.jobsiteName}</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      <PunchEditModal
        open={!!editingPunch}
        onOpenChange={(open) => { if (!open) setEditingPunch(null); }}
        punch={editingPunch}
        employeeName={editingEmployee}
      />

      <AlertDialog open={!!deletingPunch} onOpenChange={(open) => { if (!open) setDeletingPunch(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Punch Record</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this punch record for <strong>{deletingEmployee}</strong>
              {deletingPunch && (
                <> on {format(new Date(deletingPunch.checkIn), 'EEE, MMM dd yyyy')} at {format(new Date(deletingPunch.checkIn), 'h:mm a')}</>
              )}? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? 'Deleting…' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default EmployeeHoursBreakdown;
