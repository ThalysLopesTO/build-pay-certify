
import React, { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import Header from '@/components/Header';
import SuperAdminHeader from '@/components/admin/SuperAdminHeader';
import SuperAdminLoading from '@/components/admin/SuperAdminLoading';
import CompanyManagementTable from '@/components/admin/CompanyManagementTable';
import CancellationRequestsManagement from '@/components/admin/CancellationRequestsManagement';
import LicenseApprovalDialog from '@/components/admin/LicenseApprovalDialog';
import RejectionConfirmationDialog from '@/components/admin/RejectionConfirmationDialog';
import { useSuperAdminData } from '@/hooks/useSuperAdminData';
import { useSuperAdminMutations } from '@/hooks/useSuperAdminMutations';

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
  const { requests, companies, isLoading, pendingCount } = useSuperAdminData();
  const { approveRequestMutation, rejectRequestMutation } = useSuperAdminMutations();

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
      approveRequestMutation.mutate(
        { 
          request: selectedRequest, 
          registrationDate, 
          expirationDate 
        },
        {
          onSettled: () => {
            setProcessingId(null);
            setShowApprovalDialog(false);
            setSelectedRequest(null);
          }
        }
      );
    }
  };

  const confirmRejection = () => {
    if (selectedRequest) {
      setProcessingId(selectedRequest.id);
      rejectRequestMutation.mutate(selectedRequest, {
        onSettled: () => {
          setProcessingId(null);
          setShowRejectionDialog(false);
          setSelectedRequest(null);
        }
      });
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

  if (isLoading) {
    return <SuperAdminLoading />;
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Header />
      <div className="p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          <SuperAdminHeader pendingCount={pendingCount} />

          <CompanyManagementTable
            companies={companies}
            requests={requests}
            onApproveRequest={handleApprove}
            onRejectRequest={handleReject}
            onEditCompany={handleEditCompany}
            onRevokeCompany={handleRevokeCompany}
            isProcessing={processingId}
          />

          {/* Cancellation Requests Section */}
          <CancellationRequestsManagement />
        </div>
      </div>

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
