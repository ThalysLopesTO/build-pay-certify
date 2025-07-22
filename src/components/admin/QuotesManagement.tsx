
import React, { useState } from 'react';
import { useQuotes } from '@/hooks/quotes';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import QuotesTable from './quotes/QuotesTable';
import QuotesFilters from './quotes/QuotesFilters';
import QuoteFormModal from './quotes/QuoteFormModal';

const QuotesManagement = () => {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
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
    setIsCreateModalOpen(true);
  };

  const handleEditQuote = (quote: any) => {
    setSelectedQuote(quote);
    setIsCreateModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsCreateModalOpen(false);
    setSelectedQuote(null);
    refetch();
  };

  const handleFilterChange = (newFilters: any) => {
    setFilters(newFilters);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-muted/30">
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
      <div className="min-h-screen bg-muted/30">
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
    <div className="min-h-screen bg-muted/30">
      {/* Sticky Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Quote Management</h1>
              <p className="text-muted-foreground mt-1">Create and manage project quotes</p>
            </div>
            <Button onClick={handleCreateQuote} size="lg" className="shadow-sm">
              <Plus className="h-4 w-4 mr-2" />
              New Quote
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-6 space-y-6">
        <QuotesFilters 
          filters={filters}
          onFiltersChange={handleFilterChange}
        />

        <QuotesTable
          quotes={quotes}
          onEdit={handleEditQuote}
          onRefresh={refetch}
        />
      </div>

      <QuoteFormModal
        quote={selectedQuote}
        isOpen={isCreateModalOpen}
        onClose={handleCloseModal}
      />
    </div>
  );
};

export default QuotesManagement;
