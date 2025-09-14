
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
import { useCompanySettings } from '@/hooks/useCompanySettings';
import { useCompanyLogo } from '@/hooks/useCompanyLogo';
import { generateBrandedInvoicePDF } from './BrandedInvoicePDF';
import { useToast } from '@/hooks/use-toast';
import { Invoice } from './types/invoice';
import { format } from 'date-fns';
import { Search, Filter, Upload, Mail, Eye, FileText, Download, Calendar, Building, DollarSign, FileSpreadsheet, SlidersHorizontal, Bell, Clock, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { InvoiceEmailSender } from './InvoiceEmailSender';
import { InvoiceDeleteConfirmDialog } from './InvoiceDeleteConfirmDialog';
import { MonthlyInvoiceAnalytics } from './invoices/MonthlyInvoiceAnalytics';

const InvoiceTracker = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { invoices, isLoading, updateInvoiceStatus, deleteInvoice, isDeleting } = useInvoices();
  const { data: jobsites } = useJobsites();
  const { settings: companySettings } = useCompanySettings();
  const { logoUrl } = useCompanyLogo();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [jobsiteFilter, setJobsiteFilter] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [emailInvoice, setEmailInvoice] = useState<Invoice | null>(null);
  const [isEmailDialogOpen, setIsEmailDialogOpen] = useState(false);
  const [invoiceToDelete, setInvoiceToDelete] = useState<Invoice | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const getStatusBadgeClass = (status: string, isOverdue: boolean = false) => {
    if (isOverdue) return 'invoice-status-overdue';
    switch (status) {
      case 'pending': return 'invoice-status-pending';
      case 'paid': return 'invoice-status-paid';
      case 'expired': return 'invoice-status-overdue';
      default: return 'bg-muted text-muted-foreground border-border';
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

  const handleDownloadPDF = async (invoice: Invoice) => {
    try {
      if (!companySettings) {
        toast({
          title: "Error",
          description: "Company settings not loaded. Please try again.",
          variant: "destructive",
        });
        return;
      }

      await generateBrandedInvoicePDF(invoice, companySettings, logoUrl);
      
      toast({
        title: "Success",
        description: "Invoice PDF downloaded successfully",
      });
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast({
        title: "Error",
        description: "Failed to generate PDF. Please try again.",
        variant: "destructive",
      });
    }
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

  const handleDeleteInvoice = (invoice: Invoice) => {
    setInvoiceToDelete(invoice);
    setIsDeleteDialogOpen(true);
  };

  const confirmDeleteInvoice = () => {
    if (invoiceToDelete) {
      deleteInvoice(invoiceToDelete.id);
      setIsDeleteDialogOpen(false);
      setInvoiceToDelete(null);
    }
  };

  const canDeleteInvoices = user?.role && ['admin', 'super_admin', 'management'].includes(user.role);

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
      {/* Enhanced Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="invoice-summary-card rounded-xl border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Total Invoices</p>
                <p className="text-3xl font-bold text-foreground">{filteredInvoices.length}</p>
              </div>
              <div className="p-3 rounded-full bg-primary/10">
                <FileText className="h-6 w-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="invoice-summary-card rounded-xl border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Total Paid</p>
                <p className="text-3xl font-bold text-emerald-600">${summaryStats.paid.toLocaleString('en-US', { maximumFractionDigits: 0 })}</p>
              </div>
              <div className="p-3 rounded-full bg-emerald-100">
                <DollarSign className="h-6 w-6 text-emerald-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="invoice-summary-card rounded-xl border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Pending</p>
                <p className="text-3xl font-bold text-amber-600">${summaryStats.pending.toLocaleString('en-US', { maximumFractionDigits: 0 })}</p>
              </div>
              <div className="p-3 rounded-full bg-amber-100">
                <Clock className="h-6 w-6 text-amber-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="invoice-summary-card rounded-xl border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Overdue</p>
                <p className="text-3xl font-bold text-red-600">${summaryStats.overdue.toLocaleString('en-US', { maximumFractionDigits: 0 })}</p>
              </div>
              <div className="p-3 rounded-full bg-red-100">
                <Bell className="h-6 w-6 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Monthly Invoice Analytics */}
      <MonthlyInvoiceAnalytics 
        invoices={filteredInvoices}
        statusFilter={statusFilter}
        dateFrom={dateFrom}
        dateTo={dateTo}
      />

      {/* Enhanced Filters and Actions */}
      <Card className="invoice-filter-toolbar rounded-xl border-0">
        <CardHeader className="pb-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <SlidersHorizontal className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-xl font-semibold">Invoice Management</CardTitle>
                <p className="text-sm text-muted-foreground mt-1">Track, filter, and manage all your invoices</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Button onClick={exportToCSV} variant="outline" size="sm" className="invoice-action-button">
                <FileSpreadsheet className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
              <Button onClick={clearFilters} variant="outline" size="sm" className="invoice-action-button">
                Clear Filters
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Professional Filter Bar */}
          <div className="bg-gradient-to-r from-muted/30 to-muted/10 rounded-lg p-6 mb-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search invoices..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 border-border/50 bg-background/60 backdrop-blur-sm"
                />
              </div>
              
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="border-border/50 bg-background/60 backdrop-blur-sm">
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
                <SelectTrigger className="border-border/50 bg-background/60 backdrop-blur-sm">
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
                  className="border-border/50 bg-background/60 backdrop-blur-sm"
                />
              </div>

              <div className="flex items-center space-x-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <Input
                  type="date"
                  placeholder="To date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="border-border/50 bg-background/60 backdrop-blur-sm"
                />
              </div>
            </div>
          </div>

          {/* Professional Invoice Table */}
          <div className="rounded-xl border border-border/50 bg-card overflow-hidden shadow-lg">
            <Table>
              <TableHeader>
                <TableRow className="bg-gradient-to-r from-muted/60 to-muted/40 border-border/50">
                  <TableHead className="font-semibold text-foreground py-4">Invoice #</TableHead>
                  <TableHead className="font-semibold text-foreground py-4">Client</TableHead>
                  <TableHead className="font-semibold text-foreground py-4">Jobsite</TableHead>
                  <TableHead className="font-semibold text-foreground py-4">Amount</TableHead>
                  <TableHead className="font-semibold text-foreground py-4">Due Date</TableHead>
                  <TableHead className="font-semibold text-foreground py-4">Status</TableHead>
                  <TableHead className="font-semibold text-foreground py-4">Sent Date</TableHead>
                  <TableHead className="font-semibold text-foreground py-4">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredInvoices.map((invoice, index) => (
                  <TableRow 
                    key={invoice.id} 
                    className={`
                      invoice-table-row
                      ${isOverdue(invoice.due_date, invoice.status) ? 'bg-red-50/50 border-l-4 border-l-red-500' : ''}
                    `}
                  >
                    <TableCell className="py-4">
                      <div className="flex items-center space-x-3">
                        <span className="font-semibold text-base">{invoice.invoice_number}</span>
                        {isOverdue(invoice.due_date, invoice.status) && (
                          <Badge className="invoice-status-overdue text-xs font-medium px-2 py-1">OVERDUE</Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="py-4">
                      <div className="space-y-1">
                        <div className="font-semibold text-foreground">{invoice.client_company}</div>
                        <div className="text-sm text-muted-foreground">{invoice.title}</div>
                      </div>
                    </TableCell>
                    <TableCell className="py-4">
                      <div className="flex items-center space-x-2">
                        <div className="p-1 rounded-md bg-muted/50">
                          <Building className="h-3 w-3 text-muted-foreground" />
                        </div>
                        <span className="text-sm">{invoice.jobsites?.name || 'No jobsite'}</span>
                      </div>
                    </TableCell>
                    <TableCell className="py-4">
                      <span className="font-mono font-bold text-lg text-foreground">${invoice.total_amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                    </TableCell>
                    <TableCell className="py-4">
                      <div className="flex items-center space-x-2">
                        <div className="p-1 rounded-md bg-muted/50">
                          <Calendar className="h-3 w-3 text-muted-foreground" />
                        </div>
                        <span className="text-sm font-medium">{format(new Date(invoice.due_date), 'MMM dd, yyyy')}</span>
                      </div>
                    </TableCell>
                    <TableCell className="py-4">
                      <Badge className={`${getStatusBadgeClass(invoice.status, isOverdue(invoice.due_date, invoice.status))} px-3 py-1`}>
                        {isOverdue(invoice.due_date, invoice.status) ? 'OVERDUE' : invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                      </Badge>
                    </TableCell>
                    <TableCell className="py-4">
                      <div className="flex items-center space-x-2">
                        <div className="p-1 rounded-md bg-muted/50">
                          <Calendar className="h-3 w-3 text-muted-foreground" />
                        </div>
                        <span className="text-sm font-medium">{format(new Date(invoice.sent_date), 'MMM dd, yyyy')}</span>
                      </div>
                    </TableCell>
                    <TableCell className="py-4">
                      <div className="flex items-center space-x-2">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleViewDetails(invoice)}
                              title="View Details"
                              className="invoice-action-button h-8 w-8 p-0"
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
                                     <Badge className={getStatusBadgeClass(selectedInvoice.status, isOverdue(selectedInvoice.due_date, selectedInvoice.status))}>
                                       {isOverdue(selectedInvoice.due_date, selectedInvoice.status) ? 'OVERDUE' : selectedInvoice.status.charAt(0).toUpperCase() + selectedInvoice.status.slice(1)}
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
                          <SelectTrigger className="w-24 h-8 border-border/50 bg-background/80">
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
                            className="invoice-action-button h-8 w-8 p-0"
                          >
                            <Upload className="h-4 w-4" />
                          </Button>
                        )}
                        
                        <Button 
                          size="sm" 
                          variant="default" 
                          onClick={() => handleSendEmail(invoice)}
                          title="Send Email"
                          className="h-8 w-8 p-0 bg-primary hover:bg-primary/90"
                        >
                          <Mail className="h-4 w-4" />
                        </Button>

                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDownloadPDF(invoice)}
                          title="Download PDF"
                          className="invoice-action-button h-8 w-8 p-0"
                        >
                          <Download className="h-4 w-4" />
                        </Button>

                        {canDeleteInvoices && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDeleteInvoice(invoice)}
                            title="Delete Invoice"
                            className="h-8 w-8 p-0 border-destructive/50 hover:bg-destructive hover:text-destructive-foreground"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {filteredInvoices.length === 0 && (
            <div className="text-center py-16">
              <div className="p-4 rounded-full bg-muted/20 w-20 h-20 mx-auto mb-6 flex items-center justify-center">
                <FileText className="h-10 w-10 text-muted-foreground" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-3">No invoices found</h3>
              <p className="text-muted-foreground max-w-md mx-auto">
                {searchTerm || statusFilter !== 'all' || jobsiteFilter !== 'all' || dateFrom || dateTo
                  ? 'Try adjusting your filters to see more results.'
                  : 'Create your first invoice to get started with tracking your billing.'
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

      {/* Invoice Delete Confirmation Dialog */}
      <InvoiceDeleteConfirmDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        onConfirm={confirmDeleteInvoice}
        invoice={invoiceToDelete}
        isDeleting={isDeleting}
      />
    </div>
  );
};

export default InvoiceTracker;
