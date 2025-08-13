import React, { useState } from 'react';
import { FileText, StickyNote } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

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
  const [isDialogOpen, setIsDialogOpen] = useState(false);
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
      <>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div 
                className="w-5 h-5 flex items-center justify-center cursor-pointer hover:bg-accent rounded transition-colors"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsDialogOpen(true);
                }}
              >
                <StickyNote className="h-4 w-4 text-primary fill-primary/10" />
              </div>
            </TooltipTrigger>
            <TooltipContent className="max-w-xs p-3">
              <div className="space-y-1">
                <div className="font-medium text-sm">Work Note - Click to expand</div>
                <div className="text-xs text-muted-foreground whitespace-pre-wrap">
                  {truncatedNote}
                </div>
              </div>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <StickyNote className="h-5 w-5 text-primary" />
                Work Note
              </DialogTitle>
            </DialogHeader>
            <div className="mt-4">
              <div className="text-sm text-muted-foreground whitespace-pre-wrap bg-muted/30 rounded-md p-4 border max-h-96 overflow-y-auto">
                {note}
              </div>
              <div className="flex justify-between items-center mt-3 text-xs text-muted-foreground">
                <span>Work summary provided by employee</span>
                <span>{note.length} characters</span>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </>
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