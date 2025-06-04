
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { createUserWithAdmin } from '@/utils/createUserAdmin';
import { toast } from '@/hooks/use-toast';

const AdminUserCreator = () => {
  const [creating, setCreating] = useState(false);

  const createTestUser = async () => {
    setCreating(true);
    try {
      const result = await createUserWithAdmin('Thalyslopesdev@gmail.com', '190497');
      
      if (result.error) {
        toast({
          title: "Error",
          description: result.error,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Success",
          description: "User account created successfully! You can now login with the credentials.",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create user account",
        variant: "destructive",
      });
    } finally {
      setCreating(false);
    }
  };

  return (
    <Card className="max-w-md mx-auto mt-8">
      <CardHeader>
        <CardTitle>Admin: Create Test User</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="text-sm text-gray-600">
            <p><strong>Email:</strong> Thalyslopesdev@gmail.com</p>
            <p><strong>Password:</strong> 190497</p>
          </div>
          <Button 
            onClick={createTestUser} 
            disabled={creating}
            className="w-full"
          >
            {creating ? 'Creating User...' : 'Create User Account'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default AdminUserCreator;
