import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Skeleton } from '@/components/ui/skeleton';
import { ChartContainer, ChartTooltip, ChartLegend, ChartLegendContent } from '@/components/ui/chart';
import { ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from 'recharts';
import { useInvoiceAnalytics, MonthlyData } from '@/hooks/useInvoiceAnalytics';
import { Invoice } from '@/components/admin/types/invoice';
import { formatCurrency } from '@/utils/formatters';
import { TrendingUp, BarChart3 } from 'lucide-react';
interface MonthlyInvoiceAnalyticsProps {
  invoices: Invoice[];
  statusFilter: string;
  dateFrom?: string;
  dateTo?: string;
}
const chartConfig = {
  paid: {
    label: "Paid",
    color: "hsl(var(--chart-1))",
    type: "bar" as const
  },
  issued: {
    label: "Issued",
    color: "hsl(var(--chart-2))",
    type: "bar" as const
  },
  pending: {
    label: "Pending",
    color: "hsl(var(--chart-3))",
    type: "line" as const
  },
  overdue: {
    label: "Overdue",
    color: "hsl(var(--chart-4))",
    type: "line" as const
  }
};

// Currency formatter with abbreviations
const formatCurrencyAbbr = (value: number): string => {
  if (value === 0) return '$0';
  if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `$${(value / 1000).toFixed(0)}k`;
  return formatCurrency(value);
};

// Calculate month-over-month change
const calculateMoMChange = (current: number, previous: number): string | null => {
  if (previous === 0) return null;
  const change = (current - previous) / previous * 100;
  const arrow = change > 0 ? '▲' : change < 0 ? '▼' : '●';
  const sign = change > 0 ? '+' : '';
  return `${arrow} ${sign}${change.toFixed(1)}% vs prior month`;
};
export const MonthlyInvoiceAnalytics: React.FC<MonthlyInvoiceAnalyticsProps> = ({
  invoices,
  statusFilter,
  dateFrom,
  dateTo
}) => {
  const {
    monthlyData
  } = useInvoiceAnalytics(invoices, dateFrom, dateTo);

  // Default series based on status filter
  const getDefaultSeries = () => {
    if (statusFilter === 'paid') return ['paid'];
    if (statusFilter === 'pending') return ['pending'];
    if (statusFilter === 'expired') return ['overdue'];
    return ['paid']; // Default to paid for all statuses
  };
  const [visibleSeries, setVisibleSeries] = useState<string[]>(getDefaultSeries());
  const [isLoading] = useState(false);

  // Update visible series when status filter changes
  React.useEffect(() => {
    setVisibleSeries(getDefaultSeries());
  }, [statusFilter]);
  const handleSeriesToggle = (newValue: string[]) => {
    setVisibleSeries(newValue);
  };
  const handleLegendClick = (dataKey: string) => {
    if (visibleSeries.includes(dataKey)) {
      setVisibleSeries(prev => prev.filter(s => s !== dataKey));
    } else {
      setVisibleSeries(prev => [...prev, dataKey]);
    }
  };
  const formatMonth = (month: string) => {
    const date = new Date(month + '-01');
    return date.toLocaleDateString('en-US', {
      month: 'short',
      year: '2-digit'
    });
  };
  const CustomTooltip = ({
    active,
    payload,
    label
  }: any) => {
    if (active && payload && payload.length) {
      const currentIndex = monthlyData.findIndex(item => item.month === label);
      const previousMonth = currentIndex > 0 ? monthlyData[currentIndex - 1] : null;
      return <div className="rounded-lg border bg-background p-3 shadow-lg">
          <p className="font-medium text-foreground mb-2">{formatMonth(label)}</p>
          {payload.filter((entry: any) => visibleSeries.includes(entry.dataKey)).map((entry: any, index: number) => <div key={index} className="mb-1">
                <p className="text-sm flex justify-between items-center gap-3">
                  <span style={{
              color: entry.color
            }}>
                    {chartConfig[entry.dataKey as keyof typeof chartConfig]?.label}:
                  </span>
                  <span className="font-medium">{formatCurrency(entry.value)}</span>
                </p>
                {entry.dataKey === 'paid' && previousMonth && <p className="text-xs text-muted-foreground mt-1">
                    {calculateMoMChange(entry.value, previousMonth.paid)}
                  </p>}
              </div>)}
        </div>;
    }
    return null;
  };
  const availableSeries = statusFilter === 'paid' ? ['paid'] : statusFilter === 'pending' ? ['pending'] : statusFilter === 'expired' ? ['overdue'] : ['paid', 'issued', 'pending', 'overdue'];
  if (isLoading) {
    return <Card className="shadow-md rounded-2xl">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div>
              <Skeleton className="h-6 w-48 mb-2" />
              <Skeleton className="h-4 w-64" />
            </div>
            <Skeleton className="h-10 w-40" />
          </div>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-80 w-full" />
        </CardContent>
      </Card>;
  }
  if (!monthlyData.length) {
    return <Card className="shadow-md rounded-2xl">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary" />
            Monthly Invoices
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Paid vs Issued vs Pending vs Overdue
          </p>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center h-80 text-muted-foreground">
            <BarChart3 className="h-12 w-12 mb-4 opacity-40" />
            <p className="text-lg font-medium mb-2">No data for the selected period</p>
            <p className="text-sm text-center">Adjust filters above to view invoice analytics</p>
          </div>
        </CardContent>
      </Card>;
  }
  return <Card className="invoice-summary-card rounded-xl border-0">
      
      
      
    </Card>;
};