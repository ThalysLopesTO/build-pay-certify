import { StatusBadge } from 'vite_react_shadcn_ts';

const row = { display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' } as const;

export function Invoice() {
  return (
    <div style={row}>
      <StatusBadge status="paid" type="invoice" />
      <StatusBadge status="sent" type="invoice" />
      <StatusBadge status="pending" type="invoice" />
      <StatusBadge status="overdue" type="invoice" />
    </div>
  );
}

export function Punch() {
  return (
    <div style={row}>
      <StatusBadge status="clocked in" type="punch" />
      <StatusBadge status="clocked out" type="punch" />
      <StatusBadge status="edited" type="punch" />
      <StatusBadge status="missed" type="punch" />
    </div>
  );
}
