
import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';

const SuperAdminUserChecker = () => {
  const [userProfile, setUserProfile] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const checkUserProfile = async () => {
    setLoading(true);
    try {
      // First check if user exists in auth.users
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        console.log('No authenticated user found');
        return;
      }

      console.log('Current user:', user.email);

      // Check user_profiles table
      const { data: profile, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      console.log('Profile query result:', { profile, error });
      setUserProfile(profile);

      if (error && error.code === 'PGRST116') {
        toast({
          title: "Profile Not Found",
          description: "User profile doesn't exist. Creating one now...",
          variant: "destructive",
        });
        await createSuperAdminProfile(user.id);
      } else if (error) {
        console.error('Error fetching profile:', error);
        toast({
          title: "Error",
          description: "Failed to fetch user profile",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error checking user:', error);
    } finally {
      setLoading(false);
    }
  };

  const createSuperAdminProfile = async (userId: string) => {
    try {
      // Get first company for company_id
      const { data: companies } = await supabase
        .from('companies')
        .select('id')
        .limit(1);

      const companyId = companies?.[0]?.id;

      if (!companyId) {
        // Create a default company first
        const { data: newCompany, error: companyError } = await supabase
          .from('companies')
          .insert({
            name: 'Super Admin Company',
            status: 'active'
          })
          .select()
          .single();

        if (companyError) throw companyError;
        
        const { data: profile, error } = await supabase
          .from('user_profiles')
          .insert({
            user_id: userId,
            company_id: newCompany.id,
            role: 'super_admin',
            first_name: 'Super',
            last_name: 'Admin',
            pending_approval: false
          })
          .select()
          .single();

        if (error) throw error;
        
        setUserProfile(profile);
        toast({
          title: "Success",
          description: "Super Admin profile created successfully!",
        });
      } else {
        const { data: profile, error } = await supabase
          .from('user_profiles')
          .insert({
            user_id: userId,
            company_id: companyId,
            role: 'super_admin',
            first_name: 'Super',
            last_name: 'Admin',
            pending_approval: false
          })
          .select()
          .single();

        if (error) throw error;
        
        setUserProfile(profile);
        toast({
          title: "Success",
          description: "Super Admin profile created successfully!",
        });
      }
    } catch (error) {
      console.error('Error creating profile:', error);
      toast({
        title: "Error",
        description: "Failed to create Super Admin profile",
        variant: "destructive",
      });
    }
  };

  const updateToSuperAdmin = async () => {
    if (!userProfile) return;

    try {
      const { error } = await supabase
        .from('user_profiles')
        .update({ 
          role: 'super_admin',
          pending_approval: false 
        })
        .eq('id', userProfile.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "User role updated to Super Admin!",
      });

      // Refresh the profile
      await checkUserProfile();
    } catch (error) {
      console.error('Error updating role:', error);
      toast({
        title: "Error",
        description: "Failed to update user role",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    checkUserProfile();
  }, []);

  return (
    <Card className="max-w-2xl mx-auto mt-8">
      <CardHeader>
        <CardTitle>Super Admin User Checker</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <Button onClick={checkUserProfile} disabled={loading}>
            {loading ? 'Checking...' : 'Check User Profile'}
          </Button>
          
          {userProfile && (
            <div className="p-4 bg-slate-50 rounded-lg">
              <h3 className="font-semibold mb-2">Current Profile:</h3>
              <div className="space-y-1 text-sm">
                <p><strong>User ID:</strong> {userProfile.user_id}</p>
                <p><strong>Role:</strong> {userProfile.role}</p>
                <p><strong>Company ID:</strong> {userProfile.company_id}</p>
                <p><strong>First Name:</strong> {userProfile.first_name}</p>
                <p><strong>Last Name:</strong> {userProfile.last_name}</p>
                <p><strong>Pending Approval:</strong> {userProfile.pending_approval ? 'Yes' : 'No'}</p>
              </div>
              
              {userProfile.role !== 'super_admin' && (
                <Button onClick={updateToSuperAdmin} className="mt-3">
                  Update to Super Admin
                </Button>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default SuperAdminUserChecker;
