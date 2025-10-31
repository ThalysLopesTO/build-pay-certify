import React, { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Header from '@/components/Header';
import SuperAdminHeader from '@/components/admin/SuperAdminHeader';
import SuperAdminLoading from '@/components/admin/SuperAdminLoading';
import CompanyManagementTable from '@/components/admin/CompanyManagementTable';
import LicenseApprovalDialog from '@/components/admin/LicenseApprovalDialog';
import RejectionConfirmationDialog from '@/components/admin/RejectionConfirmationDialog';
import EditCompanyDialog from '@/components/admin/EditCompanyDialog';
import RevokeCompanyDialog from '@/components/admin/RevokeCompanyDialog';
import { ResetAdminPasswordDialog } from '@/components/admin/ResetAdminPasswordDialog';
import { useSuperAdminData } from '@/hooks/useSuperAdminData';
import { useSuperAdminMutations } from '@/hooks/useSuperAdminMutations';
import { useCompanyMutations } from '@/hooks/useCompanyMutations';
import { useResetUserPassword } from '@/hooks/usePasswordManagement';
import CompanyRequestTable from '@/components/admin/CompanyRequestTable';
import { CreateTrialCompanyDialog } from '@/components/admin/trial-companies/CreateTrialCompanyDialog';
import { StatsCards } from '@/components/admin/super-admin/StatsCards';
import { MobileCompanyCard } from '@/components/admin/super-admin/MobileCompanyCard';
import { MobileRequestCard } from '@/components/admin/super-admin/MobileRequestCard';
import { useIsMobile } from '@/hooks/use-mobile';

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
  admin_user_id?: string;
  admin_first_name?: string;
  admin_last_name?: string;
  plan: string;
  subscription_status: string;
  trial_end_date: string | null;
  grace_period_end_date: string | null;
  created_by_super_admin: boolean;
  trial_days_remaining: number | null;
  subscription_days_remaining: number | null;
}

const SuperAdminDashboard = () => {
  const [selectedRequest, setSelectedRequest] = useState<RegistrationRequest | null>(null);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [showApprovalDialog, setShowApprovalDialog] = useState(false);
  const [showRejectionDialog, setShowRejectionDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showRevokeDialog, setShowRevokeDialog] = useState(false);
  const [showResetPasswordDialog, setShowResetPasswordDialog] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('companies');
  
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const { requests, companies, isLoading, pendingCount } = useSuperAdminData();
  const { approveRequestMutation, rejectRequestMutation } = useSuperAdminMutations();
  const { editCompanyMutation, revokeCompanyMutation } = useCompanyMutations();
  const resetPasswordMutation = useResetUserPassword();

  // Calculate stats
  const totalCompanies = companies.filter(c => c.status === 'active').length;
  const trialCompanies = companies.filter(c => 
    c.subscription_status === 'active' && c.trial_days_remaining !== null && c.trial_days_remaining > 0
  ).length;
  const expiringSoon = companies.filter(c => 
    (c.status === 'active' && c.subscription_days_remaining !== null && c.subscription_days_remaining <= 7 && c.subscription_days_remaining > 0) ||
    (c.subscription_status === 'active' && c.trial_days_remaining !== null && c.trial_days_remaining <= 7 && c.trial_days_remaining > 0)
  ).length;

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

  const handleResetPassword = (company: Company) => {
    setSelectedCompany(company);
    setShowResetPasswordDialog(true);
  };

  const confirmResetPassword = (userId: string, password: string, email: string, name: string) => {
    if (selectedCompany) {
      setProcessingId(selectedCompany.id);
      resetPasswordMutation.mutate(
        {
          targetUserId: userId,
          newPassword: password,
          targetUserEmail: email,
          targetUserName: name
        },
        {
          onSettled: () => {
            setProcessingId(null);
            setShowResetPasswordDialog(false);
            setSelectedCompany(null);
          }
        }
      );
    }
  };

  if (isLoading) {
    return <SuperAdminLoading />;
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Header />
      <div className="p-4 md:p-6">
        <div className="max-w-7xl mx-auto space-y-4 md:space-y-6">
          {/* Header with Create Button */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex-1 w-full">
              <SuperAdminHeader pendingCount={pendingCount} />
            </div>
            <div className="w-full sm:w-auto">
              <CreateTrialCompanyDialog />
            </div>
          </div>

          {/* Stats Cards */}
          <StatsCards
            totalCompanies={totalCompanies}
            pendingApprovals={pendingCount}
            trialCompanies={trialCompanies}
            expiringSoon={expiringSoon}
          />

          {/* Mobile: Tabs View */}
          {isMobile ? (
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-4">
                <TabsTrigger value="companies" className="touch-target">
                  Companies ({totalCompanies})
                </TabsTrigger>
                <TabsTrigger value="requests" className="touch-target">
                  Requests ({pendingCount})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="companies" className="space-y-3 mt-0">
                {companies.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    No companies yet
                  </div>
                ) : (
                  companies.map((company) => (
                    <MobileCompanyCard
                      key={company.id}
                      company={company}
                      onEdit={handleEditCompany}
                      onRevoke={handleRevokeCompany}
                      onResetPassword={handleResetPassword}
                      isProcessing={processingId === company.id}
                    />
                  ))
                )}
              </TabsContent>

              <TabsContent value="requests" className="space-y-3 mt-0">
                {requests.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    No pending requests
                  </div>
                ) : (
                  requests.map((request) => (
                    <MobileRequestCard
                      key={request.id}
                      request={request}
                      onApprove={handleApprove}
                      onReject={handleReject}
                      isProcessing={processingId === request.id}
                    />
                  ))
                )}
              </TabsContent>
            </Tabs>
          ) : (
            /* Desktop: Table View */
            <>
              <CompanyManagementTable
                companies={companies}
                requests={requests}
                onApproveRequest={handleApprove}
                onRejectRequest={handleReject}
                onEditCompany={handleEditCompany}
                onRevokeCompany={handleRevokeCompany}
                onResetPassword={handleResetPassword}
                isProcessing={processingId}
              />

              <CompanyRequestTable
                requests={requests}
                onApproveRequest={handleApprove}
                onRejectRequest={handleReject}
                isProcessing={processingId}
              />
            </>
          )}
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

      <ResetAdminPasswordDialog
        open={showResetPasswordDialog}
        onOpenChange={setShowResetPasswordDialog}
        company={selectedCompany}
        onConfirm={confirmResetPassword}
        isProcessing={processingId === selectedCompany?.id}
      />
    </div>
  );
};

export default SuperAdminDashboard;
