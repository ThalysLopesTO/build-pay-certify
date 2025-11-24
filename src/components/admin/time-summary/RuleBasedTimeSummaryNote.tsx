import React from 'react';
import { Info } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

export const RuleBasedTimeSummaryNote: React.FC = () => {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="inline-flex items-center gap-1.5 text-xs text-muted-foreground cursor-help">
            <Info className="h-3.5 w-3.5" />
            <span>Hours calculated by time rules</span>
          </div>
        </TooltipTrigger>
        <TooltipContent className="max-w-xs">
          <p className="text-xs">
            These hours are calculated using the jobsite/company time rules, including work start/end times, breaks, and grace periods.
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
