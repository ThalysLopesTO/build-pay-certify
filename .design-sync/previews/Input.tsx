import { Input, Label } from 'vite_react_shadcn_ts';

const field = { display: 'grid', gap: 6, maxWidth: 280 } as const;

export function WithLabel() {
  return (
    <div style={field}>
      <Label htmlFor="site">Jobsite name</Label>
      <Input id="site" placeholder="e.g. Riverside Tower" defaultValue="Riverside Tower" />
    </div>
  );
}

export function Placeholder() {
  return (
    <div style={field}>
      <Label htmlFor="email">Work email</Label>
      <Input id="email" type="email" placeholder="you@company.com" />
    </div>
  );
}

export function Disabled() {
  return (
    <div style={field}>
      <Label htmlFor="id">Employee ID</Label>
      <Input id="id" disabled defaultValue="GZ-0042" />
    </div>
  );
}
