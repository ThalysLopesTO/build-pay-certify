
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
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="text-center py-8">
          <p className="text-red-600 mb-4">Failed to load quotes</p>
          <Button onClick={() => refetch()}>Try Again</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Quotes Management</h1>
          <p className="text-slate-600">Create and manage project quotes</p>
        </div>
        <Button onClick={handleCreateQuote} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          New Quote
        </Button>
      </div>

      <QuotesFilters 
        filters={filters}
        onFiltersChange={handleFilterChange}
      />

      <QuotesTable
        quotes={quotes}
        onEdit={handleEditQuote}
        onRefresh={refetch}
      />

      <QuoteFormModal
        quote={selectedQuote}
        isOpen={isCreateModalOpen}
        onClose={handleCloseModal}
      />
    </div>
  );
};

export default QuotesManagement;
