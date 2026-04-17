import { CheckCircle2, AlertTriangle, Copy, XCircle } from 'lucide-react';

interface ImportResultSummaryProps {
  total: number;
  imported: number;
  skippedDuplicates: number;
  skippedInvalid: number;
  failed: number;
}

const Stat = ({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number;
  tone: 'success' | 'warning' | 'danger' | 'muted';
}) => {
  const toneClass =
    tone === 'success'
      ? 'text-green-600'
      : tone === 'warning'
        ? 'text-amber-600'
        : tone === 'danger'
          ? 'text-destructive'
          : 'text-muted-foreground';
  return (
    <div className="flex items-center gap-3 rounded-lg border p-4">
      <div className={`h-9 w-9 rounded-lg bg-muted flex items-center justify-center ${toneClass}`}>
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-2xl font-bold">{value}</p>
      </div>
    </div>
  );
};

export function ImportResultSummary(props: ImportResultSummaryProps) {
  const { total, imported, skippedDuplicates, skippedInvalid, failed } = props;
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <Stat icon={CheckCircle2} label="Total rows" value={total} tone="muted" />
        <Stat icon={CheckCircle2} label="Imported" value={imported} tone="success" />
        <Stat icon={Copy} label="Skipped (duplicates)" value={skippedDuplicates} tone="warning" />
        <Stat icon={AlertTriangle} label="Skipped (invalid)" value={skippedInvalid} tone="warning" />
        <Stat icon={XCircle} label="Failed" value={failed} tone="danger" />
      </div>
    </div>
  );
}
