import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';
import { ArrowLeft, Mail, Send } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface ForgotPasswordFormProps {
  onBack: () => void;
}

const ForgotPasswordForm: React.FC<ForgotPasswordFormProps> = ({ onBack }) => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [emailError, setEmailError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setEmailError('');

    try {
      // Call custom edge function that sends branded email via Resend
      const { data, error } = await supabase.functions.invoke('send-password-reset', {
        body: { email: email.toLowerCase() }
      });

      if (error) {
        console.error('Password reset error:', error);
        setEmailError('Failed to send reset email. Please try again.');
        return;
      }

      toast({
        title: "Reset Link Sent",
        description: "If an account exists with that email, a password reset link has been sent.",
      });
      
      setSubmitted(true);
    } catch (error: any) {
      console.error('Password reset exception:', error);
      setEmailError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
        <CardHeader className="text-center pb-4">
          <CardTitle className="text-2xl font-bold text-slate-800 flex items-center justify-center space-x-2">
            <Mail className="h-6 w-6 text-orange-600" />
            <span>Check Your Email</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-slate-600">
            If an account with that email address exists, we've sent you a password reset link.
          </p>
          <p className="text-sm text-slate-500">
            Please check your email and follow the instructions to reset your password.
          </p>
          <Button
            onClick={onBack}
            variant="outline"
            className="w-full mt-6"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Login
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
      <CardHeader className="text-center pb-4">
        <CardTitle className="text-2xl font-bold text-slate-800">Reset Password</CardTitle>
        <p className="text-slate-600 mt-2">
          Enter your email address and we'll send you a link to reset your password.
        </p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="reset-email" className="text-slate-700 font-medium text-sm">
              Email Address
            </Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
              <Input
                id="reset-email"
                type="email"
                placeholder="Enter your email address"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setEmailError(''); // Clear error when user types
                }}
                required
                className={`pl-10 h-12 border-slate-200 focus:border-orange-500 focus:ring-orange-500 text-slate-700 bg-white/60 ${
                  emailError ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''
                }`}
              />
            </div>
            {emailError && (
              <p className="text-red-600 text-sm mt-1 flex items-center">
                <span className="mr-1">⚠</span>
                {emailError}
              </p>
            )}
          </div>
          
          <div className="space-y-4">
            <Button
              type="submit"
              className="w-full h-12 text-white font-semibold shadow-lg transition-all duration-200 hover:shadow-xl"
              style={{ backgroundColor: '#F26522' }}
              disabled={loading}
            >
              {loading ? (
                <div className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Sending...</span>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <Send className="h-4 w-4" />
                  <span>Send Reset Link</span>
                </div>
              )}
            </Button>
            
            <Button
              type="button"
              onClick={onBack}
              variant="outline"
              className="w-full h-12 border-2 border-slate-300 hover:border-orange-500 hover:bg-orange-50 text-slate-700 hover:text-orange-600 font-medium transition-all duration-200 bg-white/60"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Login
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default ForgotPasswordForm;