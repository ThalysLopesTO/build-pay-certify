import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/SupabaseAuthContext';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';
import { Link } from 'react-router-dom';
import { Users, ArrowRight, User, Lock, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import PWAInstallButton from '@/components/common/PWAInstallButton';
import LoginLoading from '@/components/common/LoginLoading';

const EmployeeLoginForm = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { loginWithUsername, isAuthenticated, user } = useAuth();
  const navigate = useNavigate();

  // Handle navigation after successful login
  useEffect(() => {
    if (isAuthenticated && user) {
      console.log('🎯 Employee login successful, navigating to dashboard for role:', user.role);
      console.log('📊 Full user object:', user);
      
      // Stop loading state before navigation
      setLoading(false);
      
      // Role-based redirect with enhanced logging
      switch (user.role) {
        case 'admin':
        case 'super_admin':
          console.log('🔐 Admin user detected, redirecting to admin dashboard');
          navigate('/admin/dashboard', { replace: true });
          break;
        case 'management':
          console.log('📊 Management user detected, redirecting to management dashboard');
          navigate('/management/dashboard', { replace: true });
          break;
        case 'foreman':
          console.log('👷 Foreman user detected, redirecting to foreman dashboard');
          navigate('/foreman/dashboard', { replace: true });
          break;
        case 'employee':
          console.log('👤 Employee user detected, redirecting to employee dashboard');
          navigate('/employee/dashboard', { replace: true });
          break;
        default:
          console.warn('⚠️ Unknown role detected:', user.role, 'redirecting to home');
          // Fallback to home page if role is undefined
          navigate('/', { replace: true });
      }
    } else if (isAuthenticated && !user) {
      console.log('🔄 User authenticated but profile not loaded yet...');
    }
  }, [isAuthenticated, user, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      console.log('🔑 Attempting username login for:', username);
      console.log('🔍 Pre-login auth state:', { isAuthenticated, user: user?.email });
      
      const { error } = await loginWithUsername(username, password, 'employee');
      
      if (error) {
        console.error('❌ Login error:', error);
        toast({
          title: "Login Failed",
          description: error.message || "Invalid username or password",
          variant: "destructive",
        });
        setLoading(false);
      } else {
        console.log('✅ Login successful, waiting for auth state update...');
        console.log('🔍 Post-login auth state:', { isAuthenticated, user: user?.email });
        
        toast({
          title: "Welcome Back",
          description: "Successfully logged into StackBuild",
        });
        
        // After successful login, directly check session and navigate
        console.log('✅ Login successful, checking session...');
        
        // Small delay to ensure auth state updates
        setTimeout(() => {
          console.log('🔄 Checking current auth state:', { isAuthenticated, userRole: user?.role });
          
          if (isAuthenticated && user?.role) {
            console.log('✅ Auth state already updated, navigation will happen via useEffect');
            setLoading(false);
          } else {
            console.log('⚡ Auth state not yet updated, navigating directly...');
            setLoading(false);
            navigate('/employee/dashboard');
          }
        }, 200);
      }
    } catch (error) {
      console.error('💥 Login error:', error);
      toast({
        title: "Error",
        description: "An error occurred during login",
        variant: "destructive",
      });
      setLoading(false);
    }
  };


  return (
    <>
      {loading && isAuthenticated && user && (
        <LoginLoading message="Setting up your employee dashboard..." />
      )}
      <div className="min-h-screen flex bg-gradient-to-br from-blue-50 via-slate-50 to-blue-100">
      {/* Left Side - Login Form */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 lg:px-8">
        <div className="w-full max-w-md">
          {/* StackBuild Logo */}
          <div className="text-center mb-8">
            <img 
              src="/lovable-uploads/3496e725-3945-4e97-9e3b-23e2b57ac36b.png" 
              alt="StackBuild Logo" 
              className="h-16 w-auto mx-auto mb-8"
            />
            <h1 className="text-3xl font-bold text-slate-800 mb-2">Employee Login</h1>
            <p className="text-slate-600">Access your work dashboard</p>
            
            {/* PWA Install Button */}
            <div className="mt-4">
              <PWAInstallButton />
            </div>
          </div>

          {/* Info Alert for Employee Login */}
          <Alert className="mb-6 border-blue-200 bg-blue-50/80">
            <Users className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-700">
              This login page is specifically for employees. If you're a company admin, please use the 
              <Link to="/login" className="font-medium underline ml-1">Company Login</Link> page.
            </AlertDescription>
          </Alert>

          {/* Login Form Card with Light Background */}
          <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
            <CardContent className="p-8">
              <form onSubmit={handleLogin} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="username" className="text-slate-700 font-medium text-sm">
                    Username
                  </Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
                    <Input
                      id="username"
                      type="text"
                      placeholder="Enter your username"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      required
                      className="pl-10 h-12 border-slate-200 focus:border-blue-500 focus:ring-blue-500 text-slate-700 bg-white/60"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-slate-700 font-medium text-sm">
                    Password
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
                    <Input
                      id="password"
                      type="password"
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="pl-10 h-12 border-slate-200 focus:border-blue-500 focus:ring-blue-500 text-slate-700 bg-white/60"
                    />
                  </div>
                </div>
                
                <Button 
                  type="submit" 
                  className="w-full h-12 text-white font-semibold shadow-lg transition-all duration-200 hover:shadow-xl bg-blue-600 hover:bg-blue-700"
                  disabled={loading}
                >
                  {loading ? (
                    <div className="flex items-center space-x-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Signing In...</span>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-2">
                      <span>Employee Login</span>
                      <ArrowRight className="h-4 w-4" />
                    </div>
                  )}
                </Button>
              </form>
              
              <div className="mt-8 pt-6 border-t border-slate-200 text-center">
                <p className="text-sm text-slate-600 mb-4">Need help with your account?</p>
                <p className="text-xs text-slate-500">
                  Contact your company administrator for assistance with your username or password.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Right Side - Background Image */}
      <div className="flex-1 lg:block hidden relative">
        <div 
          className="w-full h-full bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: `url('https://images.unsplash.com/photo-1581094794329-c8112a89af12?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80')`
          }}
        >
          {/* Subtle overlay for depth */}
          <div className="absolute inset-0 bg-gradient-to-l from-slate-900/20 to-transparent"></div>
        </div>
      </div>

      {/* Mobile: Image on top for small screens */}
      <div className="lg:hidden h-64 relative">
        <div 
          className="w-full h-full bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: `url('https://images.unsplash.com/photo-1581094794329-c8112a89af12?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80')`
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-b from-slate-900/30 to-transparent"></div>
        </div>
      </div>
      </div>
    </>
  );
};

export default EmployeeLoginForm;