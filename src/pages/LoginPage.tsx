import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { Building, Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  // If already authenticated, redirect to dashboard
  React.useEffect(() => {
    if (isAuthenticated) {
      navigate('/admin/dashboard');
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { error } = await login(email, password);
      
      if (error) {
        toast({
          title: "Login Failed",
          description: error.message || "Invalid email or password",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Welcome Back!",
        description: "Login successful. Redirecting to your dashboard...",
      });

      // Navigation will be handled by the useEffect above
    } catch (error: any) {
      toast({
        title: "Login Failed",
        description: error.message || "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-orange-900 flex items-center justify-center p-4">
        <Card className="w-full max-w-md border-orange-200 shadow-2xl">
          <CardHeader className="text-center pb-8">
            <CardTitle className="text-4xl font-bold text-orange-600 flex items-center justify-center mb-4">
              <Building className="h-10 w-10 mr-3" />
              StackBuild
            </CardTitle>
            <h1 className="text-2xl font-semibold text-slate-800 mb-2">
              Welcome Back!
            </h1>
            <p className="text-slate-600 text-lg">
              You're already logged in. Redirecting to your dashboard...
            </p>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-orange-900 flex items-center justify-center p-4">
      <Card className="w-full max-w-md border-orange-200 shadow-2xl">
        <CardHeader className="text-center pb-8">
          <CardTitle className="text-4xl font-bold text-orange-600 flex items-center justify-center mb-4">
            <Building className="h-10 w-10 mr-3" />
            StackBuild
          </CardTitle>
          <h1 className="text-2xl font-semibold text-slate-800 mb-2">
            Welcome Back
          </h1>
          <p className="text-slate-600">
            Sign in to your account to continue
          </p>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-slate-700 font-medium">
                Email Address
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  className="pl-10 h-12 border-slate-300 focus:border-orange-500 focus:ring-orange-500"
                  required
                  disabled={isLoading}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-slate-700 font-medium">
                Password
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="pl-10 pr-10 h-12 border-slate-300 focus:border-orange-500 focus:ring-orange-500"
                  required
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
                  disabled={isLoading}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <Link 
                to="/reset-password" 
                className="text-sm text-orange-600 hover:text-orange-700 font-medium"
              >
                Forgot your password?
              </Link>
            </div>

            <Button
              type="submit"
              className="w-full bg-orange-600 hover:bg-orange-700 h-12 text-lg font-semibold"
              disabled={isLoading}
            >
              {isLoading ? 'Signing In...' : 'Sign In'}
            </Button>
          </form>

          <div className="mt-8 pt-6 border-t border-slate-200 text-center">
            <p className="text-slate-600 mb-4">
              Don't have an account?
            </p>
            <Link to="/company/registration">
              <Button variant="outline" className="w-full border-orange-200 text-orange-600 hover:bg-orange-50">
                Start Your Free Trial
              </Button>
            </Link>
          </div>

          <div className="mt-4 text-center">
            <Link 
              to="/super-admin/login" 
              className="text-xs text-slate-500 hover:text-slate-700"
            >
              Super Admin Access
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default LoginPage;