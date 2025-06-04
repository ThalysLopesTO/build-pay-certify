
import React, { useState } from 'react';
import { useAuth } from '../contexts/SupabaseAuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';
import { Link } from 'react-router-dom';
import { Building } from 'lucide-react';

const LoginForm = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await login(email, password);
      if (error) {
        console.error('Login error:', error);
        toast({
          title: "Login Failed",
          description: error.message || "Invalid email or password",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Login Successful",
          description: "Welcome to Construction Payroll Manager",
        });
      }
    } catch (error) {
      console.error('Login error:', error);
      toast({
        title: "Error",
        description: "An error occurred during login",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-orange-900">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-orange-600">
            Construction Payroll Manager
          </CardTitle>
          <p className="text-slate-600 mt-2">Sign in to access the system</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            
            <Button 
              type="submit" 
              className="w-full bg-orange-600 hover:bg-orange-700"
              disabled={loading}
            >
              {loading ? 'Signing In...' : 'Sign In'}
            </Button>
          </form>
          
          <div className="mt-6 pt-4 border-t border-slate-200">
            <div className="text-center">
              <p className="text-sm text-slate-600 mb-3">New to the system?</p>
              <Link to="/register-company">
                <Button variant="outline" className="w-full">
                  <Building className="h-4 w-4 mr-2" />
                  Register Your Company
                </Button>
              </Link>
            </div>
          </div>
          
          <div className="mt-6 p-4 bg-slate-50 rounded-lg">
            <p className="text-sm font-medium mb-2">System Access:</p>
            <div className="space-y-1 text-xs text-slate-600">
              <p>• Employee accounts are created by administrators</p>
              <p>• Contact your site manager for access credentials</p>
              <p>• Unauthorized access is prohibited</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default LoginForm;
