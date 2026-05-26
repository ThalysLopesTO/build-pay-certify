import React from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';

interface PaymentSummaryProps {
  totalHours: number;
  hourlyRate: number;
  extraAmount: number;
  taxPercent: number;
  onHourlyRateChange: (v: number) => void;
  onExtraChange: (v: number) => void;
  onTaxPercentChange: (v: number) => void;
  disabled?: boolean;
  rateLocked?: boolean;
}

const formatCurrency = (n: number) =>
  n.toLocaleString('en-US', { style: 'currency', currency: 'USD' });

export const PaymentSummary: React.FC<PaymentSummaryProps> = ({
  totalHours,
  hourlyRate,
  extraAmount,
  taxPercent,
  onHourlyRateChange,
  onExtraChange,
  onTaxPercentChange,
  disabled,
  rateLocked,
}) => {
  const subtotal = totalHours * hourlyRate + extraAmount;
  const taxAmount = +(subtotal * (taxPercent / 100)).toFixed(2);
  const total = subtotal + taxAmount;

  const numInput = (
    value: number,
    onChange: (v: number) => void,
    placeholder = '0.00',
    max?: number
  ) => (
    <Input
      type="number"
      min={0}
      max={max}
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
          <Input
            type="number"
            min={0}
            step={0.01}
            value={hourlyRate === 0 ? '' : hourlyRate}
            placeholder="0.00"
            disabled={disabled || rateLocked}
            readOnly={rateLocked}
            onChange={e => {
              const v = e.target.value === '' ? 0 : parseFloat(e.target.value);
              onHourlyRateChange(Number.isFinite(v) ? v : 0);
            }}
            className="text-right h-9"
          />
          {rateLocked && (
            <p className="text-xs text-muted-foreground">
              Only Admins and Managers can edit the rate.
            </p>
          )}
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Extra Amount</Label>
          {numInput(extraAmount, onExtraChange)}
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Tax (%)</Label>
          <div className="relative">
            <Input
              type="number"
              min={0}
              max={100}
              step={0.01}
              value={taxPercent === 0 ? '' : taxPercent}
              placeholder="0"
              disabled={disabled}
              onChange={e => {
                const v = e.target.value === '' ? 0 : parseFloat(e.target.value);
                onTaxPercentChange(Number.isFinite(v) ? v : 0);
              }}
              className="text-right h-9 pr-8"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground pointer-events-none">
              %
            </span>
          </div>
          <p className="text-xs text-muted-foreground text-right">
            = {formatCurrency(taxAmount)}
          </p>
        </div>
      </div>

      <Separator className="my-4" />

      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Subtotal</span>
          <span className="font-medium">{formatCurrency(subtotal)}</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">
            Tax {taxPercent > 0 ? `(${taxPercent}%)` : ''}
          </span>
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
