import React from 'react';
import { Quote } from '@/hooks/quotes';
import { TrendingUp, TrendingDown, DollarSign, FileCheck, Target } from 'lucide-react';

interface QuotesAnalyticsProps {
  quotes: Quote[];
}

const QuotesAnalytics: React.FC<QuotesAnalyticsProps> = ({ quotes }) => {
  // Calculate current month stats
  const now = new Date();
  const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  
  const currentMonthQuotes = quotes.filter(q => 
    new Date(q.created_at) >= currentMonthStart
  );
  
  const approvedQuotes = quotes.filter(q => q.public_status === 'approved');
  const approvedTotal = approvedQuotes.reduce((sum, q) => sum + (q.total_amount || 0), 0);
  
  const sentQuotes = quotes.filter(q => q.status === 'sent' || q.public_status);
  const conversionRate = sentQuotes.length > 0 
    ? ((approvedQuotes.length / sentQuotes.length) * 100).toFixed(1)
    : '0.0';
  
  const stats = [
    {
      label: 'Quotes This Month',
      value: currentMonthQuotes.length.toString(),
      icon: FileCheck,
      gradient: 'from-blue-500 to-cyan-500',
      bgGradient: 'from-blue-50 to-cyan-50 dark:from-blue-950/30 dark:to-cyan-950/30',
      iconColor: 'text-blue-600 dark:text-blue-400',
      trend: currentMonthQuotes.length > 0 ? '+' : '',
    },
    {
      label: 'Total Approved Value',
      value: `$${approvedTotal.toLocaleString()}`,
      icon: DollarSign,
      gradient: 'from-emerald-500 to-green-500',
      bgGradient: 'from-emerald-50 to-green-50 dark:from-emerald-950/30 dark:to-green-950/30',
      iconColor: 'text-emerald-600 dark:text-emerald-400',
      trend: approvedTotal > 0 ? '+' : '',
    },
    {
      label: 'Conversion Rate',
      value: `${conversionRate}%`,
      icon: Target,
      gradient: 'from-purple-500 to-pink-500',
      bgGradient: 'from-purple-50 to-pink-50 dark:from-purple-950/30 dark:to-pink-950/30',
      iconColor: 'text-purple-600 dark:text-purple-400',
      trend: parseFloat(conversionRate) > 50 ? '+' : '',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className={`rounded-xl bg-gradient-to-br ${stat.bgGradient} p-6 shadow-sm hover:shadow-md transition-all duration-200 border border-border/50`}
        >
          <div className="flex items-start justify-between mb-4">
            <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${stat.gradient} flex items-center justify-center shadow-sm`}>
              <stat.icon className="h-6 w-6 text-white" />
            </div>
            {stat.trend && (
              <div className="flex items-center gap-1 text-xs font-medium text-muted-foreground">
                {stat.trend === '+' ? (
                  <TrendingUp className="h-3 w-3 text-emerald-600" />
                ) : (
                  <TrendingDown className="h-3 w-3 text-red-600" />
                )}
              </div>
            )}
          </div>
          <p className="text-xs uppercase tracking-wider font-semibold text-muted-foreground mb-1">
            {stat.label}
          </p>
          <p className={`text-3xl font-bold ${stat.iconColor}`}>
            {stat.value}
          </p>
        </div>
      ))}
    </div>
  );
};

export default QuotesAnalytics;
