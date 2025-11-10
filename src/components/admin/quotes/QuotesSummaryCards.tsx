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
      bgColor: 'bg-slate-50/80 dark:bg-slate-900/40',
      iconColor: 'text-slate-600 dark:text-slate-400',
      iconBgGradient: 'from-slate-500/20 to-slate-600/10',
      countColor: 'text-slate-900 dark:text-slate-100',
    },
    {
      label: 'AWAITING RESPONSE',
      subtitle: 'Waiting for client',
      count: awaitingCount,
      icon: Clock,
      bgColor: 'bg-amber-50/80 dark:bg-amber-950/20',
      iconColor: 'text-amber-600 dark:text-amber-400',
      iconBgGradient: 'from-amber-500/20 to-amber-600/10',
      countColor: 'text-amber-700 dark:text-amber-400',
    },
    {
      label: 'CHANGES REQUESTED',
      subtitle: 'Requires updates',
      count: changesRequestedCount,
      icon: AlertCircle,
      bgColor: 'bg-orange-50/80 dark:bg-orange-950/20',
      iconColor: 'text-orange-600 dark:text-orange-400',
      iconBgGradient: 'from-orange-500/20 to-orange-600/10',
      countColor: 'text-orange-700 dark:text-orange-400',
    },
    {
      label: 'APPROVED',
      subtitle: 'Ready to invoice',
      count: approvedCount,
      icon: CheckCircle,
      bgColor: 'bg-emerald-50/80 dark:bg-emerald-950/20',
      iconColor: 'text-emerald-600 dark:text-emerald-400',
      iconBgGradient: 'from-emerald-500/20 to-emerald-600/10',
      countColor: 'text-emerald-700 dark:text-emerald-400',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card) => (
        <Card 
          key={card.label} 
          className={`relative overflow-hidden ${card.bgColor} backdrop-blur-sm border border-border/50 rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 hover:scale-[1.02] cursor-pointer`}
        >
          <CardContent className="p-6">
            <div className="absolute top-4 right-4 w-14 h-14 rounded-full bg-gradient-to-br ${card.iconBgGradient} flex items-center justify-center">
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
