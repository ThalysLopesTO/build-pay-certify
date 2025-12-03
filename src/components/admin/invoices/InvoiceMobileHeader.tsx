import React from 'react';
import { FileText } from 'lucide-react';

interface InvoiceMobileHeaderProps {
  activeTab: string;
}

const InvoiceMobileHeader: React.FC<InvoiceMobileHeaderProps> = ({ activeTab }) => {
  const getSubtitle = () => {
    switch (activeTab) {
      case 'create':
        return 'Create new invoice';
      case 'tracker':
        return 'Track payments';
      case 'overview':
        return 'Project budgets';
      default:
        return 'Manage invoices';
    }
  };

  return (
    <div className="sticky top-0 z-10 bg-background border-b md:hidden">
      <div className="px-4 py-3 flex items-center gap-3">
        <div className="p-2 rounded-lg bg-primary/10">
          <FileText className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-lg font-bold text-foreground">Invoices</h1>
          <p className="text-xs text-muted-foreground">{getSubtitle()}</p>
        </div>
      </div>
    </div>
  );
};

export default InvoiceMobileHeader;
