
import React, { useState } from 'react';
import { useAuth } from '../contexts/SupabaseAuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';
import { Link } from 'react-router-dom';
import { Building, ArrowRight, Mail, Lock } from 'lucide-react';

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
          title: "Welcome Back",
          description: "Successfully logged into StackBuild",
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
    <div className="min-h-screen flex flex-col lg:flex-row bg-gradient-to-br from-orange-50 via-slate-50 to-orange-100">
      {/* Left Side - Login Form */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 lg:px-8">
        <div className="w-full max-w-md">
          {/* StackBuild Logo */}
          <div className="text-center mb-8">
            <img 
              src="/lovable-uploads/bef9bd69-be4a-4d88-bbc9-2f3c22bf3643.png" 
              alt="StackBuild Logo" 
              className="h-20 w-auto mx-auto mb-8"
            />
            <h1 className="text-3xl font-bold text-slate-800 mb-2">Log In</h1>
            <p className="text-slate-600">Welcome back to StackBuild</p>
          </div>

          {/* Login Form Card */}
          <Card className="border-0 shadow-2xl bg-white">
            <CardContent className="p-8">
              <form onSubmit={handleLogin} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-slate-700 font-medium text-sm">
                    Email
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="Enter your email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="pl-10 h-12 border-slate-200 focus:border-orange-500 focus:ring-orange-500 text-slate-700"
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
                      className="pl-10 h-12 border-slate-200 focus:border-orange-500 focus:ring-orange-500 text-slate-700"
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
                      <span>Signing In...</span>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-2">
                      <span>Log In</span>
                      <ArrowRight className="h-4 w-4" />
                    </div>
                  )}
                </Button>
              </form>
              
              <div className="mt-8 pt-6 border-t border-slate-200 text-center">
                <p className="text-sm text-slate-600 mb-4">Don't have access?</p>
                <Link to="/register-company">
                  <Button 
                    variant="outline" 
                    className="w-full h-12 border-2 border-slate-300 hover:border-orange-500 hover:bg-orange-50 text-slate-700 hover:text-orange-600 font-medium transition-all duration-200"
                  >
                    <Building className="h-4 w-4 mr-2" />
                    Register Your Company
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
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
        <div 
          className="w-full h-full bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: `url('https://images.unsplash.com/photo-1487958449943-2429e8be8625?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80')`
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
            backgroundImage: `url('https://images.unsplash.com/photo-1487958449943-2429e8be8625?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80')`
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-b from-slate-900/30 to-transparent"></div>
        </div>
      </div>
    </div>
  );
};

export default LoginForm;
