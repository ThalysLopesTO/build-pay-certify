import React from 'react';
import { FileText, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface QuotesEmptyStateProps {
  onCreateQuote: () => void;
}

const QuotesEmptyState: React.FC<QuotesEmptyStateProps> = ({ onCreateQuote }) => {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center mb-6">
        <FileText className="h-12 w-12 text-primary/40" />
      </div>
      <h3 className="text-2xl font-semibold text-foreground mb-2">
        No quotes yet
      </h3>
      <p className="text-muted-foreground text-center max-w-md mb-6">
        Get started by creating your first quote. Track proposals, manage client responses, and convert quotes to projects.
      </p>
      <Button onClick={onCreateQuote} size="lg" className="shadow-md hover:shadow-lg transition-shadow">
        <Plus className="h-5 w-5 mr-2" />
        Create Your First Quote
      </Button>
    </div>
  );
};

export default QuotesEmptyState;
