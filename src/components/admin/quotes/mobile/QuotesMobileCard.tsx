import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { Eye, Edit, MoreVertical, FileText, MessageSquare } from 'lucide-react';
import { Quote } from '@/hooks/quotes';
import QuoteStatusBadge from '../QuoteStatusBadge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface QuotesMobileCardProps {
  quote: Quote;
  onEdit: (quote: Quote) => void;
}

const QuotesMobileCard: React.FC<QuotesMobileCardProps> = ({ quote, onEdit }) => {
  return (
    <Card 
      className={cn(
        "shadow-sm hover:shadow-md transition-shadow",
        quote.status === 'accepted' && "bg-green-50/50 border-green-200",
        quote.public_status === 'changes_requested' && "border-l-4 border-l-orange-500"
      )}
      onClick={() => onEdit(quote)}
    >
      <CardContent className="p-4 space-y-3">
        {/* Header Row */}
        <div className="flex items-start justify-between">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2 flex-wrap">
              <QuoteStatusBadge status={quote.status} />
              {quote.invoice_id && (
                <Badge variant="outline" className="text-emerald-600 border-emerald-300 bg-emerald-50">
                  <FileText className="h-3 w-3 mr-1" />
                  Invoiced
                </Badge>
              )}
              {quote.public_status === 'changes_requested' && (
                <Badge variant="outline" className="text-orange-600 border-orange-300 bg-orange-50">
                  <MessageSquare className="h-3 w-3 mr-1" />
                  Changes
                </Badge>
              )}
            </div>
            <span className="font-mono text-sm font-semibold text-muted-foreground">
              {quote.quote_number}
            </span>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={(e) => {
                e.stopPropagation();
                onEdit(quote);
              }}>
                <Edit className="h-4 w-4 mr-2" />
                Edit Quote
              </DropdownMenuItem>
              <DropdownMenuItem onClick={(e) => {
                e.stopPropagation();
                onEdit(quote);
              }}>
                <Eye className="h-4 w-4 mr-2" />
                View Details
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Client Info */}
        <div className="space-y-1">
          <h3 className="font-semibold text-base leading-tight">
            {quote.client_name}
          </h3>
          {quote.client_company && (
            <p className="text-sm text-muted-foreground">
              {quote.client_company}
            </p>
          )}
        </div>

        {/* Project Name */}
        <div className="text-sm text-foreground">
          <span className="font-medium">Project:</span>{' '}
          <span className="line-clamp-2">{quote.project_name}</span>
        </div>

        {/* Bottom Row - Amount and Date */}
        <div className="flex items-center justify-between pt-2 border-t">
          <div className="flex flex-col">
            <span className="text-xs text-muted-foreground">Total</span>
            <span className="text-xl font-bold text-foreground">
              ${quote.total_amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
          <div className="text-right">
            <div className="text-xs text-muted-foreground">Created</div>
            <div className="text-sm font-medium">
              {format(new Date(quote.created_at), 'MMM dd, yyyy')}
            </div>
            {quote.sent_date && (
              <>
                <div className="text-xs text-muted-foreground mt-1">Sent</div>
                <div className="text-sm font-medium">
                  {format(new Date(quote.sent_date), 'MMM dd, yyyy')}
                </div>
              </>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// Helper function for conditional classes
function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(' ');
}

export default QuotesMobileCard;
