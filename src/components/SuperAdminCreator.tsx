
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { createSuperAdminUser } from '@/utils/createSuperAdmin';
import { Shield, CheckCircle, AlertCircle } from 'lucide-react';

const SuperAdminCreator = () => {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const { toast } = useToast();

  const handleCreateSuperAdmin = async () => {
    setLoading(true);
    setSuccess(false);

    try {
      const result = await createSuperAdminUser();
      
      if (result.error) {
        toast({
          title: "Creation Failed",
          description: result.error,
          variant: "destructive",
        });
      } else {
        setSuccess(true);
        toast({
          title: "Super Admin Created!",
          description: "testsuperadmin@groundzero.ca can now log in with password: Test1234!",
        });
      }
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="max-w-md mx-auto mt-8">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-purple-600" />
          Create Super Admin User
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="text-sm text-slate-600">
            <p><strong>Email:</strong> testsuperadmin@groundzero.ca</p>
            <p><strong>Password:</strong> Test1234!</p>
            <p><strong>Role:</strong> super_admin</p>
          </div>
          
          {success ? (
            <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <span className="text-green-700 font-medium">Super Admin user created successfully!</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <AlertCircle className="h-5 w-5 text-amber-600" />
              <span className="text-amber-700 text-sm">Click below to create the Super Admin user</span>
            </div>
          )}
          
          <Button 
            onClick={handleCreateSuperAdmin} 
            disabled={loading || success}
            className="w-full"
          >
            {loading ? 'Creating User...' : success ? 'User Created ✓' : 'Create Super Admin User'}
          </Button>
          
          {success && (
            <div className="text-center">
              <p className="text-sm text-slate-600 mb-2">You can now test login at:</p>
              <a 
                href="/super-admin-login" 
                className="text-purple-600 hover:text-purple-700 underline"
              >
                /super-admin-login
              </a>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default SuperAdminCreator;
