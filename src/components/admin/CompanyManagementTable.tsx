
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Search, Building, Edit, Trash2, CheckCircle, XCircle } from 'lucide-react';
import { format } from 'date-fns';
import CompanyStatusBadge from './CompanyStatusBadge';

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
  isProcessing: string | null;
}

const CompanyManagementTable: React.FC<CompanyManagementTableProps> = ({
  companies,
  requests,
  onApproveRequest,
  onRejectRequest,
  onEditCompany,
  onRevokeCompany,
  isProcessing
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortOrder, setSortOrder] = useState('newest');

  // Combine requests and companies for unified display
  const allItems = [
    // Map registration requests
    ...requests.map(request => ({
      id: request.id,
      name: request.company_name,
      status: request.status,
      registration_date: null,
      expiration_date: null,
      created_at: request.created_at,
      is_expired: false,
      days_until_expiry: null,
      admin_email: request.admin_email,
      admin_phone: request.company_phone,
      type: 'request' as const,
      original: request
    })),
    // Map existing companies
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
    <div className="space-y-6">
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
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
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
                  <TableHead>Admin Email</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Registration Date</TableHead>
                  <TableHead>Expiration Date</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredItems.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-slate-500">
                      No companies found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredItems.map((item) => (
                    <TableRow key={item.id} className={item.is_expired ? 'bg-red-50' : ''}>
                      <TableCell className="font-medium">{item.name}</TableCell>
                      <TableCell>{item.admin_email || '--'}</TableCell>
                      <TableCell>{item.admin_phone || '--'}</TableCell>
                      <TableCell>
                        <CompanyStatusBadge 
                          status={item.status} 
                          isExpired={item.is_expired}
                          daysUntilExpiry={item.days_until_expiry}
                        />
                      </TableCell>
                      <TableCell>
                        {item.registration_date ? format(new Date(item.registration_date), 'MMM dd, yyyy') : '--'}
                      </TableCell>
                      <TableCell>
                        {item.expiration_date ? format(new Date(item.expiration_date), 'MMM dd, yyyy') : '--'}
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          {item.type === 'request' && item.status === 'pending' && (
                            <>
                              <Button
                                size="sm"
                                onClick={() => onApproveRequest(item.original as RegistrationRequest)}
                                disabled={isProcessing === item.id}
                                className="bg-green-600 hover:bg-green-700"
                              >
                                <CheckCircle className="h-3 w-3 mr-1" />
                                {isProcessing === item.id ? 'Processing...' : 'Approve'}
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => onRejectRequest(item.original as RegistrationRequest)}
                                disabled={isProcessing === item.id}
                              >
                                <XCircle className="h-3 w-3 mr-1" />
                                Reject
                              </Button>
                            </>
                          )}
                          {item.type === 'company' && item.status === 'active' && (
                            <>
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
