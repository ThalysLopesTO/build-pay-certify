
import React, { useState, useMemo } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useInvoices } from '@/hooks/useInvoices';
import { useJobsites } from '@/hooks/useJobsites';
import { Invoice } from './types/invoice';
import { format } from 'date-fns';
import { Search, Filter, Upload, Mail, Eye, FileText, Download, Calendar, Building, DollarSign, FileSpreadsheet, SlidersHorizontal, Bell, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { InvoiceEmailSender } from './InvoiceEmailSender';

const InvoiceTracker = () => {
  const navigate = useNavigate();
  const { invoices, isLoading, updateInvoiceStatus } = useInvoices();
  const { data: jobsites } = useJobsites();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [jobsiteFilter, setJobsiteFilter] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [emailInvoice, setEmailInvoice] = useState<Invoice | null>(null);
  const [isEmailDialogOpen, setIsEmailDialogOpen] = useState(false);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200 hover:bg-yellow-200';
      case 'paid': return 'bg-green-100 text-green-800 border-green-200 hover:bg-green-200';
      case 'expired': return 'bg-red-100 text-red-800 border-red-200 hover:bg-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200 hover:bg-gray-200';
    }
  };

  const isOverdue = (dueDate: string, status: string) => {
    return status === 'pending' && new Date(dueDate) < new Date();
  };

  const filteredInvoices = useMemo(() => {
    return invoices.filter(invoice => {
      const matchesSearch = searchTerm === '' || 
        invoice.invoice_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        invoice.client_company.toLowerCase().includes(searchTerm.toLowerCase()) ||
        invoice.title.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === 'all' || invoice.status === statusFilter;
      const matchesJobsite = jobsiteFilter === 'all' || invoice.jobsite_id === jobsiteFilter;
      
      const invoiceDate = new Date(invoice.due_date);
      const matchesDateFrom = !dateFrom || invoiceDate >= new Date(dateFrom);
      const matchesDateTo = !dateTo || invoiceDate <= new Date(dateTo);
      
      return matchesSearch && matchesStatus && matchesJobsite && matchesDateFrom && matchesDateTo;
    });
  }, [invoices, searchTerm, statusFilter, jobsiteFilter, dateFrom, dateTo]);

  // Summary statistics
  const summaryStats = useMemo(() => {
    const total = filteredInvoices.reduce((sum, inv) => sum + inv.total_amount, 0);
    const paid = filteredInvoices.filter(inv => inv.status === 'paid').reduce((sum, inv) => sum + inv.total_amount, 0);
    const pending = filteredInvoices.filter(inv => inv.status === 'pending').reduce((sum, inv) => sum + inv.total_amount, 0);
    const overdue = filteredInvoices.filter(inv => isOverdue(inv.due_date, inv.status)).reduce((sum, inv) => sum + inv.total_amount, 0);
    
    return { total, paid, pending, overdue };
  }, [filteredInvoices]);

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

  const handleViewInvoice = (invoiceId: string) => {
    navigate(`/invoices/${invoiceId}/preview`);
  };

  const handleViewDetails = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
  };

  const handleSendEmail = (invoice: Invoice) => {
    setEmailInvoice(invoice);
    setIsEmailDialogOpen(true);
  };

  const handleCloseEmailDialog = () => {
    setIsEmailDialogOpen(false);
    setEmailInvoice(null);
  };

  const exportToCSV = () => {
    const headers = ['Invoice Number', 'Client Company', 'Title', 'Amount', 'Status', 'Due Date', 'Sent Date'];
    
    const csvData = filteredInvoices.map(invoice => [
      invoice.invoice_number,
      invoice.client_company,
      invoice.title,
      invoice.total_amount.toFixed(2),
      invoice.status,
      format(new Date(invoice.due_date), 'yyyy-MM-dd'),
      invoice.sent_date ? format(new Date(invoice.sent_date), 'yyyy-MM-dd') : 'Not sent'
    ]);

    const csvContent = [headers, ...csvData]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `invoices-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setJobsiteFilter('all');
    setDateFrom('');
    setDateTo('');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading invoices...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <FileText className="h-5 w-5 text-primary" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Invoices</p>
                <p className="text-2xl font-bold">{filteredInvoices.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <DollarSign className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Paid</p>
                <p className="text-2xl font-bold text-green-600">${summaryStats.paid.toFixed(0)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Clock className="h-5 w-5 text-yellow-600" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Pending</p>
                <p className="text-2xl font-bold text-yellow-600">${summaryStats.pending.toFixed(0)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Bell className="h-5 w-5 text-red-600" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Overdue</p>
                <p className="text-2xl font-bold text-red-600">${summaryStats.overdue.toFixed(0)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Actions */}
      <Card className="shadow-sm">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <SlidersHorizontal className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg">Invoice Tracker</CardTitle>
            </div>
            <div className="flex items-center space-x-2">
              <Button onClick={exportToCSV} variant="outline" size="sm">
                <FileSpreadsheet className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
              <Button onClick={clearFilters} variant="outline" size="sm">
                Clear Filters
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Advanced Filters */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search invoices..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="expired">Expired</SelectItem>
              </SelectContent>
            </Select>

            <Select value={jobsiteFilter} onValueChange={setJobsiteFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Jobsites" />
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

            <div className="flex items-center space-x-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <Input
                type="date"
                placeholder="From date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
              />
            </div>

            <div className="flex items-center space-x-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <Input
                type="date"
                placeholder="To date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
              />
            </div>
          </div>

          {/* Invoice Table */}
          <div className="border rounded-lg bg-background overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="font-semibold">Invoice #</TableHead>
                  <TableHead className="font-semibold">Client</TableHead>
                  <TableHead className="font-semibold">Jobsite</TableHead>
                  <TableHead className="font-semibold">Amount</TableHead>
                  <TableHead className="font-semibold">Due Date</TableHead>
                  <TableHead className="font-semibold">Status</TableHead>
                  <TableHead className="font-semibold">Sent Date</TableHead>
                  <TableHead className="font-semibold">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredInvoices.map((invoice, index) => (
                  <TableRow 
                    key={invoice.id} 
                    className={`
                      ${index % 2 === 0 ? 'bg-background' : 'bg-muted/20'}
                      ${isOverdue(invoice.due_date, invoice.status) ? 'bg-red-50 border-l-4 border-l-red-500' : ''}
                      hover:bg-muted/40 transition-colors
                    `}
                  >
                    <TableCell className="font-medium">
                      <div className="flex items-center space-x-2">
                        <span>{invoice.invoice_number}</span>
                        {isOverdue(invoice.due_date, invoice.status) && (
                          <Badge variant="destructive" className="text-xs">OVERDUE</Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{invoice.client_company}</div>
                        <div className="text-sm text-muted-foreground">{invoice.title}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-1">
                        <Building className="h-4 w-4 text-muted-foreground" />
                        <span>{invoice.jobsites?.name || 'No jobsite'}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="font-mono font-semibold">${invoice.total_amount.toFixed(2)}</span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-1">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span>{format(new Date(invoice.due_date), 'MMM dd, yyyy')}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(invoice.status)}>
                        {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-1">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span>{format(new Date(invoice.sent_date), 'MMM dd, yyyy')}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-1">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleViewDetails(invoice)}
                              title="View Details"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl">
                            <DialogHeader>
                              <DialogTitle>Invoice Details</DialogTitle>
                              <DialogDescription>
                                Complete information for invoice {invoice.invoice_number}
                              </DialogDescription>
                            </DialogHeader>
                            {selectedInvoice && (
                              <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <label className="text-sm font-medium">Client Company</label>
                                    <p className="text-sm text-muted-foreground">{selectedInvoice.client_company}</p>
                                  </div>
                                  <div>
                                    <label className="text-sm font-medium">Email</label>
                                    <p className="text-sm text-muted-foreground">{selectedInvoice.client_email}</p>
                                  </div>
                                  <div>
                                    <label className="text-sm font-medium">Amount</label>
                                    <p className="text-sm font-semibold">${selectedInvoice.total_amount.toFixed(2)}</p>
                                  </div>
                                  <div>
                                    <label className="text-sm font-medium">Status</label>
                                    <Badge className={getStatusColor(selectedInvoice.status)}>
                                      {selectedInvoice.status.charAt(0).toUpperCase() + selectedInvoice.status.slice(1)}
                                    </Badge>
                                  </div>
                                </div>
                                {selectedInvoice.notes && (
                                  <div>
                                    <label className="text-sm font-medium">Notes</label>
                                    <p className="text-sm text-muted-foreground">{selectedInvoice.notes}</p>
                                  </div>
                                )}
                              </div>
                            )}
                          </DialogContent>
                        </Dialog>
                        
                        <Select
                          value={invoice.status}
                          onValueChange={(value: 'pending' | 'paid' | 'expired') =>
                            handleStatusUpdate(invoice.id, value)
                          }
                        >
                          <SelectTrigger className="w-20 h-8">
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
                            title="Upload Receipt"
                          >
                            <Upload className="h-4 w-4" />
                          </Button>
                        )}
                        
                        <Button 
                          size="sm" 
                          variant="outline" 
                          onClick={() => handleSendEmail(invoice)}
                          title="Send Email"
                        >
                          <Mail className="h-4 w-4" />
                        </Button>

                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleViewInvoice(invoice.id)}
                          title="View Full Invoice"
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {filteredInvoices.length === 0 && (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">No invoices found</h3>
              <p className="text-muted-foreground">
                {searchTerm || statusFilter !== 'all' || jobsiteFilter !== 'all' || dateFrom || dateTo
                  ? 'Try adjusting your filters to see more results.'
                  : 'Create your first invoice to get started.'
                }
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Invoice Email Dialog */}
      {emailInvoice && (
        <InvoiceEmailSender
          invoice={emailInvoice}
          isOpen={isEmailDialogOpen}
          onClose={handleCloseEmailDialog}
        />
      )}
    </div>
  );
};

export default InvoiceTracker;
