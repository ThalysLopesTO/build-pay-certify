import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Plus, X, DollarSign, Percent } from 'lucide-react';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { PaymentConfig, PaymentScheduleItem } from '@/hooks/quotes/types';

interface PaymentScheduleModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentConfig: PaymentConfig;
  jobTotal: number;
  onSave: (config: PaymentConfig) => void;
}

export function PaymentScheduleModal({
  open,
  onOpenChange,
  currentConfig,
  jobTotal,
  onSave
}: PaymentScheduleModalProps) {
  const [mode, setMode] = useState<'full' | 'deposit' | 'schedule'>(currentConfig.mode);
  const [depositType, setDepositType] = useState<'percentage' | 'fixed'>(
    currentConfig.deposit_type || 'percentage'
  );
  const [depositValue, setDepositValue] = useState(currentConfig.deposit_value || 0);
  const [scheduleType, setScheduleType] = useState<'percentage' | 'fixed'>('percentage');
  const [scheduleItems, setScheduleItems] = useState<PaymentScheduleItem[]>(
    currentConfig.schedule_items || [
      {
        id: crypto.randomUUID(),
        amount_type: 'percentage',
        amount_value: 0,
        description: 'Payment 1',
        calculated_total: 0
      }
    ]
  );

  useEffect(() => {
    if (open) {
      setMode(currentConfig.mode);
      setDepositType(currentConfig.deposit_type || 'percentage');
      setDepositValue(currentConfig.deposit_value || 0);
      setScheduleItems(
        currentConfig.schedule_items || [
          {
            id: crypto.randomUUID(),
            amount_type: 'percentage',
            amount_value: 0,
            description: 'Payment 1',
            calculated_total: 0
          }
        ]
      );
    }
  }, [open, currentConfig]);

  const calculateScheduleTotals = () => {
    const total = scheduleItems.reduce((sum, item) => {
      if (item.amount_type === 'percentage') {
        return sum + (jobTotal * item.amount_value) / 100;
      }
      return sum + item.amount_value;
    }, 0);

    const remaining = jobTotal - total;
    const remainingPercent = jobTotal > 0 ? (remaining / jobTotal) * 100 : 0;

    return { total, remaining, remainingPercent };
  };

  const handleAddScheduleItem = () => {
    setScheduleItems([
      ...scheduleItems,
      {
        id: crypto.randomUUID(),
        amount_type: scheduleType,
        amount_value: 0,
        description: `Payment ${scheduleItems.length + 1}`,
        calculated_total: 0
      }
    ]);
  };

  const handleRemoveScheduleItem = (id: string) => {
    if (scheduleItems.length > 1) {
      setScheduleItems(scheduleItems.filter((item) => item.id !== id));
    }
  };

  const handleScheduleItemChange = (id: string, field: string, value: any) => {
    setScheduleItems(
      scheduleItems.map((item) => {
        if (item.id === id) {
          const updated = { ...item, [field]: value };
          if (field === 'amount_value' || field === 'amount_type') {
            if (updated.amount_type === 'percentage') {
              updated.calculated_total = (jobTotal * updated.amount_value) / 100;
            } else {
              updated.calculated_total = updated.amount_value;
            }
          }
          return updated;
        }
        return item;
      })
    );
  };

  const handleSave = () => {
    const config: PaymentConfig = {
      mode,
      deposit_type: mode === 'deposit' ? depositType : undefined,
      deposit_value: mode === 'deposit' ? depositValue : undefined,
      schedule_items: mode === 'schedule' ? scheduleItems : []
    };
    onSave(config);
  };

  const { total, remaining, remainingPercent } =
    mode === 'schedule'
      ? calculateScheduleTotals()
      : { total: 0, remaining: jobTotal, remainingPercent: 100 };

  const isScheduleValid = mode !== 'schedule' || Math.abs(remaining) < 0.01;

  const depositAmount =
    mode === 'deposit'
      ? depositType === 'percentage'
        ? (jobTotal * depositValue) / 100
        : depositValue
      : 0;
  const depositRemaining = jobTotal - depositAmount;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Deposit or payment schedule</DialogTitle>
        </DialogHeader>

        <RadioGroup value={mode} onValueChange={(v) => setMode(v as any)} className="space-y-4">
          {/* Full Payment Option */}
          <div className="flex items-start space-x-3 p-4 border rounded-lg hover:bg-accent/50 transition-colors">
            <RadioGroupItem value="full" id="full" className="mt-1" />
            <div className="flex-1">
              <Label htmlFor="full" className="font-semibold cursor-pointer">
                Full payment
              </Label>
              <p className="text-sm text-muted-foreground mt-1">
                Client pays the full amount upon approval
              </p>
            </div>
          </div>

          {/* Deposit Only Option */}
          <div className="flex items-start space-x-3 p-4 border rounded-lg hover:bg-accent/50 transition-colors">
            <RadioGroupItem value="deposit" id="deposit" className="mt-1" />
            <div className="flex-1">
              <Label htmlFor="deposit" className="font-semibold cursor-pointer">
                Deposit only
              </Label>
              <p className="text-sm text-muted-foreground mt-1">
                Collect an upfront payment on quote approval
              </p>

              {mode === 'deposit' && (
                <div className="mt-4 space-y-3">
                  <ToggleGroup
                    type="single"
                    value={depositType}
                    onValueChange={(v) => v && setDepositType(v as any)}
                    className="justify-start"
                  >
                    <ToggleGroupItem value="percentage" aria-label="Percentage">
                      <Percent className="w-4 h-4 mr-1" />
                      Percentage
                    </ToggleGroupItem>
                    <ToggleGroupItem value="fixed" aria-label="Fixed Amount">
                      <DollarSign className="w-4 h-4 mr-1" />
                      Fixed Amount
                    </ToggleGroupItem>
                  </ToggleGroup>

                  <div className="flex items-center gap-2">
                    <Label className="w-24 text-sm">
                      {depositType === 'percentage' ? 'Percentage:' : 'Amount:'}
                    </Label>
                    <Input
                      type="number"
                      min="0"
                      max={depositType === 'percentage' ? 100 : jobTotal}
                      step={depositType === 'percentage' ? 1 : 0.01}
                      value={depositValue}
                      onChange={(e) => setDepositValue(parseFloat(e.target.value) || 0)}
                      className="w-32"
                    />
                    <span className="text-sm text-muted-foreground">
                      {depositType === 'percentage' ? '%' : 'USD'}
                    </span>
                  </div>

                  <div className="p-3 bg-muted rounded-md text-sm space-y-1">
                    <div className="flex justify-between">
                      <span>Deposit Amount:</span>
                      <span className="font-semibold">${depositAmount.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Remaining:</span>
                      <span className="font-semibold">${depositRemaining.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Payment Schedule Option */}
          <div className="flex items-start space-x-3 p-4 border rounded-lg hover:bg-accent/50 transition-colors">
            <RadioGroupItem value="schedule" id="schedule" className="mt-1" />
            <div className="flex-1">
              <Label htmlFor="schedule" className="font-semibold cursor-pointer">
                Payment schedule
              </Label>
              <p className="text-sm text-muted-foreground mt-1">
                Break the job into multiple invoices over time
              </p>

              {mode === 'schedule' && (
                <div className="mt-4 space-y-4">
                  <ToggleGroup
                    type="single"
                    value={scheduleType}
                    onValueChange={(v) => v && setScheduleType(v as any)}
                    className="justify-start"
                  >
                    <ToggleGroupItem value="percentage" aria-label="Percentage">
                      <Percent className="w-4 h-4 mr-1" />
                      Percentage %
                    </ToggleGroupItem>
                    <ToggleGroupItem value="fixed" aria-label="Fixed Amount">
                      <DollarSign className="w-4 h-4 mr-1" />
                      Fixed Amount $
                    </ToggleGroupItem>
                  </ToggleGroup>

                  <div className="space-y-2">
                    {scheduleItems.map((item, index) => (
                      <div
                        key={item.id}
                        className="flex items-center gap-2 p-3 border rounded-md bg-background"
                      >
                        <Input
                          type="number"
                          min="0"
                          max={scheduleType === 'percentage' ? 100 : jobTotal}
                          step={scheduleType === 'percentage' ? 1 : 0.01}
                          value={item.amount_value}
                          onChange={(e) =>
                            handleScheduleItemChange(
                              item.id,
                              'amount_value',
                              parseFloat(e.target.value) || 0
                            )
                          }
                          className="w-24"
                          placeholder={scheduleType === 'percentage' ? '%' : '$'}
                        />
                        <Input
                          value={item.description}
                          onChange={(e) =>
                            handleScheduleItemChange(item.id, 'description', e.target.value)
                          }
                          placeholder="Description"
                          className="flex-1"
                        />
                        <div className="w-32 text-right font-semibold text-sm">
                          ${item.calculated_total.toFixed(2)}
                        </div>
                        {scheduleItems.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveScheduleItem(item.id)}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleAddScheduleItem}
                    className="w-full"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Invoice to Payment Schedule
                  </Button>

                  <div className="p-4 bg-muted rounded-md space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Job Total:</span>
                      <span className="font-semibold">${jobTotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Scheduled:</span>
                      <span className="font-semibold">${total.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Remaining:</span>
                      <span
                        className={`font-semibold ${!isScheduleValid ? 'text-destructive' : ''}`}
                      >
                        ${remaining.toFixed(2)} ({remainingPercent.toFixed(1)}%)
                      </span>
                    </div>

                    {!isScheduleValid && (
                      <p className="text-xs text-destructive mt-2">
                        ⚠ Payment schedule does not add up to 100%
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </RadioGroup>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!isScheduleValid}>
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
