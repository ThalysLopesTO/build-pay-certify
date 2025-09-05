import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from '@/components/ui/chart';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
} from 'recharts';
import { useInvoiceAnalytics, MonthlyData } from '@/hooks/useInvoiceAnalytics';
import { Invoice } from '@/components/admin/types/invoice';
import { formatCurrency } from '@/utils/formatters';
import { TrendingUp } from 'lucide-react';

interface MonthlyInvoiceAnalyticsProps {
  invoices: Invoice[];
  statusFilter: string;
  dateFrom?: string;
  dateTo?: string;
}

const chartConfig = {
  paid: {
    label: "Paid Amount",
    color: "hsl(var(--chart-1))",
  },
  issued: {
    label: "Issued Amount", 
    color: "hsl(var(--chart-2))",
  },
  pending: {
    label: "Pending Amount",
    color: "hsl(var(--chart-3))",
  },
  overdue: {
    label: "Overdue Amount",
    color: "hsl(var(--chart-4))",
  },
};

export const MonthlyInvoiceAnalytics: React.FC<MonthlyInvoiceAnalyticsProps> = ({
  invoices,
  statusFilter,
  dateFrom,
  dateTo,
}) => {
  const { monthlyData } = useInvoiceAnalytics(invoices, dateFrom, dateTo);

  // Default series based on status filter
  const getDefaultSeries = () => {
    if (statusFilter === 'paid') return ['paid'];
    if (statusFilter === 'pending') return ['pending'];
    if (statusFilter === 'expired') return ['overdue'];
    return ['paid']; // Default to paid for all statuses
  };

  const [visibleSeries, setVisibleSeries] = useState<string[]>(getDefaultSeries());

  // Update visible series when status filter changes
  React.useEffect(() => {
    setVisibleSeries(getDefaultSeries());
  }, [statusFilter]);

  const handleSeriesToggle = (series: string, checked: boolean) => {
    if (checked) {
      setVisibleSeries(prev => [...prev, series]);
    } else {
      setVisibleSeries(prev => prev.filter(s => s !== series));
    }
  };

  const formatMonth = (month: string) => {
    const date = new Date(month + '-01');
    return date.toLocaleDateString('en-CA', { month: 'short', year: 'numeric' });
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="rounded-lg border bg-background p-3 shadow-md">
          <p className="font-medium">{formatMonth(label)}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {formatCurrency(entry.value)}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  const availableSeries = statusFilter === 'paid' 
    ? ['paid'] 
    : statusFilter === 'pending'
    ? ['pending']
    : statusFilter === 'expired'
    ? ['overdue']
    : ['paid', 'issued', 'pending', 'overdue'];

  if (!monthlyData.length) {
    return (
      <Card className="shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            Monthly Invoices
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Paid vs Issued vs Pending vs Overdue
          </p>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64 text-muted-foreground">
            No invoice data available for the selected period
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Monthly Invoices
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Paid vs Issued vs Pending vs Overdue
            </p>
          </div>
          
          {/* Series Toggle Controls */}
          <div className="flex flex-wrap gap-4">
            {availableSeries.map((series) => (
              <div key={series} className="flex items-center space-x-2">
                <Checkbox
                  id={`series-${series}`}
                  checked={visibleSeries.includes(series)}
                  onCheckedChange={(checked) => handleSeriesToggle(series, checked as boolean)}
                />
                <label
                  htmlFor={`series-${series}`}
                  className="text-sm font-medium cursor-pointer capitalize"
                  style={{ color: chartConfig[series as keyof typeof chartConfig]?.color }}
                >
                  {chartConfig[series as keyof typeof chartConfig]?.label}
                </label>
              </div>
            ))}
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <ChartContainer config={chartConfig} className="h-80">
          <BarChart data={monthlyData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis 
              dataKey="month"
              tickFormatter={formatMonth}
              className="text-xs"
            />
            <YAxis 
              tickFormatter={(value) => formatCurrency(value)}
              className="text-xs"
            />
            <ChartTooltip content={CustomTooltip} />
            <ChartLegend content={<ChartLegendContent />} />
            
            {visibleSeries.includes('paid') && (
              <Bar
                dataKey="paid"
                fill={chartConfig.paid.color}
                name={chartConfig.paid.label}
                radius={[2, 2, 0, 0]}
              />
            )}
            {visibleSeries.includes('issued') && (
              <Bar
                dataKey="issued"
                fill={chartConfig.issued.color}
                name={chartConfig.issued.label}
                radius={[2, 2, 0, 0]}
              />
            )}
            {visibleSeries.includes('pending') && (
              <Bar
                dataKey="pending"
                fill={chartConfig.pending.color}
                name={chartConfig.pending.label}
                radius={[2, 2, 0, 0]}
              />
            )}
            {visibleSeries.includes('overdue') && (
              <Bar
                dataKey="overdue"
                fill={chartConfig.overdue.color}
                name={chartConfig.overdue.label}
                radius={[2, 2, 0, 0]}
              />
            )}
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
};