import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/SupabaseAuthContext';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';
import { Link } from 'react-router-dom';
import { Building, ArrowRight, Mail, Lock, Users } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import PWAInstallButton from '@/components/common/PWAInstallButton';
import LoginLoading from '@/components/common/LoginLoading';
import ForgotPasswordForm from '@/components/ForgotPasswordForm';
const LoginForm = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const {
    login,
    isAuthenticated,
    user
  } = useAuth();
  const navigate = useNavigate();

  // Handle navigation after successful login
  useEffect(() => {
    if (isAuthenticated && user) {
      // Stop loading state before navigation
      setLoading(false);

      // Role-based redirect with enhanced logging
      switch (user.role) {
        case 'admin':
        case 'super_admin':
          navigate('/admin/dashboard', { replace: true });
          break;
        case 'management':
          navigate('/management/dashboard', { replace: true });
          break;
        case 'foreman':
          navigate('/foreman/dashboard', { replace: true });
          break;
        case 'employee':
          toast({
            title: "Access Denied",
            description: "This login page is for company/admin users only. Please use the Employee Login page.",
            variant: "destructive"
          });
          logout();
          return;
        default:
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
      const { error } = await login(email, password, 'admin');
      console.log("ERROR LOGIN: ", error)
      
      if (error) {
        console.error('❌ Login error:', error);
        toast({
          title: "Login Failed",
          description: error.message || "Invalid email or password",
          variant: "destructive"
        });
        setLoading(false);
      } else {
        // console.log('✅ Login successful, waiting for auth state update...');
        // console.log('🔍 Post-login auth state:', {
        //   isAuthenticated,
        //   user: user?.email
        // });
        // toast({
        //   title: "Welcome Back",
        //   description: "Successfully logged into StackBuild"
        // });

        // // Wait for auth state to update before timing out
        // let attempts = 0;
        // const maxAttempts = 50; // 5 seconds with 100ms intervals

        // const checkAuthUpdate = () => {
        //   attempts++;
        //   console.log(`🔄 Auth check attempt ${attempts}/50:`, {
        //     isAuthenticated,
        //     userRole: user?.role,
        //     userEmail: user?.email
        //   });
        //   if (isAuthenticated && user?.role) {
        //     console.log('✅ Auth state updated successfully, user role:', user.role);
        //     setLoading(false);
        //     // Don't manually navigate - let useEffect handle it
        //     return;
        //   }
        //   if (attempts >= maxAttempts) {
        //     console.warn('⚠️ Auth state update timeout after 5 seconds, forcing redirect...');
        //     setLoading(false);
        //     // Force redirect as fallback
        //     window.location.href = '/admin/dashboard';
        //     return;
        //   }

        //   // Continue checking
        //   setTimeout(checkAuthUpdate, 100);
        // };

        // // Start checking for auth state update
        // setTimeout(checkAuthUpdate, 100);
      }
    } catch (error) {
      console.error('💥 Login error:', error);
      toast({
        title: "Error",
        description: "An error occurred during login",
        variant: "destructive"
      });
      setLoading(false);
    }
  };
  return <>
      {loading && isAuthenticated && user && <LoginLoading message="Setting up your admin dashboard..." />}
      <div className="min-h-screen flex bg-gradient-to-br from-orange-50 via-slate-50 to-orange-100">
      {/* Left Side - Login Form */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 lg:px-8">
        <div className="w-full max-w-md">
          {/* StackBuild Logo */}
          <div className="text-center mb-8">
            <img src="/lovable-uploads/3496e725-3945-4e97-9e3b-23e2b57ac36b.png" alt="StackBuild Logo" className="h-16 w-auto mx-auto mb-8" />
            <h1 className="text-3xl font-bold text-slate-800 mb-2">Company Login</h1>
            <p className="text-slate-600">Welcome back to StackBuild</p>
            
            {/* PWA Install Button */}
            <div className="mt-4">
              <PWAInstallButton />
            </div>
          </div>

          {/* Employee Login Navigation */}
          <div className="mb-6 p-4 rounded-lg border border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 rounded-full bg-blue-100">
                  <Users className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-800">Are you an Employee?</p>
                  <p className="text-xs text-slate-600">Use the employee login portal</p>
                </div>
              </div>
              <Link to="/employee-login">
                <Button 
                  type="button"
                  variant="outline"
                  className="bg-blue-600 hover:bg-blue-700 text-white border-blue-600 hover:border-blue-700 transition-all duration-200 shadow-md hover:shadow-lg"
                >
                  Employee Login
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </Link>
            </div>
          </div>

          {/* Login Form Card with Light Background */}
          {showForgotPassword ? <ForgotPasswordForm onBack={() => setShowForgotPassword(false)} /> : <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
              <CardContent className="p-8">
                <form onSubmit={handleLogin} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-slate-700 font-medium text-sm">
                    Email
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
                    <Input id="email" type="email" placeholder="Enter your email" value={email} onChange={e => setEmail(e.target.value)} required className="pl-10 h-12 border-slate-200 focus:border-orange-500 focus:ring-orange-500 text-slate-700 bg-white/60" />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-slate-700 font-medium text-sm">
                    Password
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
                    <Input id="password" type="password" placeholder="Enter your password" value={password} onChange={e => setPassword(e.target.value)} required className="pl-10 h-12 border-slate-200 focus:border-orange-500 focus:ring-orange-500 text-slate-700 bg-white/60" />
                  </div>
                </div>
                
                <Button type="submit" className="w-full h-12 text-white font-semibold shadow-lg transition-all duration-200 hover:shadow-xl" style={{
                  backgroundColor: '#F26522'
                }} disabled={loading}>
                  {loading ? <div className="flex items-center space-x-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Signing In...</span>
                    </div> : <div className="flex items-center space-x-2">
                      <span>Log In</span>
                      <ArrowRight className="h-4 w-4" />
                    </div>}
                </Button>
              </form>
              
              <div className="mt-6 text-center">
                <button type="button" onClick={() => setShowForgotPassword(true)} className="text-sm text-slate-600 hover:text-orange-600 underline transition-colors duration-200">
                  Forgot your password?
                </button>
              </div>
              
              
            </CardContent>
          </Card>}
        </div>
      </div>

      {/* Right Side - Background Image */}
      {/* 
        BACKGROUND IMAGE CUSTOMIZATION:
        Replace the CSS background-image URL below with your construction jobsite photo.
        Example: bg-[url('/images/construction-jobsite.jpg')]
        Current placeholder: Unsplash construction image
       */}
      <div className="flex-1 lg:block hidden relative">
        <div className="w-full h-full bg-cover bg-center bg-no-repeat" style={{
          backgroundImage: `url('/images/admin-login-bg.png')`
        }}>
          {/* Subtle overlay for depth */}
          <div className="absolute inset-0 bg-gradient-to-l from-slate-900/20 to-transparent"></div>
        </div>
      </div>

      {/* Mobile: Image on top for small screens */}
      <div className="lg:hidden h-64 relative">
        <div className="w-full h-full bg-cover bg-center bg-no-repeat" style={{
          backgroundImage: `url('/images/admin-login-bg.png')`
        }}>
          <div className="absolute inset-0 bg-gradient-to-b from-slate-900/30 to-transparent"></div>
        </div>
      </div>
      </div>
    </>;
};
export default LoginForm;