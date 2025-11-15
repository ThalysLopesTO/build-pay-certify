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
      draft: 'bg-gray-500 hover:bg-gray-600',
      sent: 'bg-orange-500 hover:bg-orange-600',
      accepted: 'bg-green-500 hover:bg-green-600',
      declined: 'bg-red-500 hover:bg-red-600',
      invoiced: 'bg-purple-500 hover:bg-purple-600',
    };
    return statusMap[status] || 'bg-gray-500 hover:bg-gray-600';
  };

  const handleView = () => {
    if (quote.public_token) {
      navigate(`/quote/${quote.public_token}`);
    }
  };

  return (
    <div className="bg-card border rounded-lg p-6 hover:shadow-lg hover:scale-[1.02] transition-all">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <FileText className="w-5 h-5 text-primary" />
            <h3 className="font-semibold text-lg">{quote.quote_number}</h3>
          </div>
          <p className="text-foreground font-medium mb-1">{quote.project_name}</p>
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            Sent {format(new Date(quote.quote_date), 'MMM d, yyyy')}
          </p>
        </div>
        <Badge className={`${getStatusColor(quote.status)} text-white border-0`}>
          {quote.status}
        </Badge>
      </div>

      <div className="flex items-center justify-between py-4 border-t border-b mb-4">
        <div className="text-sm text-muted-foreground">Total amount</div>
        <div className="text-2xl font-bold">${quote.total_amount.toFixed(2)}</div>
      </div>

      {quote.expiry_date && (
        <div className="mb-4">
          <p className="text-sm text-muted-foreground">
            Expires {format(new Date(quote.expiry_date), 'MMM d, yyyy')}
          </p>
        </div>
      )}

      {quote.public_token && (
        <Button onClick={handleView} className="w-full" size="lg">
          <ExternalLink className="w-4 h-4 mr-2" />
          View Quote
        </Button>
      )}
    </div>
  );
}
