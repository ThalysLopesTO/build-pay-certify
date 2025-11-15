import { useClientPortalContext } from '@/contexts/ClientPortalContext';
import { Card, CardContent } from '@/components/ui/card';
import { FileText, Receipt, CheckCircle, DollarSign } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { PortalQuoteCard } from '@/components/client-portal/PortalQuoteCard';
import { PortalInvoiceCard } from '@/components/client-portal/PortalInvoiceCard';

export default function PortalDashboard() {
  const { client, quotes, invoices, token } = useClientPortalContext();

  const acceptedQuotes = quotes.filter(q => q.status === 'accepted').length;
  const paidInvoices = invoices.filter(i => i.status === 'paid').length;
  const totalRevenue = invoices
    .filter(i => i.status === 'paid')
    .reduce((sum, inv) => sum + inv.total_amount, 0);

  const recentQuotes = quotes.slice(0, 3);
  const recentInvoices = invoices.slice(0, 3);

  const stats = [
    {
      title: 'Total Quotes',
      value: quotes.length,
      icon: FileText,
      color: 'text-blue-500',
    },
    {
      title: 'Accepted Quotes',
      value: acceptedQuotes,
      icon: CheckCircle,
      color: 'text-green-500',
    },
    {
      title: 'Total Invoices',
      value: invoices.length,
      icon: Receipt,
      color: 'text-orange-500',
    },
    {
      title: 'Total Paid',
      value: `$${totalRevenue.toFixed(2)}`,
      icon: DollarSign,
      color: 'text-emerald-500',
    },
  ];

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

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">
                      {stat.title}
                    </p>
                    <p className="text-2xl font-bold">{stat.value}</p>
                  </div>
                  <Icon className={`h-8 w-8 ${stat.color}`} />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Recent Quotes */}
      {recentQuotes.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-semibold">Recent Quotes</h2>
            <Link to={`/client/${token}/quotes`}>
              <Button variant="outline" size="sm">
                View All
              </Button>
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {recentQuotes.map((quote) => (
              <PortalQuoteCard key={quote.id} quote={quote} />
            ))}
          </div>
        </div>
      )}

      {/* Recent Invoices */}
      {recentInvoices.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-semibold">Recent Invoices</h2>
            <Link to={`/client/${token}/invoices`}>
              <Button variant="outline" size="sm">
                View All
              </Button>
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {recentInvoices.map((invoice) => (
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
