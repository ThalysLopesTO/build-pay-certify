
import React, { useState } from 'react';
import { useQuotes } from '@/hooks/quotes';
import { Button } from '@/components/ui/button';
import { Plus, Sparkles } from 'lucide-react';
import QuotesTable from './quotes/QuotesTable';
import QuotesFilters from './quotes/QuotesFilters';
import QuoteEditor from './quotes/QuoteEditor';
import QuotesSummaryCards from './quotes/QuotesSummaryCards';
import QuotesEmptyState from './quotes/QuotesEmptyState';


const QuotesManagement = () => {
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [selectedQuote, setSelectedQuote] = useState(null);
  const [filters, setFilters] = useState({
    status: 'all',
    client_name: '',
    date_from: '',
    date_to: '',
  });

  const { data: quotes = [], isLoading, error, refetch } = useQuotes(filters);

  const handleCreateQuote = () => {
    setSelectedQuote(null);
    setIsEditorOpen(true);
  };

  const handleEditQuote = (quote: any) => {
    setSelectedQuote(quote);
    setIsEditorOpen(true);
  };

  const handleCloseEditor = () => {
    setIsEditorOpen(false);
    setSelectedQuote(null);
    refetch();
  };

  const handleFilterChange = (newFilters: any) => {
    setFilters(newFilters);
  };

  // If editor is open, show only the editor
  if (isEditorOpen) {
    return (
      <QuoteEditor
        quote={selectedQuote}
        onClose={handleCloseEditor}
      />
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="animate-pulse space-y-6">
            <div className="h-12 bg-muted rounded-lg w-1/3"></div>
            <div className="h-20 bg-muted rounded-lg"></div>
            <div className="h-96 bg-muted rounded-lg"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="text-center py-12">
            <p className="text-destructive mb-4 text-lg">Failed to load quotes</p>
            <Button onClick={() => refetch()} variant="outline">Try Again</Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex justify-between items-start">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <h1 className="text-4xl font-bold tracking-tight text-foreground">Quote Management</h1>
                <Sparkles className="h-6 w-6 text-primary/60" />
              </div>
              <p className="text-muted-foreground text-base">Create and manage project quotes with ease</p>
            </div>
            <Button 
              onClick={handleCreateQuote} 
              size="lg" 
              className="shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105"
            >
              <Plus className="h-5 w-5 mr-2" />
              New Quote
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-6 space-y-6">
        {quotes.length === 0 ? (
          <QuotesEmptyState onCreateQuote={handleCreateQuote} />
        ) : (
          <>
            <QuotesSummaryCards quotes={quotes} />
            
            <QuotesFilters 
              filters={filters}
              onFiltersChange={handleFilterChange}
            />

            <QuotesTable
              quotes={quotes}
              onEdit={handleEditQuote}
              onRefresh={refetch}
            />
          </>
        )}
      </div>
    </div>
  );
};

export default QuotesManagement;
