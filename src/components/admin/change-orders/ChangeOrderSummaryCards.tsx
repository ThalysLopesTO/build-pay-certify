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
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {summaryCards.map((card, index) => (
        <Card key={index} className="hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">
                  {card.title}
                </p>
                <p className="text-2xl font-bold text-foreground">
                  {card.value}
                </p>
              </div>
              <div className={`p-3 rounded-lg ${card.bgColor}`}>
                <card.icon className={`h-5 w-5 ${card.color}`} />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default ChangeOrderSummaryCards;