import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { sendEmail } from '@/utils/sendEmail';
import { Mail, Send, CheckCircle, AlertCircle } from 'lucide-react';

const EmailTestComponent: React.FC = () => {
  const { toast } = useToast();
  const [testEmail, setTestEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [lastTestResult, setLastTestResult] = useState<'success' | 'error' | null>(null);

  const handleTestEmail = async () => {
    if (!testEmail || !testEmail.includes('@')) {
      toast({
        title: 'Invalid Email',
        description: 'Please enter a valid email address',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    setLastTestResult(null);

    try {
      const result = await sendEmail({
        to: testEmail,
        subject: 'StackBuild Email System Test',
        bodyText: 'This is a test email to verify that the StackBuild email system is working correctly.\n\nIf you received this email, the system is functioning properly!\n\nTime sent: ' + new Date().toLocaleString(),
        companyData: {
          name: 'StackBuild',
          address: 'Test Address',
          phone: '555-123-4567',
        }
      });

      if (result.success) {
        setLastTestResult('success');
        toast({
          title: 'Test Email Sent Successfully!',
          description: `Check ${testEmail} for the test message`,
        });
      } else {
        throw new Error(result.error || 'Unknown error');
      }
    } catch (error) {
      setLastTestResult('error');
      console.error('Test email failed:', error);
      toast({
        title: 'Test Email Failed',
        description: error instanceof Error ? error.message : 'Unknown error occurred',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mail className="h-5 w-5" />
          Email System Test
        </CardTitle>
        <CardDescription>
          Test the email system to ensure it's working correctly
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="test-email">Test Email Address</Label>
          <Input
            id="test-email"
            type="email"
            placeholder="your.email@example.com"
            value={testEmail}
            onChange={(e) => setTestEmail(e.target.value)}
          />
        </div>

        <Button 
          onClick={handleTestEmail}
          disabled={isLoading || !testEmail}
          className="w-full"
        >
          {isLoading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Sending Test Email...
            </>
          ) : (
            <>
              <Send className="h-4 w-4 mr-2" />
              Send Test Email
            </>
          )}
        </Button>

        {lastTestResult && (
          <div className={`flex items-center gap-2 text-sm p-2 rounded ${
            lastTestResult === 'success' 
              ? 'bg-green-50 text-green-700 border border-green-200' 
              : 'bg-red-50 text-red-700 border border-red-200'
          }`}>
            {lastTestResult === 'success' ? (
              <CheckCircle className="h-4 w-4" />
            ) : (
              <AlertCircle className="h-4 w-4" />
            )}
            {lastTestResult === 'success' 
              ? 'Email sent successfully!' 
              : 'Email failed to send - check console for details'
            }
          </div>
        )}

        <div className="text-xs text-muted-foreground">
          <p><strong>Note:</strong> This test uses the Resend sandbox domain (onboarding@resend.dev) for reliable delivery.</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default EmailTestComponent;