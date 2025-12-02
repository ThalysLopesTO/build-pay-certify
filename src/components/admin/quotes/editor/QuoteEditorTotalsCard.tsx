
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Calculator } from 'lucide-react';
import { PaymentConfig } from '@/hooks/quotes/types';

interface QuoteEditorTotalsCardProps {
  formData: {
    discount: number;
    tax: number;
  };
  calculateSubtotal: () => number;
  handleInputChange: (field: string, value: number) => void;
  paymentConfig: PaymentConfig;
  onPaymentScheduleClick: () => void;
}

const QuoteEditorTotalsCard: React.FC<QuoteEditorTotalsCardProps> = ({
  formData,
  calculateSubtotal,
  handleInputChange,
  paymentConfig,
  onPaymentScheduleClick,
}) => {
  const subtotal = calculateSubtotal();
  const discountAmount = Math.min(Number(formData.discount) || 0, subtotal);
  const taxAmount = (subtotal - discountAmount) * (Number(formData.tax) / 100);
  const total = subtotal - discountAmount + taxAmount;

  const getPaymentSummary = () => {
    if (paymentConfig.mode === 'deposit') {
      const amount =
        paymentConfig.deposit_type === 'percentage'
          ? `${paymentConfig.deposit_value}%`
          : `$${paymentConfig.deposit_value?.toFixed(2)}`;
      return `Deposit: ${amount} required`;
    }
    if (paymentConfig.mode === 'schedule' && paymentConfig.schedule_items) {
      return `Payment schedule: ${paymentConfig.schedule_items.length} invoices`;
    }
    return null;
  };

  return (
    <Card className="shadow-lg mt-4">
      <CardHeader className="pb-3 bg-muted/30">
        <CardTitle className="text-lg">Totals</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 pt-4">
        {/* Subtotal */}
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Subtotal</span>
          <span className="font-medium">${subtotal.toFixed(2)}</span>
        </div>

        {/* Discount Input */}
        <div className="flex justify-between items-center text-sm">
          <span className="text-muted-foreground">Discount</span>
          <div className="flex items-center gap-2">
            <span>$</span>
            <Input 
              type="number" 
              value={formData.discount}
              onChange={(e) => handleInputChange('discount', Number(e.target.value))}
              onFocus={(e) => e.target.select()}
              className="w-24 h-8 text-right"
              min="0"
              step="0.01"
              placeholder="0.00"
              autoComplete="off"
            />
          </div>
        </div>

        {/* Tax Input */}
        <div className="flex justify-between items-center text-sm">
          <span className="text-muted-foreground">Tax</span>
          <div className="flex items-center gap-2">
            <Input 
              type="number" 
              value={formData.tax}
              onChange={(e) => handleInputChange('tax', Number(e.target.value))}
              onFocus={(e) => e.target.select()}
              className="w-20 h-8 text-right"
              min="0"
              max="100"
              step="0.01"
              autoComplete="off"
            />
            <span>%</span>
          </div>
        </div>
        <div className="flex justify-between text-sm pl-4">
          <span className="text-muted-foreground">+ ${taxAmount.toFixed(2)}</span>
        </div>

        {/* Divider */}
        <Separator />

        {/* Total */}
        <div className="flex justify-between items-center pt-2">
          <span className="text-lg font-semibold">Total</span>
          <span className="text-2xl font-bold text-primary">
            ${total.toFixed(2)}
          </span>
        </div>

        {/* Payment Schedule Link */}
        <div className="pt-3 border-t">
          <Button
            type="button"
            variant="link"
            className="p-0 h-auto text-sm text-primary hover:underline"
            onClick={onPaymentScheduleClick}
          >
            <Calculator className="w-4 h-4 mr-1" />
            Deposit or payment schedule
          </Button>

          {paymentConfig.mode !== 'full' && (
            <div className="mt-2 text-xs text-muted-foreground bg-muted/50 p-2 rounded">
              {getPaymentSummary()}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default QuoteEditorTotalsCard;
