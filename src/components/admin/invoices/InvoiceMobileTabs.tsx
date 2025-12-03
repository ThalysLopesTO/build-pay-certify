import React from 'react';
import { Plus, FileText, BarChart3 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface InvoiceMobileTabsProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const InvoiceMobileTabs: React.FC<InvoiceMobileTabsProps> = ({ activeTab, onTabChange }) => {
  const tabs = [
    { id: 'create', label: 'Create', icon: Plus },
    { id: 'tracker', label: 'Tracker', icon: FileText },
    { id: 'overview', label: 'Budgets', icon: BarChart3 },
  ];

  return (
    <div className="px-4 py-2 md:hidden">
      <div className="flex gap-2 bg-muted/50 p-1 rounded-lg">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={cn(
                "flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-md text-sm font-medium transition-all",
                isActive 
                  ? "bg-background text-foreground shadow-sm" 
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className="h-4 w-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default InvoiceMobileTabs;
