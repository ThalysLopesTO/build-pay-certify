
import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useUpdateUserProfile } from '@/hooks/useUserSettings';
import { profileSchema, ProfileFormData } from './schemas';

const ProfileTab = () => {
  const { user } = useAuth();
  const updateProfile = useUpdateUserProfile();

  const profileForm = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      first_name: user?.firstName || '',
      last_name: user?.lastName || '',
      trade: user?.trade || '',
      position: user?.position || '',
      hourly_rate: user?.hourlyRate || 0,
    },
  });

  const onProfileSubmit = (data: ProfileFormData) => {
    updateProfile.mutate(data);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Profile Information</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...profileForm}>
          <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={profileForm.control}
                name="first_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>First Name</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={profileForm.control}
                name="last_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Last Name</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={profileForm.control}
                name="trade"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Trade</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="e.g. Electrician, Plumber" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={profileForm.control}
                name="position"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Position</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="e.g. Journeyman, Apprentice" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {user?.role !== 'employee' && (
                <FormField
                  control={profileForm.control}
                  name="hourly_rate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Hourly Rate ($)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </div>

            <Separator />

            <div className="flex justify-end">
              <Button
                type="submit"
                disabled={updateProfile.isPending}
              >
                {updateProfile.isPending ? 'Saving...' : 'Save Profile'}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

export default ProfileTab;
