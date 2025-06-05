
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
import { Check, X, Calendar, User, Building } from 'lucide-react';
import { useCancellationRequests } from '@/hooks/useCancellationRequests';
import { format } from 'date-fns';

const CancellationRequestsManagement = () => {
  const { requests, isLoading, updateCancellationRequest } = useCancellationRequests();

  const handleApprove = (requestId: string) => {
    updateCancellationRequest.mutate({ 
      requestId, 
      status: 'approved',
      shouldExpireLicense: true 
    });
  };

  const handleReject = (requestId: string) => {
    updateCancellationRequest.mutate({ 
      requestId, 
      status: 'rejected' 
    });
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { color: 'bg-yellow-100 text-yellow-800', label: 'Pending' },
      approved: { color: 'bg-green-100 text-green-800', label: 'Approved' },
      rejected: { color: 'bg-red-100 text-red-800', label: 'Rejected' }
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    
    return (
      <Badge className={config.color}>
        {config.label}
      </Badge>
    );
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Cancellation Requests</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <X className="h-5 w-5" />
          <span>Cancellation Requests</span>
          {requests.filter(r => r.status === 'pending').length > 0 && (
            <Badge className="bg-yellow-100 text-yellow-800">
              {requests.filter(r => r.status === 'pending').length} pending
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {requests.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No cancellation requests found
          </div>
        ) : (
          <div className="space-y-4">
            {requests.map((request) => (
              <div 
                key={request.id} 
                className="border rounded-lg p-4 space-y-3"
              >
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Building className="h-4 w-4 text-gray-500" />
                      <span className="font-medium">
                        {(request as any).companies?.name || 'Unknown Company'}
                      </span>
                      {getStatusBadge(request.status)}
                    </div>
                    
                    <div className="flex items-center space-x-4 text-sm text-gray-600">
                      <div className="flex items-center space-x-1">
                        <User className="h-3 w-3" />
                        <span>
                          {(request as any).user_profiles?.first_name} {(request as any).user_profiles?.last_name}
                        </span>
                      </div>
                      
                      <div className="flex items-center space-x-1">
                        <Calendar className="h-3 w-3" />
                        <span>
                          {format(new Date(request.request_date), 'MMM d, yyyy')}
                        </span>
                      </div>
                    </div>

                    {request.notes && (
                      <div className="text-sm text-gray-700 bg-gray-50 p-2 rounded">
                        <strong>Notes:</strong> {request.notes}
                      </div>
                    )}
                  </div>

                  {request.status === 'pending' && (
                    <div className="flex space-x-2">
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button 
                            size="sm" 
                            className="bg-green-600 hover:bg-green-700"
                          >
                            <Check className="h-3 w-3 mr-1" />
                            Approve
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Approve Cancellation Request</AlertDialogTitle>
                            <AlertDialogDescription>
                              This will approve the cancellation request and immediately expire the company's license.
                              The company will lose access to the system.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction 
                              onClick={() => handleApprove(request.id)}
                              className="bg-green-600 hover:bg-green-700"
                            >
                              Approve & Expire License
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>

                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button 
                            size="sm" 
                            variant="outline"
                            className="border-red-300 text-red-700 hover:bg-red-50"
                          >
                            <X className="h-3 w-3 mr-1" />
                            Reject
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Reject Cancellation Request</AlertDialogTitle>
                            <AlertDialogDescription>
                              This will reject the cancellation request. The company will keep their current plan and access.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction 
                              onClick={() => handleReject(request.id)}
                              className="bg-red-600 hover:bg-red-700"
                            >
                              Reject Request
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default CancellationRequestsManagement;
