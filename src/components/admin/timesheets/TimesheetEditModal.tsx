
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, Clock, DollarSign, Calculator } from 'lucide-react';
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
  
  // Collapsible section states
  const [hoursOpen, setHoursOpen] = useState(true);
  const [expensesOpen, setExpensesOpen] = useState(false);
  const [taxOpen, setTaxOpen] = useState(false);

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
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
        <DialogHeader className="flex-shrink-0 pb-4">
          <DialogTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Edit Timesheet
          </DialogTitle>
        </DialogHeader>

        {/* Summary Section - Always Visible */}
        <div className="flex-shrink-0 bg-muted/50 rounded-lg p-4 mb-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div className="text-center">
              <div className="font-semibold text-lg">{totalHours.toFixed(1)}h</div>
              <div className="text-muted-foreground">Total Hours</div>
            </div>
            <div className="text-center">
              <div className="font-semibold text-lg">${grossPay.toFixed(2)}</div>
              <div className="text-muted-foreground">Gross Pay</div>
            </div>
            <div className="text-center">
              <div className="font-semibold text-lg">${finalTaxAmount.toFixed(2)}</div>
              <div className="text-muted-foreground">Tax</div>
            </div>
            <div className="text-center">
              <div className="font-semibold text-lg text-primary">${totalPay.toFixed(2)}</div>
              <div className="text-muted-foreground">Total Pay</div>
            </div>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto space-y-4 pr-2">
          
          {/* Weekly Hours Section */}
          <Collapsible open={hoursOpen} onOpenChange={setHoursOpen}>
            <CollapsibleTrigger asChild>
              <Button 
                variant="ghost" 
                className="w-full justify-between p-3 h-auto border rounded-lg hover:bg-muted/50"
              >
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  <span className="font-medium">Weekly Hours</span>
                  <span className="text-sm text-muted-foreground">({totalHours.toFixed(1)}h total)</span>
                </div>
                <ChevronDown className={`h-4 w-4 transition-transform ${hoursOpen ? 'rotate-180' : ''}`} />
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-3 pt-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {Object.entries(formData).filter(([key]) => key.includes('_hours')).map(([day, hours]) => (
                  <div key={day} className="flex items-center gap-3">
                    <Label className="w-20 text-sm capitalize">
                      {day.replace('_hours', '')}:
                    </Label>
                    <Input
                      type="number"
                      min="0"
                      max="24"
                      step="0.5"
                      value={hours}
                      onChange={(e) => handleInputChange(day, e.target.value)}
                      className="h-9"
                    />
                    <span className="text-xs text-muted-foreground w-8">hrs</span>
                  </div>
                ))}
              </div>
            </CollapsibleContent>
          </Collapsible>

          {/* Additional Expenses Section */}
          <Collapsible open={expensesOpen} onOpenChange={setExpensesOpen}>
            <CollapsibleTrigger asChild>
              <Button 
                variant="ghost" 
                className="w-full justify-between p-3 h-auto border rounded-lg hover:bg-muted/50"
              >
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  <span className="font-medium">Additional Expenses</span>
                  <span className="text-sm text-muted-foreground">(${formData.additional_expense.toFixed(2)})</span>
                </div>
                <ChevronDown className={`h-4 w-4 transition-transform ${expensesOpen ? 'rotate-180' : ''}`} />
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-3 pt-3">
              <div className="flex items-center gap-3">
                <Label className="w-32 text-sm">
                  Amount ($):
                </Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.additional_expense}
                  onChange={(e) => handleInputChange('additional_expense', e.target.value)}
                  placeholder="0.00"
                  className="h-9"
                />
                <span className="text-xs text-muted-foreground">CAD</span>
              </div>
            </CollapsibleContent>
          </Collapsible>

          {/* Tax Control Section */}
          <Collapsible open={taxOpen} onOpenChange={setTaxOpen}>
            <CollapsibleTrigger asChild>
              <Button 
                variant="ghost" 
                className="w-full justify-between p-3 h-auto border rounded-lg hover:bg-muted/50 bg-orange-50/50 dark:bg-orange-950/20"
              >
                <div className="flex items-center gap-2">
                  <Calculator className="h-4 w-4" />
                  <span className="font-medium">Tax Control</span>
                  <span className="text-sm text-muted-foreground">
                    ({taxIncluded ? `$${finalTaxAmount.toFixed(2)}` : 'No tax'})
                  </span>
                </div>
                <ChevronDown className={`h-4 w-4 transition-transform ${taxOpen ? 'rotate-180' : ''}`} />
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-3 pt-3">
              <div className="bg-orange-50/50 dark:bg-orange-950/20 rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <Label htmlFor="tax-toggle" className="text-sm font-medium">
                    Include Tax on this Timesheet
                  </Label>
                  <Switch
                    id="tax-toggle"
                    checked={taxIncluded}
                    onCheckedChange={setTaxIncluded}
                  />
                </div>

                <div className="text-sm text-muted-foreground bg-background/60 rounded px-3 py-2">
                  Company Tax Rate: <span className="font-medium">{taxRate}%</span>
                </div>

                {taxIncluded && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <Label className="w-32 text-sm font-medium">
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
                        className="h-9"
                      />
                      <span className="text-xs text-muted-foreground">CAD</span>
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
                        className="text-xs text-muted-foreground h-8"
                      >
                        Reset to calculated amount (${calculatedTax.toFixed(2)})
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </CollapsibleContent>
          </Collapsible>

          {/* Employee Notes Section */}
          {timesheet.notes && (
            <div className="border rounded-lg p-4 bg-card">
              <h4 className="font-medium text-sm mb-3 flex items-center gap-2">
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Employee Notes
              </h4>
              <div className="text-sm text-muted-foreground bg-muted/30 rounded-lg p-3">
                {timesheet.notes}
              </div>
            </div>
          )}

          {/* Detailed Summary */}
          <div className="border rounded-lg p-4 bg-card">
            <h4 className="font-medium text-sm mb-3 flex items-center gap-2">
              <Calculator className="h-4 w-4" />
              Calculation Breakdown
            </h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Hours × Rate:</span>
                <span className="font-mono">{totalHours.toFixed(2)}h × ${(timesheet.hourly_rate || 0).toFixed(2)} = ${grossPay.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Additional Expenses:</span>
                <span className="font-mono">${formData.additional_expense.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Tax ({taxIncluded ? taxRate : 0}%):</span>
                <span className="font-mono">${finalTaxAmount.toFixed(2)}</span>
              </div>
              <div className="border-t pt-2 flex justify-between font-semibold">
                <span>Total Pay:</span>
                <span className="font-mono text-primary">${totalPay.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Fixed Footer */}
        <div className="flex-shrink-0 flex justify-end gap-3 pt-4 border-t">
          <Button variant="outline" onClick={onClose} className="px-6">
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSaving} className="px-6">
            {isSaving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TimesheetEditModal;
