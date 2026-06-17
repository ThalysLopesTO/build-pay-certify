import { Skeleton } from 'vite_react_shadcn_ts';

export function Card() {
  return (
    <div style={{ display: 'flex', gap: 12, alignItems: 'center', width: 320 }}>
      <Skeleton style={{ height: 48, width: 48, borderRadius: 9999 }} />
      <div style={{ display: 'grid', gap: 8, flex: 1 }}>
        <Skeleton style={{ height: 14, width: '70%' }} />
        <Skeleton style={{ height: 14, width: '45%' }} />
      </div>
    </div>
  );
}

export function Lines() {
  return (
    <div style={{ display: 'grid', gap: 10, width: 320 }}>
      <Skeleton style={{ height: 14, width: '100%' }} />
      <Skeleton style={{ height: 14, width: '90%' }} />
      <Skeleton style={{ height: 14, width: '60%' }} />
    </div>
  );
}
