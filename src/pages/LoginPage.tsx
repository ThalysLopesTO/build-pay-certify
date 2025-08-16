import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { Building2, Users } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import LoginHeader from '@/components/auth/LoginHeader';
import RoleCard from '@/components/auth/RoleCard';


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
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-900 to-orange-950 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <Card className="w-full max-w-md border-slate-200 shadow-2xl bg-white/95 backdrop-blur-sm">
            <CardContent className="text-center p-8">
              <div className="mb-6 flex items-center justify-center">
                <div className="flex items-center space-x-3">
                  <div className="p-3 bg-orange-600 rounded-xl">
                    <Building2 className="h-6 w-6 text-white" />
                  </div>
                  <h1 className="text-2xl font-bold text-slate-800">
                    StackBuild
                  </h1>
                </div>
              </div>
              <h1 className="text-2xl font-semibold text-slate-800 mb-2">
                Welcome Back!
              </h1>
              <p className="text-slate-600 text-lg">
                You're already logged in. Redirecting to your dashboard...
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  const handleCompanyLogin = () => {
    navigate('/admin-login');
  };

  const handleEmployeeLogin = () => {
    navigate('/employee-login');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-900 to-orange-950 flex items-center justify-center p-4">
      <div className="w-full max-w-[780px] mx-auto">
        <LoginHeader />
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <Card className="border-slate-200 shadow-2xl bg-white/95 backdrop-blur-sm rounded-2xl">
            <CardContent className="p-8 md:p-10">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <RoleCard
                  icon={Building2}
                  title="Company Login"
                  subtitle="For administrators, managers, and foremen"
                  ctaLabel="Access Company Dashboard"
                  onClick={handleCompanyLogin}
                  colorVariant="orange"
                  aria-label="Company login - Access the company dashboard for administrators, managers, and foremen"
                />
                
                <RoleCard
                  icon={Users}
                  title="Employee Login"
                  subtitle="For field workers and staff"
                  ctaLabel="Access Employee Dashboard"
                  onClick={handleEmployeeLogin}
                  colorVariant="blue"
                  aria-label="Employee login - Access the employee dashboard for field workers and staff"
                />
              </div>

              <motion.div 
                className="pt-6 border-t border-slate-200 text-center space-y-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.4 }}
              >
                <div>
                  <p className="text-slate-600 mb-4 text-sm">Don't have an account?</p>
                  <Link to="/company/registration">
                    <Button variant="outline" className="w-full md:w-auto border-orange-200 text-orange-600 hover:bg-orange-50 px-8">
                      Start Your Free Trial
                    </Button>
                  </Link>
                </div>

                <div className="flex items-center justify-center space-x-4 text-xs text-slate-500">
                  <Link 
                    to="/super-admin/login" 
                    className="hover:text-slate-700 transition-colors"
                  >
                    Super Admin Access
                  </Link>
                  <span>•</span>
                  <span className="hover:text-slate-700 transition-colors cursor-pointer">Privacy</span>
                  <span>•</span>
                  <span className="hover:text-slate-700 transition-colors cursor-pointer">Terms</span>
                  <span>•</span>
                  <span className="hover:text-slate-700 transition-colors cursor-pointer">Help</span>
                </div>
              </motion.div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default LoginPage;