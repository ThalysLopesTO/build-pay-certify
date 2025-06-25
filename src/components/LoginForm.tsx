
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
    <div className="min-h-screen flex">
      {/* Left Side - Centered Login Form */}
      <div className="flex-1 flex items-center justify-center bg-slate-50 px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-md space-y-8">
          {/* StackBuild Logo - Larger Size */}
          <div className="text-center">
            <div className="flex justify-center mb-8">
              <div className="relative">
                <img 
                  src="/lovable-uploads/bef9bd69-be4a-4d88-bbc9-2f3c22bf3643.png" 
                  alt="StackBuild Logo" 
                  className="h-24 w-auto"
                />
              </div>
            </div>
            <h1 className="text-3xl font-bold text-slate-800 mb-2">Log In</h1>
            <p className="text-slate-600">Welcome back to StackBuild</p>
          </div>

          {/* Login Form Card */}
          <Card className="border-0 shadow-xl bg-white/90 backdrop-blur-sm">
            <CardContent className="p-8">
              <form onSubmit={handleLogin} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-slate-700 font-medium">
                    Email Address
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-5 w-5" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="Enter your email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="pl-10 h-12 border-slate-200 focus:border-orange-500 focus:ring-orange-500 rounded-lg"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-slate-700 font-medium">
                    Password
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-5 w-5" />
                    <Input
                      id="password"
                      type="password"
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="pl-10 h-12 border-slate-200 focus:border-orange-500 focus:ring-orange-500 rounded-lg"
                    />
                  </div>
                </div>
                
                <Button 
                  type="submit" 
                  className="w-full h-12 bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600 text-white font-semibold rounded-lg shadow-lg transform transition-all duration-200 hover:scale-[1.02] hover:shadow-xl"
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
              
              <div className="mt-8 pt-6 border-t border-slate-200">
                <div className="text-center space-y-4">
                  <p className="text-sm text-slate-600">New to StackBuild?</p>
                  <Link to="/register-company">
                    <Button 
                      variant="outline" 
                      className="w-full h-12 border-2 border-slate-300 hover:border-orange-500 hover:bg-orange-50 text-slate-700 hover:text-orange-600 font-medium rounded-lg transition-all duration-200"
                    >
                      <Building className="h-4 w-4 mr-2" />
                      Register Your Company
                    </Button>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Right Side - Background Image */}
      {/* 
        BACKGROUND IMAGE REPLACEMENT AREA:
        Replace the URL below with your custom construction jobsite photo.
        The current image is a placeholder construction scene.
        Recommended image specs: High resolution, landscape orientation, 
        shows construction workers or jobsite activity.
      */}
      <div className="hidden lg:flex flex-1 relative">
        <div 
          className="w-full bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: `url('https://images.unsplash.com/photo-1487958449943-2429e8be8625?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80')`
          }}
        >
          {/* Subtle Dark Overlay for Visual Separation */}
          <div className="absolute inset-0 bg-gradient-to-l from-slate-900/30 via-slate-900/20 to-slate-900/10"></div>
        </div>
      </div>
    </div>
  );
};

export default LoginForm;
