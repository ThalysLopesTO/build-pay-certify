
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Search, Building, Edit, Trash2, Key } from 'lucide-react';
import { format } from 'date-fns';
import { SubscriptionStatusBadge } from './super-admin/SubscriptionStatusBadge';

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
  isProcessing: string | null;
}

const CompanyManagementTable: React.FC<CompanyManagementTableProps> = ({
  companies,
  onEditCompany,
  onRevokeCompany,
  onResetPassword,
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
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Building className="h-5 w-5 mr-2" />
            Company Management
          </CardTitle>
          <CardDescription>
            Manage company registrations, licenses, and access
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Company Name</TableHead>
                  <TableHead>Subscription Status</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead>Registration Date</TableHead>
                  <TableHead>Next Billing / Expiry</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredItems.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-slate-500">
                      No companies found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredItems.map((item) => (
                    <TableRow key={item.id} className={item.is_expired ? 'bg-red-50' : ''}>
                      <TableCell className="font-medium">{item.name}</TableCell>
                      <TableCell>
                        <SubscriptionStatusBadge
                          subscriptionStatus={item.subscription_status}
                          plan={item.plan}
                          trialDaysRemaining={item.trial_days_remaining}
                          subscriptionDaysRemaining={item.subscription_days_remaining}
                          isExpired={item.is_expired}
                          isSuperAdminCompany={item.created_by_super_admin}
                        />
                      </TableCell>
                      <TableCell>
                        <span className="font-medium capitalize">
                          {item.plan === 'start' ? 'Start' : 
                           item.plan === 'builder' ? 'Builder' : 
                           item.plan === 'builder_pro' ? 'Builder Pro' : 
                           item.plan === 'free' ? 'Free' : item.plan}
                        </span>
                      </TableCell>
                      <TableCell>
                        {item.registration_date ? format(new Date(item.registration_date), 'MMM dd, yyyy') : '--'}
                      </TableCell>
                      <TableCell>
                        {item.trial_end_date && item.subscription_status === 'trialing' ? (
                          <span className="text-blue-700">
                            Trial ends: {format(new Date(item.trial_end_date), 'MMM dd, yyyy')}
                          </span>
                        ) : item.expiration_date ? (
                          format(new Date(item.expiration_date), 'MMM dd, yyyy')
                        ) : (
                          '--'
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          {item.type === 'company' && item.status === 'active' && (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => onResetPassword(item.original as Company)}
                                disabled={isProcessing === item.id || !(item.original as Company).admin_user_id}
                                title="Reset Company Admin Password"
                              >
                                <Key className="h-3 w-3 mr-1" />
                                Reset Password
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => onEditCompany(item.original as Company)}
                                disabled={isProcessing === item.id}
                              >
                                <Edit className="h-3 w-3 mr-1" />
                                Edit
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => onRevokeCompany(item.original as Company)}
                                disabled={isProcessing === item.id}
                              >
                                <Trash2 className="h-3 w-3 mr-1" />
                                Revoke
                              </Button>
                            </>
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
