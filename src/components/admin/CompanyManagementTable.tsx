
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Search, Building } from 'lucide-react';
import { format, formatDistanceToNowStrict } from 'date-fns';
import { SubscriptionStatusBadge } from './super-admin/SubscriptionStatusBadge';
import { CompanyActionsMenu } from './super-admin/CompanyActionsMenu';
import { CompanyUsage } from '@/hooks/super-admin/useCompanyUsage';

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

interface RegistrationRequest {
  id: string;
  company_name: string;
  company_email: string;
  company_phone: string | null;
  admin_first_name: string;
  admin_last_name: string;
  admin_email: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
}

interface CompanyManagementTableProps {
  companies: Company[];
  requests: RegistrationRequest[];
  onApproveRequest: (request: RegistrationRequest) => void;
  onRejectRequest: (request: RegistrationRequest) => void;
  onEditCompany: (company: Company) => void;
  onRevokeCompany: (company: Company) => void;
  onResetPassword: (company: Company) => void;
  onManageSubscription?: (company: Company) => void;
  onDeleteCompany?: (company: Company) => void;
  usageMap?: Record<string, CompanyUsage>;
  isProcessing: string | null;
}

const LastActiveCell: React.FC<{ usage?: CompanyUsage }> = ({ usage }) => {
  if (!usage) return <span className="text-muted-foreground text-sm">—</span>;
  if (!usage.last_login) return <span className="text-red-600 text-sm font-semibold">Never</span>;
  const d = new Date(usage.last_login);
  const days = Math.floor((Date.now() - d.getTime()) / 86_400_000);
  const cls = days > 90 ? 'text-red-600' : days > 30 ? 'text-amber-600' : 'text-emerald-600';
  return (
    <span className={`text-sm font-medium ${cls}`} title={format(d, 'PPpp')}>
      {formatDistanceToNowStrict(d, { addSuffix: true })}
    </span>
  );
};

const CompanyManagementTable: React.FC<CompanyManagementTableProps> = ({
  companies,
  onEditCompany,
  onRevokeCompany,
  onResetPassword,
  onManageSubscription,
  onDeleteCompany,
  usageMap,
  isProcessing
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortOrder, setSortOrder] = useState('newest');

  // Combine requests and companies for unified display
  const allItems = [
    ...companies.map(company => ({
      ...company,
      type: 'company' as const,
      original: company
    }))
  ];

  const filteredItems = allItems.filter(item => {
    const matchesSearch = 
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.admin_email && item.admin_email.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  }).sort((a, b) => {
    const dateA = new Date(a.created_at).getTime();
    const dateB = new Date(b.created_at).getTime();
    return sortOrder === 'newest' ? dateB - dateA : dateA - dateB;
  });

  return (
    <div className="space-y-6 hidden md:block">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
          <Input
            placeholder="Search by company name or admin email..."
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
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="revoked">Revoked</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
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

      {/* Table */}
      <Card className="shadow-md border-border">
        <CardHeader className="bg-muted/30 border-b">
          <CardTitle className="flex items-center text-foreground">
            <Building className="h-5 w-5 mr-2 text-primary" />
            Active Companies
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            Manage company registrations, licenses, and access
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/20 hover:bg-muted/20">
                  <TableHead className="font-semibold">Company Name</TableHead>
                  <TableHead className="font-semibold">Subscription Status</TableHead>
                  <TableHead className="font-semibold">Plan</TableHead>
                  <TableHead className="font-semibold">Registration Date</TableHead>
                  <TableHead className="font-semibold">Last Active</TableHead>
                  <TableHead className="font-semibold">Next Billing / Expiry</TableHead>
                  <TableHead className="font-semibold text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredItems.length === 0 ? (
                  <TableRow className="hover:bg-transparent">
                    <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                      No companies found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredItems.map((item, idx) => (
                    <TableRow 
                      key={item.id} 
                      className={`transition-colors ${
                        item.is_expired ? 'bg-red-50/50 hover:bg-red-50' : 
                        idx % 2 === 0 ? 'bg-background hover:bg-muted/30' : 'bg-muted/10 hover:bg-muted/30'
                      }`}
                    >
                      <TableCell className="font-medium py-4">{item.name}</TableCell>
                      <TableCell className="py-4">
                        <SubscriptionStatusBadge
                          subscriptionStatus={item.subscription_status}
                          plan={item.plan}
                          trialDaysRemaining={item.trial_days_remaining}
                          subscriptionDaysRemaining={item.subscription_days_remaining}
                          isExpired={item.is_expired}
                          isSuperAdminCompany={item.created_by_super_admin}
                        />
                      </TableCell>
                      <TableCell className="py-4">
                        <span className="font-medium capitalize text-foreground">
                          {item.plan === 'start' ? 'Start' : 
                           item.plan === 'builder' ? 'Builder' : 
                           item.plan === 'builder_pro' ? 'Builder Pro' : 
                           item.plan === 'free' ? 'Free' : item.plan}
                        </span>
                      </TableCell>
                      <TableCell className="py-4 text-muted-foreground">
                        {item.registration_date ? format(new Date(item.registration_date), 'MMM dd, yyyy') : '--'}
                      </TableCell>
                      <TableCell className="py-4">
                        {item.type === 'company'
                          ? <LastActiveCell usage={usageMap?.[(item.original as Company).id]} />
                          : <span className="text-muted-foreground text-sm">—</span>}
                      </TableCell>
                      <TableCell className="py-4">
                        {item.trial_end_date && item.subscription_status === 'active' && item.trial_days_remaining && item.trial_days_remaining > 0 ? (
                          <span className="text-blue-700 font-medium">
                            Trial ends: {format(new Date(item.trial_end_date), 'MMM dd, yyyy')}
                          </span>
                        ) : item.expiration_date ? (
                          <span className="text-muted-foreground">
                            {format(new Date(item.expiration_date), 'MMM dd, yyyy')}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">--</span>
                        )}
                      </TableCell>
                      <TableCell className="py-4">
                        <div className="flex justify-end">
                          {item.type === 'company' && item.status === 'active' && (
                            <CompanyActionsMenu
                              company={item.original as Company}
                              onEdit={onEditCompany}
                              onRevoke={onRevokeCompany}
                              onResetPassword={onResetPassword}
                              onManageSubscription={onManageSubscription}
                              onDelete={onDeleteCompany}
                              isProcessing={isProcessing === item.id}
                            />
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CompanyManagementTable;
