import { format } from 'date-fns';
import { FileText, Calendar, MapPin } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';
import { useClientPortalContext } from '@/contexts/ClientPortalContext';

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
    client_address: string | null;
    client_viewed_at: string | null;
    client_approved_at: string | null;
    client_declined_at: string | null;
  };
}

export function PortalQuoteCard({ quote }: PortalQuoteCardProps) {
  const navigate = useNavigate();
  const { token } = useClientPortalContext();

  const getStatusColor = (status: string, publicStatus?: string | null) => {
    if (publicStatus === 'approved' || status === 'accepted') return 'bg-green-600';
    if (publicStatus === 'declined' || status === 'declined') return 'bg-red-600';
    if (publicStatus === 'changes_requested') return 'bg-blue-600';
    if (publicStatus === 'awaiting_response' || status === 'sent') return 'bg-orange-600';
    return 'bg-gray-600';
  };

  const handleCardClick = () => {
    navigate(`/client/${token}/quotes/${quote.id}`);
  };

  return (
    <div 
      onClick={handleCardClick}
      className="bg-card border rounded-lg p-4 sm:p-6 hover:shadow-lg hover:scale-[1.02] transition-all cursor-pointer"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <FileText className="w-5 h-5 text-primary flex-shrink-0" />
            <h3 className="font-semibold text-base sm:text-lg truncate">{quote.quote_number}</h3>
          </div>
          <p className="text-foreground font-medium mb-1 text-sm sm:text-base truncate">{quote.project_name}</p>
          {quote.client_address && (
            <p className="text-xs text-muted-foreground flex items-center gap-1 mb-1">
              <MapPin className="w-3 h-3 flex-shrink-0" />
              <span className="truncate">{quote.client_address}</span>
            </p>
          )}
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            <Calendar className="w-3 h-3 flex-shrink-0" />
            Expires {format(new Date(quote.expiry_date || quote.quote_date), 'MMM d, yyyy')}
          </p>
        </div>
        <Badge className={`${getStatusColor(quote.status, quote.public_status)} text-white border-0 ml-2 flex-shrink-0`}>
          {quote.public_status || quote.status}
        </Badge>
      </div>

      {quote.notes && (
        <div className="mb-4 pb-4 border-b">
          <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2">{quote.notes}</p>
        </div>
      )}

      {quote.client_viewed_at && (
        <div className="mb-4 pb-4 border-b">
          <p className="text-xs text-muted-foreground">
            Viewed {format(new Date(quote.client_viewed_at), 'MMM d, yyyy')}
          </p>
        </div>
      )}

      {(quote.client_approved_at || quote.client_declined_at) && (
        <div className="mb-4 pb-4 border-b">
          <div className="flex items-center justify-between text-xs sm:text-sm">
            <span className="text-muted-foreground">
              {quote.client_approved_at ? 'Approved' : 'Declined'} on
            </span>
            <span className="font-medium">
              {format(new Date(quote.client_approved_at || quote.client_declined_at!), 'MMM d, yyyy')}
            </span>
          </div>
        </div>
      )}

      {!quote.client_approved_at && !quote.client_declined_at && (
        <div className="flex items-center justify-between">
          <span className="text-xs sm:text-sm text-muted-foreground">Total amount</span>
          <span className="text-xl sm:text-2xl font-bold">${quote.total_amount.toFixed(2)}</span>
        </div>
      )}
    </div>
  );
}
