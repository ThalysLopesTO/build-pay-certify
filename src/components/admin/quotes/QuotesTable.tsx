
import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { format } from 'date-fns';
import { FileText } from 'lucide-react';
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
    <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border border-slate-200/60 dark:border-slate-800/60 rounded-2xl overflow-hidden shadow-sm">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader className="sticky top-0 z-10">
            <TableRow className="border-b bg-slate-50/90 dark:bg-slate-800/90 backdrop-blur-sm hover:bg-slate-50/90 dark:hover:bg-slate-800/90">
              <TableHead className="text-xs uppercase tracking-wider font-semibold text-slate-600 dark:text-slate-300 py-4 px-6">Quote #</TableHead>
              <TableHead className="text-xs uppercase tracking-wider font-semibold text-slate-600 dark:text-slate-300 py-4 px-6">Client</TableHead>
              <TableHead className="text-xs uppercase tracking-wider font-semibold text-slate-600 dark:text-slate-300 py-4 px-6">Project</TableHead>
              <TableHead className="text-xs uppercase tracking-wider font-semibold text-slate-600 dark:text-slate-300 py-4 px-6">Created</TableHead>
              <TableHead className="text-xs uppercase tracking-wider font-semibold text-slate-600 dark:text-slate-300 py-4 px-6">Sent</TableHead>
              <TableHead className="text-xs uppercase tracking-wider font-semibold text-slate-600 dark:text-slate-300 py-4 px-6">Status</TableHead>
              <TableHead className="text-xs uppercase tracking-wider font-semibold text-slate-600 dark:text-slate-300 py-4 px-6 text-right">Total</TableHead>
              <TableHead className="text-xs uppercase tracking-wider font-semibold text-slate-600 dark:text-slate-300 py-4 px-6 text-center">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {quotes.length === 0 ? (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={8} className="text-center py-12 text-muted-foreground">
                  <div className="flex flex-col items-center gap-2">
                    <FileText className="h-8 w-8 text-muted-foreground/50" />
                    <p>No quotes found</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              quotes.map((quote, index) => (
                <TableRow 
                  key={quote.id} 
                  className={`hover:bg-slate-100/50 dark:hover:bg-slate-800/30 transition-colors duration-150 border-b border-slate-100 dark:border-slate-800 last:border-0 ${
                    index % 2 === 1 ? 'bg-slate-50/30 dark:bg-slate-800/20' : ''
                  }`}
                >
                  <TableCell className="py-4 px-6">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm font-semibold text-slate-900 dark:text-slate-100">{quote.quote_number}</span>
                      {quote.invoice_id && (
                        <div className="relative group">
                          <FileText className="h-4 w-4 text-emerald-600" />
                          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-foreground text-background text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                            Converted to Invoice
                          </div>
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="py-4 px-6">
                    <div className="space-y-0.5">
                      <div className="font-medium text-slate-900 dark:text-slate-100">{quote.client_name}</div>
                      {quote.client_company && (
                        <div className="text-sm text-slate-500 dark:text-slate-400">{quote.client_company}</div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="py-4 px-6">
                    <div className="font-medium text-slate-700 dark:text-slate-200 max-w-[200px] truncate" title={quote.project_name}>
                      {quote.project_name}
                    </div>
                  </TableCell>
                  <TableCell className="py-4 px-6 text-sm text-slate-500 dark:text-slate-400">
                    {format(new Date(quote.created_at), 'MMM dd, yyyy')}
                  </TableCell>
                  <TableCell className="py-4 px-6 text-sm text-slate-500 dark:text-slate-400">
                    {quote.sent_date ? format(new Date(quote.sent_date), 'MMM dd, yyyy') : '—'}
                  </TableCell>
                  <TableCell className="py-4 px-6">
                    <QuoteStatusBadge status={quote.status} publicStatus={quote.public_status} />
                  </TableCell>
                  <TableCell className="py-4 px-6 text-right">
                    <span className="text-lg font-bold text-slate-900 dark:text-slate-100">
                      ${quote.total_amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </span>
                  </TableCell>
                  <TableCell className="py-4 px-6">
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
    </div>
  );
};

export default QuotesTable;
