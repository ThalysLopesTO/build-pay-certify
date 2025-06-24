
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { format } from 'date-fns';
import { FileText } from 'lucide-react';
import { Quote } from '@/hooks/useQuotes';
import QuoteStatusBadge from './QuoteStatusBadge';
import QuoteActions from './QuoteActions';

interface QuotesTableProps {
  quotes: Quote[];
  onEdit: (quote: Quote) => void;
  onRefresh: () => void;
}

const QuotesTable: React.FC<QuotesTableProps> = ({ quotes, onEdit, onRefresh }) => {
  return (
    <Card>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Quote #</TableHead>
                <TableHead>Client Name</TableHead>
                <TableHead>Project</TableHead>
                <TableHead>Date Sent</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {quotes.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-slate-500">
                    No quotes found
                  </TableCell>
                </TableRow>
              ) : (
                quotes.map((quote) => (
                  <TableRow key={quote.id} className="hover:bg-gray-50">
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        {quote.quote_number}
                        {quote.invoice_id && (
                          <div className="relative group">
                            <FileText className="h-4 w-4 text-green-600" />
                            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                              Converted to Invoice
                            </div>
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{quote.client_name}</div>
                        {quote.client_company && (
                          <div className="text-sm text-slate-500">{quote.client_company}</div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{quote.project_name}</TableCell>
                    <TableCell>
                      {quote.sent_date ? format(new Date(quote.sent_date), 'MMM dd, yyyy') : '--'}
                    </TableCell>
                    <TableCell>
                      <QuoteStatusBadge status={quote.status} />
                    </TableCell>
                    <TableCell className="font-semibold">
                      ${quote.total_amount.toFixed(2)}
                    </TableCell>
                    <TableCell>
                      <QuoteActions 
                        quote={quote} 
                        onEdit={onEdit}
                        onRefresh={onRefresh}
                      />
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
