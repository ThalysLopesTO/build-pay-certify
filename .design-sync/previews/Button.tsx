import { Button } from 'vite_react_shadcn_ts';

const row = { display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center' } as const;

export function Variants() {
  return (
    <div style={row}>
      <Button>Submit timesheet</Button>
      <Button variant="secondary">Save draft</Button>
      <Button variant="destructive">Delete</Button>
      <Button variant="outline">Cancel</Button>
      <Button variant="ghost">Dismiss</Button>
      <Button variant="link">View details</Button>
    </div>
  );
}

export function Sizes() {
  return (
    <div style={row}>
      <Button size="sm">Small</Button>
      <Button size="default">Default</Button>
      <Button size="lg">Large</Button>
    </div>
  );
}

export function Disabled() {
  return (
    <div style={row}>
      <Button disabled>Processing…</Button>
      <Button variant="outline" disabled>Unavailable</Button>
    </div>
  );
}
