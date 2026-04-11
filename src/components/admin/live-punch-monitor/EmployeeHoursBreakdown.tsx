import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Clock, Coffee, AlertTriangle, ArrowRight } from 'lucide-react';
import { format } from 'date-fns';
import { parseLocalDate } from '@/utils/dateUtils';
import { formatDurationFromMinutes } from '@/hooks/useDailyHoursSummary';
import type { EmployeeBreakdown } from '@/hooks/useEmployeeHoursBreakdown';

interface EmployeeHoursBreakdownProps {
  employees: EmployeeBreakdown[];
  incompleteCount: number;
}

const EmployeeHoursBreakdown: React.FC<EmployeeHoursBreakdownProps> = ({ employees, incompleteCount }) => {
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
              <div className="flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-sm font-bold text-foreground">{formatDurationFromMinutes(emp.totalNetMinutes)}</span>
              </div>
              {emp.totalBreakMinutes > 0 && (
                <div className="flex items-center gap-1 text-muted-foreground">
                  <Coffee className="h-3 w-3" />
                  <span className="text-xs">{formatDurationFromMinutes(emp.totalBreakMinutes)}</span>
                </div>
              )}
            </div>
          </div>

          {/* Days */}
          <div className="divide-y divide-border">
            {emp.days.map((day) => (
              <div key={day.date} className="px-4 py-2.5">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    {format(parseLocalDate(day.date), 'EEE, MMM dd')}
                  </span>
                  <span className="text-xs font-semibold text-foreground">
                    {formatDurationFromMinutes(day.dayNetMinutes)}
                  </span>
                </div>

                {/* Punch rows */}
                <div className="space-y-1">
                  {day.punches.map((punch) => (
                    <div
                      key={punch.id}
                      className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted-foreground"
                    >
                      {/* Time in → Time out */}
                      <span className="flex items-center gap-1 text-foreground font-medium">
                        {format(new Date(punch.checkIn), 'h:mm a')}
                        <ArrowRight className="h-3 w-3 text-muted-foreground" />
                        {punch.isIncomplete ? (
                          <span className="text-amber-600 dark:text-amber-400 flex items-center gap-0.5">
                            <AlertTriangle className="h-3 w-3" />
                            Missing
                          </span>
                        ) : (
                          format(new Date(punch.checkOut!), 'h:mm a')
                        )}
                      </span>

                      {/* Break */}
                      {punch.breakMinutes > 0 && (
                        <span className="flex items-center gap-0.5">
                          <Coffee className="h-3 w-3" />
                          {punch.breakMinutes}m
                        </span>
                      )}

                      {/* Net */}
                      {!punch.isIncomplete && (
                        <span className="font-medium text-foreground">
                          {formatDurationFromMinutes(punch.netMinutes)}
                        </span>
                      )}

                      {/* Jobsite */}
                      {punch.jobsiteName && punch.jobsiteName !== '—' && (
                        <span className="text-muted-foreground/70 truncate max-w-[140px]">
                          @ {punch.jobsiteName}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export default EmployeeHoursBreakdown;
