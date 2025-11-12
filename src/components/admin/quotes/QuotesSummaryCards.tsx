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
      iconColor: 'text-slate-600',
      borderAccent: 'border-l-slate-300',
    },
    {
      label: 'Awaiting Response',
      count: awaitingCount,
      icon: Clock,
      iconColor: 'text-yellow-600',
      borderAccent: 'border-l-yellow-400',
    },
    {
      label: 'Changes Requested',
      count: changesRequestedCount,
      icon: AlertCircle,
      iconColor: 'text-orange-600',
      borderAccent: 'border-l-orange-400',
    },
    {
      label: 'Approved',
      count: approvedCount,
      icon: CheckCircle,
      iconColor: 'text-emerald-600',
      borderAccent: 'border-l-emerald-400',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card) => (
        <Card 
          key={card.label} 
          className={`bg-white border border-gray-200 border-l-4 ${card.borderAccent} shadow-sm hover:shadow-md transition-shadow`}
        >
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium text-slate-600">
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
