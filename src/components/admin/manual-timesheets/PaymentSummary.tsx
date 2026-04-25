import React from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';

interface PaymentSummaryProps {
  totalHours: number;
  hourlyRate: number;
  extraAmount: number;
  taxAmount: number;
  onHourlyRateChange: (v: number) => void;
  onExtraChange: (v: number) => void;
  onTaxChange: (v: number) => void;
  disabled?: boolean;
}

const formatCurrency = (n: number) =>
  n.toLocaleString('en-US', { style: 'currency', currency: 'USD' });

export const PaymentSummary: React.FC<PaymentSummaryProps> = ({
  totalHours,
  hourlyRate,
  extraAmount,
  taxAmount,
  onHourlyRateChange,
  onExtraChange,
  onTaxChange,
  disabled,
}) => {
  const subtotal = totalHours * hourlyRate + extraAmount;
  const total = subtotal + taxAmount;

  const numInput = (
    value: number,
    onChange: (v: number) => void,
    placeholder = '0.00'
  ) => (
    <Input
      type="number"
      min={0}
      step={0.01}
      value={value === 0 ? '' : value}
      placeholder={placeholder}
      disabled={disabled}
      onChange={e => {
        const v = e.target.value === '' ? 0 : parseFloat(e.target.value);
        onChange(Number.isFinite(v) ? v : 0);
      }}
      className="text-right h-9"
    />
  );

  return (
    <Card className="p-4 md:p-5 bg-muted/30">
      <h3 className="text-sm font-semibold mb-4 uppercase tracking-wide text-muted-foreground">
        Payment Summary
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Total Hours (auto)</Label>
          <Input value={totalHours.toFixed(2)} readOnly disabled className="text-right h-9 bg-background" />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Hourly Rate</Label>
          {numInput(hourlyRate, onHourlyRateChange)}
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Extra Amount</Label>
          {numInput(extraAmount, onExtraChange)}
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Tax</Label>
          {numInput(taxAmount, onTaxChange)}
        </div>
      </div>

      <Separator className="my-4" />

      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Subtotal</span>
          <span className="font-medium">{formatCurrency(subtotal)}</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Tax</span>
          <span className="font-medium">{formatCurrency(taxAmount)}</span>
        </div>
        <Separator />
        <div className="flex items-center justify-between text-base">
          <span className="font-semibold">Total Payment</span>
          <span className="font-bold text-lg text-primary">{formatCurrency(total)}</span>
        </div>
      </div>
    </Card>
  );
};
