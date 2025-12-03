import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { TrendingUp, Clock, CheckCircle, DollarSign } from 'lucide-react';
import { ChangeOrder } from '@/hooks/useChangeOrders';

interface ChangeOrderSummaryCardsProps {
  orders: ChangeOrder[];
}

const ChangeOrderSummaryCards: React.FC<ChangeOrderSummaryCardsProps> = ({ orders }) => {
  const stats = React.useMemo(() => {
    const totalOrders = orders.length;
    const pendingOrders = orders.filter(order => order.status === 'submitted').length;
    const approvedOrders = orders.filter(order => order.status === 'approved').length;
    const totalValue = orders
      .filter(order => order.status === 'approved')
      .reduce((sum, order) => sum + (order.cost || 0), 0);

    return {
      totalOrders,
      pendingOrders,
      approvedOrders,
      totalValue,
    };
  }, [orders]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-CA', {
      style: 'currency',
      currency: 'CAD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const summaryCards = [
    {
      title: 'Total Orders',
      value: stats.totalOrders.toString(),
      icon: TrendingUp,
      color: 'text-primary',
      bgColor: 'bg-primary/10',
    },
    {
      title: 'Pending Review',
      value: stats.pendingOrders.toString(),
      icon: Clock,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-100',
    },
    {
      title: 'Approved',
      value: stats.approvedOrders.toString(),
      icon: CheckCircle,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
    },
    {
      title: 'Approved Value',
      value: formatCurrency(stats.totalValue),
      icon: DollarSign,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-4 md:mb-6">
      {summaryCards.map((card, index) => (
        <Card key={index} className="hover:shadow-md transition-shadow">
          <CardContent className="p-3 md:p-6">
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0 flex-1">
                <p className="text-xs md:text-sm font-medium text-muted-foreground mb-0.5 md:mb-1 truncate">
                  {card.title}
                </p>
                <p className="text-lg md:text-2xl font-bold text-foreground truncate">
                  {card.value}
                </p>
              </div>
              <div className={`p-2 md:p-3 rounded-lg ${card.bgColor} shrink-0`}>
                <card.icon className={`h-4 w-4 md:h-5 md:w-5 ${card.color}`} />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default ChangeOrderSummaryCards;