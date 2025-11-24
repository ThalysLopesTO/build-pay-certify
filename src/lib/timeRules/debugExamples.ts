import { calculateWorkedHours } from './calculateWorkedHours';

/**
 * Debug examples for testing the calculateWorkedHours function
 * Run these in the browser console or component to test various scenarios
 */

export async function runDebugExamples() {
  console.group('🔧 Time Rules Calculation Debug Examples');

  // Example 1: On-time punch (within grace period)
  console.group('Example 1: On-time punch');
  const example1 = await calculateWorkedHours({
    rawIn: '2025-01-15T06:05:00.000Z',     // 6:05 AM (5 min late)
    rawOut: '2025-01-15T14:00:00.000Z',    // 2:00 PM
    jobsiteId: 'test-jobsite-id',
    companyId: 'test-company-id',
    date: '2025-01-15',
  });
  console.log('Input: 6:05 AM - 2:00 PM (5 min late)');
  console.log('Result:', example1);
  console.groupEnd();

  // Example 2: Early punch (before grace period)
  console.group('Example 2: Early punch');
  const example2 = await calculateWorkedHours({
    rawIn: '2025-01-15T05:30:00.000Z',     // 5:30 AM (30 min early)
    rawOut: '2025-01-15T14:00:00.000Z',    // 2:00 PM
    jobsiteId: 'test-jobsite-id',
    companyId: 'test-company-id',
    date: '2025-01-15',
  });
  console.log('Input: 5:30 AM - 2:00 PM (30 min early)');
  console.log('Result:', example2);
  console.groupEnd();

  // Example 3: Late arrival (after grace period)
  console.group('Example 3: Late arrival');
  const example3 = await calculateWorkedHours({
    rawIn: '2025-01-15T06:30:00.000Z',     // 6:30 AM (30 min late)
    rawOut: '2025-01-15T14:00:00.000Z',    // 2:00 PM
    jobsiteId: 'test-jobsite-id',
    companyId: 'test-company-id',
    date: '2025-01-15',
  });
  console.log('Input: 6:30 AM - 2:00 PM (30 min late)');
  console.log('Result:', example3);
  console.groupEnd();

  // Example 4: Overtime (after scheduled end)
  console.group('Example 4: Overtime');
  const example4 = await calculateWorkedHours({
    rawIn: '2025-01-15T06:00:00.000Z',     // 6:00 AM
    rawOut: '2025-01-15T16:00:00.000Z',    // 4:00 PM (2 hours OT)
    jobsiteId: 'test-jobsite-id',
    companyId: 'test-company-id',
    date: '2025-01-15',
  });
  console.log('Input: 6:00 AM - 4:00 PM (2 hours OT)');
  console.log('Result:', example4);
  console.groupEnd();

  // Example 5: Short day
  console.group('Example 5: Short day');
  const example5 = await calculateWorkedHours({
    rawIn: '2025-01-15T06:00:00.000Z',     // 6:00 AM
    rawOut: '2025-01-15T10:00:00.000Z',    // 10:00 AM (4 hours only)
    jobsiteId: 'test-jobsite-id',
    companyId: 'test-company-id',
    date: '2025-01-15',
  });
  console.log('Input: 6:00 AM - 10:00 AM (4 hours only)');
  console.log('Result:', example5);
  console.groupEnd();

  // Example 6: Invalid punch (out before in)
  console.group('Example 6: Invalid punch');
  const example6 = await calculateWorkedHours({
    rawIn: '2025-01-15T14:00:00.000Z',     // 2:00 PM
    rawOut: '2025-01-15T06:00:00.000Z',    // 6:00 AM (invalid)
    jobsiteId: 'test-jobsite-id',
    companyId: 'test-company-id',
    date: '2025-01-15',
  });
  console.log('Input: 2:00 PM - 6:00 AM (out before in)');
  console.log('Result:', example6);
  console.groupEnd();

  console.groupEnd();

  return {
    example1,
    example2,
    example3,
    example4,
    example5,
    example6,
  };
}

/**
 * To run these examples in the browser console:
 * 
 * import { runDebugExamples } from '@/lib/timeRules/debugExamples';
 * runDebugExamples();
 */
