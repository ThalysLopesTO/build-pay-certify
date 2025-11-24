import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Skeleton } from '@/components/ui/skeleton';
import { Clock, Coffee, AlertCircle, RefreshCw } from 'lucide-react';
import { useJobsiteTimeRule, JobsiteTimeRulePayload } from '@/hooks/useJobsiteTimeRule';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface JobsiteTimeRulesProps {
  jobsiteId: string;
}

const JobsiteTimeRules: React.FC<JobsiteTimeRulesProps> = ({ jobsiteId }) => {
  const { data: timeRule, isLoading, upsertTimeRule, isUpdating } = useJobsiteTimeRule(jobsiteId);

  // Form state with defaults
  const [timeRulesEnabled, setTimeRulesEnabled] = useState(false);
  const [workStartTime, setWorkStartTime] = useState('06:00');
  const [workEndTime, setWorkEndTime] = useState('14:00');
  const [breakMinutes, setBreakMinutes] = useState('0');
  const [breakIsPaid, setBreakIsPaid] = useState(false);
  const [earlyGraceMinutes, setEarlyGraceMinutes] = useState('0');
  const [lateGraceMinutes, setLateGraceMinutes] = useState('0');

  // Load existing data when available
  useEffect(() => {
    if (timeRule) {
      // Time rules are enabled if inherits_company_rule is false
      setTimeRulesEnabled(!timeRule.inherits_company_rule);
      setWorkStartTime(timeRule.work_start_time || '06:00');
      setWorkEndTime(timeRule.work_end_time || '14:00');
      setBreakMinutes(String(timeRule.break_minutes || 0));
      setBreakIsPaid(timeRule.break_is_paid || false);
      setEarlyGraceMinutes(String(timeRule.early_grace_minutes || 0));
      setLateGraceMinutes(String(timeRule.late_grace_minutes || 0));
    }
  }, [timeRule]);

  const handleSave = async () => {
    const payload: JobsiteTimeRulePayload = {
      // inherits_company_rule is now inverted: true = disabled, false = enabled
      inherits_company_rule: !timeRulesEnabled,
      work_start_time: timeRulesEnabled ? workStartTime : null,
      work_end_time: timeRulesEnabled ? workEndTime : null,
      break_minutes: timeRulesEnabled ? parseInt(breakMinutes) : 0,
      break_is_paid: timeRulesEnabled ? breakIsPaid : false,
      early_grace_minutes: timeRulesEnabled ? parseInt(earlyGraceMinutes) : 0,
      late_grace_minutes: timeRulesEnabled ? parseInt(lateGraceMinutes) : 0,
    };

    await upsertTimeRule(payload);
  };

  const isValid = () => {
    if (!timeRulesEnabled) return true;
    return workStartTime && workEndTime;
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }

  return (
    <Card className="border-0 shadow-none">
      <CardHeader className="px-0 pt-0">
        <div className="flex items-center gap-2">
          <Clock className="h-5 w-5 text-primary" />
          <CardTitle className="text-lg">Time Rules</CardTitle>
        </div>
        <CardDescription>
          Define the work schedule and break rules for this jobsite. These rules will be used to calculate paid hours from punch in/out times.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6 px-0">
        {/* Enable Time Rules Toggle */}
        <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
          <div className="space-y-0.5 flex-1">
            <Label htmlFor="enable-time-rules" className="text-base font-medium">
              Enable time rules for this jobsite
            </Label>
            <p className="text-sm text-muted-foreground">
              Apply work schedule, breaks, and grace periods to calculate paid hours
            </p>
          </div>
          <Switch
            id="enable-time-rules"
            checked={timeRulesEnabled}
            onCheckedChange={setTimeRulesEnabled}
          />
        </div>

        {!timeRulesEnabled && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              This jobsite currently has no time rules. Employee hours will be calculated directly from punch in/out times, and no schedule-based flags will be generated.
            </AlertDescription>
          </Alert>
        )}

        {/* Time Rules Form (disabled when not enabled) */}
        <div className={`space-y-6 ${!timeRulesEnabled ? 'opacity-50 pointer-events-none' : ''}`}>
          {/* Work Hours Section */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Work Hours
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="work-start-time">Work start time</Label>
                <Input
                  id="work-start-time"
                  type="time"
                  value={workStartTime}
                  onChange={(e) => setWorkStartTime(e.target.value)}
                  disabled={!timeRulesEnabled}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="work-end-time">Work end time</Label>
                <Input
                  id="work-end-time"
                  type="time"
                  value={workEndTime}
                  onChange={(e) => setWorkEndTime(e.target.value)}
                  disabled={!timeRulesEnabled}
                />
              </div>
            </div>
          </div>

          {/* Break Configuration */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Coffee className="h-4 w-4" />
              Break Configuration
            </h3>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="break-minutes">Automatic break</Label>
                <Select
                  value={breakMinutes}
                  onValueChange={setBreakMinutes}
                  disabled={!timeRulesEnabled}
                >
                  <SelectTrigger id="break-minutes">
                    <SelectValue placeholder="Select break duration" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">None (0 minutes)</SelectItem>
                    <SelectItem value="30">30 minutes</SelectItem>
                    <SelectItem value="45">45 minutes</SelectItem>
                    <SelectItem value="60">60 minutes</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Automatic break will be applied to the work schedule
                </p>
              </div>

              {parseInt(breakMinutes) > 0 && (
                <div className="space-y-2">
                  <Label>Break type</Label>
                  <RadioGroup
                    value={breakIsPaid ? 'paid' : 'unpaid'}
                    onValueChange={(value) => setBreakIsPaid(value === 'paid')}
                    disabled={!timeRulesEnabled}
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="paid" id="break-paid" />
                      <Label htmlFor="break-paid" className="font-normal cursor-pointer">
                        Paid break (do not deduct from hours)
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="unpaid" id="break-unpaid" />
                      <Label htmlFor="break-unpaid" className="font-normal cursor-pointer">
                        Unpaid break (deduct from hours)
                      </Label>
                    </div>
                  </RadioGroup>
                </div>
              )}
            </div>
          </div>

          {/* Grace Periods */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-foreground">Grace periods (minutes)</h3>
            <p className="text-sm text-muted-foreground -mt-2">
              Allow employees to clock in/out within these margins without affecting their scheduled hours
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="early-grace">Early grace minutes</Label>
                <Input
                  id="early-grace"
                  type="number"
                  min="0"
                  value={earlyGraceMinutes}
                  onChange={(e) => setEarlyGraceMinutes(e.target.value)}
                  disabled={!timeRulesEnabled}
                  placeholder="0"
                />
                <p className="text-xs text-muted-foreground">
                  How early employees can clock in
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="late-grace">Late grace minutes</Label>
                <Input
                  id="late-grace"
                  type="number"
                  min="0"
                  value={lateGraceMinutes}
                  onChange={(e) => setLateGraceMinutes(e.target.value)}
                  disabled={!timeRulesEnabled}
                  placeholder="0"
                />
                <p className="text-xs text-muted-foreground">
                  How late employees can clock in/out
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t">
          <Button
            onClick={handleSave}
            disabled={!isValid() || isUpdating}
            className="flex-1"
          >
            {isUpdating && <RefreshCw className="h-4 w-4 mr-2 animate-spin" />}
            Save changes
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default JobsiteTimeRules;
