import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { AlertCircle, ChevronDown } from 'lucide-react';

interface CancellationSectionProps {
  onSubmitCancellation: (notes: string) => Promise<void>;
  isSubmitting: boolean;
  hasPendingRequest: boolean;
  pendingRequestDate?: string;
  isActive: boolean;
}

export const CancellationSection: React.FC<CancellationSectionProps> = ({
  onSubmitCancellation,
  isSubmitting,
  hasPendingRequest,
  pendingRequestDate,
  isActive,
}) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [notes, setNotes] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  if (!isActive) {
    return null;
  }

  const handleSubmit = async () => {
    await onSubmitCancellation(notes);
    setIsDialogOpen(false);
    setNotes('');
  };

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <Card className="border-muted">
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
            <CardTitle className="flex items-center justify-between text-base">
              <span className="text-muted-foreground">Need to cancel?</span>
              <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </CardTitle>
          </CardHeader>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent className="pt-0">
            {hasPendingRequest ? (
              <Alert className="border-orange-200 bg-orange-50">
                <AlertCircle className="h-4 w-4 text-orange-600" />
                <AlertDescription className="text-orange-800">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <span className="font-medium">Cancellation request pending review</span>
                    {pendingRequestDate && (
                      <span className="text-xs text-orange-600">
                        Submitted {new Date(pendingRequestDate).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </AlertDescription>
              </Alert>
            ) : (
              <div className="space-y-4">
                <div className="bg-muted/50 p-3 rounded-md">
                  <p className="text-sm text-muted-foreground">
                    We're sorry to see you go. If you cancel your subscription:
                  </p>
                  <ul className="text-sm text-muted-foreground mt-2 space-y-1 ml-4 list-disc">
                    <li>Your access will continue until the end of your billing cycle</li>
                    <li>All your data will be retained for 30 days</li>
                    <li>You can reactivate anytime before data deletion</li>
                  </ul>
                </div>

                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm" className="text-destructive hover:text-destructive">
                      Request Cancellation
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Request Plan Cancellation</DialogTitle>
                      <DialogDescription>
                        Submit a cancellation request for review. Our team will process your request and contact you shortly.
                      </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4">
                      <div>
                        <label className="text-sm font-medium mb-2 block">
                          Help us improve - why are you canceling? (optional)
                        </label>
                        <Textarea
                          placeholder="Your feedback helps us serve you better..."
                          value={notes}
                          onChange={(e) => setNotes(e.target.value)}
                          className="min-h-[100px]"
                        />
                      </div>
                    </div>

                    <DialogFooter>
                      <Button
                        variant="outline"
                        onClick={() => setIsDialogOpen(false)}
                        disabled={isSubmitting}
                      >
                        Keep Plan
                      </Button>
                      <Button
                        variant="destructive"
                        onClick={handleSubmit}
                        disabled={isSubmitting}
                      >
                        {isSubmitting ? 'Submitting...' : 'Submit Request'}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            )}
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
};
