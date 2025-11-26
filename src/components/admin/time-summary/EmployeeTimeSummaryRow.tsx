import React, { useState, useMemo } from 'react';
import { ChevronDown, ChevronUp, AlertTriangle, Clock, Briefcase, Calendar, RefreshCw, CheckCircle, Pencil } from 'lucide-react';
import EmployeeAvatar from '@/components/ui/employee-avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { format, parseISO } from 'date-fns';
import { EmployeeSummary } from '@/hooks/useTimeSummaryData';
import { useTimeSummaryDetails } from '@/hooks/useTimeSummaryDetails';
import { cn } from '@/lib/utils';
import { RoleBadge } from './RoleBadge';
import { RuleBasedTimeSummaryNote } from './RuleBasedTimeSummaryNote';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { EditPunchDialog } from './EditPunchDialog';
import type { DailyPunch } from '@/hooks/useTimeSummaryData';

// Convert 24-hour time string (HH:mm) to 12-hour AM/PM format
const formatTimeToAmPm = (timeString: string | null): string => {
  if (!timeString) return "—";
  
  try {
    const [hours, minutes] = timeString.split(':').map(Number);
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12; // Convert 0 to 12, and 13-23 to 1-11
    return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
  } catch {
    return timeString; // Return original if parsing fails
  }
};

interface EmployeeTimeSummaryRowProps {
  employee: EmployeeSummary;
  jobsiteId: string;
  startDate: Date;
  endDate: Date;
}

export const EmployeeTimeSummaryRow: React.FC<EmployeeTimeSummaryRowProps> = ({ 
  employee,
  jobsiteId,
  startDate,
  endDate 
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [editingPunch, setEditingPunch] = useState<DailyPunch | null>(null);
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  // Fetch daily details immediately to ensure accurate totals
  const { data: dailyPunches, isLoading, refetch } = useTimeSummaryDetails({
    employeeId: employee.employee_id,
    jobsiteId,
    startDate,
    endDate,
    enabled: true,
  });

  // Calculate totals from loaded data - return 0 values when no punches found
  const calculatedTotals = useMemo(() => {
    if (!dailyPunches || dailyPunches.length === 0) {
      return { totalRaw: 0, totalPaid: 0, totalBreak: 0, issueCount: 0, daysWorked: 0 };
    }
    
    const totalRaw = dailyPunches.reduce((sum, p) => {
      const val = p.raw_hours !== undefined ? p.raw_hours : p.hours_worked;
      return sum + (isNaN(val) ? 0 : val);
    }, 0);
    const totalPaid = dailyPunches.reduce((sum, p) => {
      const val = p.paid_hours !== undefined ? p.paid_hours : p.hours_worked;
      return sum + (isNaN(val) ? 0 : val);
    }, 0);
    const totalBreak = (totalRaw - totalPaid) * 60; // in minutes
    const issueCount = dailyPunches.reduce((sum, p) => sum + (p.flags?.length || 0), 0);
    
    return { totalRaw, totalPaid, totalBreak, issueCount, daysWorked: dailyPunches.length };
  }, [dailyPunches]);

  // Always prefer calculated totals when loaded, show 0 if no punches found
  const displayPaidHours = isLoading ? employee.total_hours : calculatedTotals.totalPaid;

  // Manual refresh handler
  const handleRefresh = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsRefreshing(true);
    try {
      await refetch();
    } finally {
      setIsRefreshing(false);
    }
  };

  // Get first and last name for avatar
  const nameParts = employee.employee_name.split(' ');
  const firstName = nameParts[0] || '';
  const lastName = nameParts[nameParts.length - 1] || '';

  // Determine subtitle
  const subtitle = [
    employee.employee_position || employee.employee_trade || employee.employee_role,
    `${employee.total_punches} ${employee.total_punches === 1 ? 'punch' : 'punches'}`
  ].filter(Boolean).join(' · ');

  return (
    <div className="mb-2">
      {/* Main Row */}
      <div
        className="flex items-center gap-3 md:gap-4 p-4 md:p-5 bg-gradient-to-r from-card via-card to-card/80 rounded-xl border border-border/50 shadow-sm hover:shadow-lg hover:border-primary/20 active:scale-[0.99] transition-all duration-300 cursor-pointer min-h-[72px] group"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        {/* Avatar */}
        <div className="flex-shrink-0">
          <EmployeeAvatar
            photoUrl={employee.employee_photo}
            firstName={firstName}
            lastName={lastName}
            size="md"
            className="ring-2 ring-border group-hover:ring-primary/20 transition-all"
          />
        </div>

        {/* Main Content */}
        <div className="flex-1 min-w-0 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <h3 className="text-base md:text-lg font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                {employee.employee_name}
              </h3>
              <RoleBadge 
                role={employee.employee_role}
                position={employee.employee_position}
                trade={employee.employee_trade}
              />
            </div>
            {subtitle && (
              <p className="text-xs text-muted-foreground truncate">
                {subtitle}
              </p>
            )}
          </div>

          {/* Right Side: Hours and Issues Badge */}
          <div className="flex items-center gap-4">
            <div className="flex flex-col items-end gap-2">
              {/* Paid Hours Label */}
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Paid hours</p>
              
              {/* Paid Hours - Large */}
              <div className="flex items-baseline gap-1.5">
                {isLoading ? (
                  <span className="text-2xl md:text-3xl font-bold text-muted-foreground animate-pulse">
                    ...
                  </span>
                ) : (
                  <>
                    <span className="text-2xl md:text-3xl font-bold text-primary group-hover:scale-105 transition-transform origin-right">
                      {(() => {
                        return isNaN(displayPaidHours) || displayPaidHours === null || displayPaidHours === undefined ? '—' : displayPaidHours.toFixed(2);
                      })()}
                    </span>
                    {!isNaN(displayPaidHours) && (
                      <span className="text-sm font-medium text-muted-foreground">hrs</span>
                    )}
                  </>
                )}
              </div>
              
              {/* Raw Hours - Small (only if different) */}
              {calculatedTotals && 
               !isNaN(calculatedTotals.totalRaw) &&
               !isNaN(calculatedTotals.totalPaid) &&
               calculatedTotals.totalRaw !== calculatedTotals.totalPaid && (
                <p className="text-xs text-muted-foreground/70">
                  Raw: {calculatedTotals.totalRaw.toFixed(2)} hrs
                </p>
              )}
            </div>
            
            {/* Issues Badge */}
            <div className="flex flex-col items-end gap-2">
              {calculatedTotals?.issueCount !== undefined && calculatedTotals.issueCount > 0 ? (
                <Badge variant="destructive" className="flex items-center gap-1.5 text-xs px-2.5 py-1 shadow-sm">
                  <AlertTriangle className="h-3.5 w-3.5" />
                  <span>{calculatedTotals.issueCount} {calculatedTotals.issueCount === 1 ? 'issue' : 'issues'}</span>
                </Badge>
              ) : calculatedTotals?.issueCount !== undefined ? (
                <Badge variant="outline" className="flex items-center gap-1.5 text-xs px-2.5 py-1 bg-green-100 text-green-800 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800 shadow-sm">
                  <CheckCircle className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">All clear</span>
                </Badge>
              ) : employee.has_flags ? (
                <Badge variant="destructive" className="flex items-center gap-1.5 text-xs px-2.5 py-1 shadow-sm">
                  <AlertTriangle className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Issues</span>
                </Badge>
              ) : null}

              {/* Expand Icon */}
              <div className="flex-shrink-0 ml-1">
                {isExpanded ? (
                  <ChevronUp className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Expanded Daily Breakdown */}
      {isExpanded && (
        <div className="mt-2 px-3 md:px-4 py-4 bg-muted/30 border rounded-lg shadow-inner">
          {/* Header with Date Range and Refresh */}
          <div className="mb-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-2 border-b border-border/50">
            <div className="flex items-center gap-2 flex-wrap">
              <Calendar className="h-4 w-4 text-primary" />
              <span className="text-sm font-semibold text-foreground">
                {format(startDate, 'MMM dd')} - {format(endDate, 'MMM dd, yyyy')}
              </span>
              <Badge variant="secondary" className="text-xs">
                {dailyPunches?.length || 0} {dailyPunches?.length === 1 ? 'day' : 'days'}
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <RuleBasedTimeSummaryNote />
              <Button
                variant="ghost"
                size="sm"
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="h-7 px-2"
              >
                <RefreshCw className={cn("h-3.5 w-3.5", isRefreshing && "animate-spin")} />
              </Button>
            </div>
          </div>

          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
              Loading details...
            </div>
          ) : !dailyPunches || dailyPunches.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Clock className="h-10 w-10 mx-auto mb-2 opacity-40" />
              <p className="text-sm font-medium">No punch records found</p>
              <p className="text-xs mt-1">
                Filter: {format(startDate, 'MMM dd')} - {format(endDate, 'MMM dd, yyyy')}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {/* Table Header - Hidden on mobile */}
              <div className="hidden md:grid grid-cols-[110px_1fr_90px_90px_60px_70px_70px_100px_40px] gap-2 px-3 py-2 bg-background/50 rounded-md text-xs font-medium text-muted-foreground border">
                <div>Date</div>
                <div>Project</div>
                <div>Time In</div>
                <div>Time Out</div>
                <div>Break</div>
                <div className="text-right">Raw</div>
                <div className="text-right">Paid</div>
                <div>Issues</div>
                <div></div>
              </div>

              {/* Table Rows */}
              {dailyPunches.map((punch, index) => (
                <div key={index}>
                  {/* Desktop View */}
                  <div className="hidden md:grid grid-cols-[110px_1fr_90px_90px_60px_70px_70px_100px_40px] gap-2 px-3 py-3 bg-background rounded-md border hover:bg-accent/50 transition-colors items-center">
                    <div className="text-sm font-medium">
                      {format(parseISO(punch.date), "MMM dd")}
                    </div>
                    <div className="flex items-center gap-2 text-sm min-w-0">
                      <Briefcase className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                      <span className="truncate">{punch.jobsite_name}</span>
                    </div>
                    <div className="text-sm flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5 text-green-600 flex-shrink-0" />
                      <span className="text-xs">{formatTimeToAmPm(punch.check_in_time)}</span>
                    </div>
                    <div className="text-sm flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5 text-red-600 flex-shrink-0" />
                      {punch.check_out_time ? (
                        <span className="text-xs">{formatTimeToAmPm(punch.check_out_time)}</span>
                      ) : punch.status === "active" ? (
                        <Badge variant="secondary" className="text-xs">
                          Active
                        </Badge>
                      ) : (
                        <span className="text-xs">—</span>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {punch.break_minutes ? `${punch.break_minutes}m` : "—"}
                    </div>
                    <div className="text-sm font-medium text-right">
                      {(() => {
                        const rawHours = punch.raw_hours !== undefined ? punch.raw_hours : punch.hours_worked;
                        return isNaN(rawHours) || rawHours === null || rawHours === undefined ? '—' : rawHours.toFixed(2);
                      })()}
                    </div>
                    <div className="text-sm font-semibold text-right text-primary">
                      {(() => {
                        const paidHours = punch.paid_hours !== undefined ? punch.paid_hours : punch.hours_worked;
                        return isNaN(paidHours) || paidHours === null || paidHours === undefined ? '—' : paidHours.toFixed(2);
                      })()}
                    </div>
                    <div className="flex items-center gap-1 flex-wrap">
                      {punch.flags && punch.flags.length > 0 ? (
                        punch.flags.map((flag, idx) => (
                          <Badge key={idx} variant="destructive" className="text-xs">
                            ⚠
                          </Badge>
                        ))
                      ) : (
                        <Badge variant="outline" className="text-xs text-green-600 border-green-200">
                          ✓ OK
                        </Badge>
                      )}
                    </div>
                    <div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingPunch(punch);
                        }}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                  
                  {/* Mobile View */}
                  <div className="md:hidden bg-background rounded-lg border p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold">{format(parseISO(punch.date), "MMM dd, yyyy")}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">Paid:</span>
                        <span className="text-sm font-bold text-primary">
                          {(() => {
                            const paidHours = punch.paid_hours !== undefined ? punch.paid_hours : punch.hours_worked;
                            return isNaN(paidHours) || paidHours === null || paidHours === undefined ? '—' : `${paidHours.toFixed(2)} hrs`;
                          })()}
                        </span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 ml-1"
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingPunch(punch);
                          }}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Briefcase className="h-3.5 w-3.5" />
                      <span className="truncate">{punch.jobsite_name}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5 text-green-600" />
                        <span>{formatTimeToAmPm(punch.check_in_time)}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5 text-red-600" />
                        {punch.check_out_time ? (
                          <span>{formatTimeToAmPm(punch.check_out_time)}</span>
                        ) : punch.status === "active" ? (
                          <Badge variant="secondary" className="text-xs">Active</Badge>
                        ) : (
                          <span>—</span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-xs pt-1 border-t">
                      <div className="flex items-center gap-3">
                        <span className="text-muted-foreground">
                          Raw: {(() => {
                            const rawHours = punch.raw_hours !== undefined ? punch.raw_hours : punch.hours_worked;
                            return isNaN(rawHours) || rawHours === null || rawHours === undefined ? '—' : `${rawHours.toFixed(2)} hrs`;
                          })()}
                        </span>
                        {punch.break_minutes ? (
                          <span className="text-muted-foreground">
                            Break: {punch.break_minutes}m
                          </span>
                        ) : null}
                      </div>
                      {punch.flags && punch.flags.length > 0 && (
                        <div className="flex gap-1 flex-wrap">
                          {punch.flags.map((flag, idx) => (
                            <Badge key={idx} variant="destructive" className="text-xs">
                              ⚠ {flag}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}

              {/* Summary Footer */}
              {calculatedTotals && (
                <div className="mt-4 pt-3 border-t border-border/50 bg-muted/20 rounded-lg p-3">
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-sm">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Total Raw</p>
                      <p className="font-semibold">{calculatedTotals.totalRaw.toFixed(2)} hrs</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Total Break</p>
                      <p className="font-semibold text-orange-600">{calculatedTotals.totalBreak.toFixed(0)} min</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Total Paid</p>
                      <p className="font-semibold text-primary">{calculatedTotals.totalPaid.toFixed(2)} hrs</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Days Worked</p>
                      <p className="font-semibold">{calculatedTotals.daysWorked}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Total Issues</p>
                      <p className={cn("font-semibold", calculatedTotals.issueCount > 0 ? "text-destructive" : "text-green-600")}>
                        {calculatedTotals.issueCount}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Edit Dialog */}
      <EditPunchDialog 
        punch={editingPunch} 
        onClose={() => setEditingPunch(null)} 
      />
    </div>
  );
};
