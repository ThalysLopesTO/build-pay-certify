
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { X, AlertCircle } from 'lucide-react';
import { useCancellationRequests } from '@/hooks/useCancellationRequests';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';

const PlanTab = () => {
  const { requests, submitCancellationRequest } = useCancellationRequests();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [notes, setNotes] = useState('');

  // Find pending request for current user's company
  const pendingRequest = requests.find(request => request.status === 'pending');

  const handleCancellationSubmit = async () => {
    await submitCancellationRequest.mutateAsync({ notes });
    setIsDialogOpen(false);
    setNotes('');
  };

  return (
    <Card className="border-red-200">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <X className="h-5 w-5 text-red-600" />
          <span>Plan Management</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {pendingRequest ? (
          <Alert className="border-orange-200 bg-orange-50">
            <AlertCircle className="h-4 w-4 text-orange-600" />
            <AlertDescription className="text-orange-800">
              <div className="flex items-center justify-between">
                <span className="font-medium">Cancellation request pending review</span>
                <span className="text-xs text-orange-600">
                  Submitted {new Date(pendingRequest.request_date).toLocaleDateString()}
                </span>
              </div>
            </AlertDescription>
          </Alert>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Need to cancel your subscription? Submit a cancellation request for review.
            </p>
            
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="border-red-300 text-red-700 hover:bg-red-50">
                  Cancel My Plan
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Cancel Your Plan</DialogTitle>
                  <DialogDescription>
                    Are you sure you want to cancel your plan? Your access will end at the end of your billing cycle.
                    This action requires approval from our team.
                  </DialogDescription>
                </DialogHeader>
                
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">
                      Reason for cancellation (optional)
                    </label>
                    <Textarea
                      placeholder="Please let us know why you're cancelling..."
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      className="min-h-[80px]"
                    />
                  </div>
                </div>
                
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setIsDialogOpen(false)}
                    disabled={submitCancellationRequest.isPending}
                  >
                    Keep Plan
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={handleCancellationSubmit}
                    disabled={submitCancellationRequest.isPending}
                  >
                    {submitCancellationRequest.isPending ? 'Submitting...' : 'Submit Cancellation Request'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PlanTab;
