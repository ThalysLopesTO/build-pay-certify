import { format } from 'date-fns';
import { FileText, Calendar, DollarSign, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';

interface PortalQuoteCardProps {
  quote: {
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
  };
}

export function PortalQuoteCard({ quote }: PortalQuoteCardProps) {
  const navigate = useNavigate();

  const getStatusColor = (status: string) => {
    const statusMap: Record<string, string> = {
      draft: 'bg-gray-500',
      sent: 'bg-blue-500',
      accepted: 'bg-green-500',
      declined: 'bg-red-500',
      invoiced: 'bg-purple-500',
    };
    return statusMap[status] || 'bg-gray-500';
  };

  const handleView = () => {
    if (quote.public_token) {
      navigate(`/quote/${quote.public_token}`);
    }
  };

  return (
    <div className="bg-card border rounded-lg p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <FileText className="w-5 h-5 text-muted-foreground" />
            <h3 className="font-semibold text-lg">{quote.quote_number}</h3>
          </div>
          <p className="text-muted-foreground">{quote.project_name}</p>
        </div>
        <Badge className={getStatusColor(quote.status)}>
          {quote.status}
        </Badge>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="flex items-center gap-2 text-sm">
          <Calendar className="w-4 h-4 text-muted-foreground" />
          <div>
            <p className="text-xs text-muted-foreground">Date</p>
            <p>{format(new Date(quote.quote_date), 'MMM d, yyyy')}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <DollarSign className="w-4 h-4 text-muted-foreground" />
          <div>
            <p className="text-xs text-muted-foreground">Amount</p>
            <p className="font-semibold">${quote.total_amount.toFixed(2)}</p>
          </div>
        </div>
      </div>

      {quote.expiry_date && (
        <div className="mb-4">
          <p className="text-sm text-muted-foreground">
            Expires: {format(new Date(quote.expiry_date), 'MMM d, yyyy')}
          </p>
        </div>
      )}

      {quote.public_token && (
        <Button onClick={handleView} className="w-full">
          <ExternalLink className="w-4 h-4 mr-2" />
          View Quote
        </Button>
      )}
    </div>
  );
}
