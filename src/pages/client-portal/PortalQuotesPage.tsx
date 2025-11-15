import { useClientPortalContext } from '@/contexts/ClientPortalContext';
import { DocumentGroup } from '@/components/client-portal/DocumentGroup';
import { PortalQuoteCard } from '@/components/client-portal/PortalQuoteCard';

export default function PortalQuotesPage() {
  const { quotes } = useClientPortalContext();

  const awaitingQuotes = quotes.filter(
    q => q.status === 'sent' || q.public_status === 'awaiting'
  );
  const approvedQuotes = quotes.filter(q => q.status === 'accepted');
  const declinedQuotes = quotes.filter(q => q.status === 'declined');
  const otherQuotes = quotes.filter(
    q => !['sent', 'accepted', 'declined'].includes(q.status) && q.public_status !== 'awaiting'
  );

  return (
    <div className="space-y-6 pt-16 lg:pt-0">
      <div>
        <h1 className="text-3xl font-bold mb-2">Your quotes</h1>
        <p className="text-muted-foreground">
          View and manage all your quotes
        </p>
      </div>

      {quotes.length === 0 ? (
        <div className="bg-card border rounded-lg p-12 text-center">
          <p className="text-muted-foreground">No quotes found</p>
        </div>
      ) : (
        <div className="space-y-4">
          <DocumentGroup
            title="Awaiting response"
            count={awaitingQuotes.length}
            color="orange"
            defaultOpen={true}
          >
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
              {awaitingQuotes.map(quote => (
                <PortalQuoteCard key={quote.id} quote={quote} />
              ))}
            </div>
          </DocumentGroup>

          <DocumentGroup
            title="Approved"
            count={approvedQuotes.length}
            color="green"
            defaultOpen={true}
          >
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
              {approvedQuotes.map(quote => (
                <PortalQuoteCard key={quote.id} quote={quote} />
              ))}
            </div>
          </DocumentGroup>

          <DocumentGroup
            title="Declined"
            count={declinedQuotes.length}
            color="red"
            defaultOpen={false}
          >
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
              {declinedQuotes.map(quote => (
                <PortalQuoteCard key={quote.id} quote={quote} />
              ))}
            </div>
          </DocumentGroup>

          <DocumentGroup
            title="Other"
            count={otherQuotes.length}
            color="gray"
            defaultOpen={false}
          >
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
              {otherQuotes.map(quote => (
                <PortalQuoteCard key={quote.id} quote={quote} />
              ))}
            </div>
          </DocumentGroup>
        </div>
      )}
    </div>
  );
}
