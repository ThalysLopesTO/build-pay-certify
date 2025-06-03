
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Download, 
  Upload, 
  Shield, 
  Key, 
  AlertTriangle, 
  Globe, 
  CreditCard,
  FileText 
} from 'lucide-react';

export const AdvancedControlsTab = () => {
  const [advancedSettings, setAdvancedSettings] = useState({
    enable2FA: false,
    certificateExpiryDays: 30,
    quickbooksApiKey: '',
    stripeApiKey: '',
    webhookUrl: '',
    backupFrequency: 'weekly'
  });

  const exportSettings = () => {
    const settingsToExport = {
      timestamp: new Date().toISOString(),
      settings: advancedSettings,
      // Add other settings from different tabs here in a real implementation
    };

    const blob = new Blob([JSON.stringify(settingsToExport, null, 2)], { 
      type: 'application/json' 
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `system-settings-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const importSettings = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const settings = JSON.parse(e.target?.result as string);
        if (settings.settings) {
          setAdvancedSettings(settings.settings);
          alert('Settings imported successfully!');
        }
      } catch (error) {
        alert('Error importing settings. Please check the file format.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <FileText className="h-5 w-5" />
            <span>Backup & Restore</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button 
              onClick={exportSettings}
              className="flex items-center space-x-2"
              variant="outline"
            >
              <Download className="h-4 w-4" />
              <span>Export Settings</span>
            </Button>

            <div>
              <Input
                type="file"
                accept=".json"
                onChange={importSettings}
                className="hidden"
                id="import-settings"
              />
              <Button 
                onClick={() => document.getElementById('import-settings')?.click()}
                className="flex items-center space-x-2 w-full"
                variant="outline"
              >
                <Upload className="h-4 w-4" />
                <span>Import Settings</span>
              </Button>
            </div>
          </div>

          <div>
            <Label htmlFor="backupFrequency">Automatic Backup Frequency</Label>
            <Select
              value={advancedSettings.backupFrequency}
              onValueChange={(value) => setAdvancedSettings({
                ...advancedSettings, 
                backupFrequency: value
              })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="daily">Daily</SelectItem>
                <SelectItem value="weekly">Weekly</SelectItem>
                <SelectItem value="monthly">Monthly</SelectItem>
                <SelectItem value="disabled">Disabled</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Globe className="h-5 w-5" />
            <span>External Integrations</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div>
              <Label htmlFor="quickbooks" className="flex items-center space-x-2">
                <FileText className="h-4 w-4" />
                <span>QuickBooks API Key</span>
              </Label>
              <Input
                id="quickbooks"
                type="password"
                value={advancedSettings.quickbooksApiKey}
                onChange={(e) => setAdvancedSettings({
                  ...advancedSettings, 
                  quickbooksApiKey: e.target.value
                })}
                placeholder="Enter QuickBooks API key for accounting sync"
              />
            </div>

            <div>
              <Label htmlFor="stripe" className="flex items-center space-x-2">
                <CreditCard className="h-4 w-4" />
                <span>Stripe API Key</span>
              </Label>
              <Input
                id="stripe"
                type="password"
                value={advancedSettings.stripeApiKey}
                onChange={(e) => setAdvancedSettings({
                  ...advancedSettings, 
                  stripeApiKey: e.target.value
                })}
                placeholder="Enter Stripe API key for payment processing"
              />
            </div>

            <div>
              <Label htmlFor="webhook">Webhook URL</Label>
              <Input
                id="webhook"
                value={advancedSettings.webhookUrl}
                onChange={(e) => setAdvancedSettings({
                  ...advancedSettings, 
                  webhookUrl: e.target.value
                })}
                placeholder="https://your-app.com/webhooks/construction-manager"
              />
              <p className="text-xs text-gray-500 mt-1">
                Receive real-time notifications for invoice payments, employee changes, etc.
              </p>
            </div>
          </div>

          <div className="bg-amber-50 p-4 rounded-lg border border-amber-200">
            <div className="flex items-start space-x-2">
              <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-amber-900">Security Notice</h4>
                <p className="text-sm text-amber-700 mt-1">
                  API keys are encrypted and stored securely. Only enter keys from trusted sources 
                  and ensure they have minimal required permissions.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Shield className="h-5 w-5" />
            <span>Security Settings</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="2fa" className="flex items-center space-x-2">
                <Key className="h-4 w-4" />
                <span>Two-Factor Authentication (2FA)</span>
              </Label>
              <p className="text-sm text-gray-600">Require 2FA for admin login (recommended)</p>
            </div>
            <Switch
              id="2fa"
              checked={advancedSettings.enable2FA}
              onCheckedChange={(checked) => setAdvancedSettings({
                ...advancedSettings, 
                enable2FA: checked
              })}
            />
          </div>

          <div>
            <Label htmlFor="certExpiry">Certificate Expiry Alert Window (Days)</Label>
            <Select
              value={advancedSettings.certificateExpiryDays.toString()}
              onValueChange={(value) => setAdvancedSettings({
                ...advancedSettings, 
                certificateExpiryDays: parseInt(value)
              })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">7 days</SelectItem>
                <SelectItem value="14">14 days</SelectItem>
                <SelectItem value="30">30 days</SelectItem>
                <SelectItem value="60">60 days</SelectItem>
                <SelectItem value="90">90 days</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-gray-500 mt-1">
              Get notified when employee certificates are approaching expiration
            </p>
          </div>

          {advancedSettings.enable2FA && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <h4 className="font-medium text-green-900 mb-2">2FA Setup Required</h4>
              <p className="text-sm text-green-700 mb-3">
                To complete 2FA setup, scan the QR code with your authenticator app:
              </p>
              <div className="bg-white p-4 rounded border text-center">
                <div className="w-32 h-32 bg-gray-200 mx-auto mb-2 flex items-center justify-center">
                  QR Code Placeholder
                </div>
                <p className="text-xs text-gray-600">Google Authenticator / Authy</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Button className="w-full">
        Save Advanced Settings
      </Button>
    </div>
  );
};
