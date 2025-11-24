import React, { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { AlertCircle, Clock, Loader2 } from 'lucide-react';
import { calculateWorkedHours, CalculateWorkedHoursResult } from '@/lib/timeRules/calculateWorkedHours';
import { format } from 'date-fns';

interface RuleBasedHoursProps {
  checkInTime: string | null;
  checkOutTime: string | null;
  jobsiteId: string;
  companyId: string;
  date: string;
}

// Flag descriptions for user-friendly display
const FLAG_DESCRIPTIONS: Record<string, string> = {
  EARLY_PUNCH: 'Punched before jobsite start time',
  LATE_ARRIVAL: 'Arrived after allowed grace period',
  AFTER_END: 'Punched out after jobsite end time',
  SHORT_DAY: 'Worked less than expected',
  INVALID: 'Punch is outside valid schedule',
};

export const RuleBasedHours: React.FC<RuleBasedHoursProps> = ({
  checkInTime,
  checkOutTime,
  jobsiteId,
  companyId,
  date,
}) => {
  const [calculated, setCalculated] = useState<CalculateWorkedHoursResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    // Only calculate if we have both check in and check out
    if (!checkInTime || !checkOutTime) {
      setCalculated(null);
      return;
    }

    const calculate = async () => {
      setIsLoading(true);
      setError(false);
      try {
        const result = await calculateWorkedHours({
          rawIn: checkInTime,
          rawOut: checkOutTime,
          jobsiteId,
          companyId,
          date,
        });
        setCalculated(result);
      } catch (err) {
        console.error('Error calculating worked hours:', err);
        setError(true);
        setCalculated(null);
      } finally {
        setIsLoading(false);
      }
    };

    calculate();
  }, [checkInTime, checkOutTime, jobsiteId, companyId, date]);

  if (!checkInTime || !checkOutTime) {
    return null;
  }

  if (isLoading) {
    return (
      <div className="flex items-center gap-1 text-xs text-muted-foreground">
        <Loader2 className="h-3 w-3 animate-spin" />
        <span>Calculating...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-xs text-muted-foreground">
        Rules not applied
      </div>
    );
  }

  if (!calculated) {
    return null;
  }

  return (
    <TooltipProvider>
      <div className="space-y-1">
        <div className="flex items-center gap-1">
          <Clock className="h-3 w-3 text-primary" />
          <span className="text-xs text-muted-foreground">
            By rules: <span className="font-semibold text-foreground">{calculated.paidHours.toFixed(2)} h</span>
          </span>
        </div>
        
        {calculated.flags.length > 0 && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Badge 
                variant="outline" 
                className="text-xs border-orange-200 bg-orange-50 text-orange-700 hover:bg-orange-100 cursor-help"
              >
                <AlertCircle className="h-3 w-3 mr-1" />
                {calculated.flags.length} {calculated.flags.length === 1 ? 'Issue' : 'Issues'}
              </Badge>
            </TooltipTrigger>
            <TooltipContent className="max-w-xs">
              <div className="space-y-1">
                <p className="font-semibold text-xs mb-1">Time Rule Issues:</p>
                {calculated.flags.map((flag) => (
                  <div key={flag} className="text-xs flex items-start gap-1">
                    <span className="text-orange-500">•</span>
                    <span>{FLAG_DESCRIPTIONS[flag] || flag}</span>
                  </div>
                ))}
              </div>
            </TooltipContent>
          </Tooltip>
        )}
      </div>
    </TooltipProvider>
  );
};

// Desktop table cell version - more compact
export const RuleBasedHoursCell: React.FC<RuleBasedHoursProps> = (props) => {
  const [calculated, setCalculated] = useState<CalculateWorkedHoursResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!props.checkInTime || !props.checkOutTime) {
      setCalculated(null);
      return;
    }

    const calculate = async () => {
      setIsLoading(true);
      try {
        const result = await calculateWorkedHours({
          rawIn: props.checkInTime!,
          rawOut: props.checkOutTime!,
          jobsiteId: props.jobsiteId,
          companyId: props.companyId,
          date: props.date,
        });
        setCalculated(result);
      } catch (err) {
        console.error('Error calculating worked hours:', err);
        setCalculated(null);
      } finally {
        setIsLoading(false);
      }
    };

    calculate();
  }, [props.checkInTime, props.checkOutTime, props.jobsiteId, props.companyId, props.date]);

  if (!props.checkInTime || !props.checkOutTime) {
    return <span className="text-muted-foreground">—</span>;
  }

  if (isLoading) {
    return <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />;
  }

  if (!calculated) {
    return <span className="text-muted-foreground">—</span>;
  }

  return (
    <TooltipProvider>
      <div className="flex items-center gap-2">
        <span className="font-semibold">{calculated.paidHours.toFixed(2)} h</span>
        {calculated.flags.length > 0 && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Badge 
                variant="outline" 
                className="text-xs border-orange-200 bg-orange-50 text-orange-700 hover:bg-orange-100 cursor-help"
              >
                <AlertCircle className="h-3 w-3 mr-1" />
                {calculated.flags.length}
              </Badge>
            </TooltipTrigger>
            <TooltipContent className="max-w-xs">
              <div className="space-y-1">
                <p className="font-semibold text-xs mb-1">Time Rule Issues:</p>
                {calculated.flags.map((flag) => (
                  <div key={flag} className="text-xs flex items-start gap-1">
                    <span className="text-orange-500">•</span>
                    <span>{FLAG_DESCRIPTIONS[flag] || flag}</span>
                  </div>
                ))}
              </div>
            </TooltipContent>
          </Tooltip>
        )}
      </div>
    </TooltipProvider>
  );
};
