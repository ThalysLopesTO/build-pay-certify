import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { Building2, Users } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import LoginHeader from '@/components/auth/LoginHeader';
import RoleTile from '@/components/auth/RoleTile';

const LoginPage = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // If already authenticated, redirect to dashboard
  React.useEffect(() => {
    if (isAuthenticated) {
      navigate('/admin/dashboard');
    }
  }, [isAuthenticated, navigate]);

  if (isAuthenticated) {
    return (
      <div className="min-h-screen flex bg-gradient-to-br from-orange-50 via-slate-50 to-orange-100">
        <div className="flex-1 flex items-center justify-center px-6 py-12 lg:px-8">
          <Card className="w-full max-w-md border-0 shadow-xl bg-white/80 backdrop-blur-sm">
            <CardContent className="text-center p-8">
              <div className="flex items-center justify-center mb-6">
                <div className="flex items-center space-x-3">
                  <div className="p-3 bg-orange-600 rounded-xl">
                    <Building2 className="h-6 w-6 text-white" />
                  </div>
                  <h1 className="text-2xl font-bold text-slate-800">StackBuild</h1>
                </div>
              </div>
              <h1 className="text-2xl font-semibold text-slate-800 mb-2">Welcome Back!</h1>
              <p className="text-slate-600 text-lg">
                You're already logged in. Redirecting to your dashboard...
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Right Side - Background Image */}
        <div className="flex-1 lg:block hidden relative">
          <div
            className="w-full h-full bg-cover bg-center bg-no-repeat"
            style={{
              backgroundImage: `url('/lovable-uploads/81c0730a-56f4-4b76-b03c-d703c6fcbd76.png')`,
            }}
          >
            <div className="absolute inset-0 bg-gradient-to-l from-slate-900/20 to-transparent" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-gradient-to-br from-orange-50 via-slate-50 to-orange-100">
      {/* Left Side - Role Selection */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 lg:px-8">
        <div className="w-full max-w-md">
          <LoginHeader />

          {/* Role Options */}
          <div className="space-y-4 mb-8">
            <RoleTile
              icon={Building2}
              title="Company Login"
              subtitle="For administrators, managers, and foremen"
              ctaLabel="Access Company Dashboard"
              href="/admin-login"
              colorVariant="orange"
              aria-label="Company Login - Access Company Dashboard for administrators, managers, and foremen"
            />

            <RoleTile
              icon={Users}
              title="Employee Login"
              subtitle="For field workers and staff"
              ctaLabel="Access Employee Dashboard"
              href="/employee-login"
              colorVariant="blue"
              aria-label="Employee Login - Access Employee Dashboard for field workers and staff"
            />
          </div>

          {/* Footer */}
          <div className="text-center space-y-4">
            <div>
              <Link to="/company/registration"></Link>
            </div>
            {/* Footer Links */}
          </div>
        </div>
      </div>

      {/* Right Side - Background Image */}
      <div className="flex-1 lg:block hidden relative">
        <div
          className="w-full h-full bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: `url('/lovable-uploads/81c0730a-56f4-4b76-b03c-d703c6fcbd76.png')`,
          }}
        >
          {/* Subtle overlay for depth */}
          <div className="absolute inset-0 bg-gradient-to-l from-slate-900/20 to-transparent" />
        </div>
      </div>

      {/* Mobile: Image on top for small screens */}
      <div className="lg:hidden h-64 relative order-first">
        <div
          className="w-full h-full bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: `url('/lovable-uploads/81c0730a-56f4-4b76-b03c-d703c6fcbd76.png')`,
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-b from-slate-900/30 to-transparent" />
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
