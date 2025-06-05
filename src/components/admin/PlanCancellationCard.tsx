
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { XCircle, AlertTriangle } from 'lucide-react';
import { useCancellationRequests } from '@/hooks/useCancellationRequests';

const PlanCancellationCard = () => {
  const [notes, setNotes] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { requests, submitCancellationRequest } = useCancellationRequests();

  // Check if there's already a pending request
  const hasPendingRequest = requests.some(request => request.status === 'pending');

  const handleSubmitCancellation = () => {
    submitCancellationRequest.mutate({ notes });
    setNotes('');
    setIsDialogOpen(false);
  };

  if (hasPendingRequest) {
    return (
      <Card className="border-yellow-200 bg-yellow-50">
        <CardHeader>
          <div className="flex items-center space-x-2">
            <AlertTriangle className="h-5 w-5 text-yellow-600" />
            <CardTitle className="text-yellow-800">Cancellation Request Pending</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-yellow-700">
            Your plan cancellation request is currently being reviewed by our team. 
            You will be notified once a decision has been made.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-red-200">
      <CardHeader>
        <div className="flex items-center space-x-2">
          <XCircle className="h-5 w-5 text-red-600" />
          <CardTitle className="text-red-800">Plan Cancellation</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-gray-600">
          Need to cancel your plan? Submit a cancellation request and our team will review it.
        </p>
        
        <AlertDialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <AlertDialogTrigger asChild>
            <Button 
              variant="outline" 
              className="border-red-300 text-red-700 hover:bg-red-50"
            >
              Cancel My Plan
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Cancel Your Plan</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to cancel your plan? Your access will end at the end of your billing cycle.
                This action will submit a request for review by our team.
              </AlertDialogDescription>
            </AlertDialogHeader>
            
            <div className="space-y-2">
              <Label htmlFor="cancellation-notes">
                Additional Notes (Optional)
              </Label>
              <Textarea
                id="cancellation-notes"
                placeholder="Please let us know why you're cancelling or if there's anything we can do to help..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
              />
            </div>

            <AlertDialogFooter>
              <AlertDialogCancel>Keep My Plan</AlertDialogCancel>
              <AlertDialogAction 
                onClick={handleSubmitCancellation}
                className="bg-red-600 hover:bg-red-700"
                disabled={submitCancellationRequest.isPending}
              >
                {submitCancellationRequest.isPending ? 'Submitting...' : 'Submit Cancellation Request'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  );
};

export default PlanCancellationCard;
