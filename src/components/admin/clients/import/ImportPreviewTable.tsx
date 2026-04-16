import { useMemo } from 'react';
import { CheckCircle2, AlertTriangle, Copy } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { ValidatedRow } from '@/lib/clients/importValidator';

interface ImportPreviewTableProps {
  rows: ValidatedRow[];
}

export function ImportPreviewTable({ rows }: ImportPreviewTableProps) {
  const counts = useMemo(() => {
    let valid = 0;
    let duplicate = 0;
    let invalid = 0;
    for (const r of rows) {
      if (r.status === 'valid') valid++;
      else if (r.status === 'duplicate') duplicate++;
      else invalid++;
    }
    return { valid, duplicate, invalid };
  }, [rows]);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2 text-sm">
        <Badge variant="outline" className="gap-1.5">
          <CheckCircle2 className="h-3.5 w-3.5 text-green-600" />
          {counts.valid} valid
        </Badge>
        <Badge variant="outline" className="gap-1.5">
          <Copy className="h-3.5 w-3.5 text-amber-600" />
          {counts.duplicate} duplicate
        </Badge>
        <Badge variant="outline" className="gap-1.5">
          <AlertTriangle className="h-3.5 w-3.5 text-destructive" />
          {counts.invalid} invalid
        </Badge>
      </div>

      <div className="border rounded-lg max-h-[420px] overflow-auto">
        <Table>
          <TableHeader className="sticky top-0 bg-background z-10">
            <TableRow>
              <TableHead className="w-12">#</TableHead>
              <TableHead className="w-24">Status</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Company</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Issue</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((r, idx) => (
              <TableRow key={idx}>
                <TableCell className="text-muted-foreground text-xs">{r.row.rowIndex}</TableCell>
                <TableCell>
                  {r.status === 'valid' && (
                    <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
                      Valid
                    </Badge>
                  )}
                  {r.status === 'duplicate' && (
                    <Badge variant="secondary" className="bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300">
                      Duplicate
                    </Badge>
                  )}
                  {r.status === 'invalid' && (
                    <Badge variant="destructive">Invalid</Badge>
                  )}
                </TableCell>
                <TableCell className="font-medium">{r.row.name || <span className="text-muted-foreground">—</span>}</TableCell>
                <TableCell>{r.row.company || <span className="text-muted-foreground">—</span>}</TableCell>
                <TableCell className="text-sm">{r.row.email || <span className="text-muted-foreground">—</span>}</TableCell>
                <TableCell className="text-sm">{r.row.phone || <span className="text-muted-foreground">—</span>}</TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  {r.errors.length > 0 && <div className="text-destructive">{r.errors.join(', ')}</div>}
                  {r.duplicateMatch && <div>Matches {r.duplicateMatch} ({r.duplicateReason})</div>}
                  {r.warnings.length > 0 && r.status === 'valid' && (
                    <div>{r.warnings.join(', ')}</div>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
