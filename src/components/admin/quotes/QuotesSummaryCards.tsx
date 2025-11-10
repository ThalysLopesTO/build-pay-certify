import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { FileText, Clock, AlertCircle, CheckCircle } from 'lucide-react';
import { Quote } from '@/hooks/quotes';

interface QuotesSummaryCardsProps {
  quotes: Quote[];
}

const QuotesSummaryCards: React.FC<QuotesSummaryCardsProps> = ({ quotes }) => {
  const draftCount = quotes.filter(q => q.status === 'draft').length;
  const awaitingCount = quotes.filter(q => q.public_status === 'awaiting_response').length;
  const changesRequestedCount = quotes.filter(q => q.public_status === 'changes_requested').length;
  const approvedCount = quotes.filter(q => q.public_status === 'approved').length;

  const cards = [
    {
      label: 'Draft',
      count: draftCount,
      icon: FileText,
      bgColor: 'bg-muted/30',
      iconColor: 'text-muted-foreground',
      borderColor: 'border-border',
    },
    {
      label: 'Awaiting Response',
      count: awaitingCount,
      icon: Clock,
      bgColor: 'bg-yellow-50 dark:bg-yellow-950/20',
      iconColor: 'text-yellow-600 dark:text-yellow-500',
      borderColor: 'border-yellow-200 dark:border-yellow-800',
    },
    {
      label: 'Changes Requested',
      count: changesRequestedCount,
      icon: AlertCircle,
      bgColor: 'bg-orange-50 dark:bg-orange-950/20',
      iconColor: 'text-orange-600 dark:text-orange-500',
      borderColor: 'border-orange-200 dark:border-orange-800',
    },
    {
      label: 'Approved',
      count: approvedCount,
      icon: CheckCircle,
      bgColor: 'bg-green-50 dark:bg-green-950/20',
      iconColor: 'text-green-600 dark:text-green-500',
      borderColor: 'border-green-200 dark:border-green-800',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card) => (
        <Card 
          key={card.label} 
          className={`shadow-sm border-2 ${card.borderColor} ${card.bgColor} hover:shadow-md transition-shadow`}
        >
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">
                  {card.label}
                </p>
                <p className={`text-3xl font-bold ${card.iconColor}`}>
                  {card.count}
                </p>
              </div>
              <card.icon className={`h-10 w-10 ${card.iconColor} opacity-30`} />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default QuotesSummaryCards;
