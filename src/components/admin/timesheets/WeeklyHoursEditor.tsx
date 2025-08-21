import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface DayInfo {
  iso: string;
  label: string;
  weekday: string;
}

interface WeeklyHoursEditorProps {
  days: DayInfo[];
  values: number[];
  onChange: (index: number, value: number) => void;
  disabled?: boolean;
}

const WeeklyHoursEditor: React.FC<WeeklyHoursEditorProps> = ({ days, values, onChange, disabled = false }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      {days.map((d, idx) => (
        <div key={d.iso} className="flex items-center gap-3" onClick={(e) => e.stopPropagation()}>
          <Label className="w-36 text-sm">
            {d.weekday} ({d.label})
          </Label>
           <Input
             type="number"
             inputMode="decimal"
             min={0}
             max={24}
             step={0.5}
             value={values[idx] === 0 ? '' : values[idx] || ''}
             onFocus={(e) => e.target.select()}
             onChange={(e) => onChange(idx, Number(e.target.value) || 0)}
             disabled={disabled}
             className="h-9"
           />
          <span className="text-xs text-muted-foreground w-8">hrs</span>
        </div>
      ))}
    </div>
  );
};

export default WeeklyHoursEditor;
