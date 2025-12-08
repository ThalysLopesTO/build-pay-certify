
import React, { useState } from 'react';
import { useQuotes } from '@/hooks/quotes';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import QuotesTable from './quotes/QuotesTable';
import QuotesFilters from './quotes/QuotesFilters';
import QuoteEditor from './quotes/QuoteEditor';
import QuotesSummaryCards from './quotes/QuotesSummaryCards';
import QuotesMobileFilters from './quotes/mobile/QuotesMobileFilters';
import QuotesMobileList from './quotes/mobile/QuotesMobileList';
import { useIsMobile } from '@/hooks/use-mobile';

const QuotesManagement = () => {
  const isMobile = useIsMobile();
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
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-6">
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
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-6">
          <div className="text-center py-12">
            <p className="text-destructive mb-4 text-lg">Failed to load quotes</p>
            <Button onClick={() => refetch()} variant="outline">Try Again</Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 overflow-x-hidden">
      {/* Sticky Header */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-4">
          <div className="flex justify-between items-center gap-4">
            <div className="min-w-0 flex-1">
              <h1 className="text-xl md:text-3xl font-bold tracking-tight truncate">
                Quote Management
              </h1>
              <p className="text-muted-foreground mt-1 text-sm md:text-base hidden sm:block">
                Create and manage project quotes
              </p>
            </div>
            <Button 
              onClick={handleCreateQuote} 
              size={isMobile ? "default" : "lg"} 
              className="shadow-sm shrink-0"
            >
              <Plus className="h-4 w-4 md:mr-2" />
              <span className="hidden sm:inline">New Quote</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-4 md:py-6 space-y-4 md:space-y-6">
        <QuotesSummaryCards quotes={quotes} />
        
        {isMobile ? (
          <>
            <QuotesMobileFilters 
              filters={filters}
              onFiltersChange={handleFilterChange}
            />
            <QuotesMobileList
              quotes={quotes}
              onEdit={handleEditQuote}
              onRefresh={refetch}
            />
          </>
        ) : (
          <>
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
