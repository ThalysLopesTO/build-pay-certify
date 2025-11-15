import { useClientPortalContext } from '@/contexts/ClientPortalContext';
import { Card, CardContent } from '@/components/ui/card';
import { FileText, Receipt, CheckCircle, DollarSign } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { PortalQuoteCard } from '@/components/client-portal/PortalQuoteCard';
import { PortalInvoiceCard } from '@/components/client-portal/PortalInvoiceCard';
import { ActivityTimeline } from '@/components/client-portal/ActivityTimeline';

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
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title}>
              <CardContent className="p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center sm:justify-between gap-2">
                  <div className="w-full">
                    <p className="text-xs sm:text-sm text-muted-foreground mb-1">
                      {stat.title}
                    </p>
                    <p className="text-lg sm:text-2xl font-bold truncate">{stat.value}</p>
                  </div>
                  <Icon className={`h-6 w-6 sm:h-8 sm:w-8 ${stat.color} flex-shrink-0`} />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Activity Timeline */}
      <ActivityTimeline quotes={quotes} invoices={invoices} />

      {/* Recent Quotes */}
      {recentQuotes.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl sm:text-2xl font-semibold">Recent Quotes</h2>
            <Link to={`/client/${token}/quotes`}>
              <Button variant="outline" size="sm">
                View All
              </Button>
            </Link>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4">
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
            <h2 className="text-xl sm:text-2xl font-semibold">Recent Invoices</h2>
            <Link to={`/client/${token}/invoices`}>
              <Button variant="outline" size="sm">
                View All
              </Button>
            </Link>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4">
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
