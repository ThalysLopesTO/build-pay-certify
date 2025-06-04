
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import Header from '@/components/Header';
import CompanyManagementTable from '@/components/admin/CompanyManagementTable';
import LicenseApprovalDialog from '@/components/admin/LicenseApprovalDialog';
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

interface Company {
  id: string;
  name: string;
  status: string;
  registration_date: string | null;
  expiration_date: string | null;
  created_at: string;
  is_expired: boolean;
  days_until_expiry: number | null;
}

const SuperAdminDashboard = () => {
  const [selectedRequest, setSelectedRequest] = useState<RegistrationRequest | null>(null);
  const [showApprovalDialog, setShowApprovalDialog] = useState(false);
  const [showRejectionDialog, setShowRejectionDialog] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch registration requests
  const { data: requests, isLoading: requestsLoading } = useQuery({
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

  // Fetch companies with status
  const { data: companies, isLoading: companiesLoading } = useQuery({
    queryKey: ['super-admin-companies'],
    queryFn: async () => {
      const { data, error } = await supabase
        .rpc('get_companies_with_status');

      if (error) throw error;
      return data as Company[];
    }
  });

  const approveRequestMutation = useMutation({
    mutationFn: async ({ request, registrationDate, expirationDate }: { 
      request: RegistrationRequest;
      registrationDate: string;
      expirationDate: string;
    }) => {
      // Create company with dates
      const { data: companyData, error: companyError } = await supabase
        .from('companies')
        .insert({
          name: request.company_name,
          status: 'active',
          registration_date: registrationDate,
          expiration_date: expirationDate
        })
        .select()
        .single();

      if (companyError) throw companyError;

      // Create auth user
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: request.admin_email,
        password: 'TempPassword123!',
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
      queryClient.invalidateQueries({ queryKey: ['super-admin-companies'] });
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

  const confirmApproval = (registrationDate: string, expirationDate: string) => {
    if (selectedRequest) {
      setProcessingId(selectedRequest.id);
      approveRequestMutation.mutate({ 
        request: selectedRequest, 
        registrationDate, 
        expirationDate 
      });
    }
  };

  const confirmRejection = () => {
    if (selectedRequest) {
      setProcessingId(selectedRequest.id);
      rejectRequestMutation.mutate(selectedRequest);
    }
  };

  const handleEditCompany = (company: Company) => {
    // TODO: Implement edit company functionality
    toast({
      title: "Edit Company",
      description: "Edit company functionality coming soon"
    });
  };

  const handleRevokeCompany = (company: Company) => {
    // TODO: Implement revoke company functionality
    toast({
      title: "Revoke Company",
      description: "Revoke company functionality coming soon"
    });
  };

  const pendingCount = requests?.filter(r => r.status === 'pending').length || 0;
  const isLoading = requestsLoading || companiesLoading;

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
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Super Admin Dashboard</h1>
              <p className="text-slate-600 mt-1">
                Manage company registrations and licenses
                {pendingCount > 0 && (
                  <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                    {pendingCount} pending approval
                  </span>
                )}
              </p>
            </div>
          </div>

          {/* Company Management Table */}
          <CompanyManagementTable
            companies={companies || []}
            requests={requests || []}
            onApproveRequest={handleApprove}
            onRejectRequest={handleReject}
            onEditCompany={handleEditCompany}
            onRevokeCompany={handleRevokeCompany}
            isProcessing={processingId}
          />
        </div>
      </div>

      {/* Dialogs */}
      <LicenseApprovalDialog
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
