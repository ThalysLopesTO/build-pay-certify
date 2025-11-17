import React from 'react';
import { Button } from '@/components/ui/button';
import { Save, Send } from 'lucide-react';

interface QuoteEditorMobileActionsProps {
  onSave: () => void;
  onSaveAndSend: () => void;
  onCancel: () => void;
}

const QuoteEditorMobileActions: React.FC<QuoteEditorMobileActionsProps> = ({
  onSave,
  onSaveAndSend,
  onCancel,
}) => {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-20 bg-background border-t shadow-lg safe-bottom">
      <div className="px-4 py-3 space-y-2">
        <Button 
          type="button" 
          variant="default" 
          onClick={onSave}
          className="w-full h-12"
          size="lg"
        >
          <Save className="h-5 w-5 mr-2" />
          Save Quote
        </Button>
        <div className="grid grid-cols-2 gap-2">
          <Button 
            type="button" 
            variant="outline" 
            onClick={onCancel}
            className="h-11"
          >
            Cancel
          </Button>
          <Button 
            type="button" 
            variant="default" 
            onClick={onSaveAndSend}
            className="h-11 bg-blue-600 hover:bg-blue-700"
          >
            <Send className="h-4 w-4 mr-2" />
            Save & Send
          </Button>
        </div>
      </div>
    </div>
  );
};

export default QuoteEditorMobileActions;
