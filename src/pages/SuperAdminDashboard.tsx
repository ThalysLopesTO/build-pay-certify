
import React, { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import Header from '@/components/Header';
import SuperAdminHeader from '@/components/admin/SuperAdminHeader';
import SuperAdminLoading from '@/components/admin/SuperAdminLoading';
import CompanyManagementTable from '@/components/admin/CompanyManagementTable';
import CancellationRequestsManagement from '@/components/admin/CancellationRequestsManagement';
import LicenseApprovalDialog from '@/components/admin/LicenseApprovalDialog';
import RejectionConfirmationDialog from '@/components/admin/RejectionConfirmationDialog';
import EditCompanyDialog from '@/components/admin/EditCompanyDialog';
import RevokeCompanyDialog from '@/components/admin/RevokeCompanyDialog';
import { useSuperAdminData } from '@/hooks/useSuperAdminData';
import { useSuperAdminMutations } from '@/hooks/useSuperAdminMutations';
import { useCompanyMutations } from '@/hooks/useCompanyMutations';

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
  admin_email?: string;
  admin_phone?: string;
}

const SuperAdminDashboard = () => {
  const [selectedRequest, setSelectedRequest] = useState<RegistrationRequest | null>(null);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [showApprovalDialog, setShowApprovalDialog] = useState(false);
  const [showRejectionDialog, setShowRejectionDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showRevokeDialog, setShowRevokeDialog] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);
  
  const { toast } = useToast();
  const { requests, companies, isLoading, pendingCount } = useSuperAdminData();
  const { approveRequestMutation, rejectRequestMutation } = useSuperAdminMutations();
  const { editCompanyMutation, revokeCompanyMutation } = useCompanyMutations();

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
    setSelectedCompany(company);
    setShowEditDialog(true);
  };

  const handleRevokeCompany = (company: Company) => {
    setSelectedCompany(company);
    setShowRevokeDialog(true);
  };

  const confirmEdit = (companyId: string, data: { name: string; email: string; phone?: string }) => {
    setProcessingId(companyId);
    editCompanyMutation.mutate(
      { companyId, data },
      {
        onSettled: () => {
          setProcessingId(null);
          setShowEditDialog(false);
          setSelectedCompany(null);
        }
      }
    );
  };

  const confirmRevoke = () => {
    if (selectedCompany) {
      setProcessingId(selectedCompany.id);
      revokeCompanyMutation.mutate(selectedCompany.id, {
        onSettled: () => {
          setProcessingId(null);
          setShowRevokeDialog(false);
          setSelectedCompany(null);
        }
      });
    }
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

      <EditCompanyDialog
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
        company={selectedCompany}
        onConfirm={confirmEdit}
        isProcessing={processingId === selectedCompany?.id}
      />

      <RevokeCompanyDialog
        open={showRevokeDialog}
        onOpenChange={setShowRevokeDialog}
        company={selectedCompany}
        onConfirm={confirmRevoke}
        isProcessing={processingId === selectedCompany?.id}
      />
    </div>
  );
};

export default SuperAdminDashboard;
