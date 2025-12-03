import { Users, FileText, Receipt, DollarSign } from 'lucide-react';
import { Card } from '@/components/ui/card';

interface ClientsMobileSummaryProps {
  totalClients: number;
  totalQuotes: number;
  totalInvoices: number;
  totalRevenue: number;
}

export function ClientsMobileSummary({
  totalClients,
  totalQuotes,
  totalInvoices,
  totalRevenue,
}: ClientsMobileSummaryProps) {
  const stats = [
    {
      label: 'Clients',
      value: totalClients,
      icon: Users,
      bgColor: 'bg-blue-100 dark:bg-blue-900/30',
      iconColor: 'text-blue-600 dark:text-blue-400',
    },
    {
      label: 'Quotes',
      value: totalQuotes,
      icon: FileText,
      bgColor: 'bg-purple-100 dark:bg-purple-900/30',
      iconColor: 'text-purple-600 dark:text-purple-400',
    },
    {
      label: 'Invoices',
      value: totalInvoices,
      icon: Receipt,
      bgColor: 'bg-orange-100 dark:bg-orange-900/30',
      iconColor: 'text-orange-600 dark:text-orange-400',
    },
    {
      label: 'Revenue',
      value: `$${totalRevenue.toFixed(0)}`,
      icon: DollarSign,
      bgColor: 'bg-green-100 dark:bg-green-900/30',
      iconColor: 'text-green-600 dark:text-green-400',
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 px-4 md:hidden">
      {stats.map((stat) => (
        <Card key={stat.label} className="p-3">
          <div className="flex items-center gap-2">
            <div className={`p-1.5 rounded-lg ${stat.bgColor}`}>
              <stat.icon className={`h-4 w-4 ${stat.iconColor}`} />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">{stat.label}</p>
              <p className="text-lg font-bold truncate">{stat.value}</p>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}
