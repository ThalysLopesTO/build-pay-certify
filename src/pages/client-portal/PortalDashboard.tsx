import { useClientPortalContext } from '@/contexts/ClientPortalContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { PortalQuoteCard } from '@/components/client-portal/PortalQuoteCard';
import { PortalInvoiceCard } from '@/components/client-portal/PortalInvoiceCard';

export default function PortalDashboard() {
  const { client, quotes, invoices, token } = useClientPortalContext();

  return (
    <div className="space-y-8 pt-16 lg:pt-0">
      {/* Welcome Section */}
      <div>
        <h1 className="text-3xl font-bold mb-2">
          Welcome back, {client.client_name}
        </h1>
        <p className="text-muted-foreground">
          Here's an overview of your quotes and invoices
        </p>
      </div>

      {/* Quotes */}
      {quotes.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl sm:text-2xl font-semibold">Quotes</h2>
            <Link to={`/client/${token}/quotes`}>
              <Button variant="outline" size="sm">
                View All
              </Button>
            </Link>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4">
            {quotes.map((quote) => (
              <PortalQuoteCard key={quote.id} quote={quote} />
            ))}
          </div>
        </div>
      )}

      {/* Invoices */}
      {invoices.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl sm:text-2xl font-semibold">Invoices</h2>
            <Link to={`/client/${token}/invoices`}>
              <Button variant="outline" size="sm">
                View All
              </Button>
            </Link>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4">
            {invoices.map((invoice) => (
              <PortalInvoiceCard key={invoice.id} invoice={invoice} />
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {quotes.length === 0 && invoices.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">
              No quotes or invoices yet. Check back soon!
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
