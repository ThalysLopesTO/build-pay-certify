import { supabase } from '@/integrations/supabase/client';
import { validateTimesheetHours, getCorrectTotalHours } from './timesheetDataUtils';

export const auditAndFixTimesheetData = async (companyId: string) => {
  console.log('Starting timesheet data audit for company:', companyId);
  
  // Fetch all timesheets for the company
  const { data: timesheets, error } = await supabase
    .from('weekly_timesheets')
    .select('*')
    .eq('company_id', companyId);

  if (error) {
    console.error('Error fetching timesheets for audit:', error);
    return { success: false, error };
  }

  if (!timesheets || timesheets.length === 0) {
    return { success: true, message: 'No timesheets found to audit' };
  }

  const issues: any[] = [];
  const fixes: any[] = [];

  for (const timesheet of timesheets) {
    const validation = validateTimesheetHours(timesheet);
    
    if (validation.hasDiscrepancy || validation.missingBiWeeklyData) {
      issues.push({
        id: timesheet.id,
        employee: timesheet.manual_entry_name || 'Employee',
        issue: validation.missingBiWeeklyData ? 'Missing bi-weekly data' : 'Hours discrepancy',
        storedTotal: validation.storedTotal,
        calculatedTotal: validation.calculatedTotal,
        difference: Math.abs(validation.storedTotal - validation.calculatedTotal)
      });

      // Fix the total_hours field if there's a discrepancy
      if (validation.hasDiscrepancy) {
        const { error: updateError } = await supabase
          .from('weekly_timesheets')
          .update({ 
            total_hours: validation.calculatedTotal,
            updated_at: new Date().toISOString()
          })
          .eq('id', timesheet.id);

        if (updateError) {
          console.error(`Error fixing timesheet ${timesheet.id}:`, updateError);
        } else {
          fixes.push({
            id: timesheet.id,
            oldTotal: validation.storedTotal,
            newTotal: validation.calculatedTotal
          });
        }
      }
    }
  }

  return {
    success: true,
    summary: {
      totalTimesheets: timesheets.length,
      issuesFound: issues.length,
      fixesApplied: fixes.length,
      issues,
      fixes
    }
  };
};

export const generateDataQualityReport = async (companyId: string) => {
  const { data: timesheets, error } = await supabase
    .from('weekly_timesheets')
    .select('id, manual_entry_name, total_hours, notes, created_at')
    .eq('company_id', companyId);

  if (error) return { success: false, error };

  const report = {
    totalTimesheets: timesheets?.length || 0,
    withBiWeeklyData: 0,
    withoutBiWeeklyData: 0,
    withDiscrepancies: 0,
    recentlyCreated: 0
  };

  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

  timesheets?.forEach(timesheet => {
    const validation = validateTimesheetHours(timesheet);
    
    if (validation.source === 'biweekly') {
      report.withBiWeeklyData++;
    } else {
      report.withoutBiWeeklyData++;
    }
    
    if (validation.hasDiscrepancy) {
      report.withDiscrepancies++;
    }
    
    if (new Date(timesheet.created_at) > oneWeekAgo) {
      report.recentlyCreated++;
    }
  });

  return { success: true, report };
};