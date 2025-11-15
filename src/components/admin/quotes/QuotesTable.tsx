
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { FileText, MessageSquare } from 'lucide-react';
import { Quote } from '@/hooks/quotes';
import QuoteStatusBadge from './QuoteStatusBadge';
import QuoteActions from './QuoteActions';

interface QuotesTableProps {
  quotes: Quote[];
  onEdit: (quote: Quote) => void;
  onRefresh: () => void;
}

const QuotesTable: React.FC<QuotesTableProps> = ({ quotes, onEdit, onRefresh }) => {
  return (
    <Card className="shadow-sm">
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-b bg-muted/50">
                <TableHead className="font-semibold">Quote #</TableHead>
                <TableHead className="font-semibold">Client</TableHead>
                <TableHead className="font-semibold">Project</TableHead>
                <TableHead className="font-semibold">Created</TableHead>
                <TableHead className="font-semibold">Sent</TableHead>
                <TableHead className="font-semibold">Status</TableHead>
                <TableHead className="font-semibold text-right">Total</TableHead>
                <TableHead className="font-semibold text-center">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {quotes.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-12 text-muted-foreground">
                    <div className="flex flex-col items-center gap-2">
                      <FileText className="h-8 w-8 text-muted-foreground/50" />
                      <p>No quotes found</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                quotes.map((quote) => (
                  <TableRow 
                    key={quote.id} 
                    className={`hover:bg-muted/50 transition-colors cursor-pointer ${
                      quote.status === 'accepted' ? 'bg-green-50/50 border-green-100' : ''
                    } ${
                      quote.public_status === 'changes_requested' ? 'bg-orange-50/30 hover:bg-orange-50/50 border-l-4 border-l-orange-500' : ''
                    }`}
                    onClick={() => onEdit(quote)}
                  >
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm">{quote.quote_number}</span>
                        {quote.invoice_id && (
                          <div className="relative group">
                            <FileText className="h-4 w-4 text-emerald-600" />
                            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-foreground text-background text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                              Converted to Invoice
                            </div>
                          </div>
                        )}
                        {quote.public_status === 'changes_requested' && (
                          <div className="relative group">
                            <Badge variant="outline" className="text-orange-600 border-orange-300 bg-orange-50 animate-pulse">
                              <MessageSquare className="h-3 w-3 mr-1" />
                              Changes Requested
                            </Badge>
                            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-1.5 bg-foreground text-background text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 pointer-events-none">
                              Click to view change request
                            </div>
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="font-medium text-foreground">{quote.client_name}</div>
                        {quote.client_company && (
                          <div className="text-sm text-muted-foreground">{quote.client_company}</div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium text-foreground max-w-[200px] truncate" title={quote.project_name}>
                        {quote.project_name}
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {format(new Date(quote.created_at), 'MMM dd, yyyy')}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {quote.sent_date ? format(new Date(quote.sent_date), 'MMM dd, yyyy') : '—'}
                    </TableCell>
                    <TableCell>
                      <QuoteStatusBadge status={quote.status} publicStatus={quote.public_status} />
                    </TableCell>
                    <TableCell className="text-right">
                      <span className="font-semibold text-lg">
                        ${quote.total_amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-center">
                        <QuoteActions 
                          quote={quote} 
                          onEdit={onEdit}
                          onRefresh={onRefresh}
                        />
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};

export default QuotesTable;
