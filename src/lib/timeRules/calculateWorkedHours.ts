import { parseISO } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import {
  parseTimeToDate,
  clamp,
  diffInMinutes,
  applyBreak,
  generateFlags,
  formatISO,
} from './utils';

interface TimeRule {
  work_start_time: string;
  work_end_time: string;
  break_minutes: number;
  break_is_paid: boolean;
  early_grace_minutes: number;
  late_grace_minutes: number;
}

/**
 * Fetch the applicable time rule for a jobsite
 * Returns jobsite rule if it exists and time rules are enabled (inherits_company_rule = false)
 * Otherwise returns null (free schedule)
 */
async function getApplicableTimeRule(
  jobsiteId: string
): Promise<TimeRule | null> {
  // Fetch jobsite rule
  const { data: jobsiteRule, error: jobsiteError } = await supabase
    .from('jobsite_time_rules')
    .select('*')
    .eq('jobsite_id', jobsiteId)
    .maybeSingle();

  if (jobsiteError) {
    console.error('Error fetching jobsite time rule:', jobsiteError);
    return null;
  }

  // If jobsite has time rules enabled (inherits_company_rule = false), use them
  if (jobsiteRule && !jobsiteRule.inherits_company_rule) {
    // Validate that required fields are present
    if (!jobsiteRule.work_start_time || !jobsiteRule.work_end_time) {
      console.warn('Jobsite rule missing required time fields');
      return null;
    }
    
    return {
      work_start_time: jobsiteRule.work_start_time,
      work_end_time: jobsiteRule.work_end_time,
      break_minutes: jobsiteRule.break_minutes ?? 0,
      break_is_paid: jobsiteRule.break_is_paid ?? false,
      early_grace_minutes: jobsiteRule.early_grace_minutes ?? 0,
      late_grace_minutes: jobsiteRule.late_grace_minutes ?? 0,
    };
  }

  // No rule configured or time rules disabled - use free schedule
  return null;
}

export interface CalculateWorkedHoursResult {
  effectiveStart: string;
  effectiveEnd: string;
  totalMinutes: number;
  paidMinutes: number;
  paidHours: number;
  flags: string[];
}

/**
 * Calculate worked hours from raw punch times using time rules
 */
export async function calculateWorkedHours({
  rawIn,
  rawOut,
  jobsiteId,
  companyId,
  date,
}: {
  rawIn: string;     // ISO timestamp
  rawOut: string;    // ISO timestamp
  jobsiteId: string;
  companyId: string;
  date: string;      // YYYY-MM-DD
}): Promise<CalculateWorkedHoursResult> {
  // Parse raw timestamps
  const rawInDate = parseISO(rawIn);
  const rawOutDate = parseISO(rawOut);

  // Basic validation
  if (rawOutDate <= rawInDate) {
    return {
      effectiveStart: rawIn,
      effectiveEnd: rawOut,
      totalMinutes: 0,
      paidMinutes: 0,
      paidHours: 0,
      flags: ['INVALID'],
    };
  }

  // Fetch applicable time rule
  const timeRule = await getApplicableTimeRule(jobsiteId);

  // If no rule exists or time rules disabled, use raw times (free schedule)
  if (!timeRule) {
    const totalMinutes = diffInMinutes(rawInDate, rawOutDate);
    return {
      effectiveStart: rawIn,
      effectiveEnd: rawOut,
      totalMinutes,
      paidMinutes: totalMinutes,
      paidHours: totalMinutes / 60,
      flags: [], // No schedule-based flags for free schedule
    };
  }

  // Parse rule times for the given date
  const ruleStartTime = parseTimeToDate(date, timeRule.work_start_time);
  const ruleEndTime = parseTimeToDate(date, timeRule.work_end_time);

  // Apply grace periods
  const startWithEarlyGrace = new Date(ruleStartTime);
  startWithEarlyGrace.setMinutes(startWithEarlyGrace.getMinutes() - timeRule.early_grace_minutes);

  const startWithLateGrace = new Date(ruleStartTime);
  startWithLateGrace.setMinutes(startWithLateGrace.getMinutes() + timeRule.late_grace_minutes);

  // Clamp punch times to rule boundaries with grace periods
  let effectiveStart = rawInDate;
  
  // If punched in early (before start - early grace), clamp to scheduled start
  if (rawInDate < startWithEarlyGrace) {
    effectiveStart = ruleStartTime;
  }
  // If punched in within grace period, use scheduled start
  else if (rawInDate >= startWithEarlyGrace && rawInDate <= startWithLateGrace) {
    effectiveStart = ruleStartTime;
  }
  // Otherwise use actual punch time
  
  // Clamp end time to rule end (if needed)
  const effectiveEnd = clamp(rawOutDate, ruleStartTime, ruleEndTime);

  // Calculate total minutes worked
  const totalMinutes = diffInMinutes(effectiveStart, effectiveEnd);

  // Apply unpaid break deduction if applicable
  const paidMinutes = applyBreak(
    totalMinutes,
    timeRule.break_minutes,
    timeRule.break_is_paid
  );

  // Generate flags
  const flags = generateFlags({
    rawIn: rawInDate,
    rawOut: rawOutDate,
    effectiveStart,
    effectiveEnd,
    ruleStartTime,
    ruleEndTime,
    earlyGraceMinutes: timeRule.early_grace_minutes,
    lateGraceMinutes: timeRule.late_grace_minutes,
    paidMinutes,
  });

  return {
    effectiveStart: formatISO(effectiveStart),
    effectiveEnd: formatISO(effectiveEnd),
    totalMinutes,
    paidMinutes,
    paidHours: paidMinutes / 60,
    flags,
  };
}
