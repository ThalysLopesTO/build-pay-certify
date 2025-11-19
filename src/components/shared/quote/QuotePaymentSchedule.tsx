import { PaymentConfig } from '@/hooks/quotes/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign } from 'lucide-react';

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

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <DollarSign className="h-5 w-5" />
          Payment Schedule
        </CardTitle>
      </CardHeader>
      <CardContent>
        {paymentConfig.mode === 'deposit' && (
          <div className="space-y-3">
            <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
              <span className="font-medium">Deposit Required</span>
              <span className="text-lg font-bold text-primary">
                ${getDepositAmount().toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
              <span className="font-medium">Balance Due on Completion</span>
              <span className="text-lg font-bold">
                ${(total - getDepositAmount()).toFixed(2)}
              </span>
            </div>
          </div>
        )}

        {paymentConfig.mode === 'schedule' && paymentConfig.schedule_items && (
          <div className="space-y-3">
            {paymentConfig.schedule_items.map((item, index) => {
              const amount = item.amount_type === 'percentage'
                ? (total * item.amount_value) / 100
                : item.amount_value;
              
              return (
                <div key={item.id} className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                  <div className="flex-1">
                    <div className="font-medium">Payment {index + 1}</div>
                    <div className="text-sm text-muted-foreground">{item.description}</div>
                  </div>
                  <span className="text-lg font-bold text-primary ml-4">
                    ${amount.toFixed(2)}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
