
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DollarSign, Plus, X, Percent, Calendar } from 'lucide-react';

export const FinancialDefaultsTab = () => {
  const [financialSettings, setFinancialSettings] = useState({
    defaultTaxRate: 13,
    defaultPaymentTerms: 30,
    discountLabels: [
      { id: 1, label: 'Early Payment', description: '2% discount for payment within 10 days' },
      { id: 2, label: 'Volume Discount', description: 'Bulk order discount' },
      { id: 3, label: 'Repeat Client', description: 'Loyal customer discount' }
    ]
  });

  const [newDiscountLabel, setNewDiscountLabel] = useState('');
  const [newDiscountDescription, setNewDiscountDescription] = useState('');

  const addDiscountLabel = () => {
    if (!newDiscountLabel.trim()) return;
    
    const newLabel = {
      id: Date.now(),
      label: newDiscountLabel,
      description: newDiscountDescription
    };

    setFinancialSettings({
      ...financialSettings,
      discountLabels: [...financialSettings.discountLabels, newLabel]
    });

    setNewDiscountLabel('');
    setNewDiscountDescription('');
  };

  const removeDiscountLabel = (id: number) => {
    setFinancialSettings({
      ...financialSettings,
      discountLabels: financialSettings.discountLabels.filter(label => label.id !== id)
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <DollarSign className="h-5 w-5" />
            <span>Tax & Payment Defaults</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label htmlFor="taxRate" className="flex items-center space-x-2">
                <Percent className="h-4 w-4" />
                <span>Default Tax Rate (%)</span>
              </Label>
              <Input
                id="taxRate"
                type="number"
                step="0.01"
                value={financialSettings.defaultTaxRate}
                onChange={(e) => setFinancialSettings({
                  ...financialSettings, 
                  defaultTaxRate: parseFloat(e.target.value) || 0
                })}
                placeholder="13.00"
              />
              <p className="text-xs text-gray-500 mt-1">
                This will be applied to all new invoices by default
              </p>
            </div>

            <div>
              <Label htmlFor="paymentTerms" className="flex items-center space-x-2">
                <Calendar className="h-4 w-4" />
                <span>Default Payment Terms</span>
              </Label>
              <Select
                value={financialSettings.defaultPaymentTerms.toString()}
                onValueChange={(value) => setFinancialSettings({
                  ...financialSettings, 
                  defaultPaymentTerms: parseInt(value)
                })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="15">Net 15 (15 days)</SelectItem>
                  <SelectItem value="30">Net 30 (30 days)</SelectItem>
                  <SelectItem value="45">Net 45 (45 days)</SelectItem>
                  <SelectItem value="60">Net 60 (60 days)</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-500 mt-1">
                Default payment due period for new invoices
              </p>
            </div>
          </div>

          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <h4 className="font-medium text-blue-900 mb-2">Current Settings Preview</h4>
            <div className="text-sm text-blue-700 space-y-1">
              <p>• New invoices will have a <strong>{financialSettings.defaultTaxRate}%</strong> tax rate</p>
              <p>• Payment will be due <strong>{financialSettings.defaultPaymentTerms} days</strong> from invoice date</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Badge className="h-5 w-5" />
              <span>Reusable Discount Labels</span>
            </div>
            <Button onClick={addDiscountLabel} size="sm" className="flex items-center space-x-2">
              <Plus className="h-4 w-4" />
              <span>Add Label</span>
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <Label htmlFor="discountLabel">Discount Label</Label>
              <Input
                id="discountLabel"
                value={newDiscountLabel}
                onChange={(e) => setNewDiscountLabel(e.target.value)}
                placeholder="e.g., Early Payment, Bulk Order"
              />
            </div>
            <div>
              <Label htmlFor="discountDescription">Description (Optional)</Label>
              <Input
                id="discountDescription"
                value={newDiscountDescription}
                onChange={(e) => setNewDiscountDescription(e.target.value)}
                placeholder="Brief description of the discount"
              />
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="font-medium">Existing Discount Labels</h4>
            {financialSettings.discountLabels.length === 0 ? (
              <p className="text-gray-500 text-sm">No discount labels created yet.</p>
            ) : (
              <div className="space-y-2">
                {financialSettings.discountLabels.map((discount) => (
                  <div key={discount.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <Badge variant="secondary" className="mb-1">{discount.label}</Badge>
                      {discount.description && (
                        <p className="text-sm text-gray-600">{discount.description}</p>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeDiscountLabel(discount.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-amber-50 p-4 rounded-lg border border-amber-200">
            <h4 className="font-medium text-amber-900 mb-2">How Discount Labels Work</h4>
            <p className="text-sm text-amber-700">
              These labels will appear as quick-select options when creating invoices, making it easier to apply 
              consistent discounts. You can still enter custom discount percentages when needed.
            </p>
          </div>
        </CardContent>
      </Card>

      <Button className="w-full">
        Save Financial Defaults
      </Button>
    </div>
  );
};
