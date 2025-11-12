import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronUp, FileText, ExternalLink } from 'lucide-react';
import { format } from 'date-fns';
import QuoteStatusBadge from '@/components/admin/quotes/QuoteStatusBadge';
import { Separator } from '@/components/ui/separator';

interface Quote {
  id: string;
  quote_number: string;
  project_name: string;
  quote_date: string;
  status: 'draft' | 'sent' | 'accepted' | 'declined' | 'invoiced';
  total_amount: number;
  public_status?: 'awaiting_response' | 'changes_requested' | 'approved' | 'declined';
  public_token?: string;
}

interface RelatedQuotesSectionProps {
  quotes: Quote[];
  isLoading: boolean;
}

export const RelatedQuotesSection: React.FC<RelatedQuotesSectionProps> = ({
  quotes,
  isLoading,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  if (isLoading) {
    return (
      <Card className="shadow-lg">
        <CardContent className="pt-6">
          <p className="text-sm text-muted-foreground text-center">
            Loading other quotes...
          </p>
        </CardContent>
      </Card>
    );
  }

  if (!quotes || quotes.length === 0) {
    return null;
  }

  return (
    <Card className="shadow-lg">
      <CardHeader className="cursor-pointer" onClick={() => setIsExpanded(!isExpanded)}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            <div>
              <CardTitle className="text-lg">Your Other Quotes</CardTitle>
              <CardDescription>
                {quotes.length} {quotes.length === 1 ? 'quote' : 'quotes'} from this company
              </CardDescription>
            </div>
          </div>
          <Button variant="ghost" size="sm">
            {isExpanded ? (
              <ChevronUp className="h-5 w-5" />
            ) : (
              <ChevronDown className="h-5 w-5" />
            )}
          </Button>
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent>
          <div className="space-y-3">
            {quotes.map((quote, index) => (
              <React.Fragment key={quote.id}>
                {index > 0 && <Separator />}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 py-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-sm">#{quote.quote_number}</span>
                      <QuoteStatusBadge 
                        status={quote.status} 
                        publicStatus={quote.public_status}
                        compact 
                      />
                    </div>
                    <p className="text-sm text-muted-foreground">{quote.project_name}</p>
                    <div className="flex gap-4 text-xs text-muted-foreground mt-1">
                      <span>{format(new Date(quote.quote_date), 'MMM dd, yyyy')}</span>
                      <span className="font-medium">${quote.total_amount.toFixed(2)}</span>
                    </div>
                  </div>
                  {quote.public_token && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(`/quote/${quote.public_token}`, '_blank')}
                    >
                      <ExternalLink className="h-3 w-3 mr-1" />
                      View
                    </Button>
                  )}
                </div>
              </React.Fragment>
            ))}
          </div>
        </CardContent>
      )}
    </Card>
  );
};
