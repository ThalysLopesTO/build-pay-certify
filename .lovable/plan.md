
# Fix plan: browser + mobile blank page on Employee Time Clock

## What I found
This is not mainly a PWA problem anymore. The strongest root cause is the realtime subscription inside `useTimesheets`.

The console error in the screenshot matches this exactly:

```text
tried to subscribe multiple times.
subscribe can only be called a single time per channel instance
```

### Why it crashes
When the Time Clock page opens:

- `TimeTracker.tsx` calls `useTimesheets(selectedWeek)`
- `TodayStatusBox.tsx` also calls `useTimesheets()`

Both hook instances create the same realtime channel:

```ts
supabase.channel(`timesheets-employee-${user.id}`)
```

That causes a duplicate `.subscribe()` on the same channel instance, which throws at runtime. Because the error happens in an effect/subscription, the `ErrorBoundary` does not protect it, so the page goes white in both browser and mobile.

## Fix
### 1. Make `useTimesheets` realtime subscription single-instance
**File:** `src/hooks/useTimesheets.ts`

- Remove the direct duplicate-prone `supabase.channel(...).subscribe()` pattern
- Replace it with a shared/safe subscription approach:
  - either use the existing `RealtimeProvider`
  - or keep a module-level channel registry/ref so the same user only subscribes once
- Keep query invalidation when timesheets change

Result: opening the page will no longer crash from duplicate subscriptions.

### 2. Stop calling `useTimesheets` twice on the Time Clock screen
**Files:**  
- `src/components/employee/TimeTracker.tsx`  
- `src/components/employee/time-tracker/TodayStatusBox.tsx`

- Make `TimeTracker` the single source of truth
- Pass `weeklyTimesheets` and `todayActiveTimesheet` into `TodayStatusBox` as props
- Remove `useTimesheets()` from `TodayStatusBox`

Result: fewer queries, fewer subscriptions, and no duplicate hook side effects on this page.

### 3. Keep the Time Clock screen resilient after the subscription fix
**Files:**  
- `src/components/employee/TimeTracker.tsx`  
- `src/components/employee/time-tracker/TodayStatusBox.tsx`

- Preserve the existing null/date guards
- Keep safe fallbacks for invalid timestamps and missing location values

Result: the page returns to normal and remains stable even if some records are malformed.

## Expected outcome
After this fix:

- employees should be able to open the Time Clock page again in browser and mobile
- the Clock In / Clock Out section should render normally
- realtime updates can remain enabled without crashing the app
- the blank white screen should stop happening on page open

## Files to update
- `src/hooks/useTimesheets.ts`
- `src/components/employee/TimeTracker.tsx`
- `src/components/employee/time-tracker/TodayStatusBox.tsx`

## Technical note
The key issue is that this error is thrown from subscription/effect code, not from render. That is why adding more `ErrorBoundary` wrappers did not fully solve it.
