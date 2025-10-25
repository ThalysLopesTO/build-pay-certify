import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import SuperAdminCreator from '@/components/SuperAdminCreator';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, AlertCircle, Loader2 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

const SuperAdminSetup = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [hasExistingAdmin, setHasExistingAdmin] = useState(false);

  useEffect(() => {
    checkForExistingSuperAdmin();
  }, []);

  const checkForExistingSuperAdmin = async () => {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('id')
        .eq('role', 'super_admin')
        .limit(1);

      if (error) {
        console.error('Error checking for super admin:', error);
        setIsLoading(false);
        return;
      }

      if (data && data.length > 0) {
        setHasExistingAdmin(true);
        // Redirect to login after a brief delay
        setTimeout(() => {
          navigate('/super-admin/login', { replace: true });
        }, 2000);
      } else {
        setIsLoading(false);
      }
    } catch (error) {
      console.error('Unexpected error checking for super admin:', error);
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted flex items-center justify-center p-4">
        <Card className="w-full max-w-2xl">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
            <p className="text-muted-foreground">Checking system status...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (hasExistingAdmin) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted flex items-center justify-center p-4">
        <Card className="w-full max-w-2xl">
          <CardHeader>
            <div className="flex items-center gap-2 mb-2">
              <Shield className="h-6 w-6 text-primary" />
              <CardTitle>Setup Already Complete</CardTitle>
            </div>
            <CardDescription>
              A super admin account already exists. Redirecting to login...
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                This setup page is only available for initial system configuration.
                You will be redirected to the login page.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted py-12 px-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <Card className="border-primary/20">
          <CardHeader>
            <div className="flex items-center gap-3 mb-2">
              <Shield className="h-8 w-8 text-primary" />
              <CardTitle className="text-2xl">One-Time Super Admin Setup</CardTitle>
            </div>
            <CardDescription className="text-base">
              Welcome to your first-time system setup. Create the initial super administrator account
              to manage your platform. This page will become inaccessible once the first super admin
              is created.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Alert className="bg-primary/5 border-primary/20">
              <Shield className="h-4 w-4 text-primary" />
              <AlertDescription className="text-sm">
                <strong>Important:</strong> After creating the super admin account, you'll be able to log in
                at <code className="px-1.5 py-0.5 rounded bg-muted text-primary">/super-admin/login</code> and
                access the Super Admin Dashboard to manage companies, registrations, and create trial accounts.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>

        {/* Super Admin Creator */}
        <SuperAdminCreator />

        {/* Footer Info */}
        <Card className="border-muted-foreground/20">
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground text-center">
              Need help? After setup, you can create additional trial companies and manage
              registrations through the Super Admin Dashboard.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SuperAdminSetup;
