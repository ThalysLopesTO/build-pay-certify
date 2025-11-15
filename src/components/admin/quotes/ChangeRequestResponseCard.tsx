import React from 'react';
import { Card } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { MessageSquare, FileEdit } from 'lucide-react';
import { useResetQuoteForEditing } from '@/hooks/quotes';
import { format } from 'date-fns';

interface ChangeRequestResponseCardProps {
  quoteId: string;
  clientName: string;
  clientChangeRequest: string;
  requestedAt: string;
  onQuoteReset?: () => void;
}

export const ChangeRequestResponseCard: React.FC<ChangeRequestResponseCardProps> = ({
  quoteId,
  clientName,
  clientChangeRequest,
  requestedAt,
  onQuoteReset,
}) => {
  const { mutate: resetQuote, isPending: isResetting } = useResetQuoteForEditing();

  const handleResetForEditing = () => {
    resetQuote(quoteId, {
      onSuccess: () => {
        if (onQuoteReset) {
          onQuoteReset();
        }
      },
    });
  };

  return (
    <Card className="border-l-4 border-l-orange-500 bg-gradient-to-br from-orange-50/50 to-transparent dark:from-orange-950/20">
      <div className="p-6">
        <div className="flex items-start gap-3 mb-4">
          <MessageSquare className="h-6 w-6 text-orange-600 dark:text-orange-500 mt-1" />
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-foreground">
              Client Change Request
            </h3>
            <p className="text-sm text-muted-foreground">
              Requested by {clientName} on {format(new Date(requestedAt), 'MMM d, yyyy')}
            </p>
          </div>
        </div>

        {/* Client's Request */}
        <Alert className="mb-6 bg-blue-50 border-blue-200 dark:bg-blue-950/20 dark:border-blue-800">
          <AlertDescription>
            <div className="mb-1 text-sm font-medium text-blue-900 dark:text-blue-100">
              Client's Message:
            </div>
            <p className="text-sm text-blue-800 dark:text-blue-200 italic">
              "{clientChangeRequest}"
            </p>
          </AlertDescription>
        </Alert>

        {/* Primary Action */}
        <div className="space-y-2">
          <Button
            onClick={handleResetForEditing}
            disabled={isResetting}
            className="w-full"
            size="lg"
          >
            <FileEdit className="h-4 w-4 mr-2" />
            {isResetting ? 'Preparing Quote for Editing...' : 'Edit Quote & Prepare New Version'}
          </Button>
          <p className="text-sm text-muted-foreground text-center">
            Review the client's request, make necessary changes, and resend the updated quote. The client will automatically receive an email notification.
          </p>
        </div>
      </div>
    </Card>
  );
};
