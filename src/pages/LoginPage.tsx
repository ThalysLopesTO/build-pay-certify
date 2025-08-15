import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { Building, Users } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';

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
      <Card className="w-full max-w-lg border-orange-200 shadow-2xl">
        <CardHeader className="text-center pb-8">
          <CardTitle className="text-4xl font-bold text-orange-600 flex items-center justify-center mb-4">
            <Building className="h-10 w-10 mr-3" />
            StackBuild
          </CardTitle>
          <h1 className="text-2xl font-semibold text-slate-800 mb-2">
            Choose Your Login Type
          </h1>
          <p className="text-slate-600">
            Select the appropriate login page for your role
          </p>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Admin Login Option */}
          <div className="p-6 border-2 border-orange-200 rounded-lg hover:border-orange-300 transition-colors">
            <div className="flex items-center mb-4">
              <Building className="h-8 w-8 text-orange-600 mr-3" />
              <div>
                <h3 className="text-lg font-semibold text-slate-800">Company Login</h3>
                <p className="text-sm text-slate-600">For administrators, managers, and foremen</p>
              </div>
            </div>
            <Link to="/admin-login">
              <Button className="w-full bg-orange-600 hover:bg-orange-700 text-white font-semibold">
                Access Company Dashboard
              </Button>
            </Link>
          </div>

          {/* Employee Login Option */}
          <div className="p-6 border-2 border-blue-200 rounded-lg hover:border-blue-300 transition-colors">
            <div className="flex items-center mb-4">
              <Users className="h-8 w-8 text-blue-600 mr-3" />
              <div>
                <h3 className="text-lg font-semibold text-slate-800">Employee Login</h3>
                <p className="text-sm text-slate-600">For field workers and staff</p>
              </div>
            </div>
            <Link to="/employee-login">
              <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold">
                Access Employee Dashboard
              </Button>
            </Link>
          </div>

          <div className="pt-6 border-t border-slate-200 text-center">
            <p className="text-slate-600 mb-4 text-sm">Don't have an account?</p>
            <Link to="/company/registration">
              <Button variant="outline" className="w-full border-orange-200 text-orange-600 hover:bg-orange-50">
                Start Your Free Trial
              </Button>
            </Link>
          </div>

          <div className="text-center">
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