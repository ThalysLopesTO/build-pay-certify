
import React, { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useInvoices } from '@/hooks/useInvoices';
import { useJobsites } from '@/hooks/useJobsites';
import { Invoice } from './types/invoice';
import { format } from 'date-fns';
import { Search, Filter, Upload, Mail } from 'lucide-react';

const InvoiceTracker = () => {
  const { invoices, isLoading, updateInvoiceStatus } = useInvoices();
  const { data: jobsites } = useJobsites();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [jobsiteFilter, setJobsiteFilter] = useState('all');

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'paid': return 'bg-green-100 text-green-800';
      case 'expired': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const isOverdue = (dueDate: string, status: string) => {
    return status === 'pending' && new Date(dueDate) < new Date();
  };

  const filteredInvoices = invoices.filter(invoice => {
    const matchesSearch = searchTerm === '' || 
      invoice.invoice_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.client_company.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.title.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || invoice.status === statusFilter;
    const matchesJobsite = jobsiteFilter === 'all' || invoice.jobsite_id === jobsiteFilter;
    
    return matchesSearch && matchesStatus && matchesJobsite;
  });

  const handleStatusUpdate = (invoiceId: string, newStatus: 'pending' | 'paid' | 'expired') => {
    updateInvoiceStatus({ id: invoiceId, status: newStatus });
  };

  const handleReceiptUpload = (invoiceId: string) => {
    // This would typically open a file upload dialog
    // For now, we'll just mark as paid with a placeholder receipt URL
    updateInvoiceStatus({ 
      id: invoiceId, 
      status: 'paid',
      receipt_file_url: 'receipt-placeholder-url'
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600 mx-auto mb-4"></div>
          <p>Loading invoices...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Invoice Tracker</CardTitle>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search invoices..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="expired">Expired</SelectItem>
              </SelectContent>
            </Select>

            <Select value={jobsiteFilter} onValueChange={setJobsiteFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by jobsite" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Jobsites</SelectItem>
                {jobsites?.map((jobsite) => (
                  <SelectItem key={jobsite.id} value={jobsite.id}>
                    {jobsite.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Invoice Table */}
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice #</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Jobsite</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Sent Date</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredInvoices.map((invoice) => (
                  <TableRow key={invoice.id} className={isOverdue(invoice.due_date, invoice.status) ? 'bg-red-50' : ''}>
                    <TableCell className="font-medium">
                      {invoice.invoice_number}
                      {isOverdue(invoice.due_date, invoice.status) && (
                        <Badge variant="destructive" className="ml-2 text-xs">OVERDUE</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{invoice.client_company}</div>
                        <div className="text-sm text-gray-500">{invoice.title}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {invoice.jobsites?.name || 'No jobsite'}
                    </TableCell>
                    <TableCell>${invoice.total_amount.toFixed(2)}</TableCell>
                    <TableCell>
                      {format(new Date(invoice.due_date), 'MMM dd, yyyy')}
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(invoice.status)}>
                        {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {format(new Date(invoice.sent_date), 'MMM dd, yyyy')}
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Select
                          value={invoice.status}
                          onValueChange={(value: 'pending' | 'paid' | 'expired') =>
                            handleStatusUpdate(invoice.id, value)
                          }
                        >
                          <SelectTrigger className="w-24">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="paid">Paid</SelectItem>
                            <SelectItem value="expired">Expired</SelectItem>
                          </SelectContent>
                        </Select>
                        
                        {invoice.status === 'pending' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleReceiptUpload(invoice.id)}
                          >
                            <Upload className="h-4 w-4" />
                          </Button>
                        )}
                        
                        <Button size="sm" variant="outline">
                          <Mail className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {filteredInvoices.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No invoices found matching your filters.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default InvoiceTracker;
