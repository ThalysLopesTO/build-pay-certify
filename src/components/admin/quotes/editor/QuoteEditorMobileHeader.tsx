import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, MoreVertical, Save, Send, X } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface QuoteEditorMobileHeaderProps {
  isEditing: boolean;
  clientName: string;
  onBack: () => void;
  onSave: () => void;
  onSaveAndSend: () => void;
  onCancel: () => void;
}

const QuoteEditorMobileHeader: React.FC<QuoteEditorMobileHeaderProps> = ({
  isEditing,
  clientName,
  onBack,
  onSave,
  onSaveAndSend,
  onCancel,
}) => {
  return (
    <div className="sticky top-0 z-20 bg-background border-b shadow-sm">
      <div className="flex items-center justify-between px-4 py-3">
        <Button variant="ghost" size="icon" onClick={onBack} type="button">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        
        <div className="flex-1 text-center">
          <h1 className="text-base font-semibold truncate px-2">
            {isEditing ? 'Edit Quote' : 'New Quote'}
          </h1>
          {clientName && (
            <p className="text-xs text-muted-foreground truncate px-2">{clientName}</p>
          )}
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" type="button">
              <MoreVertical className="h-5 w-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem onClick={onSave}>
              <Save className="h-4 w-4 mr-2" />
              Save Quote
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onSaveAndSend}>
              <Send className="h-4 w-4 mr-2" />
              Save & Send
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onCancel}>
              <X className="h-4 w-4 mr-2" />
              Cancel
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
};

export default QuoteEditorMobileHeader;
