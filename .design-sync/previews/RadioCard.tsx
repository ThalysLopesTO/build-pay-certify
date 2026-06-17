import { RadioCard } from 'vite_react_shadcn_ts';

export function Selection() {
  return (
    <div style={{ display: 'grid', gap: 10, width: 320 }}>
      <RadioCard
        name="shift"
        title="Day shift"
        description="7:00 AM – 3:30 PM"
        checked
        readOnly
      />
      <RadioCard
        name="shift"
        title="Night shift"
        description="10:00 PM – 6:30 AM"
        readOnly
      />
    </div>
  );
}
