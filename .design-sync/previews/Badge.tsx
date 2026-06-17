import { Badge } from 'vite_react_shadcn_ts';

const row = { display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' } as const;

export function Variants() {
  return (
    <div style={row}>
      <Badge>Active</Badge>
      <Badge variant="secondary">Draft</Badge>
      <Badge variant="destructive">Overdue</Badge>
      <Badge variant="outline">Archived</Badge>
    </div>
  );
}
