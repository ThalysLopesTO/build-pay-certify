import React from 'react';
import { Quote } from '@/hooks/quotes';
import QuotesMobileCard from './QuotesMobileCard';
import { FileText } from 'lucide-react';

interface QuotesMobileListProps {
  quotes: Quote[];
  onEdit: (quote: Quote) => void;
}

const QuotesMobileList: React.FC<QuotesMobileListProps> = ({ quotes, onEdit }) => {
  if (quotes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <FileText className="h-12 w-12 text-muted-foreground/50 mb-4" />
        <p className="text-muted-foreground text-base">No quotes found</p>
        <p className="text-sm text-muted-foreground mt-1">
          Try adjusting your filters
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {quotes.map((quote) => (
        <QuotesMobileCard key={quote.id} quote={quote} onEdit={onEdit} />
      ))}
    </div>
  );
};

export default QuotesMobileList;
