import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { format } from 'date-fns';
import { Cake } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useUpdateProfile } from '@/hooks/useUserSettings';
import { profileSchema, ProfileFormData } from './schemas';
import ProfilePhotoUpload from './ProfilePhotoUpload';
import BirthdayDatePicker from '@/components/common/BirthdayDatePicker';
const ProfileTab = () => {
  const { user, isCompanyAdmin } = useAuth();
  const updateProfile = useUpdateProfile();
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [removePhoto, setRemovePhoto] = useState(false);

  // Parse date string safely to avoid timezone shift (e.g., "1997-04-19" → April 19, not 18)
  const parseDateOfBirth = (dateStr: string | null | undefined): Date | null => {
    if (!dateStr) return null;
    const [year, month, day] = dateStr.split('-').map(Number);
    // Create date at noon to prevent timezone shift
    return new Date(year, month - 1, day, 12, 0, 0);
  };

  const profileForm = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      first_name: user?.firstName || '',
      last_name: user?.lastName || '',
      trade: user?.trade || '',
      position: user?.position || '',
      hourly_rate: user?.hourlyRate || 25,
      date_of_birth: parseDateOfBirth(user?.dateOfBirth),
    },
  });

  const handlePhotoChange = (file: File | null) => {
    setPhotoFile(file);
    setRemovePhoto(false);
    profileForm.setValue('photo', file || undefined);
  };

  const handleRemovePhoto = () => {
    setPhotoFile(null);
    setRemovePhoto(true);
    profileForm.setValue('photo', undefined);
    profileForm.setValue('removePhoto', true);
  };

  const onProfileSubmit = (data: ProfileFormData) => {
    // Transform the data to match UpdateProfileData interface
    const updateData = {
      first_name: data.first_name,
      last_name: data.last_name,
      trade: data.trade || undefined,
      position: data.position || undefined,
      hourly_rate: data.hourly_rate || undefined,
      date_of_birth: data.date_of_birth ? format(data.date_of_birth, 'yyyy-MM-dd') : null,
      photo: photoFile || undefined,
      removePhoto: removePhoto,
    };
    updateProfile.mutate(updateData);
  };

  return (
    <Card className="rounded-3xl border-slate-200/70 shadow-sm">
      <CardHeader>
        <CardTitle>Profile Information</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...profileForm}>
          <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-4">
            {/* Profile Photo Section */}
            <div className="flex justify-center py-4">
              <ProfilePhotoUpload
                currentPhotoUrl={user?.photo_url}
                firstName={user?.firstName}
                lastName={user?.lastName}
                onPhotoChange={handlePhotoChange}
                onRemovePhoto={handleRemovePhoto}
              />
            </div>

            <Separator />

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
            </div>

            {/* Birthday Field */}
            <FormField
              control={profileForm.control}
              name="date_of_birth"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel className="flex items-center gap-2">
                    <Cake className="h-4 w-4" />
                    Date of Birth
                  </FormLabel>
                  <FormControl>
                    <BirthdayDatePicker
                      value={field.value}
                      onChange={field.onChange}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={profileForm.control}
                name="trade"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Trade</FormLabel>
                    <FormControl>
                      <Input 
                        {...field} 
                        placeholder="e.g. Electrician, Plumber" 
                        disabled={!isCompanyAdmin}
                        className={!isCompanyAdmin ? "bg-muted text-muted-foreground cursor-not-allowed" : ""}
                      />
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
                      <Input 
                        {...field} 
                        placeholder="e.g. Lead, Helper" 
                        disabled={!isCompanyAdmin}
                        className={!isCompanyAdmin ? "bg-muted text-muted-foreground cursor-not-allowed" : ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

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
                      min="0"
                      {...field}
                      onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                      disabled={!isCompanyAdmin}
                      className={!isCompanyAdmin ? "bg-muted text-muted-foreground cursor-not-allowed" : ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Separator />

            <div className="flex justify-end">
              <Button
                type="submit"
                disabled={updateProfile.isPending}
                className="w-full sm:w-auto h-11 rounded-xl px-6 font-semibold bg-orange-600 hover:bg-orange-700 active:scale-[0.98] transition-transform"
              >
                {updateProfile.isPending ? 'Updating…' : 'Update Profile'}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

export default ProfileTab;
