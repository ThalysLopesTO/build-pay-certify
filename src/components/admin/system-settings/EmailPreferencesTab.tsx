
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Mail, Clock, Copy, Eye } from 'lucide-react';

export const EmailPreferencesTab = () => {
  const [emailSettings, setEmailSettings] = useState({
    invoiceSubject: 'Invoice #{invoice_number} from {company_name}',
    invoiceHeader: 'Thank you for your business! Please find your invoice attached.',
    invoiceFooter: 'If you have any questions, please don\'t hesitate to contact us.',
    enableReminders: true,
    reminderDaysBefore: 3,
    reminderDaysAfter: 7,
    bccEmail: '',
    enableInternalCopy: false
  });

  const [previewMode, setPreviewMode] = useState(false);

  const generatePreview = () => {
    return `Subject: ${emailSettings.invoiceSubject.replace('{invoice_number}', 'INV-0001').replace('{company_name}', 'ABC Construction')}

${emailSettings.invoiceHeader}

Invoice Details:
• Invoice Number: INV-0001
• Amount Due: $2,500.00
• Due Date: March 15, 2024

You can download the invoice PDF using the link provided or from the attachment.

${emailSettings.invoiceFooter}

Best regards,
ABC Construction Team`;
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Mail className="h-5 w-5" />
            <span>Invoice Email Template</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <Label htmlFor="subject">Subject Line</Label>
            <Input
              id="subject"
              value={emailSettings.invoiceSubject}
              onChange={(e) => setEmailSettings({...emailSettings, invoiceSubject: e.target.value})}
              placeholder="Invoice #{invoice_number} from {company_name}"
            />
            <p className="text-xs text-gray-500 mt-1">
              Use {'{invoice_number}'} and {'{company_name}'} as placeholders
            </p>
          </div>

          <div>
            <Label htmlFor="header">Header Message</Label>
            <Textarea
              id="header"
              value={emailSettings.invoiceHeader}
              onChange={(e) => setEmailSettings({...emailSettings, invoiceHeader: e.target.value})}
              placeholder="Thank you for your business..."
              rows={3}
            />
          </div>

          <div>
            <Label htmlFor="footer">Footer Signature</Label>
            <Textarea
              id="footer"
              value={emailSettings.invoiceFooter}
              onChange={(e) => setEmailSettings({...emailSettings, invoiceFooter: e.target.value})}
              placeholder="Best regards, Your Company Team"
              rows={3}
            />
          </div>

          <div className="flex items-center space-x-4">
            <Button
              variant={previewMode ? "default" : "outline"}
              onClick={() => setPreviewMode(!previewMode)}
              className="flex items-center space-x-2"
            >
              <Eye className="h-4 w-4" />
              <span>{previewMode ? 'Hide Preview' : 'Show Preview'}</span>
            </Button>
          </div>

          {previewMode && (
            <div className="bg-gray-50 p-4 rounded-lg border">
              <h4 className="font-medium mb-2">Email Preview:</h4>
              <pre className="text-sm whitespace-pre-wrap">{generatePreview()}</pre>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Clock className="h-5 w-5" />
            <span>Automatic Reminders</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="reminders">Enable Overdue Invoice Reminders</Label>
              <p className="text-sm text-gray-600">Automatically send reminder emails for overdue invoices</p>
            </div>
            <Switch
              id="reminders"
              checked={emailSettings.enableReminders}
              onCheckedChange={(checked) => setEmailSettings({...emailSettings, enableReminders: checked})}
            />
          </div>

          {emailSettings.enableReminders && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-6 border-l-2 border-orange-200">
              <div>
                <Label htmlFor="daysBefore">Days Before Due Date</Label>
                <Select
                  value={emailSettings.reminderDaysBefore.toString()}
                  onValueChange={(value) => setEmailSettings({...emailSettings, reminderDaysBefore: parseInt(value)})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 day</SelectItem>
                    <SelectItem value="3">3 days</SelectItem>
                    <SelectItem value="5">5 days</SelectItem>
                    <SelectItem value="7">7 days</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="daysAfter">Days After Due Date</Label>
                <Select
                  value={emailSettings.reminderDaysAfter.toString()}
                  onValueChange={(value) => setEmailSettings({...emailSettings, reminderDaysAfter: parseInt(value)})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 day</SelectItem>
                    <SelectItem value="3">3 days</SelectItem>
                    <SelectItem value="7">7 days</SelectItem>
                    <SelectItem value="14">14 days</SelectItem>
                    <SelectItem value="30">30 days</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Copy className="h-5 w-5" />
            <span>Internal Copy & Logging</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <Label htmlFor="bcc">BCC Email Address</Label>
            <Input
              id="bcc"
              type="email"
              value={emailSettings.bccEmail}
              onChange={(e) => setEmailSettings({...emailSettings, bccEmail: e.target.value})}
              placeholder="accounting@yourcompany.com"
            />
            <p className="text-xs text-gray-500 mt-1">
              Optional: Add an email address to receive copies of all outgoing invoices
            </p>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="internalCopy">Save Copy for Internal Records</Label>
              <p className="text-sm text-gray-600">Keep a copy of all sent emails in the system</p>
            </div>
            <Switch
              id="internalCopy"
              checked={emailSettings.enableInternalCopy}
              onCheckedChange={(checked) => setEmailSettings({...emailSettings, enableInternalCopy: checked})}
            />
          </div>
        </CardContent>
      </Card>

      <Button className="w-full">
        Save Email Preferences
      </Button>
    </div>
  );
};
