# Live Punch Monitor - Time Rules Integration

## Overview

The Live Punch Monitor now includes time rules calculation for displaying rule-based paid hours alongside raw punch durations.

## Components

### RuleBasedHours.tsx

This component calculates and displays paid hours based on jobsite/company time rules:

- **RuleBasedHours**: Mobile/card view version with full flag descriptions
- **RuleBasedHoursCell**: Desktop table cell version with compact display

Both components:
- Automatically calculate worked hours using `calculateWorkedHours()` from `@/lib/timeRules/calculateWorkedHours`
- Show loading states during calculation
- Display time rule issues/flags with human-readable descriptions
- Handle missing rules gracefully (fallback to no display)

### Flag Descriptions

- `EARLY_PUNCH`: Punched before jobsite start time
- `LATE_ARRIVAL`: Arrived after allowed grace period  
- `AFTER_END`: Punched out after jobsite end time
- `SHORT_DAY`: Worked less than expected
- `INVALID`: Punch is outside valid schedule

## Usage in LivePunchTable

The table now displays:
1. **Raw hours**: Original time difference between check-in and check-out
2. **By rules hours**: Calculated paid hours with grace periods, breaks, and time boundaries applied
3. **Issues badge**: Shows count of time rule violations with tooltip details

### Desktop View
Shows rule-based hours below raw hours in the Duration column with issues badge.

### Mobile View  
Shows rule-based hours in a separate section below the time grid with full issue descriptions.

## Data Flow

1. Punch entry contains: `check_in_time`, `check_out_time`, `jobsite_id`
2. Component passes data to `calculateWorkedHours()` with:
   - `rawIn`: ISO timestamp of check-in
   - `rawOut`: ISO timestamp of check-out
   - `jobsiteId`: Jobsite UUID
   - `companyId`: Company UUID from auth context
   - `date`: YYYY-MM-DD format date
3. Engine returns:
   - `paidHours`: Final calculated hours
   - `flags`: Array of issue codes
4. Component displays results with appropriate styling and tooltips

## Notes

- Only calculates when both check-in AND check-out are present
- Shows loading state while fetching time rules and calculating
- Gracefully handles errors (shows "Rules not applied")
- Does not modify database - calculation is runtime-only
- No changes to existing punch record logic
