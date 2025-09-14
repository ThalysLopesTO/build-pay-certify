import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { sendEmail } from '@/utils/sendEmail';
import { supabase } from '@/integrations/supabase/client';
import { Mail, Send, CheckCircle, AlertCircle, TestTube } from 'lucide-react';

const EmailTestComponent: React.FC = () => {
  const { toast } = useToast();
  const [testEmail, setTestEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [lastTestResult, setLastTestResult] = useState<'success' | 'error' | null>(null);

  // Test via sendEmail utility (full flow)
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
      console.log('🧪 Testing via sendEmail utility...');
      
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

  // Test directly via Supabase function (minimal test)
  const handleDirectTest = async () => {
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
      console.log('🔧 Testing edge function directly...');
      
      const testPayload = {
        to: testEmail,
        subject: 'Direct Function Test - StackBuild',
        html: '<h1>Direct Function Test</h1><p>This email was sent directly via the edge function to test basic functionality.</p><p><strong>Timestamp:</strong> ' + new Date().toISOString() + '</p>'
      };

      console.log('📤 Calling function directly:', testPayload);

      const { data, error } = await supabase.functions.invoke('send-email', {
        body: testPayload
      });

      console.log('📥 Direct function response:', { data, error });

      if (error) {
        throw new Error(`Function error: ${error.message}`);
      }

      if (!data || !data.success) {
        throw new Error(data?.error || 'Function returned failure');
      }

      setLastTestResult('success');
      toast({
        title: 'Direct Test Successful!',
        description: `Direct function call worked. Check ${testEmail}`,
      });

    } catch (error) {
      setLastTestResult('error');
      console.error('Direct test failed:', error);
      toast({
        title: 'Direct Test Failed',
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

        <div className="grid grid-cols-1 gap-2">
          <Button 
            onClick={handleTestEmail}
            disabled={isLoading || !testEmail}
            className="w-full"
            variant="default"
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Testing via sendEmail...
              </>
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                Test via sendEmail Utility
              </>
            )}
          </Button>
          
          <Button 
            onClick={handleDirectTest}
            disabled={isLoading || !testEmail}
            className="w-full"
            variant="outline"
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary mr-2"></div>
                Testing direct function...
              </>
            ) : (
              <>
                <TestTube className="h-4 w-4 mr-2" />
                Test Direct Function Call
              </>
            )}
          </Button>
        </div>

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

        <div className="text-xs text-muted-foreground space-y-1">
          <p><strong>sendEmail Utility:</strong> Tests the full email flow with branding</p>
          <p><strong>Direct Function:</strong> Tests the edge function directly (minimal)</p>
          <p><strong>Sender:</strong> no-reply@stackbuild.ca (verified domain)</p>
          <p><strong>Debug:</strong> Check browser console for detailed logs</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default EmailTestComponent;