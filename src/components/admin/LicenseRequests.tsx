
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { CheckCircle, XCircle, Building, User, Mail, Phone, MapPin, Clock } from 'lucide-react';
import { format } from 'date-fns';

interface RegistrationRequest {
  id: string;
  company_name: string;
  company_email: string;
  company_phone: string | null;
  company_address: string | null;
  admin_first_name: string;
  admin_last_name: string;
  admin_email: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  company_id: string;
  admin_user_id: string;
}

const LicenseRequests = () => {
  const [processingId, setProcessingId] = useState<string | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: requests, isLoading } = useQuery({
    queryKey: ['registration-requests'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('company_registration_requests')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as RegistrationRequest[];
    }
  });

  const approveRequestMutation = useMutation({
    mutationFn: async (request: RegistrationRequest) => {
      // Update company status to active
      const { error: companyError } = await supabase
        .from('companies')
        .update({ status: 'active' })
        .eq('id', request.company_id);

      if (companyError) throw companyError;

      // Update user profile to remove pending approval
      const { error: profileError } = await supabase
        .from('user_profiles')
        .update({ pending_approval: false })
        .eq('user_id', request.admin_user_id);

      if (profileError) throw profileError;

      // Update registration request status
      const { error: requestError } = await supabase
        .from('company_registration_requests')
        .update({ 
          status: 'approved',
          approved_at: new Date().toISOString()
        })
        .eq('id', request.id);

      if (requestError) throw requestError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['registration-requests'] });
      toast({
        title: "Request Approved",
        description: "Company registration has been approved successfully"
      });
    },
    onError: (error) => {
      console.error('Approval error:', error);
      toast({
        title: "Approval Failed",
        description: "Failed to approve the registration request",
        variant: "destructive"
      });
    },
    onSettled: () => {
      setProcessingId(null);
    }
  });

  const rejectRequestMutation = useMutation({
    mutationFn: async (request: RegistrationRequest) => {
      // Update registration request status
      const { error: requestError } = await supabase
        .from('company_registration_requests')
        .update({ status: 'rejected' })
        .eq('id', request.id);

      if (requestError) throw requestError;

      // Update company status to inactive
      const { error: companyError } = await supabase
        .from('companies')
        .update({ status: 'inactive' })
        .eq('id', request.company_id);

      if (companyError) throw companyError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['registration-requests'] });
      toast({
        title: "Request Rejected",
        description: "Company registration has been rejected"
      });
    },
    onError: (error) => {
      console.error('Rejection error:', error);
      toast({
        title: "Rejection Failed",
        description: "Failed to reject the registration request",
        variant: "destructive"
      });
    },
    onSettled: () => {
      setProcessingId(null);
    }
  });

  const handleApprove = async (request: RegistrationRequest) => {
    setProcessingId(request.id);
    approveRequestMutation.mutate(request);
  };

  const handleReject = async (request: RegistrationRequest) => {
    setProcessingId(request.id);
    rejectRequestMutation.mutate(request);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary">Pending</Badge>;
      case 'approved':
        return <Badge variant="default" className="bg-green-600">Approved</Badge>;
      case 'rejected':
        return <Badge variant="destructive">Rejected</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse">
          <div className="h-8 bg-slate-200 rounded mb-4"></div>
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-32 bg-slate-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900 mb-2">License Requests</h2>
        <p className="text-slate-600">Review and approve company registration requests</p>
      </div>

      {!requests || requests.length === 0 ? (
        <Card>
          <CardContent className="text-center py-8">
            <Building className="h-12 w-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-500">No registration requests found</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {requests.map((request) => (
            <Card key={request.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="flex items-center">
                      <Building className="h-5 w-5 mr-2" />
                      {request.company_name}
                    </CardTitle>
                    <CardDescription className="flex items-center mt-1">
                      <Clock className="h-4 w-4 mr-1" />
                      Submitted {format(new Date(request.created_at), 'PPP')}
                    </CardDescription>
                  </div>
                  {getStatusBadge(request.status)}
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-6">
                  {/* Company Info */}
                  <div className="space-y-3">
                    <h4 className="font-semibold text-slate-900">Company Information</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center">
                        <Mail className="h-4 w-4 mr-2 text-slate-400" />
                        {request.company_email}
                      </div>
                      {request.company_phone && (
                        <div className="flex items-center">
                          <Phone className="h-4 w-4 mr-2 text-slate-400" />
                          {request.company_phone}
                        </div>
                      )}
                      {request.company_address && (
                        <div className="flex items-start">
                          <MapPin className="h-4 w-4 mr-2 text-slate-400 mt-0.5" />
                          <span>{request.company_address}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Admin Info */}
                  <div className="space-y-3">
                    <h4 className="font-semibold text-slate-900">Administrator</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center">
                        <User className="h-4 w-4 mr-2 text-slate-400" />
                        {request.admin_first_name} {request.admin_last_name}
                      </div>
                      <div className="flex items-center">
                        <Mail className="h-4 w-4 mr-2 text-slate-400" />
                        {request.admin_email}
                      </div>
                    </div>
                  </div>
                </div>

                {request.status === 'pending' && (
                  <div className="flex space-x-3 mt-6 pt-4 border-t">
                    <Button
                      onClick={() => handleApprove(request)}
                      disabled={processingId === request.id}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      {processingId === request.id ? 'Approving...' : 'Approve'}
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={() => handleReject(request)}
                      disabled={processingId === request.id}
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      {processingId === request.id ? 'Rejecting...' : 'Reject'}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default LicenseRequests;
