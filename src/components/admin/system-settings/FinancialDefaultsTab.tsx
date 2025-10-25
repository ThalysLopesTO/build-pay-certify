import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DollarSign, Percent, Calendar, Save } from 'lucide-react';
import { useCompanySettings, useUpdateSettingsMutation } from '@/hooks/useCompanySettings';
import { useToast } from '@/hooks/use-toast';

export const FinancialDefaultsTab = () => {
  const { settings, isLoading } = useCompanySettings();
  const updateSettings = useUpdateSettingsMutation();
  const { toast } = useToast();
  
  const [defaultTaxRate, setDefaultTaxRate] = useState<number>(13);
  const [defaultPaymentTerms, setDefaultPaymentTerms] = useState<number>(30);

  // Update local state when settings load
  useEffect(() => {
    if (settings) {
      setDefaultTaxRate(settings.tax_percentage || 13);
      // For now, use a default for payment terms since it might not be in DB yet
      setDefaultPaymentTerms(30);
    }
  }, [settings]);

  const handleSave = () => {
    if (!settings?.id) {
      toast({
        title: "Error",
        description: "Unable to save settings. Please try again.",
        variant: "destructive",
      });
      return;
    }

    updateSettings.mutate({
      id: settings.id,
      tax_percentage: defaultTaxRate,
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="py-8">
            <p className="text-center text-muted-foreground">Loading financial settings...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

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
              <Label htmlFor="taxRate" className="flex items-center space-x-2 mb-2">
                <Percent className="h-4 w-4" />
                <span>Default Tax Rate (%)</span>
              </Label>
              <Input
                id="taxRate"
                type="number"
                step="0.01"
                value={defaultTaxRate}
                onChange={(e) => setDefaultTaxRate(parseFloat(e.target.value) || 0)}
                placeholder="13.00"
              />
              <p className="text-xs text-muted-foreground mt-1">
                This will be applied to all new invoices by default
              </p>
            </div>

            <div>
              <Label htmlFor="paymentTerms" className="flex items-center space-x-2 mb-2">
                <Calendar className="h-4 w-4" />
                <span>Default Payment Terms</span>
              </Label>
              <Select
                value={defaultPaymentTerms.toString()}
                onValueChange={(value) => setDefaultPaymentTerms(parseInt(value))}
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
              <p className="text-xs text-muted-foreground mt-1">
                Default payment due period for new invoices
              </p>
            </div>
          </div>

          <div className="bg-primary/10 p-4 rounded-lg border border-primary/20">
            <h4 className="font-medium mb-2">Current Settings Preview</h4>
            <div className="text-sm text-muted-foreground space-y-1">
              <p>• New invoices will have a <strong>{defaultTaxRate}%</strong> tax rate</p>
              <p>• Payment will be due <strong>{defaultPaymentTerms} days</strong> from invoice date</p>
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <Button 
              onClick={handleSave}
              disabled={updateSettings.isPending}
              className="gap-2"
            >
              <Save className="h-4 w-4" />
              {updateSettings.isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
