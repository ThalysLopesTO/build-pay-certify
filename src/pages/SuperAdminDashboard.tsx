
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { CheckCircle, XCircle, Building, User, Mail, Phone, MapPin, Clock, Search } from 'lucide-react';
import { format } from 'date-fns';
import Header from '@/components/Header';
import RegistrationRequestCard from '@/components/admin/RegistrationRequestCard';
import ApprovalConfirmationDialog from '@/components/admin/ApprovalConfirmationDialog';
import RejectionConfirmationDialog from '@/components/admin/RejectionConfirmationDialog';

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
}

const SuperAdminDashboard = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortOrder, setSortOrder] = useState('newest');
  const [selectedRequest, setSelectedRequest] = useState<RegistrationRequest | null>(null);
  const [showApprovalDialog, setShowApprovalDialog] = useState(false);
  const [showRejectionDialog, setShowRejectionDialog] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: requests, isLoading } = useQuery({
    queryKey: ['super-admin-registration-requests'],
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
      // Create company
      const { data: companyData, error: companyError } = await supabase
        .from('companies')
        .insert({
          name: request.company_name,
          status: 'active'
        })
        .select()
        .single();

      if (companyError) throw companyError;

      // Create auth user
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: request.admin_email,
        password: 'TempPassword123!', // Temporary password - user should reset
        email_confirm: true,
        user_metadata: {
          first_name: request.admin_first_name,
          last_name: request.admin_last_name,
          role: 'admin'
        }
      });

      if (authError) throw authError;

      // Create user profile
      const { error: profileError } = await supabase
        .from('user_profiles')
        .insert({
          user_id: authData.user.id,
          company_id: companyData.id,
          role: 'admin',
          first_name: request.admin_first_name,
          last_name: request.admin_last_name,
          pending_approval: false
        });

      if (profileError) throw profileError;

      // Update registration request
      const { error: requestError } = await supabase
        .from('company_registration_requests')
        .update({ 
          status: 'approved',
          company_id: companyData.id,
          admin_user_id: authData.user.id
        })
        .eq('id', request.id);

      if (requestError) throw requestError;

      return { company: companyData, user: authData.user };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['super-admin-registration-requests'] });
      toast({
        title: "Request Approved",
        description: "Company registration has been approved and accounts created successfully"
      });
      setShowApprovalDialog(false);
      setSelectedRequest(null);
    },
    onError: (error) => {
      console.error('Approval error:', error);
      toast({
        title: "Approval Failed",
        description: "Failed to approve the registration request. Please try again.",
        variant: "destructive"
      });
    },
    onSettled: () => {
      setProcessingId(null);
    }
  });

  const rejectRequestMutation = useMutation({
    mutationFn: async (request: RegistrationRequest) => {
      const { error } = await supabase
        .from('company_registration_requests')
        .update({ status: 'rejected' })
        .eq('id', request.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['super-admin-registration-requests'] });
      toast({
        title: "Request Rejected",
        description: "Company registration has been rejected"
      });
      setShowRejectionDialog(false);
      setSelectedRequest(null);
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

  const handleApprove = (request: RegistrationRequest) => {
    setSelectedRequest(request);
    setShowApprovalDialog(true);
  };

  const handleReject = (request: RegistrationRequest) => {
    setSelectedRequest(request);
    setShowRejectionDialog(true);
  };

  const confirmApproval = () => {
    if (selectedRequest) {
      setProcessingId(selectedRequest.id);
      approveRequestMutation.mutate(selectedRequest);
    }
  };

  const confirmRejection = () => {
    if (selectedRequest) {
      setProcessingId(selectedRequest.id);
      rejectRequestMutation.mutate(selectedRequest);
    }
  };

  const filteredRequests = requests?.filter(request => {
    const matchesSearch = 
      request.company_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.admin_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      `${request.admin_first_name} ${request.admin_last_name}`.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || request.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  }).sort((a, b) => {
    const dateA = new Date(a.created_at).getTime();
    const dateB = new Date(b.created_at).getTime();
    return sortOrder === 'newest' ? dateB - dateA : dateA - dateB;
  });

  const pendingCount = requests?.filter(r => r.status === 'pending').length || 0;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Header />
        <div className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-slate-200 rounded mb-4"></div>
            {[1, 2, 3].map(i => (
              <div key={i} className="h-32 bg-slate-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Header />
      <div className="p-6">
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Super Admin Dashboard</h1>
              <p className="text-slate-600 mt-1">
                Manage company registration requests
                {pendingCount > 0 && (
                  <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                    {pendingCount} pending
                  </span>
                )}
              </p>
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
              <Input
                placeholder="Search by company name, admin name, or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
            <Select value={sortOrder} onValueChange={setSortOrder}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest First</SelectItem>
                <SelectItem value="oldest">Oldest First</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Requests List */}
          {!filteredRequests || filteredRequests.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <Building className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-500">No registration requests found</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {filteredRequests.map((request) => (
                <RegistrationRequestCard
                  key={request.id}
                  request={request}
                  onApprove={handleApprove}
                  onReject={handleReject}
                  isProcessing={processingId === request.id}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Confirmation Dialogs */}
      <ApprovalConfirmationDialog
        open={showApprovalDialog}
        onOpenChange={setShowApprovalDialog}
        onConfirm={confirmApproval}
        request={selectedRequest}
        isProcessing={processingId === selectedRequest?.id}
      />
      
      <RejectionConfirmationDialog
        open={showRejectionDialog}
        onOpenChange={setShowRejectionDialog}
        onConfirm={confirmRejection}
        request={selectedRequest}
        isProcessing={processingId === selectedRequest?.id}
      />
    </div>
  );
};

export default SuperAdminDashboard;
