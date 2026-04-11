import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Clock, Coffee, FileText, X, CheckCircle } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';

interface BulkActionBarProps {
  selectedCount: number;
  onSetClockOut: () => void;
  onAddBreakTime: () => void;
  onAddNote: () => void;
  onClearSelection: () => void;
  hasActiveEntries: boolean;
}

const BulkActionBar: React.FC<BulkActionBarProps> = ({
  selectedCount,
  onSetClockOut,
  onAddBreakTime,
  onAddNote,
  onClearSelection,
  hasActiveEntries,
}) => {
  const isMobile = useIsMobile();

  if (selectedCount === 0) return null;

  if (isMobile) {
    return (
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t-2 border-primary shadow-lg p-3 safe-area-inset-bottom">
        <div className="flex items-center justify-between gap-2 mb-2">
          <Badge className="bg-primary text-primary-foreground font-semibold px-3 py-1">
            {selectedCount} selected
          </Badge>
          <Button variant="ghost" size="sm" onClick={onClearSelection} className="h-8 px-2">
            <X className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1">
          {hasActiveEntries && (
            <Button size="sm" onClick={onSetClockOut} className="flex-shrink-0 gap-1.5">
              <Clock className="h-3.5 w-3.5" />
              Clock Out
            </Button>
          )}
          <Button size="sm" variant="secondary" onClick={onAddBreakTime} className="flex-shrink-0 gap-1.5">
            <Coffee className="h-3.5 w-3.5" />
            Break
          </Button>
          <Button size="sm" variant="secondary" onClick={onAddNote} className="flex-shrink-0 gap-1.5">
            <FileText className="h-3.5 w-3.5" />
            Note
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="sticky top-0 z-30 bg-primary/5 border border-primary/20 rounded-lg p-3 flex items-center justify-between gap-4 backdrop-blur-sm">
      <div className="flex items-center gap-3">
        <Badge className="bg-primary text-primary-foreground font-semibold px-3 py-1.5 text-sm">
          <CheckCircle className="h-3.5 w-3.5 mr-1.5" />
          {selectedCount} record{selectedCount !== 1 ? 's' : ''} selected
        </Badge>
      </div>
      <div className="flex items-center gap-2">
        {hasActiveEntries && (
          <Button size="sm" onClick={onSetClockOut} className="gap-1.5">
            <Clock className="h-4 w-4" />
            Set Clock Out
          </Button>
        )}
        <Button size="sm" variant="secondary" onClick={onAddBreakTime} className="gap-1.5">
          <Coffee className="h-4 w-4" />
          Add Break Time
        </Button>
        <Button size="sm" variant="secondary" onClick={onAddNote} className="gap-1.5">
          <FileText className="h-4 w-4" />
          Add Note
        </Button>
        <Button size="sm" variant="ghost" onClick={onClearSelection} className="gap-1.5 text-muted-foreground">
          <X className="h-4 w-4" />
          Clear
        </Button>
      </div>
    </div>
  );
};

export default BulkActionBar;
