import React from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Trash2 } from 'lucide-react';
import { calcHours } from '@/utils/dailySheetTime';
import type { CrewMember } from './DailySheetForm';

interface DailySheetCrewTableProps {
  crew: CrewMember[];
  onChange: (id: string, patch: Partial<CrewMember>) => void;
  onRemove: (id: string) => void;
}

export const DailySheetCrewTable: React.FC<DailySheetCrewTableProps> = ({
  crew,
  onChange,
  onRemove,
}) => {
  const total = crew.reduce((acc, r) => acc + calcHours(r.start, r.end, r.breakMinutes), 0);

  return (
    <div className="space-y-3">
      {/* Desktop table */}
      <div className="hidden md:block rounded-lg border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr className="text-left">
              <th className="px-3 py-2 font-medium">Employee</th>
              <th className="px-3 py-2 font-medium w-[140px]">Role / Trade</th>
              <th className="px-3 py-2 font-medium w-[120px]">Start</th>
              <th className="px-3 py-2 font-medium w-[120px]">End</th>
              <th className="px-3 py-2 font-medium w-[100px]">Break (min)</th>
              <th className="px-3 py-2 font-medium w-[90px] text-right">Hours</th>
              <th className="px-3 py-2 font-medium w-[160px]">Notes</th>
              <th className="px-3 py-2 w-[48px]" />
            </tr>
          </thead>
          <tbody>
            {crew.map(m => (
              <tr key={m.id} className="border-t">
                <td className="px-3 py-2 font-medium">{m.name}</td>
                <td className="px-3 py-2">
                  <Input
                    value={m.role ?? ''}
                    placeholder="—"
                    onChange={e => onChange(m.id, { role: e.target.value })}
                    className="h-9"
                  />
                </td>
                <td className="px-3 py-2">
                  <Input
                    type="time"
                    value={m.start}
                    onChange={e => onChange(m.id, { start: e.target.value })}
                    className="h-9"
                  />
                </td>
                <td className="px-3 py-2">
                  <Input
                    type="time"
                    value={m.end}
                    onChange={e => onChange(m.id, { end: e.target.value })}
                    className="h-9"
                  />
                </td>
                <td className="px-3 py-2">
                  <Input
                    type="number"
                    min={0}
                    step={5}
                    value={m.breakMinutes === 0 ? '' : m.breakMinutes}
                    placeholder="0"
                    onChange={e => onChange(m.id, { breakMinutes: Number(e.target.value) || 0 })}
                    className="h-9"
                  />
                </td>
                <td className="px-3 py-2 text-right font-semibold tabular-nums">
                  {calcHours(m.start, m.end, m.breakMinutes).toFixed(2)}
                </td>
                <td className="px-3 py-2">
                  <Input
                    value={m.notes ?? ''}
                    placeholder="—"
                    onChange={e => onChange(m.id, { notes: e.target.value })}
                    className="h-9"
                  />
                </td>
                <td className="px-3 py-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                    onClick={() => onRemove(m.id)}
                    aria-label={`Remove ${m.name}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t bg-muted/30">
              <td className="px-3 py-2 font-semibold" colSpan={5}>
                Total — {crew.length} worker{crew.length === 1 ? '' : 's'}
              </td>
              <td className="px-3 py-2 text-right font-bold tabular-nums">{total.toFixed(2)}</td>
              <td />
              <td />
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="md:hidden space-y-3">
        {crew.map(m => (
          <div key={m.id} className="rounded-lg border p-3 space-y-3">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="font-semibold text-sm">{m.name}</p>
                <p className="text-xs text-muted-foreground">
                  {calcHours(m.start, m.end, m.breakMinutes).toFixed(2)} h
                </p>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-destructive"
                onClick={() => onRemove(m.id)}
                aria-label={`Remove ${m.name}`}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs">Start</Label>
                <Input
                  type="time"
                  value={m.start}
                  onChange={e => onChange(m.id, { start: e.target.value })}
                  className="h-9"
                />
              </div>
              <div>
                <Label className="text-xs">End</Label>
                <Input
                  type="time"
                  value={m.end}
                  onChange={e => onChange(m.id, { end: e.target.value })}
                  className="h-9"
                />
              </div>
              <div>
                <Label className="text-xs">Break (min)</Label>
                <Input
                  type="number"
                  min={0}
                  step={5}
                  value={m.breakMinutes === 0 ? '' : m.breakMinutes}
                  placeholder="0"
                  onChange={e => onChange(m.id, { breakMinutes: Number(e.target.value) || 0 })}
                  className="h-9"
                />
              </div>
              <div>
                <Label className="text-xs">Role / Trade</Label>
                <Input
                  value={m.role ?? ''}
                  placeholder="—"
                  onChange={e => onChange(m.id, { role: e.target.value })}
                  className="h-9"
                />
              </div>
              <div className="col-span-2">
                <Label className="text-xs">Notes</Label>
                <Input
                  value={m.notes ?? ''}
                  placeholder="—"
                  onChange={e => onChange(m.id, { notes: e.target.value })}
                  className="h-9"
                />
              </div>
            </div>
          </div>
        ))}
        <div className="rounded-lg border bg-muted/30 px-3 py-2 flex items-center justify-between">
          <span className="text-sm font-semibold">
            {crew.length} worker{crew.length === 1 ? '' : 's'}
          </span>
          <span className="text-sm font-bold tabular-nums">{total.toFixed(2)} h</span>
        </div>
      </div>
    </div>
  );
};
