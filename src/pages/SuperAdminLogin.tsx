
import React, { useState } from 'react';
import { useAuth } from '../contexts/SupabaseAuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';
import { Shield, Lock } from 'lucide-react';
import { Navigate } from 'react-router-dom';

const SuperAdminLogin = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [accessDenied, setAccessDenied] = useState(false);
  const { login, user, isAuthenticated } = useAuth();

  // If already authenticated and is super admin, redirect
  if (isAuthenticated && user?.role === 'super_admin') {
    return <Navigate to="/super-admin" replace />;
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setAccessDenied(false);

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
        // Wait a moment for auth state to update
        setTimeout(() => {
          // This will be handled by the auth context and routing
        }, 100);
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

  // Check if user logged in but is not super admin
  React.useEffect(() => {
    if (isAuthenticated && user && user.role !== 'super_admin') {
      setAccessDenied(true);
      toast({
        title: "Access Denied",
        description: "You are not a Super Admin",
        variant: "destructive",
      });
    }
  }, [isAuthenticated, user]);

  if (accessDenied) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-indigo-900">
        <Card className="w-full max-w-md border-red-500 bg-red-50">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold text-red-600 flex items-center justify-center gap-2">
              <Shield className="h-6 w-6" />
              Access Denied
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center space-y-4">
              <p className="text-red-700">You are not a Super Admin</p>
              <Button 
                variant="outline" 
                onClick={() => {
                  setAccessDenied(false);
                  setEmail('');
                  setPassword('');
                }}
                className="w-full"
              >
                Try Again
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-indigo-900">
      <div className="w-full max-w-md">
        <Card className="border-purple-500 bg-slate-800 text-white">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold text-purple-400 flex items-center justify-center gap-2 mb-2">
              <Lock className="h-6 w-6" />
              Super Admin Login
            </CardTitle>
            <p className="text-slate-300 text-sm">
              Sign in to access administrative controls for managing company registrations and system settings.
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-slate-300">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your admin email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password" className="text-slate-300">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400"
                />
              </div>
              
              <Button 
                type="submit" 
                className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold"
                disabled={loading}
              >
                {loading ? 'Signing In...' : 'Sign In'}
              </Button>
            </form>
            
            <div className="mt-6 pt-4 border-t border-slate-600">
              <div className="text-center">
                <div className="flex items-center justify-center gap-2 text-purple-400 text-sm">
                  <Shield className="h-4 w-4" />
                  <span className="font-medium">Super Admin Access Only</span>
                </div>
                <p className="text-slate-400 text-xs mt-1">
                  Unauthorized logins will be blocked
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SuperAdminLogin;
