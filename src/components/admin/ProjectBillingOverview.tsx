import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useInvoices } from '@/hooks/useInvoices';
import { useJobsites } from '@/hooks/useJobsites';
import { useCompanySettings } from '@/hooks/useCompanySettings';
import { format } from 'date-fns';
import { Download, FileText, FileSpreadsheet, Filter, Mail, AlertTriangle } from 'lucide-react';
import { generateBrandedInvoicePDF } from './BrandedInvoicePDF';
import { InvoiceEmailSender } from './InvoiceEmailSender';
import { Alert, AlertDescription } from '@/components/ui/alert';

const ProjectBillingOverview = () => {
  const { invoices, isLoading } = useInvoices();
  const { data: jobsites } = useJobsites();
  const { settings, isSettingsComplete } = useCompanySettings();
  const [selectedProjectId, setSelectedProjectId] = useState<string>('all');
  const [emailDialogOpen, setEmailDialogOpen] = useState(false);
  const [selectedInvoiceForEmail, setSelectedInvoiceForEmail] = useState<any>(null);

  // Filter invoices based on selected project
  const filteredInvoices = useMemo(() => {
    if (selectedProjectId === 'all') {
      return invoices;
    }
    return invoices.filter(invoice => invoice.jobsite_id === selectedProjectId);
  }, [invoices, selectedProjectId]);

  // Get filtered project stats
  const getFilteredProjectStats = () => {
    const totalInvoiced = filteredInvoices.reduce((sum, invoice) => sum + invoice.total_amount, 0);
    const totalPaid = filteredInvoices
      .filter(invoice => invoice.status === 'paid')
      .reduce((sum, invoice) => sum + invoice.total_amount, 0);
    const outstandingBalance = totalInvoiced - totalPaid;
    
    return {
      totalInvoiced,
      totalPaid,
      outstandingBalance,
    };
  };

  const getProjectStats = (jobsiteId: string) => {
    const projectInvoices = invoices.filter(invoice => invoice.jobsite_id === jobsiteId);
    
    const totalInvoiced = projectInvoices.reduce((sum, invoice) => sum + invoice.total_amount, 0);
    const totalPaid = projectInvoices
      .filter(invoice => invoice.status === 'paid')
      .reduce((sum, invoice) => sum + invoice.total_amount, 0);
    const outstandingBalance = totalInvoiced - totalPaid;
    
    return {
      totalInvoiced,
      totalPaid,
      outstandingBalance,
      invoices: projectInvoices,
    };
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'paid': return 'bg-green-100 text-green-800 border-green-200';
      case 'expired': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const generateInvoicePDF = (invoice: any) => {
    if (!settings) {
      console.error('Company settings not loaded');
      return;
    }
    generateBrandedInvoicePDF(invoice, settings);
  };

  const handleSendEmail = (invoice: any) => {
    if (!isSettingsComplete()) {
      return;
    }
    setSelectedInvoiceForEmail(invoice);
    setEmailDialogOpen(true);
  };

  const exportToCSV = () => {
    const headers = ['Invoice Number', 'Project', 'Client Company', 'Client Email', 'Amount', 'Status', 'Due Date', 'Sent Date'];
    
    const csvData = filteredInvoices.map(invoice => [
      invoice.invoice_number,
      invoice.jobsites?.name || 'N/A',
      invoice.client_company,
      invoice.client_email,
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
    
    const projectName = selectedProjectId !== 'all' 
      ? jobsites?.find(j => j.id === selectedProjectId)?.name || 'selected-project'
      : 'all-projects';
    const date = format(new Date(), 'yyyy-MM-dd');
    
    link.download = `invoices-${projectName}-${date}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600 mx-auto mb-4"></div>
          <p>Loading billing overview...</p>
        </div>
      </div>
    );
  }

  const filteredStats = getFilteredProjectStats();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Project Billing Overview</h2>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Filter className="h-4 w-4 text-gray-500" />
            <Select value={selectedProjectId} onValueChange={setSelectedProjectId}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by project" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Projects</SelectItem>
                {jobsites?.map((jobsite) => (
                  <SelectItem key={jobsite.id} value={jobsite.id}>
                    {jobsite.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button onClick={exportToCSV} variant="outline" className="flex items-center space-x-2">
            <FileSpreadsheet className="h-4 w-4" />
            <span>Export to CSV</span>
          </Button>
        </div>
      </div>

      {!isSettingsComplete() && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Please complete your company information in Settings before sending invoices via email.
          </AlertDescription>
        </Alert>
      )}

      {/* Filtered Summary Stats */}
      {selectedProjectId !== 'all' && (
        <Card>
          <CardHeader>
            <CardTitle>
              {jobsites?.find(j => j.id === selectedProjectId)?.name || 'Selected Project'} - Financial Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">
                  ${filteredStats.totalInvoiced.toFixed(2)}
                </div>
                <div className="text-sm text-blue-600">Total Invoiced</div>
              </div>
              
              <div className="bg-green-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  ${filteredStats.totalPaid.toFixed(2)}
                </div>
                <div className="text-sm text-green-600">Total Paid</div>
              </div>
              
              <div className="bg-orange-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-orange-600">
                  ${filteredStats.outstandingBalance.toFixed(2)}
                </div>
                <div className="text-sm text-orange-600">Outstanding Balance</div>
              </div>
            </div>

            {/* Filtered Invoice List */}
            <div className="space-y-3 mt-6">
              <h4 className="font-semibold">Filtered Invoices ({filteredInvoices.length})</h4>
              {filteredInvoices.map((invoice) => (
                <div key={invoice.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-4">
                    <FileText className="h-5 w-5 text-gray-400" />
                    <div>
                      <div className="font-medium">{invoice.invoice_number}</div>
                      <div className="text-sm text-gray-500">{invoice.title}</div>
                      <div className="text-sm text-gray-500">{invoice.jobsites?.name || 'No project'}</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <div className="font-medium">${invoice.total_amount.toFixed(2)}</div>
                      <div className="text-sm text-gray-500">
                        Due: {format(new Date(invoice.due_date), 'MMM dd, yyyy')}
                      </div>
                    </div>
                    
                    <Badge className={getStatusColor(invoice.status)}>
                      {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                    </Badge>
                    
                    <div className="flex space-x-2">
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={() => handleSendEmail(invoice)}
                        disabled={!isSettingsComplete()}
                      >
                        <Mail className="h-4 w-4 mr-1" />
                        Send
                      </Button>
                      {invoice.receipt_file_url && (
                        <Button size="sm" variant="outline">
                          <Download className="h-4 w-4 mr-1" />
                          Receipt
                        </Button>
                      )}
                      <Button size="sm" variant="outline" onClick={() => generateInvoicePDF(invoice)}>
                        <Download className="h-4 w-4 mr-1" />
                        PDF
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Show all projects when "All Projects" is selected */}
      {selectedProjectId === 'all' && (
        <>
          {jobsites?.map((jobsite) => {
            const stats = getProjectStats(jobsite.id);
            
            if (stats.invoices.length === 0) return null;

            return (
              <Card key={jobsite.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>{jobsite.name}</CardTitle>
                      {jobsite.address && (
                        <p className="text-sm text-gray-600">{jobsite.address}</p>
                      )}
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-green-600">
                        ${stats.totalPaid.toFixed(2)}
                      </div>
                      <div className="text-sm text-gray-500">Total Paid</div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {/* Project Summary */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">
                        ${stats.totalInvoiced.toFixed(2)}
                      </div>
                      <div className="text-sm text-blue-600">Total Invoiced</div>
                    </div>
                    
                    <div className="bg-green-50 p-4 rounded-lg">
                      <div className="text-2xl font-bold text-green-600">
                        ${stats.totalPaid.toFixed(2)}
                      </div>
                      <div className="text-sm text-green-600">Total Paid</div>
                    </div>
                    
                    <div className="bg-orange-50 p-4 rounded-lg">
                      <div className="text-2xl font-bold text-orange-600">
                        ${stats.outstandingBalance.toFixed(2)}
                      </div>
                      <div className="text-sm text-orange-600">Outstanding Balance</div>
                    </div>
                  </div>

                  {/* Invoice List */}
                  <div className="space-y-3">
                    <h4 className="font-semibold">Invoices for this Project</h4>
                    {stats.invoices.map((invoice) => (
                      <div key={invoice.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center space-x-4">
                          <FileText className="h-5 w-5 text-gray-400" />
                          <div>
                            <div className="font-medium">{invoice.invoice_number}</div>
                            <div className="text-sm text-gray-500">{invoice.title}</div>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-4">
                          <div className="text-right">
                            <div className="font-medium">${invoice.total_amount.toFixed(2)}</div>
                            <div className="text-sm text-gray-500">
                              Due: {format(new Date(invoice.due_date), 'MMM dd, yyyy')}
                            </div>
                          </div>
                          
                          <Badge className={getStatusColor(invoice.status)}>
                            {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                          </Badge>
                          
                          <div className="flex space-x-2">
                            <Button 
                              size="sm" 
                              variant="outline" 
                              onClick={() => handleSendEmail(invoice)}
                              disabled={!isSettingsComplete()}
                            >
                              <Mail className="h-4 w-4 mr-1" />
                              Send
                            </Button>
                            {invoice.receipt_file_url && (
                              <Button size="sm" variant="outline">
                                <Download className="h-4 w-4 mr-1" />
                                Receipt
                              </Button>
                            )}
                            <Button size="sm" variant="outline" onClick={() => generateInvoicePDF(invoice)}>
                              <Download className="h-4 w-4 mr-1" />
                              PDF
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </>
      )}

      {filteredInvoices.length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Invoices Found</h3>
            <p className="text-gray-500">
              {selectedProjectId !== 'all' 
                ? 'No invoices have been created for this project yet.'
                : 'No invoices have been created for any projects yet.'
              }
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ProjectBillingOverview;
