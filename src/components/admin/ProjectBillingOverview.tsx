
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useInvoices } from '@/hooks/useInvoices';
import { useJobsites } from '@/hooks/useJobsites';
import { format } from 'date-fns';
import { Download, FileText } from 'lucide-react';

const ProjectBillingOverview = () => {
  const { invoices, isLoading } = useInvoices();
  const { data: jobsites } = useJobsites();

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
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'paid': return 'bg-green-100 text-green-800';
      case 'expired': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Project Billing Overview</h2>
      </div>

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
                        {invoice.receipt_file_url && (
                          <Button size="sm" variant="outline">
                            <Download className="h-4 w-4 mr-1" />
                            Receipt
                          </Button>
                        )}
                        <Button size="sm" variant="outline">
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

      {jobsites?.every(jobsite => getProjectStats(jobsite.id).invoices.length === 0) && (
        <Card>
          <CardContent className="text-center py-8">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Invoices Found</h3>
            <p className="text-gray-500">No invoices have been created for any projects yet.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ProjectBillingOverview;
