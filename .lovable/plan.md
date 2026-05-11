### Bug
`ArchivedEmployeesModalContext.tsx` is mounted unconditionally by `ImprovedEmployeeManagement`. On line 30 it reads `data?.archivedEmployees` (can be `undefined` while loading), then on line 34 calls `.filter(...)` on it — throwing `Cannot read properties of undefined (reading 'filter')` and tripping the global ErrorBoundary, which masks the entire Employees screen.

### Fix
Default the array to `[]`:

```ts
const archivedEmployees = data?.archivedEmployees ?? [];
```

That single change resolves the crash. No other behavior change.

### Verification
Open Admin → Employees. Page renders the employee list. Open "Archived Employees" — modal renders with archived list (or empty state).