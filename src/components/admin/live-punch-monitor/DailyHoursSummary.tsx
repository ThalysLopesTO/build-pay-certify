import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { CalendarIcon, ChevronDown, ChevronUp, Clock, BarChart3, Coffee, TrendingUp, AlertCircle, Timer } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { formatDurationFromMinutes } from '@/hooks/useDailyHoursSummary';
import { useEmployeeHoursBreakdown } from '@/hooks/useEmployeeHoursBreakdown';
import { useCompanySettings } from '@/hooks/useCompanySettings';
import { useQuery } from '@tanstack/react-query';
import { getSupabase } from '@/integrations/supabase/client';
import EmployeeHoursBreakdown from './EmployeeHoursBreakdown';
import DailyHoursSummaryExport from './DailyHoursSummaryExport';

interface DailyHoursSummaryProps {
  jobsites?: Array<{ id: string; name: string }> | null;
}

const ALLOWED_ROLES = ['admin', 'super_admin', 'management', 'foreman'];
const EXPORT_ROLES = ['admin', 'super_admin', 'management', 'foreman'];

const DailyHoursSummary: React.FC<DailyHoursSummaryProps> = ({ jobsites }) => {
  const { user } = useAuth();
  const supabase = getSupabase();
  const { settings: companySettings } = useCompanySettings();
  const [isOpen, setIsOpen] = useState(false);
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [jobsiteId, setJobsiteId] = useState('all');
  const [employeeId, setEmployeeId] = useState('all');
  const [hasGenerated, setHasGenerated] = useState(false);

  // Role gate — hide from foreman/employee
  if (!user?.role || !ALLOWED_ROLES.includes(user.role)) {
    return null;
  }

  // Only Admins and Managers can change hours
  const canEdit = ['admin', 'super_admin', 'management'].includes(user.role);
  const canExport = EXPORT_ROLES.includes(user.role);

  // Fetch employees
  const { data: employees } = useQuery({
    queryKey: ['employees-summary', user?.companyId],
    queryFn: async () => {
      if (!user?.companyId) return [];
      const { data, error } = await supabase
        .from('user_profiles')
        .select('user_id, first_name, last_name')
        .eq('company_id', user.companyId)
        
        .order('first_name');
      if (error) throw error;
      return data;
    },
    enabled: !!user?.companyId && isOpen,
  });

  const {
    employees: breakdownEmployees,
    grandTotalGrossMinutes,
    grandTotalNetMinutes,
    grandTotalBreakMinutes,
    totalDays,
    incompleteCount,
    isLoading,
    isFetching,
  } = useEmployeeHoursBreakdown({
    companyId: user?.companyId,
    startDate,
    endDate,
    jobsiteId,
    employeeId,
    enabled: hasGenerated,
  });

  const handleGenerate = () => {
    if (startDate && endDate) {
      setHasGenerated(true);
    }
  };

  const canGenerate = !!startDate && !!endDate;

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger asChild>
        <Button variant="outline" className="gap-2">
          <BarChart3 className="h-4 w-4" />
          Daily Hours Summary
          {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <Card className="mt-3 shadow-sm border-accent/20">
          <CardContent className="p-4 md:p-6 space-y-5">
            {/* Filters */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 items-end">
              {/* Start Date */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Start Date</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        'w-full justify-start text-left font-normal',
                        !startDate && 'text-muted-foreground'
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {startDate ? format(startDate, 'MMM dd, yyyy') : 'Pick start'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={startDate ?? undefined}
                      onSelect={(d) => { setStartDate(d ?? null); setHasGenerated(false); }}
                      initialFocus
                      className="p-3 pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {/* End Date */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">End Date</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        'w-full justify-start text-left font-normal',
                        !endDate && 'text-muted-foreground'
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {endDate ? format(endDate, 'MMM dd, yyyy') : 'Pick end'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={endDate ?? undefined}
                      onSelect={(d) => { setEndDate(d ?? null); setHasGenerated(false); }}
                      disabled={(date) => startDate ? date < startDate : false}
                      initialFocus
                      className="p-3 pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {/* Jobsite */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Jobsite</label>
                <Select value={jobsiteId} onValueChange={(v) => { setJobsiteId(v); setHasGenerated(false); }}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="All Jobsites" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Jobsites</SelectItem>
                    {(Array.isArray(jobsites) ? jobsites : []).map((js) => (
                      <SelectItem key={js.id} value={js.id}>{js.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Employee */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Employee</label>
                <Select value={employeeId} onValueChange={(v) => { setEmployeeId(v); setHasGenerated(false); }}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="All Employees" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Employees</SelectItem>
                    {(Array.isArray(employees) ? employees : []).map((e) => (
                      <SelectItem key={e.user_id} value={e.user_id}>
                        {e.first_name} {e.last_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Generate */}
              <Button
                onClick={handleGenerate}
                disabled={!canGenerate || isFetching}
                className="w-full sm:w-auto"
              >
                {isFetching ? 'Loading…' : 'Generate Summary'}
              </Button>
            </div>

            {/* Results */}
            {!hasGenerated && (
              <div className="flex flex-col items-center justify-center py-8 text-muted-foreground gap-2">
                <CalendarIcon className="h-8 w-8 opacity-40" />
                <p className="text-sm">Select a date range to view daily hour totals.</p>
              </div>
            )}

            {hasGenerated && !isLoading && breakdownEmployees.length === 0 && (
              <div className="flex flex-col items-center justify-center py-8 text-muted-foreground gap-2">
                <AlertCircle className="h-8 w-8 opacity-40" />
                <p className="text-sm">No punch records found for the selected range.</p>
              </div>
            )}

            {hasGenerated && isLoading && (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
              </div>
            )}

            {hasGenerated && !isLoading && breakdownEmployees.length > 0 && (
              <div className="space-y-4">
                {/* Export button */}
                {canExport && (
                  <div className="flex justify-end">
                    <DailyHoursSummaryExport
                      employees={breakdownEmployees}
                      startDate={startDate!}
                      endDate={endDate!}
                      grandTotalGrossMinutes={grandTotalGrossMinutes}
                      grandTotalNetMinutes={grandTotalNetMinutes}
                      grandTotalBreakMinutes={grandTotalBreakMinutes}
                      companyName={companySettings?.company_name || 'Company'}
                      timezone={companySettings?.timezone || 'America/Toronto'}
                      companyAddress={companySettings?.company_address || ''}
                      companyPhone={companySettings?.company_phone || ''}
                      companyEmail={companySettings?.company_email || ''}
                      incompleteCount={incompleteCount}
                      userRole={user.role}
                    />
                  </div>
                )}

                {/* Employee breakdown */}
                <EmployeeHoursBreakdown
                  employees={breakdownEmployees}
                  incompleteCount={incompleteCount}
                  canEdit={canEdit}
                />

                {/* Grand Totals */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                  <SummaryStatCard
                    icon={<CalendarIcon className="h-4 w-4" />}
                    label="Days Worked"
                    value={String(totalDays)}
                  />
                  <SummaryStatCard
                    icon={<Timer className="h-4 w-4" />}
                    label="Total Raw Hours"
                    value={formatDurationFromMinutes(grandTotalGrossMinutes)}
                  />
                  <SummaryStatCard
                    icon={<Clock className="h-4 w-4" />}
                    label="Total Paid Hours"
                    value={formatDurationFromMinutes(grandTotalNetMinutes)}
                  />
                  <SummaryStatCard
                    icon={<Coffee className="h-4 w-4" />}
                    label="Total Break"
                    value={formatDurationFromMinutes(grandTotalBreakMinutes)}
                  />
                  <SummaryStatCard
                    icon={<TrendingUp className="h-4 w-4" />}
                    label="Avg / Day"
                    value={formatDurationFromMinutes(
                      totalDays > 0 ? grandTotalNetMinutes / totalDays : 0
                    )}
                  />
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </CollapsibleContent>
    </Collapsible>
  );
};

const SummaryStatCard: React.FC<{ icon: React.ReactNode; label: string; value: string }> = ({
  icon,
  label,
  value,
}) => (
  <div className="rounded-lg border bg-card p-3 flex flex-col gap-1">
    <div className="flex items-center gap-1.5 text-muted-foreground">
      {icon}
      <span className="text-xs font-medium">{label}</span>
    </div>
    <span className="text-lg font-semibold text-foreground">{value}</span>
  </div>
);

export default DailyHoursSummary;
