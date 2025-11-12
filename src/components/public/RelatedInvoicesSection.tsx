import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronUp, Receipt } from 'lucide-react';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

interface Invoice {
  id: string;
  invoice_number: string;
  title: string;
  due_date: string;
  status: 'pending' | 'paid' | 'expired';
  total_amount: number;
  created_at: string;
}

interface RelatedInvoicesSectionProps {
  invoices: Invoice[];
  isLoading: boolean;
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'paid':
      return 'bg-green-100 text-green-800 border-green-200';
    case 'expired':
      return 'bg-red-100 text-red-800 border-red-200';
    case 'pending':
    default:
      return 'bg-yellow-100 text-yellow-800 border-yellow-200';
  }
};

export const RelatedInvoicesSection: React.FC<RelatedInvoicesSectionProps> = ({
  invoices,
  isLoading,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  if (isLoading) {
    return (
      <Card className="shadow-lg">
        <CardContent className="pt-6">
          <p className="text-sm text-muted-foreground text-center">
            Loading invoices...
          </p>
        </CardContent>
      </Card>
    );
  }

  if (!invoices || invoices.length === 0) {
    return null;
  }

  return (
    <Card className="shadow-lg">
      <CardHeader className="cursor-pointer" onClick={() => setIsExpanded(!isExpanded)}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Receipt className="h-5 w-5 text-primary" />
            <div>
              <CardTitle className="text-lg">Your Invoices</CardTitle>
              <CardDescription>
                {invoices.length} {invoices.length === 1 ? 'invoice' : 'invoices'} from this company
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
            {invoices.map((invoice, index) => (
              <React.Fragment key={invoice.id}>
                {index > 0 && <Separator />}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 py-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-sm">#{invoice.invoice_number}</span>
                      <Badge 
                        variant="outline" 
                        className={getStatusColor(invoice.status)}
                      >
                        {invoice.status.toUpperCase()}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{invoice.title}</p>
                    <div className="flex gap-4 text-xs text-muted-foreground mt-1">
                      <span>Due: {format(new Date(invoice.due_date), 'MMM dd, yyyy')}</span>
                      <span className="font-medium">${invoice.total_amount.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </React.Fragment>
            ))}
          </div>
        </CardContent>
      )}
    </Card>
  );
};
