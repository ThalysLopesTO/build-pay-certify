import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface DayInfo {
  iso: string;
  label: string;
  weekday: string;
}

interface BiWeeklyHoursEditorProps {
  week1Days: DayInfo[];
  week2Days: DayInfo[];
  week1Values: number[];
  week2Values: number[];
  onWeek1Change: (index: number, value: number) => void;
  onWeek2Change: (index: number, value: number) => void;
  disabled?: boolean;
}

export const BiWeeklyHoursEditor: React.FC<BiWeeklyHoursEditorProps> = ({
  week1Days,
  week2Days,
  week1Values,
  week2Values,
  onWeek1Change,
  onWeek2Change,
  disabled = false,
}) => {
  const renderWeekInputs = (
    days: DayInfo[],
    values: number[],
    onChange: (index: number, value: number) => void
  ) => (
    <div className="grid grid-cols-1 gap-3">
      {days.map((day, idx) => (
        <div key={day.iso} className="flex items-center gap-3">
          <Label className="w-32 text-sm font-medium">
            {day.weekday}
          </Label>
          <Label className="w-16 text-xs text-muted-foreground">
            {day.label}
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
            className="h-9 w-20"
          />
          <span className="text-xs text-muted-foreground w-8">hrs</span>
        </div>
      ))}
    </div>
  );

  const week1Total = week1Values.reduce((sum, hours) => sum + (hours || 0), 0);
  const week2Total = week2Values.reduce((sum, hours) => sum + (hours || 0), 0);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Week 1 */}
      <Card className="border-2 border-primary/20">
        <CardHeader className="pb-4">
          <CardTitle className="text-base flex items-center justify-between">
            <span>Week 1</span>
            <span className="text-sm font-medium text-primary">
              {week1Total}h total
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          {renderWeekInputs(week1Days, week1Values, onWeek1Change)}
        </CardContent>
      </Card>

      {/* Week 2 */}
      <Card className="border-2 border-primary/20">
        <CardHeader className="pb-4">
          <CardTitle className="text-base flex items-center justify-between">
            <span>Week 2</span>
            <span className="text-sm font-medium text-primary">
              {week2Total}h total
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          {renderWeekInputs(week2Days, week2Values, onWeek2Change)}
        </CardContent>
      </Card>
    </div>
  );
};