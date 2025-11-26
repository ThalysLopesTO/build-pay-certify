import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarIcon, ChevronRight } from 'lucide-react';
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, subWeeks } from 'date-fns';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerTrigger } from '@/components/ui/drawer';

interface DateRange {
  start: Date;
  end: Date;
}

interface DateRangeSelectorProps {
  value: DateRange;
  onChange: (range: DateRange) => void;
  className?: string;
}

type PresetType = 'this-week' | 'last-week' | 'last-2-weeks' | 'this-month' | 'custom';

export const DateRangeSelector: React.FC<DateRangeSelectorProps> = ({
  value,
  onChange,
  className
}) => {
  const isMobile = useIsMobile();
  const [open, setOpen] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState<PresetType>('custom');

  const presets = [
    {
      id: 'this-week' as PresetType,
      label: 'This Week',
      getRange: () => ({
        start: startOfWeek(new Date(), { weekStartsOn: 1 }),
        end: endOfWeek(new Date(), { weekStartsOn: 1 })
      })
    },
    {
      id: 'last-week' as PresetType,
      label: 'Last Week',
      getRange: () => {
        const lastWeek = subWeeks(new Date(), 1);
        return {
          start: startOfWeek(lastWeek, { weekStartsOn: 1 }),
          end: endOfWeek(lastWeek, { weekStartsOn: 1 })
        };
      }
    },
    {
      id: 'last-2-weeks' as PresetType,
      label: 'Last 2 Weeks',
      getRange: () => {
        const twoWeeksAgo = subWeeks(new Date(), 2);
        return {
          start: startOfWeek(twoWeeksAgo, { weekStartsOn: 1 }),
          end: endOfWeek(new Date(), { weekStartsOn: 1 })
        };
      }
    },
    {
      id: 'this-month' as PresetType,
      label: 'This Month',
      getRange: () => ({
        start: startOfMonth(new Date()),
        end: endOfMonth(new Date())
      })
    }
  ];

  const handlePresetClick = (preset: typeof presets[0]) => {
    const range = preset.getRange();
    setSelectedPreset(preset.id);
    onChange(range);
    if (!isMobile) {
      setOpen(false);
    }
  };

  const handleCustomRange = (range: any) => {
    if (range?.from && range?.to) {
      setSelectedPreset('custom');
      onChange({ start: range.from, end: range.to });
      setOpen(false);
    }
  };

  const displayText = `${format(value.start, 'MMM dd')} → ${format(value.end, 'MMM dd, yyyy')}`;

  const CalendarContent = () => (
    <div className="flex flex-col">
      {/* Preset Buttons */}
      <div className="p-3 border-b bg-muted/30">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">Quick Select</p>
        <div className="grid grid-cols-2 gap-2">
          {presets.map((preset) => (
            <Button
              key={preset.id}
              variant={selectedPreset === preset.id ? "default" : "outline"}
              size="sm"
              onClick={() => handlePresetClick(preset)}
              className={cn(
                "justify-start text-xs h-9 transition-all",
                selectedPreset === preset.id && "shadow-sm"
              )}
            >
              {preset.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Custom Range Selector */}
      <div className="p-3 border-b bg-muted/10">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">Custom Range</p>
      </div>
      
      <Calendar
        mode="range"
        selected={{
          from: value.start,
          to: value.end
        }}
        onSelect={handleCustomRange}
        numberOfMonths={isMobile ? 1 : 2}
        className="pointer-events-auto"
      />
    </div>
  );

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={setOpen}>
        <DrawerTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              "w-full justify-between text-left font-normal min-h-[44px] hover:bg-accent/50 transition-colors",
              className
            )}
          >
            <div className="flex items-center gap-2 truncate">
              <CalendarIcon className="h-4 w-4 flex-shrink-0" />
              <span className="truncate">{displayText}</span>
            </div>
            <ChevronRight className="h-4 w-4 opacity-50 flex-shrink-0" />
          </Button>
        </DrawerTrigger>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>Select Date Range</DrawerTitle>
          </DrawerHeader>
          <div className="max-h-[70vh] overflow-y-auto">
            <CalendarContent />
          </div>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "w-full justify-between text-left font-normal min-h-[44px] hover:bg-accent/50 transition-colors",
            className
          )}
        >
          <div className="flex items-center gap-2 truncate">
            <CalendarIcon className="h-4 w-4 flex-shrink-0" />
            <span className="truncate">{displayText}</span>
          </div>
          <ChevronRight className="h-4 w-4 opacity-50 flex-shrink-0" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0 bg-background shadow-xl border" align="start">
        <CalendarContent />
      </PopoverContent>
    </Popover>
  );
};