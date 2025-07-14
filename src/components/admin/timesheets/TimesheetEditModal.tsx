
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useCompanySettings } from '@/hooks/useCompanySettings';

interface TimesheetEditModalProps {
  timesheet: any;
  onClose: () => void;
  onSave: (data: any, originalData: any) => void;
  isSaving: boolean;
}

const TimesheetEditModal: React.FC<TimesheetEditModalProps> = ({
  timesheet,
  onClose,
  onSave,
  isSaving
}) => {
  const { settings: companySettings } = useCompanySettings();
  const taxRate = companySettings?.tax_percentage || 13;
  
  const [formData, setFormData] = useState({
    monday_hours: timesheet.monday_hours || 0,
    tuesday_hours: timesheet.tuesday_hours || 0,
    wednesday_hours: timesheet.wednesday_hours || 0,
    thursday_hours: timesheet.thursday_hours || 0,
    friday_hours: timesheet.friday_hours || 0,
    saturday_hours: timesheet.saturday_hours || 0,
    sunday_hours: timesheet.sunday_hours || 0,
    additional_expense: timesheet.additional_expense || 0,
  });

  const [taxIncluded, setTaxIncluded] = useState(timesheet.tax_included || false);
  const [manualTaxAmount, setManualTaxAmount] = useState<string>('');
  const [isManualTax, setIsManualTax] = useState(false);

  // Store original data for audit tracking
  const originalData = {
    monday_hours: timesheet.monday_hours || 0,
    tuesday_hours: timesheet.tuesday_hours || 0,
    wednesday_hours: timesheet.wednesday_hours || 0,
    thursday_hours: timesheet.thursday_hours || 0,
    friday_hours: timesheet.friday_hours || 0,
    saturday_hours: timesheet.saturday_hours || 0,
    sunday_hours: timesheet.sunday_hours || 0,
    additional_expense: timesheet.additional_expense || 0,
    total_hours: timesheet.total_hours || 0,
    gross_pay: timesheet.gross_pay || 0,
  };

  const totalHours = Object.entries(formData)
    .filter(([key]) => key.includes('_hours'))
    .reduce((sum, [, hours]) => sum + Number(hours), 0);

  const grossPay = totalHours * (timesheet.hourly_rate || 0);
  
  // Calculate tax amount
  const calculatedTax = taxIncluded ? (grossPay * (taxRate / 100)) : 0;
  const finalTaxAmount = isManualTax && manualTaxAmount !== '' 
    ? Number(manualTaxAmount) 
    : calculatedTax;
  
  const totalPay = grossPay + Number(formData.additional_expense) + finalTaxAmount;

  const handleSave = () => {
    const updates = {
      ...formData,
      total_hours: totalHours,
      gross_pay: grossPay + Number(formData.additional_expense) + finalTaxAmount,
      tax_included: taxIncluded,
      calculated_tax: finalTaxAmount
    };
    onSave(updates, originalData);
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: Number(value) || 0
    }));
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Timesheet</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {Object.entries(formData).filter(([key]) => key.includes('_hours')).map(([day, hours]) => (
            <div key={day} className="flex items-center gap-2">
              <Label className="w-20 capitalize">
                {day.replace('_hours', '')}:
              </Label>
              <Input
                type="number"
                min="0"
                max="24"
                step="0.5"
                value={hours}
                onChange={(e) => handleInputChange(day, e.target.value)}
              />
            </div>
          ))}
          
          <div className="flex items-center gap-2">
            <Label className="w-20">
              Additional Expenses ($):
            </Label>
            <Input
              type="number"
              min="0"
              step="0.01"
              value={formData.additional_expense}
              onChange={(e) => handleInputChange('additional_expense', e.target.value)}
              placeholder="0.00"
            />
          </div>

          {/* Tax Control Section */}
          <div className="border-t pt-4 space-y-3">
            <h4 className="font-medium text-sm">Tax Control</h4>
            
            <div className="flex items-center justify-between">
              <Label htmlFor="tax-toggle" className="text-sm">
                Include Tax on this Timesheet
              </Label>
              <Switch
                id="tax-toggle"
                checked={taxIncluded}
                onCheckedChange={setTaxIncluded}
              />
            </div>

            <div className="text-sm text-muted-foreground">
              Company Tax Rate: {taxRate}%
            </div>

            {taxIncluded && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Label className="text-sm">
                    Tax Amount ($):
                  </Label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={isManualTax ? manualTaxAmount : calculatedTax.toFixed(2)}
                    onChange={(e) => {
                      setManualTaxAmount(e.target.value);
                      setIsManualTax(true);
                    }}
                    onFocus={() => setIsManualTax(true)}
                    placeholder={calculatedTax.toFixed(2)}
                    className="flex-1"
                  />
                </div>
                {isManualTax && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setIsManualTax(false);
                      setManualTaxAmount('');
                    }}
                    className="text-xs text-muted-foreground"
                  >
                    Reset to calculated amount ({calculatedTax.toFixed(2)})
                  </Button>
                )}
              </div>
            )}
          </div>

          <div className="border-t pt-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span>Total Hours:</span>
              <span className="font-mono">{totalHours.toFixed(2)}h</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Hourly Rate:</span>
              <span className="font-mono">${(timesheet.hourly_rate || 0).toFixed(2)}/hr</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Gross Pay:</span>
              <span className="font-mono">${grossPay.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Additional Expenses:</span>
              <span className="font-mono">${formData.additional_expense.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Tax:</span>
              <span className="font-mono">${finalTaxAmount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between font-semibold">
              <span>Total Pay:</span>
              <span className="font-mono">${totalPay.toFixed(2)}</span>
            </div>
          </div>
          
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? 'Saving...' : 'Save'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TimesheetEditModal;
