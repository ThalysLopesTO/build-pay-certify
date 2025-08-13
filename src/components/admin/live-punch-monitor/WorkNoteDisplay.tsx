import React from 'react';
import { FileText, StickyNote } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';

interface WorkNoteDisplayProps {
  note: string | null;
  variant?: 'icon' | 'full';
  maxPreviewLength?: number;
}

const WorkNoteDisplay: React.FC<WorkNoteDisplayProps> = ({ 
  note, 
  variant = 'icon',
  maxPreviewLength = 120 
}) => {
  if (!note || note.trim() === '') {
    return variant === 'icon' ? (
      <div className="w-5 h-5 flex items-center justify-center">
        <FileText className="h-4 w-4 text-muted-foreground/30" />
      </div>
    ) : null;
  }

  const truncatedNote = note.length > maxPreviewLength 
    ? `${note.substring(0, maxPreviewLength)}...` 
    : note;

  if (variant === 'icon') {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="w-5 h-5 flex items-center justify-center cursor-help">
              <StickyNote className="h-4 w-4 text-primary fill-primary/10" />
            </div>
          </TooltipTrigger>
          <TooltipContent className="max-w-xs p-3">
            <div className="space-y-1">
              <div className="font-medium text-sm">Work Note</div>
              <div className="text-xs text-muted-foreground whitespace-pre-wrap">
                {truncatedNote}
              </div>
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <StickyNote className="h-4 w-4 text-primary" />
        <span className="text-sm font-medium">Work Note</span>
        <Badge variant="secondary" className="text-xs">
          {note.length} chars
        </Badge>
      </div>
      <div className="text-sm text-muted-foreground whitespace-pre-wrap bg-muted/30 rounded-md p-3 border">
        {note}
      </div>
    </div>
  );
};

export default WorkNoteDisplay;