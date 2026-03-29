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

// ── In-memory cache with TTL ──────────────────────────────────────────
interface CacheEntry {
  rule: TimeRule | null;
  fetchedAt: number;
}

const CACHE_TTL_MS = 60_000; // 60 seconds
const ruleCache = new Map<string, CacheEntry>();

function getCached(jobsiteId: string): TimeRule | null | undefined {
  const entry = ruleCache.get(jobsiteId);
  if (!entry) return undefined; // cache miss
  if (Date.now() - entry.fetchedAt > CACHE_TTL_MS) {
    ruleCache.delete(jobsiteId);
    return undefined; // expired
  }
  return entry.rule;
}

function setCache(jobsiteId: string, rule: TimeRule | null) {
  ruleCache.set(jobsiteId, { rule, fetchedAt: Date.now() });
}

/**
 * Batch-preload time rules for multiple jobsites in a single query.
 * Call this before processing a batch of timesheets to eliminate N+1 queries.
 */
export async function preloadTimeRules(jobsiteIds: string[]): Promise<void> {
  // Filter out already-cached IDs
  const uncachedIds = jobsiteIds.filter((id) => getCached(id) === undefined);
  if (uncachedIds.length === 0) return;

  const { data, error } = await supabase
    .from('jobsite_time_rules')
    .select('*')
    .in('jobsite_id', uncachedIds);

  if (error) {
    console.error('Error batch-fetching jobsite time rules:', error);
    // Cache misses as null so we don't retry immediately
    uncachedIds.forEach((id) => setCache(id, null));
    return;
  }

  // Index results by jobsite_id
  const ruleMap = new Map<string, any>();
  (data || []).forEach((row) => ruleMap.set(row.jobsite_id, row));

  // Populate cache for every requested ID
  uncachedIds.forEach((id) => {
    const row = ruleMap.get(id);
    if (row && !row.inherits_company_rule && row.work_start_time && row.work_end_time) {
      setCache(id, {
        work_start_time: row.work_start_time,
        work_end_time: row.work_end_time,
        break_minutes: row.break_minutes ?? 0,
        break_is_paid: row.break_is_paid ?? false,
        early_grace_minutes: row.early_grace_minutes ?? 0,
        late_grace_minutes: row.late_grace_minutes ?? 0,
      });
    } else {
      setCache(id, null);
    }
  });
}

/**
 * Fetch the applicable time rule for a jobsite (uses cache)
 */
async function getApplicableTimeRule(
  jobsiteId: string
): Promise<TimeRule | null> {
  // Check cache first
  const cached = getCached(jobsiteId);
  if (cached !== undefined) return cached;

  // Single fetch fallback
  const { data: jobsiteRule, error: jobsiteError } = await supabase
    .from('jobsite_time_rules')
    .select('*')
    .eq('jobsite_id', jobsiteId)
    .maybeSingle();

  if (jobsiteError) {
    console.error('Error fetching jobsite time rule:', jobsiteError);
    setCache(jobsiteId, null);
    return null;
  }

  if (jobsiteRule && !jobsiteRule.inherits_company_rule) {
    if (!jobsiteRule.work_start_time || !jobsiteRule.work_end_time) {
      console.warn('Jobsite rule missing required time fields');
      setCache(jobsiteId, null);
      return null;
    }
    
    const rule: TimeRule = {
      work_start_time: jobsiteRule.work_start_time,
      work_end_time: jobsiteRule.work_end_time,
      break_minutes: jobsiteRule.break_minutes ?? 0,
      break_is_paid: jobsiteRule.break_is_paid ?? false,
      early_grace_minutes: jobsiteRule.early_grace_minutes ?? 0,
      late_grace_minutes: jobsiteRule.late_grace_minutes ?? 0,
    };
    setCache(jobsiteId, rule);
    return rule;
  }

  setCache(jobsiteId, null);
  return null;
}

export interface CalculateWorkedHoursResult {
  effectiveStart: string;
  effectiveEnd: string;
  totalMinutes: number;
  paidMinutes: number;
  paidHours: number;
  breakMinutes: number;
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
      breakMinutes: 0,
      flags: ['INVALID'],
    };
  }

  // Fetch applicable time rule (uses cache)
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
      breakMinutes: 0,
      flags: [],
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
  
  if (rawInDate < startWithEarlyGrace) {
    effectiveStart = ruleStartTime;
  } else if (rawInDate >= startWithEarlyGrace && rawInDate <= startWithLateGrace) {
    effectiveStart = ruleStartTime;
  }

  const effectiveEnd = clamp(rawOutDate, ruleStartTime, ruleEndTime);

  const totalMinutes = diffInMinutes(effectiveStart, effectiveEnd);

  const paidMinutes = applyBreak(
    totalMinutes,
    timeRule.break_minutes,
    timeRule.break_is_paid
  );

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

  const breakMinutes = timeRule.break_is_paid ? 0 : timeRule.break_minutes;

  return {
    effectiveStart: formatISO(effectiveStart),
    effectiveEnd: formatISO(effectiveEnd),
    totalMinutes,
    paidMinutes,
    paidHours: paidMinutes / 60,
    breakMinutes,
    flags,
  };
}
