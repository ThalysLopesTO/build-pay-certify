import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';
import { Lock, CheckCircle, AlertTriangle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  
  const token = searchParams.get('token');

  useEffect(() => {
    if (!token) {
      setError('Invalid or missing reset token');
    }
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!token) {
      setError('Invalid reset token');
      return;
    }

    if (password !== confirmPassword) {
      toast({
        title: "Passwords Don't Match",
        description: "Please ensure both passwords are identical.",
        variant: "destructive",
      });
      return;
    }

    if (password.length < 8) {
      toast({
        title: "Password Too Short",
        description: "Password must be at least 8 characters long.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      // Call our edge function to reset the password with the token
      const { error } = await supabase.functions.invoke('reset-password', {
        body: { 
          token,
          newPassword: password 
        }
      });

      if (error) {
        console.error('Password reset error:', error);
        if (error.message.includes('expired') || error.message.includes('invalid')) {
          setError('This reset link has expired or is invalid. Please request a new one.');
        } else {
          setError('Failed to reset password. Please try again.');
        }
      } else {
        setSuccess(true);
        toast({
          title: "Password Reset Successful",
          description: "Your password has been updated. You can now log in with your new password.",
        });
        
        // Redirect to login after 3 seconds
        setTimeout(() => {
          navigate('/admin/login');
        }, 3000);
      }
    } catch (error) {
      console.error('Password reset error:', error);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 via-slate-50 to-orange-100 px-6 py-12">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <img 
              src="/images/stackbuild-logo.webp" 
              alt="StackBuild Logo" 
              className="h-16 w-auto mx-auto mb-8"
            />
          </div>
          
          <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
            <CardHeader className="text-center pb-4">
              <CardTitle className="text-2xl font-bold text-slate-800 flex items-center justify-center space-x-2">
                <AlertTriangle className="h-6 w-6 text-red-600" />
                <span>Reset Link Invalid</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              <p className="text-slate-600">{error}</p>
              <Button
                onClick={() => navigate('/admin/login')}
                className="w-full h-12 text-white font-semibold"
                style={{ backgroundColor: '#F26522' }}
              >
                Back to Login
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 via-slate-50 to-orange-100 px-6 py-12">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <img 
              src="/images/stackbuild-logo.webp" 
              alt="StackBuild Logo" 
              className="h-16 w-auto mx-auto mb-8"
            />
          </div>
          
          <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
            <CardHeader className="text-center pb-4">
              <CardTitle className="text-2xl font-bold text-slate-800 flex items-center justify-center space-x-2">
                <CheckCircle className="h-6 w-6 text-green-600" />
                <span>Password Reset Complete</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              <p className="text-slate-600">
                Your password has been successfully updated. You will be redirected to the login page in a few seconds.
              </p>
              <Button
                onClick={() => navigate('/admin/login')}
                className="w-full h-12 text-white font-semibold"
                style={{ backgroundColor: '#F26522' }}
              >
                Go to Login
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 via-slate-50 to-orange-100 px-6 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <img 
            src="/images/stackbuild-logo.webp" 
            alt="StackBuild Logo" 
            className="h-16 w-auto mx-auto mb-8"
          />
          <h1 className="text-3xl font-bold text-slate-800 mb-2">Reset Your Password</h1>
          <p className="text-slate-600">Enter your new password below</p>
        </div>
        
        <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
          <CardContent className="p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="password" className="text-slate-700 font-medium text-sm">
                  New Password
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="Enter new password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={8}
                    className="pl-10 h-12 border-slate-200 focus:border-orange-500 focus:ring-orange-500 text-slate-700 bg-white/60"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-slate-700 font-medium text-sm">
                  Confirm New Password
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="Confirm new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    minLength={8}
                    className="pl-10 h-12 border-slate-200 focus:border-orange-500 focus:ring-orange-500 text-slate-700 bg-white/60"
                  />
                </div>
              </div>
              
              <Button
                type="submit"
                className="w-full h-12 text-white font-semibold shadow-lg transition-all duration-200 hover:shadow-xl"
                style={{ backgroundColor: '#F26522' }}
                disabled={loading}
              >
                {loading ? (
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Updating Password...</span>
                  </div>
                ) : (
                  'Update Password'
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ResetPassword;