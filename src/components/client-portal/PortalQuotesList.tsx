import { PortalQuoteCard } from './PortalQuoteCard';

interface PortalQuote {
  id: string;
  quote_number: string;
  project_name: string;
  quote_date: string;
  expiry_date: string | null;
  status: string;
  public_status: string | null;
  total_amount: number;
  public_token: string | null;
  notes: string | null;
}

interface PortalQuotesListProps {
  quotes: PortalQuote[];
}

export function PortalQuotesList({ quotes }: PortalQuotesListProps) {
  if (quotes.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">No quotes found</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Quotes</h2>
      <div className="grid grid-cols-1 gap-4">
        {quotes.map((quote) => (
          <PortalQuoteCard key={quote.id} quote={quote} />
        ))}
      </div>
    </div>
  );
}
