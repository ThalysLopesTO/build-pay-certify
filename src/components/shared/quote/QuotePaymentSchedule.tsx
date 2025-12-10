import { PaymentConfig } from '@/hooks/quotes/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DollarSign } from 'lucide-react';
import { formatCurrency } from '@/utils/formatters';

interface QuotePaymentScheduleProps {
  paymentConfig: PaymentConfig;
  total: number;
}

export const QuotePaymentSchedule = ({ paymentConfig, total }: QuotePaymentScheduleProps) => {
  if (!paymentConfig || paymentConfig.mode === 'full') {
    return null;
  }

  const getDepositAmount = () => {
    if (paymentConfig.mode === 'deposit' && paymentConfig.deposit_value) {
      if (paymentConfig.deposit_type === 'percentage') {
        return (total * paymentConfig.deposit_value) / 100;
      }
      return paymentConfig.deposit_value;
    }
    return 0;
  };

  const depositAmount = getDepositAmount();
  const depositPercentage = paymentConfig.deposit_type === 'percentage' 
    ? paymentConfig.deposit_value 
    : (depositAmount / total) * 100;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <DollarSign className="h-5 w-5" />
          Payment Schedule
        </CardTitle>
      </CardHeader>
      <CardContent>
        {paymentConfig.mode === 'deposit' && (
          <div className="border rounded-lg overflow-hidden">
            {/* Table Header */}
            <div className="grid grid-cols-[80px_1fr_120px] bg-muted/50 border-b text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <div className="px-4 py-3">% of Job</div>
              <div className="px-4 py-3">Description</div>
              <div className="px-4 py-3 text-right">Total</div>
            </div>
            
            {/* Deposit Row */}
            <div className="grid grid-cols-[80px_1fr_120px] border-b last:border-0">
              <div className="px-4 py-4 font-semibold text-primary">
                {depositPercentage?.toFixed(0)}%
              </div>
              <div className="px-4 py-4">
                <div className="font-medium">DEPOSIT</div>
                <Badge variant="secondary" className="mt-1 text-xs bg-primary/10 text-primary border-0">
                  Required quote deposit
                </Badge>
              </div>
              <div className="px-4 py-4 text-right font-bold tabular-nums">
                {formatCurrency(depositAmount)}
              </div>
            </div>

            {/* Balance Row */}
            <div className="grid grid-cols-[80px_1fr_120px] bg-muted/30">
              <div className="px-4 py-4 font-semibold">
                {(100 - (depositPercentage || 0)).toFixed(0)}%
              </div>
              <div className="px-4 py-4">
                <div className="font-medium">BALANCE DUE ON COMPLETION</div>
              </div>
              <div className="px-4 py-4 text-right font-bold tabular-nums">
                {formatCurrency(total - depositAmount)}
              </div>
            </div>
          </div>
        )}

        {paymentConfig.mode === 'schedule' && paymentConfig.schedule_items && (
          <div className="border rounded-lg overflow-hidden">
            {/* Table Header */}
            <div className="grid grid-cols-[80px_1fr_120px] bg-muted/50 border-b text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <div className="px-4 py-3">% of Job</div>
              <div className="px-4 py-3">Description</div>
              <div className="px-4 py-3 text-right">Total</div>
            </div>
            
            {/* Schedule Items */}
            {paymentConfig.schedule_items.map((item, index) => {
              const amount = item.amount_type === 'percentage'
                ? (total * item.amount_value) / 100
                : item.amount_value;
              
              const percentage = item.amount_type === 'percentage'
                ? item.amount_value
                : (amount / total) * 100;

              const isDeposit = index === 0;
              
              return (
                <div 
                  key={item.id} 
                  className={`grid grid-cols-[80px_1fr_120px] border-b last:border-0 ${
                    isDeposit ? '' : 'bg-muted/30'
                  }`}
                >
                  <div className={`px-4 py-4 font-semibold ${isDeposit ? 'text-primary' : ''}`}>
                    {percentage.toFixed(0)}%
                  </div>
                  <div className="px-4 py-4">
                    <div className="font-medium uppercase">{item.description}</div>
                    {isDeposit && (
                      <Badge variant="secondary" className="mt-1 text-xs bg-primary/10 text-primary border-0">
                        Required quote deposit
                      </Badge>
                    )}
                  </div>
                  <div className={`px-4 py-4 text-right font-bold tabular-nums ${isDeposit ? 'text-primary' : ''}`}>
                    {formatCurrency(amount)}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
