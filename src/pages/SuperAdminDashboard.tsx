import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Crown, LayoutDashboard, Building2, Users, Inbox } from 'lucide-react';
import Header from '@/components/Header';
import SuperAdminNavigation from '@/components/admin/SuperAdminNavigation';
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
import { useManageSubscription, SubscriptionUpdate } from '@/hooks/super-admin/useManageSubscription';
import { useCompanyUsage } from '@/hooks/super-admin/useCompanyUsage';
import { useDeleteCompany } from '@/hooks/super-admin/useDeleteCompany';
import { DeleteCompanyDialog } from '@/components/admin/super-admin/DeleteCompanyDialog';
import CompanyRequestTable from '@/components/admin/CompanyRequestTable';
import { CreateTrialCompanyDialog } from '@/components/admin/trial-companies/CreateTrialCompanyDialog';
import { MobileCompanyCard } from '@/components/admin/super-admin/MobileCompanyCard';
import { MobileRequestCard } from '@/components/admin/super-admin/MobileRequestCard';
import { OverviewSection } from '@/components/admin/super-admin/OverviewSection';
import { PlatformUsersSection } from '@/components/admin/super-admin/PlatformUsersSection';
import { ManageSubscriptionDialog } from '@/components/admin/super-admin/ManageSubscriptionDialog';
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
  const [showSubscriptionDialog, setShowSubscriptionDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [section, setSection] = useState('overview');
  const [mobileCompanyTab, setMobileCompanyTab] = useState('companies');

  const isMobile = useIsMobile();
  const { requests, companies, isLoading, pendingCount } = useSuperAdminData();
  const { approveRequestMutation, rejectRequestMutation } = useSuperAdminMutations();
  const { editCompanyMutation, revokeCompanyMutation } = useCompanyMutations();
  const resetPasswordMutation = useResetUserPassword();
  const manageSubscription = useManageSubscription();
  const deleteCompany = useDeleteCompany();
  const { data: usageMap = {} } = useCompanyUsage();

  const handleApprove = (request: RegistrationRequest) => { setSelectedRequest(request); setShowApprovalDialog(true); };
  const handleReject = (request: RegistrationRequest) => { setSelectedRequest(request); setShowRejectionDialog(true); };

  const confirmApproval = (registrationDate: string, expirationDate: string) => {
    if (!selectedRequest) return;
    setProcessingId(selectedRequest.id);
    approveRequestMutation.mutate(
      { request: selectedRequest, registrationDate, expirationDate },
      { onSettled: () => { setProcessingId(null); setShowApprovalDialog(false); setSelectedRequest(null); } }
    );
  };

  const confirmRejection = () => {
    if (!selectedRequest) return;
    setProcessingId(selectedRequest.id);
    rejectRequestMutation.mutate(selectedRequest, {
      onSettled: () => { setProcessingId(null); setShowRejectionDialog(false); setSelectedRequest(null); }
    });
  };

  const handleEditCompany = (company: Company) => { setSelectedCompany(company); setShowEditDialog(true); };
  const handleRevokeCompany = (company: Company) => { setSelectedCompany(company); setShowRevokeDialog(true); };
  const handleResetPassword = (company: Company) => { setSelectedCompany(company); setShowResetPasswordDialog(true); };
  const handleManageSubscription = (company: Company) => { setSelectedCompany(company); setShowSubscriptionDialog(true); };
  const handleDeleteCompany = (company: Company) => { setSelectedCompany(company); setShowDeleteDialog(true); };

  const confirmEdit = (companyId: string, data: { name: string; email: string; phone?: string }) => {
    setProcessingId(companyId);
    editCompanyMutation.mutate(
      { companyId, data },
      { onSettled: () => { setProcessingId(null); setShowEditDialog(false); setSelectedCompany(null); } }
    );
  };

  const confirmRevoke = () => {
    if (!selectedCompany) return;
    setProcessingId(selectedCompany.id);
    revokeCompanyMutation.mutate(selectedCompany.id, {
      onSettled: () => { setProcessingId(null); setShowRevokeDialog(false); setSelectedCompany(null); }
    });
  };

  const confirmResetPassword = (userId: string, password: string, email: string, name: string) => {
    if (!selectedCompany) return;
    setProcessingId(selectedCompany.id);
    resetPasswordMutation.mutate(
      { targetUserId: userId, newPassword: password, targetUserEmail: email, targetUserName: name },
      { onSettled: () => { setProcessingId(null); setShowResetPasswordDialog(false); setSelectedCompany(null); } }
    );
  };

  const confirmSubscription = (companyId: string, updates: SubscriptionUpdate) => {
    setProcessingId(companyId);
    manageSubscription.mutate(
      { companyId, updates },
      { onSettled: () => { setProcessingId(null); setShowSubscriptionDialog(false); setSelectedCompany(null); } }
    );
  };

  const confirmDelete = (companyId: string, confirmName: string) => {
    setProcessingId(companyId);
    deleteCompany.mutate(
      { companyId, confirmName },
      { onSuccess: () => { setShowDeleteDialog(false); setSelectedCompany(null); }, onSettled: () => setProcessingId(null) }
    );
  };

  if (isLoading) return <SuperAdminLoading />;

  const activeCompanies = companies.filter(c => c.status === 'active');

  const renderCompanies = () => (
    isMobile ? (
      <Tabs value={mobileCompanyTab} onValueChange={setMobileCompanyTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-4">
          <TabsTrigger value="companies">Companies ({activeCompanies.length})</TabsTrigger>
          <TabsTrigger value="requests">Requests ({pendingCount})</TabsTrigger>
        </TabsList>
        <TabsContent value="companies" className="space-y-3 mt-0">
          {companies.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">No companies yet</div>
          ) : companies.map((company) => (
            <MobileCompanyCard key={company.id} company={company} onEdit={handleEditCompany}
              onRevoke={handleRevokeCompany} onResetPassword={handleResetPassword}
              isProcessing={processingId === company.id} />
          ))}
        </TabsContent>
        <TabsContent value="requests" className="space-y-3 mt-0">
          {requests.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">No pending requests</div>
          ) : requests.map((request) => (
            <MobileRequestCard key={request.id} request={request} onApprove={handleApprove}
              onReject={handleReject} isProcessing={processingId === request.id} />
          ))}
        </TabsContent>
      </Tabs>
    ) : (
      <CompanyManagementTable
        companies={companies}
        requests={requests}
        onApproveRequest={handleApprove}
        onRejectRequest={handleReject}
        onEditCompany={handleEditCompany}
        onRevokeCompany={handleRevokeCompany}
        onResetPassword={handleResetPassword}
        onManageSubscription={handleManageSubscription}
        onDeleteCompany={handleDeleteCompany}
        usageMap={usageMap}
        isProcessing={processingId}
      />
    )
  );

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <SuperAdminNavigation />

      <div className="p-4 md:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto space-y-5">
          {/* Hero */}
          <div className="relative rounded-2xl bg-gradient-to-br from-orange-600 via-orange-500 to-amber-500 shadow-lg p-5 sm:p-6 overflow-hidden flex items-center justify-between gap-4 flex-wrap">
            <div className="absolute -top-20 -right-10 w-64 h-64 bg-white/10 rounded-full blur-3xl pointer-events-none" />
            <div className="relative z-10 flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-white/15"><Crown className="h-6 w-6 text-white" /></div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-white">Super Admin Console</h1>
                <p className="text-white/80 text-sm">Manage companies, memberships & platform members</p>
              </div>
            </div>
            <div className="relative z-10"><CreateTrialCompanyDialog /></div>
          </div>

          {/* Section nav */}
          <Tabs value={section} onValueChange={setSection} className="w-full">
            <TabsList className="bg-white border border-slate-200/70 shadow-sm rounded-xl p-1 h-auto flex flex-wrap gap-1">
              <TabsTrigger value="overview" className="data-[state=active]:bg-orange-50 data-[state=active]:text-orange-700 rounded-lg gap-1.5">
                <LayoutDashboard className="h-4 w-4" /> Overview
              </TabsTrigger>
              <TabsTrigger value="companies" className="data-[state=active]:bg-orange-50 data-[state=active]:text-orange-700 rounded-lg gap-1.5">
                <Building2 className="h-4 w-4" /> Companies
              </TabsTrigger>
              <TabsTrigger value="members" className="data-[state=active]:bg-orange-50 data-[state=active]:text-orange-700 rounded-lg gap-1.5">
                <Users className="h-4 w-4" /> Members
              </TabsTrigger>
              <TabsTrigger value="requests" className="data-[state=active]:bg-orange-50 data-[state=active]:text-orange-700 rounded-lg gap-1.5">
                <Inbox className="h-4 w-4" /> Requests
                {pendingCount > 0 && (
                  <span className="ml-1 inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold">{pendingCount}</span>
                )}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="mt-5">
              <OverviewSection companies={companies} pendingCount={pendingCount} />
            </TabsContent>

            <TabsContent value="companies" className="mt-5">
              {renderCompanies()}
            </TabsContent>

            <TabsContent value="members" className="mt-5">
              <PlatformUsersSection />
            </TabsContent>

            <TabsContent value="requests" className="mt-5">
              {isMobile ? (
                <div className="space-y-3">
                  {requests.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">No pending requests</div>
                  ) : requests.map((request) => (
                    <MobileRequestCard key={request.id} request={request} onApprove={handleApprove}
                      onReject={handleReject} isProcessing={processingId === request.id} />
                  ))}
                </div>
              ) : (
                <CompanyRequestTable
                  requests={requests}
                  onApproveRequest={handleApprove}
                  onRejectRequest={handleReject}
                  isProcessing={processingId}
                />
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Dialogs */}
      <LicenseApprovalDialog open={showApprovalDialog} onOpenChange={setShowApprovalDialog} onConfirm={confirmApproval}
        request={selectedRequest} isProcessing={processingId === selectedRequest?.id} />
      <RejectionConfirmationDialog open={showRejectionDialog} onOpenChange={setShowRejectionDialog} onConfirm={confirmRejection}
        request={selectedRequest} isProcessing={processingId === selectedRequest?.id} />
      <EditCompanyDialog open={showEditDialog} onOpenChange={setShowEditDialog} company={selectedCompany}
        onConfirm={confirmEdit} isProcessing={processingId === selectedCompany?.id} />
      <RevokeCompanyDialog open={showRevokeDialog} onOpenChange={setShowRevokeDialog} company={selectedCompany}
        onConfirm={confirmRevoke} isProcessing={processingId === selectedCompany?.id} />
      <ResetAdminPasswordDialog open={showResetPasswordDialog} onOpenChange={setShowResetPasswordDialog} company={selectedCompany}
        onConfirm={confirmResetPassword} isProcessing={processingId === selectedCompany?.id} />
      <ManageSubscriptionDialog open={showSubscriptionDialog} onOpenChange={setShowSubscriptionDialog} company={selectedCompany}
        onConfirm={confirmSubscription} isProcessing={processingId === selectedCompany?.id} />
      <DeleteCompanyDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        company={selectedCompany ? { id: selectedCompany.id, name: selectedCompany.name, member_count: usageMap[selectedCompany.id]?.member_count } : null}
        onConfirm={confirmDelete}
        isProcessing={processingId === selectedCompany?.id}
      />
    </div>
  );
};

export default SuperAdminDashboard;
