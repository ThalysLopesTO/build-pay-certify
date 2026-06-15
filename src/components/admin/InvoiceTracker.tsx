
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
import { Search, Filter, Upload, Mail, Eye, FileText, Download, Calendar, Building, DollarSign, FileSpreadsheet, SlidersHorizontal, Bell, Clock, Trash2, CheckCircle2, X, MoreHorizontal } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { InvoiceDetailsDialogContent } from './invoices/InvoiceDetailsDialogContent';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { InvoiceEmailSender } from './InvoiceEmailSender';
import { InvoiceDeleteConfirmDialog } from './InvoiceDeleteConfirmDialog';
import { MonthlyInvoiceAnalytics } from './invoices/MonthlyInvoiceAnalytics';
import { useIsMobile } from '@/hooks/use-mobile';
import InvoiceTrackerMobileCard from './invoices/InvoiceTrackerMobileCard';
import InvoiceTrackerMobileFilters from './invoices/InvoiceTrackerMobileFilters';

const InvoiceTracker = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { invoices, isLoading, updateInvoiceStatus, deleteInvoice, isDeleting } = useInvoices();
  const { data: jobsites } = useJobsites();
  const { settings: companySettings } = useCompanySettings();
  const { logoUrl } = useCompanyLogo();
  const { toast } = useToast();
  const isMobile = useIsMobile();
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

  // Bulk selection state
  const [selectedInvoiceIds, setSelectedInvoiceIds] = useState<Set<string>>(new Set());
  const [isBulkProcessing, setIsBulkProcessing] = useState(false);

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

  // ── Bulk helpers ────────────────────────────────────────────────────────────

  const allVisibleIds = filteredInvoices.map((inv) => inv.id);
  const allVisibleSelected =
    allVisibleIds.length > 0 && allVisibleIds.every((id) => selectedInvoiceIds.has(id));

  const toggleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedInvoiceIds(new Set(allVisibleIds));
    } else {
      setSelectedInvoiceIds(new Set());
    }
  };

  const toggleSelectInvoice = (id: string, checked: boolean) => {
    const next = new Set(selectedInvoiceIds);
    if (checked) next.add(id); else next.delete(id);
    setSelectedInvoiceIds(next);
  };

  const selectedInvoices = filteredInvoices.filter((inv) => selectedInvoiceIds.has(inv.id));

  const handleBulkMarkPaid = async () => {
    if (!user?.companyId || selectedInvoiceIds.size === 0) return;
    setIsBulkProcessing(true);
    const ids = Array.from(selectedInvoiceIds);
    const { error } = await supabase
      .from('invoices')
      .update({ status: 'paid' })
      .in('id', ids)
      .eq('company_id', user.companyId);
    setIsBulkProcessing(false);
    if (error) {
      toast({ title: 'Error', description: 'Failed to update invoices.', variant: 'destructive' });
    } else {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      toast({ title: `${ids.length} invoice${ids.length !== 1 ? 's' : ''} marked as paid` });
      setSelectedInvoiceIds(new Set());
    }
  };

  const handleBulkExportCSV = () => {
    if (selectedInvoices.length === 0) return;
    const headers = ['Invoice Number', 'Client Company', 'Title', 'Amount', 'Status', 'Due Date'];
    const rows = selectedInvoices.map((inv) => [
      inv.invoice_number,
      inv.client_company,
      inv.title,
      inv.total_amount.toFixed(2),
      inv.status,
      format(new Date(inv.due_date), 'yyyy-MM-dd'),
    ]);
    const csv = [headers, ...rows].map((r) => r.map((f) => `"${f}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `invoices-selected-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    document.body.appendChild(a); a.click();
    document.body.removeChild(a); URL.revokeObjectURL(url);
    toast({ title: `${selectedInvoices.length} invoice${selectedInvoices.length !== 1 ? 's' : ''} exported` });
  };

  const handleBulkDelete = async () => {
    if (!user?.companyId || selectedInvoiceIds.size === 0) return;
    if (!window.confirm(`Delete ${selectedInvoiceIds.size} invoice${selectedInvoiceIds.size !== 1 ? 's' : ''}? This cannot be undone.`)) return;
    setIsBulkProcessing(true);
    const ids = Array.from(selectedInvoiceIds);

    // Clear child references first so foreign-key constraints don't block the
    // delete (a quote can reference the invoice it was converted into; line
    // items / payments are owned children).
    await supabase.from('quotes').update({ invoice_id: null }).in('invoice_id', ids);
    await supabase.from('invoice_payments').delete().in('invoice_id', ids);
    await supabase.from('invoice_line_items').delete().in('invoice_id', ids);

    const { error } = await supabase
      .from('invoices')
      .delete()
      .in('id', ids)
      .eq('company_id', user.companyId);
    setIsBulkProcessing(false);
    if (error) {
      toast({ title: 'Error', description: 'Failed to delete invoices.', variant: 'destructive' });
    } else {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      toast({ title: `${ids.length} invoice${ids.length !== 1 ? 's' : ''} deleted` });
      setSelectedInvoiceIds(new Set());
    }
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
    <div className="space-y-4 md:space-y-6 overflow-x-hidden">
      {/* Enhanced Summary Cards */}
      <div className={`grid gap-4 md:gap-6 ${isMobile ? 'grid-cols-2 px-4' : 'grid-cols-1 md:grid-cols-4'}`}>
        <Card className={`invoice-summary-card rounded-xl border-0 ${isMobile ? '' : ''}`}>
          <CardContent className={isMobile ? 'p-3' : 'p-6'}>
            <div className="flex items-center justify-between">
              <div className={isMobile ? 'space-y-1' : 'space-y-2'}>
                <p className={`font-medium text-muted-foreground uppercase tracking-wide ${isMobile ? 'text-xs' : 'text-sm'}`}>Total</p>
                <p className={`font-bold text-foreground ${isMobile ? 'text-xl' : 'text-3xl'}`}>{filteredInvoices.length}</p>
              </div>
              <div className={`rounded-full bg-primary/10 ${isMobile ? 'p-2' : 'p-3'}`}>
                <FileText className={`text-primary ${isMobile ? 'h-4 w-4' : 'h-6 w-6'}`} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="invoice-summary-card rounded-xl border-0">
          <CardContent className={isMobile ? 'p-3' : 'p-6'}>
            <div className="flex items-center justify-between">
              <div className={isMobile ? 'space-y-1' : 'space-y-2'}>
                <p className={`font-medium text-muted-foreground uppercase tracking-wide ${isMobile ? 'text-xs' : 'text-sm'}`}>Paid</p>
                <p className={`font-bold text-emerald-600 ${isMobile ? 'text-lg' : 'text-3xl'}`}>${summaryStats.paid.toLocaleString('en-US', { maximumFractionDigits: 0 })}</p>
              </div>
              <div className={`rounded-full bg-emerald-100 ${isMobile ? 'p-2' : 'p-3'}`}>
                <DollarSign className={`text-emerald-600 ${isMobile ? 'h-4 w-4' : 'h-6 w-6'}`} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="invoice-summary-card rounded-xl border-0">
          <CardContent className={isMobile ? 'p-3' : 'p-6'}>
            <div className="flex items-center justify-between">
              <div className={isMobile ? 'space-y-1' : 'space-y-2'}>
                <p className={`font-medium text-muted-foreground uppercase tracking-wide ${isMobile ? 'text-xs' : 'text-sm'}`}>Pending</p>
                <p className={`font-bold text-amber-600 ${isMobile ? 'text-lg' : 'text-3xl'}`}>${summaryStats.pending.toLocaleString('en-US', { maximumFractionDigits: 0 })}</p>
              </div>
              <div className={`rounded-full bg-amber-100 ${isMobile ? 'p-2' : 'p-3'}`}>
                <Clock className={`text-amber-600 ${isMobile ? 'h-4 w-4' : 'h-6 w-6'}`} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="invoice-summary-card rounded-xl border-0">
          <CardContent className={isMobile ? 'p-3' : 'p-6'}>
            <div className="flex items-center justify-between">
              <div className={isMobile ? 'space-y-1' : 'space-y-2'}>
                <p className={`font-medium text-muted-foreground uppercase tracking-wide ${isMobile ? 'text-xs' : 'text-sm'}`}>Overdue</p>
                <p className={`font-bold text-red-600 ${isMobile ? 'text-lg' : 'text-3xl'}`}>${summaryStats.overdue.toLocaleString('en-US', { maximumFractionDigits: 0 })}</p>
              </div>
              <div className={`rounded-full bg-red-100 ${isMobile ? 'p-2' : 'p-3'}`}>
                <Bell className={`text-red-600 ${isMobile ? 'h-4 w-4' : 'h-6 w-6'}`} />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Monthly Invoice Analytics - Hide on mobile for cleaner UI */}
      {!isMobile && (
        <MonthlyInvoiceAnalytics 
          invoices={filteredInvoices}
          statusFilter={statusFilter}
          dateFrom={dateFrom}
          dateTo={dateTo}
        />
      )}

      {/* Mobile Filters */}
      {isMobile && (
        <InvoiceTrackerMobileFilters
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          statusFilter={statusFilter}
          onStatusFilterChange={setStatusFilter}
          jobsiteFilter={jobsiteFilter}
          onJobsiteFilterChange={setJobsiteFilter}
          dateFrom={dateFrom}
          onDateFromChange={setDateFrom}
          dateTo={dateTo}
          onDateToChange={setDateTo}
          jobsites={jobsites}
          onClearFilters={clearFilters}
        />
      )}

      {/* Desktop Filters and Table */}
      {!isMobile && (
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

          {/* Bulk selection bar */}
          {selectedInvoiceIds.size > 0 && (
            <div className="mb-4 flex items-center justify-between gap-3 px-4 py-3 rounded-xl bg-blue-50 border border-blue-200">
              <span className="text-sm font-medium text-blue-900">
                {selectedInvoiceIds.size} invoice{selectedInvoiceIds.size !== 1 ? 's' : ''} selected
              </span>
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  onClick={handleBulkMarkPaid}
                  disabled={isBulkProcessing}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition-colors disabled:opacity-50"
                >
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Mark as Paid
                </button>
                <button
                  onClick={handleBulkExportCSV}
                  disabled={isBulkProcessing}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-colors disabled:opacity-50"
                >
                  <FileSpreadsheet className="h-3.5 w-3.5" />
                  Export CSV
                </button>
                {canDeleteInvoices && (
                  <button
                    onClick={handleBulkDelete}
                    disabled={isBulkProcessing}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-red-200 hover:bg-red-50 text-red-600 text-xs font-semibold transition-colors disabled:opacity-50"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Delete
                  </button>
                )}
                <button
                  onClick={() => setSelectedInvoiceIds(new Set())}
                  className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-blue-600 hover:bg-blue-100 text-xs font-medium transition-colors"
                >
                  <X className="h-3.5 w-3.5" />
                  Clear
                </button>
              </div>
            </div>
          )}

          {/* Professional Invoice Table */}
          <div className="rounded-xl border border-border/50 bg-card overflow-hidden shadow-lg">
            <Table>
              <TableHeader>
                <TableRow className="bg-gradient-to-r from-muted/60 to-muted/40 border-border/50">
                  <TableHead className="w-10 py-4">
                    <Checkbox
                      checked={allVisibleSelected}
                      onCheckedChange={(c) => toggleSelectAll(!!c)}
                      aria-label="Select all"
                    />
                  </TableHead>
                  <TableHead className="font-semibold text-foreground py-4">Invoice #</TableHead>
                  <TableHead className="font-semibold text-foreground py-4">Client</TableHead>
                  <TableHead className="font-semibold text-foreground py-4">Jobsite</TableHead>
                  <TableHead className="font-semibold text-foreground py-4 text-right">Amount</TableHead>
                  <TableHead className="font-semibold text-foreground py-4">Status</TableHead>
                  <TableHead className="font-semibold text-foreground py-4">Due Date</TableHead>
                  <TableHead className="font-semibold text-foreground py-4 text-right pr-4">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredInvoices.map((invoice, index) => (
                  <TableRow
                    key={invoice.id}
                    onClick={() => handleViewDetails(invoice)}
                    title="View invoice details"
                    className={`
                      invoice-table-row cursor-pointer
                      ${selectedInvoiceIds.has(invoice.id) ? 'bg-blue-50/60' : ''}
                      ${isOverdue(invoice.due_date, invoice.status) ? 'bg-red-50/50 border-l-4 border-l-red-500' : ''}
                    `}
                  >
                    <TableCell className="py-4 w-10" onClick={(e) => e.stopPropagation()}>
                      <Checkbox
                        checked={selectedInvoiceIds.has(invoice.id)}
                        onCheckedChange={(c) => toggleSelectInvoice(invoice.id, !!c)}
                        aria-label={`Select invoice ${invoice.invoice_number}`}
                      />
                    </TableCell>
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
                    <TableCell className="py-3">
                      <span className="text-sm text-slate-600 whitespace-nowrap">{invoice.jobsites?.name || 'No jobsite'}</span>
                    </TableCell>
                    <TableCell className="py-3 text-right">
                      <span className="font-mono font-bold text-base text-foreground tabular-nums whitespace-nowrap">${invoice.total_amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                    </TableCell>
                    <TableCell className="py-3">
                      <Badge className={`${getStatusBadgeClass(invoice.status, isOverdue(invoice.due_date, invoice.status))} px-2.5 py-0.5 whitespace-nowrap`}>
                        {isOverdue(invoice.due_date, invoice.status) ? 'Overdue' : invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                      </Badge>
                    </TableCell>
                    <TableCell className="py-3">
                      <span className="text-sm font-medium text-slate-700 whitespace-nowrap">{format(new Date(invoice.due_date), 'MMM dd, yyyy')}</span>
                    </TableCell>
                    <TableCell className="py-3 pr-4" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Send email (primary quick action) */}
                        <Button
                          size="sm"
                          variant="default"
                          onClick={() => handleSendEmail(invoice)}
                          title="Send email"
                          className="h-8 w-8 p-0 bg-primary hover:bg-primary/90"
                        >
                          <Mail className="h-4 w-4" />
                        </Button>

                        {/* More actions */}
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button size="sm" variant="outline" title="More actions" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuItem onClick={() => handleViewDetails(invoice)}>
                              <Eye className="h-4 w-4 mr-2" /> View details
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDownloadPDF(invoice)}>
                              <Download className="h-4 w-4 mr-2" /> Download PDF
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            {invoice.status !== 'paid' && (
                              <DropdownMenuItem onClick={() => handleStatusUpdate(invoice.id, 'paid')}>
                                <CheckCircle2 className="h-4 w-4 mr-2 text-emerald-600" /> Mark as paid
                              </DropdownMenuItem>
                            )}
                            {invoice.status !== 'pending' && (
                              <DropdownMenuItem onClick={() => handleStatusUpdate(invoice.id, 'pending')}>
                                <Clock className="h-4 w-4 mr-2 text-amber-600" /> Mark as pending
                              </DropdownMenuItem>
                            )}
                            {invoice.status !== 'expired' && (
                              <DropdownMenuItem onClick={() => handleStatusUpdate(invoice.id, 'expired')}>
                                <Bell className="h-4 w-4 mr-2 text-red-600" /> Mark as expired
                              </DropdownMenuItem>
                            )}
                            {canDeleteInvoices && (
                              <>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onClick={() => handleDeleteInvoice(invoice)}
                                  className="text-red-600 focus:text-red-600"
                                >
                                  <Trash2 className="h-4 w-4 mr-2" /> Delete
                                </DropdownMenuItem>
                              </>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
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
      )}

      {/* Mobile Invoice List */}
      {isMobile && (
        <div className="px-4 space-y-3">
          {filteredInvoices.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">No invoices found</p>
            </div>
          ) : (
            filteredInvoices.map((invoice) => (
              <InvoiceTrackerMobileCard
                key={invoice.id}
                invoice={invoice}
                onView={handleViewInvoice}
                onEmail={handleSendEmail}
                onStatusChange={handleStatusUpdate}
                onDownload={handleDownloadPDF}
                onDelete={canDeleteInvoices ? handleDeleteInvoice : undefined}
              />
            ))
          )}
        </div>
      )}

      {/* Invoice Details Dialog (opened by clicking a row or the menu) */}
      <Dialog open={!!selectedInvoice} onOpenChange={(o) => !o && setSelectedInvoice(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Invoice Details</DialogTitle>
            <DialogDescription>
              {selectedInvoice ? `Complete information for invoice ${selectedInvoice.invoice_number}` : ''}
            </DialogDescription>
          </DialogHeader>
          {selectedInvoice && (
            <InvoiceDetailsDialogContent
              invoice={selectedInvoice}
              getStatusBadgeClass={getStatusBadgeClass}
              isOverdue={isOverdue}
            />
          )}
        </DialogContent>
      </Dialog>

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
