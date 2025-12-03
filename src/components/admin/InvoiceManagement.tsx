
import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import CreateInvoiceForm from './CreateInvoiceForm';
import InvoiceTracker from './InvoiceTracker';
import ProjectBillingOverview from './ProjectBillingOverview';
import InvoiceMobileHeader from './invoices/InvoiceMobileHeader';
import InvoiceMobileTabs from './invoices/InvoiceMobileTabs';
import { FileText, Plus, BarChart3 } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';

const InvoiceManagement = () => {
  const [activeTab, setActiveTab] = useState('create');
  const isMobile = useIsMobile();

  useEffect(() => {
    // Check if there's an invoice parameter in the URL
    const urlParams = new URLSearchParams(window.location.search);
    const invoiceParam = urlParams.get('invoice');
    
    if (invoiceParam) {
      // If there's an invoice parameter, switch to the tracker tab
      setActiveTab('tracker');
      
      // Store the invoice ID for the tracker to highlight
      sessionStorage.setItem('highlightInvoiceId', invoiceParam);
      
      // Clean up the URL parameter
      const newUrl = window.location.pathname + window.location.search.replace(/[?&]invoice=[^&]*/g, '');
      window.history.replaceState({}, '', newUrl);
    }
  }, []);

  return (
    <div className="min-h-screen bg-background p-4 md:p-6 overflow-x-hidden">
      <div className="max-w-7xl mx-auto space-y-4 md:space-y-8">
        {/* Mobile Header */}
        {isMobile && <InvoiceMobileHeader activeTab={activeTab} />}

        {/* Desktop Header Section */}
        {!isMobile && (
          <div className="bg-card border rounded-lg p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                  <FileText className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-foreground">Invoice Management</h1>
                  <p className="text-muted-foreground mt-1">
                    Create professional invoices, track payments, and manage project budgets
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Mobile Tabs */}
        {isMobile && <InvoiceMobileTabs activeTab={activeTab} onTabChange={setActiveTab} />}

        {/* Tab Navigation */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4 md:space-y-6">
          {/* Desktop Tab List */}
          {!isMobile && (
            <div className="bg-card border rounded-lg p-2 shadow-sm">
              <TabsList className="grid w-full grid-cols-3 bg-muted/50">
                <TabsTrigger value="create" className="flex items-center space-x-2 data-[state=active]:bg-background data-[state=active]:shadow-sm">
                  <Plus className="h-4 w-4" />
                  <span>Create Invoice</span>
                </TabsTrigger>
                <TabsTrigger value="tracker" className="flex items-center space-x-2 data-[state=active]:bg-background data-[state=active]:shadow-sm">
                  <FileText className="h-4 w-4" />
                  <span>Invoice Tracker</span>
                </TabsTrigger>
                <TabsTrigger value="overview" className="flex items-center space-x-2 data-[state=active]:bg-background data-[state=active]:shadow-sm">
                  <BarChart3 className="h-4 w-4" />
                  <span>Project Budgets</span>
                </TabsTrigger>
              </TabsList>
            </div>
          )}

          <TabsContent value="create" className="space-y-0">
            <CreateInvoiceForm />
          </TabsContent>

          <TabsContent value="tracker" className="space-y-0">
            <InvoiceTracker />
          </TabsContent>

          <TabsContent value="overview" className="space-y-0">
            <ProjectBillingOverview />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default InvoiceManagement;
