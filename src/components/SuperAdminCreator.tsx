
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { createSuperAdminUser, createThalysAdminUser } from '@/utils/createSuperAdmin';
import { Shield, CheckCircle, AlertCircle, User } from 'lucide-react';

const SuperAdminCreator = () => {
  const [loadingTest, setLoadingTest] = useState(false);
  const [loadingThalys, setLoadingThalys] = useState(false);
  const [successTest, setSuccessTest] = useState(false);
  const [successThalys, setSuccessThalys] = useState(false);
  const { toast } = useToast();

  const handleCreateTestSuperAdmin = async () => {
    setLoadingTest(true);
    setSuccessTest(false);

    try {
      const result = await createSuperAdminUser();
      
      if (result.error) {
        toast({
          title: "Creation Failed",
          description: result.error,
          variant: "destructive",
        });
      } else {
        setSuccessTest(true);
        toast({
          title: "Test Super Admin Created!",
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
      setLoadingTest(false);
    }
  };

  const handleCreateThalysAdmin = async () => {
    setLoadingThalys(true);
    setSuccessThalys(false);

    try {
      const result = await createThalysAdminUser();
      
      if (result.error) {
        toast({
          title: "Creation Failed",
          description: result.error,
          variant: "destructive",
        });
      } else {
        setSuccessThalys(true);
        toast({
          title: "Thalys Admin Created!",
          description: "thalyslopesdev@gmail.com can now log in with password: Admin@1234",
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
      setLoadingThalys(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto mt-8">
      {/* Thalys Admin Card */}
      <Card className="border-purple-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5 text-purple-600" />
            Create Thalys Admin User
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="text-sm text-slate-600">
              <p><strong>Email:</strong> thalyslopesdev@gmail.com</p>
              <p><strong>Password:</strong> Admin@1234</p>
              <p><strong>Role:</strong> super_admin</p>
              <p><strong>Name:</strong> Thalys Lopes</p>
            </div>
            
            {successThalys ? (
              <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <span className="text-green-700 font-medium">Thalys Admin user created successfully!</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 p-3 bg-purple-50 border border-purple-200 rounded-lg">
                <AlertCircle className="h-5 w-5 text-purple-600" />
                <span className="text-purple-700 text-sm">Click below to create Thalys's Super Admin account</span>
              </div>
            )}
            
            <Button 
              onClick={handleCreateThalysAdmin} 
              disabled={loadingThalys || successThalys}
              className="w-full bg-purple-600 hover:bg-purple-700"
            >
              {loadingThalys ? 'Creating Thalys Admin...' : successThalys ? 'Thalys Admin Created ✓' : 'Create Thalys Admin User'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Test Admin Card */}
      <Card className="border-orange-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-orange-600" />
            Create Test Super Admin User
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="text-sm text-slate-600">
              <p><strong>Email:</strong> testsuperadmin@groundzero.ca</p>
              <p><strong>Password:</strong> Test1234!</p>
              <p><strong>Role:</strong> super_admin</p>
            </div>
            
            {successTest ? (
              <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <span className="text-green-700 font-medium">Test Super Admin user created successfully!</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <AlertCircle className="h-5 w-5 text-amber-600" />
                <span className="text-amber-700 text-sm">Click below to create the Test Super Admin user</span>
              </div>
            )}
            
            <Button 
              onClick={handleCreateTestSuperAdmin} 
              disabled={loadingTest || successTest}
              className="w-full bg-orange-600 hover:bg-orange-700"
            >
              {loadingTest ? 'Creating Test User...' : successTest ? 'Test User Created ✓' : 'Create Test Super Admin User'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Success Message */}
      {(successTest || successThalys) && (
        <div className="text-center">
          <p className="text-sm text-slate-600 mb-2">You can now test login at:</p>
          <a 
            href="/super-admin-login" 
            className="text-purple-600 hover:text-purple-700 underline font-medium"
          >
            /super-admin-login
          </a>
        </div>
      )}
    </div>
  );
};

export default SuperAdminCreator;
