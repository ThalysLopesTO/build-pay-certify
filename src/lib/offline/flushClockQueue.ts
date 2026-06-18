import { supabase } from '@/integrations/supabase/client';
import { getClockQueue, removeClockAction } from './clockQueue';

export interface FlushResult {
  synced: number;
  failed: number;
}

/**
 * Replay queued clock punches against Supabase, in order. Clock-outs that
 * reference a still-pending offline clock-in are resolved via the id mapping
 * built as clock-ins sync. Stops on the first failure to preserve ordering
 * (a clock-out must not run before its clock-in) — the next flush retries.
 */
export async function flushClockQueue(): Promise<FlushResult> {
  if (!navigator.onLine) return { synced: 0, failed: 0 };

  const queue = getClockQueue();
  if (queue.length === 0) return { synced: 0, failed: 0 };

  const localToRealId: Record<string, string> = {};
  let synced = 0;
  let failed = 0;

  for (const action of queue) {
    try {
      if (action.type === 'clock_in') {
        const { data, error } = await supabase
          .from('timesheets')
          .insert({
            user_id: action.userId,
            company_id: action.companyId,
            jobsite_id: action.jobsiteId,
            check_in_time: action.checkInTime,
            check_in_location: action.location,
          })
          .select('id')
          .single();
        if (error) throw error;
        localToRealId[action.localId] = data.id;
        removeClockAction(action.localId);
        synced++;
      } else {
        const tsId =
          action.timesheetId ??
          (action.pendingClockInLocalId ? localToRealId[action.pendingClockInLocalId] : null);
        if (!tsId) {
          // The matching clock-in hasn't synced yet — retry on the next flush.
          failed++;
          break;
        }

        const { data: existing } = await supabase
          .from('timesheets')
          .select('check_in_time')
          .eq('id', tsId)
          .single();

        const rawMinutes = existing?.check_in_time
          ? Math.max(
              0,
              Math.round(
                (new Date(action.checkOutTime).getTime() - new Date(existing.check_in_time).getTime()) / 60000,
              ),
            )
          : 0;
        const finalPayableMinutes = Math.max(0, rawMinutes - action.breakMinutes);

        const update: Record<string, unknown> = {
          check_out_time: action.checkOutTime,
          check_out_location: action.location,
          break_minutes: action.breakMinutes,
          raw_minutes: rawMinutes,
          final_payable_minutes: finalPayableMinutes,
        };
        if (action.workNote) update.work_note = action.workNote;

        const { error } = await supabase.from('timesheets').update(update).eq('id', tsId);
        if (error) throw error;
        removeClockAction(action.localId);
        synced++;
      }
    } catch (e) {
      console.warn('flushClockQueue: action failed, will retry next sync', action.type, e);
      failed++;
      break; // preserve order
    }
  }

  return { synced, failed };
}
