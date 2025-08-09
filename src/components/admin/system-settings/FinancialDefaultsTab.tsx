
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

    </div>
  );
};
