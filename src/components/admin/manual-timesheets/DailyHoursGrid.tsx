import React from 'react';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { type DayEntry, formatDateLong } from '@/utils/manualTimesheetDays';
import { Calendar } from 'lucide-react';

interface DailyHoursGridProps {
  days: DayEntry[];
  onChange: (index: number, hours: number) => void;
  disabled?: boolean;
}

export const DailyHoursGrid: React.FC<DailyHoursGridProps> = ({ days, onChange, disabled }) => {
  if (days.length === 0) {
    return (
      <Card className="p-8 text-center text-muted-foreground bg-muted/30 border-dashed">
        <Calendar className="h-8 w-8 mx-auto mb-2 opacity-40" />
        <p className="text-sm">Select a pay period to populate the daily hours table.</p>
      </Card>
    );
  }

  return (
    <div className="border rounded-lg overflow-hidden">
      <div className="grid grid-cols-12 gap-2 px-4 py-2 bg-muted/50 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
        <div className="col-span-5">Date</div>
        <div className="col-span-4">Day</div>
        <div className="col-span-3 text-right">Hours Worked</div>
      </div>
      <div className="divide-y">
        {days.map((d, i) => (
          <div key={d.date} className="grid grid-cols-12 gap-2 px-4 py-2 items-center">
            <div className="col-span-5 text-sm">{formatDateLong(d.date)}</div>
            <div className="col-span-4 text-sm text-muted-foreground">{d.day}</div>
            <div className="col-span-3">
              <Input
                type="number"
                min={0}
                max={24}
                step={0.25}
                value={d.hours === 0 ? '' : d.hours}
                placeholder="0"
                disabled={disabled}
                onChange={e => {
                  const v = e.target.value === '' ? 0 : parseFloat(e.target.value);
                  onChange(i, Number.isFinite(v) ? v : 0);
                }}
                className="text-right h-9"
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
