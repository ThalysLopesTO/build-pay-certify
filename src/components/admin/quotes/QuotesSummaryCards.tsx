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
      label: 'DRAFT',
      subtitle: 'Pending review',
      count: draftCount,
      icon: FileText,
      borderColor: 'border-l-slate-400',
      iconColor: 'text-slate-600',
      iconBgGradient: 'from-slate-500/20 to-slate-600/10',
      countColor: 'text-slate-900',
    },
    {
      label: 'AWAITING RESPONSE',
      subtitle: 'Waiting for client',
      count: awaitingCount,
      icon: Clock,
      borderColor: 'border-l-amber-400',
      iconColor: 'text-amber-600',
      iconBgGradient: 'from-amber-500/20 to-amber-600/10',
      countColor: 'text-amber-700',
    },
    {
      label: 'CHANGES REQUESTED',
      subtitle: 'Requires updates',
      count: changesRequestedCount,
      icon: AlertCircle,
      borderColor: 'border-l-orange-400',
      iconColor: 'text-orange-600',
      iconBgGradient: 'from-orange-500/20 to-orange-600/10',
      countColor: 'text-orange-700',
    },
    {
      label: 'APPROVED',
      subtitle: 'Ready to invoice',
      count: approvedCount,
      icon: CheckCircle,
      borderColor: 'border-l-emerald-400',
      iconColor: 'text-emerald-600',
      iconBgGradient: 'from-emerald-500/20 to-emerald-600/10',
      countColor: 'text-emerald-700',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card) => (
        <Card 
          key={card.label} 
          className={`relative overflow-hidden bg-white border border-gray-200 ${card.borderColor} border-l-4 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 hover:scale-[1.02] cursor-pointer`}
        >
          <CardContent className="p-6">
            <div className={`absolute top-4 right-4 w-14 h-14 rounded-full bg-gradient-to-br ${card.iconBgGradient} flex items-center justify-center`}>
              <card.icon className={`h-7 w-7 ${card.iconColor} opacity-40`} />
            </div>
            <div className="space-y-2">
              <p className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground">
                {card.label}
              </p>
              <p className={`text-5xl font-bold ${card.countColor}`}>
                {card.count}
              </p>
              <p className="text-xs text-muted-foreground">
                {card.subtitle}
              </p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default QuotesSummaryCards;
