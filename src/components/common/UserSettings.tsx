
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Settings, User, Lock, X, AlertCircle } from 'lucide-react';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useUpdateUserProfile, useUpdatePassword } from '@/hooks/useUserSettings';
import { useCancellationRequests } from '@/hooks/useCancellationRequests';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';

const profileSchema = z.object({
  first_name: z.string().min(1, 'First name is required'),
  last_name: z.string().min(1, 'Last name is required'),
  trade: z.string().optional(),
  position: z.string().optional(),
  hourly_rate: z.number().min(0, 'Hourly rate must be positive').optional(),
});

const passwordSchema = z.object({
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string().min(6, 'Confirm password is required'),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type ProfileFormData = z.infer<typeof profileSchema>;
type PasswordFormData = z.infer<typeof passwordSchema>;

const UserSettings = () => {
  const { user } = useAuth();
  const updateProfile = useUpdateUserProfile();
  const updatePassword = useUpdatePassword();
  const { requests, submitCancellationRequest } = useCancellationRequests();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [notes, setNotes] = useState('');

  // Find pending request for current user's company
  const pendingRequest = requests.find(request => request.status === 'pending');

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

  const passwordForm = useForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      password: '',
      confirmPassword: '',
    },
  });

  const onProfileSubmit = (data: ProfileFormData) => {
    updateProfile.mutate(data);
  };

  const onPasswordSubmit = (data: PasswordFormData) => {
    updatePassword.mutate({ password: data.password });
    passwordForm.reset();
  };

  const handleCancellationSubmit = async () => {
    await submitCancellationRequest.mutateAsync({ notes });
    setIsDialogOpen(false);
    setNotes('');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center space-x-2 mb-6">
        <Settings className="h-6 w-6" />
        <h1 className="text-2xl font-bold">Account Settings</h1>
      </div>

      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="profile" className="flex items-center space-x-2">
            <User className="h-4 w-4" />
            <span>Profile</span>
          </TabsTrigger>
          <TabsTrigger value="password" className="flex items-center space-x-2">
            <Lock className="h-4 w-4" />
            <span>Password</span>
          </TabsTrigger>
          <TabsTrigger value="plan" className="flex items-center space-x-2">
            <X className="h-4 w-4" />
            <span>Plan</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
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
        </TabsContent>

        <TabsContent value="password">
          <Card>
            <CardHeader>
              <CardTitle>Change Password</CardTitle>
            </CardHeader>
            <CardContent>
              <Form {...passwordForm}>
                <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-4">
                  <FormField
                    control={passwordForm.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>New Password</FormLabel>
                        <FormControl>
                          <Input type="password" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={passwordForm.control}
                    name="confirmPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Confirm New Password</FormLabel>
                        <FormControl>
                          <Input type="password" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Separator />

                  <div className="flex justify-end">
                    <Button
                      type="submit"
                      disabled={updatePassword.isPending}
                    >
                      {updatePassword.isPending ? 'Updating...' : 'Update Password'}
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="plan">
          <Card className="border-red-200">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <X className="h-5 w-5 text-red-600" />
                <span>Plan Management</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {pendingRequest ? (
                <Alert className="border-orange-200 bg-orange-50">
                  <AlertCircle className="h-4 w-4 text-orange-600" />
                  <AlertDescription className="text-orange-800">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">Cancellation request pending review</span>
                      <span className="text-xs text-orange-600">
                        Submitted {new Date(pendingRequest.request_date).toLocaleDateString()}
                      </span>
                    </div>
                  </AlertDescription>
                </Alert>
              ) : (
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Need to cancel your subscription? Submit a cancellation request for review.
                  </p>
                  
                  <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                      <Button variant="outline" className="border-red-300 text-red-700 hover:bg-red-50">
                        Cancel My Plan
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Cancel Your Plan</DialogTitle>
                        <DialogDescription>
                          Are you sure you want to cancel your plan? Your access will end at the end of your billing cycle.
                          This action requires approval from our team.
                        </DialogDescription>
                      </DialogHeader>
                      
                      <div className="space-y-4">
                        <div>
                          <label className="text-sm font-medium mb-2 block">
                            Reason for cancellation (optional)
                          </label>
                          <Textarea
                            placeholder="Please let us know why you're cancelling..."
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            className="min-h-[80px]"
                          />
                        </div>
                      </div>
                      
                      <DialogFooter>
                        <Button
                          variant="outline"
                          onClick={() => setIsDialogOpen(false)}
                          disabled={submitCancellationRequest.isPending}
                        >
                          Keep Plan
                        </Button>
                        <Button
                          variant="destructive"
                          onClick={handleCancellationSubmit}
                          disabled={submitCancellationRequest.isPending}
                        >
                          {submitCancellationRequest.isPending ? 'Submitting...' : 'Submit Cancellation Request'}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default UserSettings;
