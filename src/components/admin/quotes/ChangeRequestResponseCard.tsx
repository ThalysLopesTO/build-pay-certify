import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { MessageSquare, Send, CheckCircle2, FileEdit } from 'lucide-react';
import { useRespondToChangeRequest, useResetQuoteForEditing } from '@/hooks/quotes';
import { format } from 'date-fns';

interface ChangeRequestResponseCardProps {
  quoteId: string;
  clientName: string;
  clientChangeRequest: string;
  requestedAt: string;
  adminResponse?: string;
  adminRespondedAt?: string;
  onQuoteReset?: () => void;
}

export const ChangeRequestResponseCard: React.FC<ChangeRequestResponseCardProps> = ({
  quoteId,
  clientName,
  clientChangeRequest,
  requestedAt,
  adminResponse,
  adminRespondedAt,
  onQuoteReset,
}) => {
  const [response, setResponse] = useState(adminResponse || '');
  const [isEditing, setIsEditing] = useState(!adminResponse);
  const { mutate: sendResponse, isPending } = useRespondToChangeRequest();
  const { mutate: resetQuote, isPending: isResetting } = useResetQuoteForEditing();

  const handleSendResponse = () => {
    if (!response.trim()) return;
    
    sendResponse(
      { quoteId, responseMessage: response },
      {
        onSuccess: () => {
          setIsEditing(false);
        },
      }
    );
  };

  const handleResetForEditing = () => {
    resetQuote(quoteId, {
      onSuccess: () => {
        if (onQuoteReset) {
          onQuoteReset();
        }
      },
    });
  };

  const hasResponded = !!adminResponse && !isEditing;

  return (
    <Card className="border-l-4 border-l-primary bg-gradient-to-br from-primary/5 to-transparent">
      <div className="p-6">
        <div className="flex items-start gap-3 mb-4">
          <MessageSquare className="h-6 w-6 text-primary mt-1" />
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-foreground">
              {hasResponded ? 'Change Request & Response' : 'Client Change Request'}
            </h3>
            <p className="text-sm text-muted-foreground">
              Requested by {clientName} on {format(new Date(requestedAt), 'MMM d, yyyy')}
            </p>
          </div>
          {hasResponded && (
            <CheckCircle2 className="h-6 w-6 text-green-600" />
          )}
        </div>

        {/* Client's Request */}
        <Alert className="mb-4 bg-blue-50 border-blue-200 dark:bg-blue-950/20 dark:border-blue-800">
          <AlertDescription>
            <div className="mb-1 text-sm font-medium text-blue-900 dark:text-blue-100">
              Client's Message:
            </div>
            <p className="text-sm text-blue-800 dark:text-blue-200 italic">
              "{clientChangeRequest}"
            </p>
          </AlertDescription>
        </Alert>

        {/* Admin Response Section */}
        {hasResponded ? (
          <Alert className="bg-green-50 border-green-200 dark:bg-green-950/20 dark:border-green-800">
            <AlertDescription>
              <div className="mb-1 text-sm font-medium text-green-900 dark:text-green-100">
                Your Response:
              </div>
              <p className="text-sm text-green-800 dark:text-green-200 whitespace-pre-wrap">
                {adminResponse}
              </p>
              <p className="text-xs text-green-700 dark:text-green-300 mt-2">
                Sent on {format(new Date(adminRespondedAt!), 'MMM d, yyyy \'at\' h:mm a')}
              </p>
            </AlertDescription>
          </Alert>
        ) : (
          <div className="space-y-3">
            <div>
              <Label htmlFor="admin-response" className="text-base font-medium">
                Your Response
              </Label>
              <p className="text-sm text-muted-foreground mb-2">
                Respond to the client's change request. They will receive an email notification.
              </p>
            </div>
            
            <Textarea
              id="admin-response"
              value={response}
              onChange={(e) => setResponse(e.target.value)}
              placeholder="Type your response to the client here..."
              className="min-h-[120px] resize-none"
              disabled={isPending}
            />
            
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">
                {response.length} characters
              </span>
              <Button
                onClick={handleSendResponse}
                disabled={!response.trim() || isPending}
                className="gap-2"
              >
                <Send className="h-4 w-4" />
                {isPending ? 'Sending...' : 'Send Response to Client'}
              </Button>
            </div>
          </div>
        )}

        {hasResponded && (
          <div className="mt-4 pt-4 border-t space-y-3">
            <p className="text-sm text-muted-foreground">
              Now that you've responded, you can edit this quote and send the updated version.
            </p>
            <div className="flex gap-2">
              <Button
                onClick={handleResetForEditing}
                disabled={isResetting}
                className="flex-1"
              >
                <FileEdit className="h-4 w-4 mr-2" />
                {isResetting ? 'Resetting...' : 'Edit Quote & Prepare New Version'}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEditing(true)}
              >
                Update Response
              </Button>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};
