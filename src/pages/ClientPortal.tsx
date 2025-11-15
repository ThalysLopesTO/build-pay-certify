import { useParams } from 'react-router-dom';
import { useClientPortal } from '@/hooks/useClientPortal';
import { PortalHeader } from '@/components/client-portal/PortalHeader';
import { PortalQuotesList } from '@/components/client-portal/PortalQuotesList';
import { PortalInvoicesList } from '@/components/client-portal/PortalInvoicesList';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function ClientPortal() {
  const { token } = useParams<{ token: string }>();
  const { data, isLoading, error } = useClientPortal(token);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading your portal...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Invalid Link</h1>
          <p className="text-muted-foreground">
            This portal link is invalid or has expired.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <PortalHeader
        client={data.client}
        companySettings={data.company_settings}
      />

      <div className="container mx-auto py-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-card border rounded-lg p-6">
            <p className="text-sm text-muted-foreground">Total Quotes</p>
            <p className="text-2xl font-bold">{data.quotes.length}</p>
          </div>
          <div className="bg-card border rounded-lg p-6">
            <p className="text-sm text-muted-foreground">Accepted Quotes</p>
            <p className="text-2xl font-bold">
              {data.quotes.filter(q => q.status === 'accepted').length}
            </p>
          </div>
          <div className="bg-card border rounded-lg p-6">
            <p className="text-sm text-muted-foreground">Total Invoices</p>
            <p className="text-2xl font-bold">{data.invoices.length}</p>
          </div>
          <div className="bg-card border rounded-lg p-6">
            <p className="text-sm text-muted-foreground">Paid Invoices</p>
            <p className="text-2xl font-bold">
              {data.invoices.filter(i => i.status === 'paid').length}
            </p>
          </div>
        </div>

        {/* Documents */}
        <Tabs defaultValue="all" className="w-full">
          <TabsList className="grid w-full grid-cols-3 max-w-md">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="quotes">Quotes ({data.quotes.length})</TabsTrigger>
            <TabsTrigger value="invoices">Invoices ({data.invoices.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-6">
            <PortalQuotesList quotes={data.quotes} />
            <PortalInvoicesList invoices={data.invoices} />
          </TabsContent>

          <TabsContent value="quotes">
            <PortalQuotesList quotes={data.quotes} />
          </TabsContent>

          <TabsContent value="invoices">
            <PortalInvoicesList invoices={data.invoices} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
