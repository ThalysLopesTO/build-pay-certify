import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Globe, RefreshCw } from 'lucide-react';
import { useJobsiteActions } from '@/hooks/useJobsiteActions';
import { validateCoordinates, formatCoordinates } from '@/services/geocoding';

const formSchema = z.object({
  name: z.string().min(1, 'Jobsite name is required').min(2, 'Jobsite name must be at least 2 characters'),
  address: z.string().min(1, 'Address is required').min(5, 'Address must be at least 5 characters'),
  starting_date: z.string().optional(),
  latitude: z.string().optional(),
  longitude: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

interface Jobsite {
  id: string;
  name: string;
  address: string;
  starting_date?: string;
  due_date?: string;
  created_at: string;
  status?: string;
  completion_date?: string;
  latitude?: number;
  longitude?: number;
}

interface JobsiteEditModalProps {
  jobsite: Jobsite;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const JobsiteEditModal: React.FC<JobsiteEditModalProps> = ({ jobsite, open, onOpenChange }) => {
  const { updateJobsite, geocodeJobsiteAddress } = useJobsiteActions();
  const [isGeocoding, setIsGeocoding] = useState(false);
  
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: jobsite.name || '',
      address: jobsite.address || '',
      starting_date: jobsite.starting_date || '',
      latitude: jobsite.latitude ? jobsite.latitude.toString() : '',
      longitude: jobsite.longitude ? jobsite.longitude.toString() : '',
    },
  });

  // Reset form when jobsite changes
  React.useEffect(() => {
    form.reset({
      name: jobsite.name || '',
      address: jobsite.address || '',
      starting_date: jobsite.starting_date || '',
      latitude: jobsite.latitude ? jobsite.latitude.toString() : '',
      longitude: jobsite.longitude ? jobsite.longitude.toString() : '',
    });
  }, [jobsite, form]);

  const onSubmit = async (data: FormData) => {
    try {
      const updateData: any = {
        name: data.name.trim(),
        address: data.address.trim(),
      };

      if (data.starting_date) {
        updateData.starting_date = data.starting_date;
      }

      // Handle coordinates if provided
      if (data.latitude && data.longitude) {
        const lat = parseFloat(data.latitude);
        const lng = parseFloat(data.longitude);
        
        if (!isNaN(lat) && !isNaN(lng)) {
          if (validateCoordinates(lat, lng)) {
            updateData.latitude = lat;
            updateData.longitude = lng;
          } else {
            form.setError('latitude', { message: 'Latitude must be between -90 and 90' });
            form.setError('longitude', { message: 'Longitude must be between -180 and 180' });
            return;
          }
        } else {
          form.setError('latitude', { message: 'Please enter a valid number' });
          form.setError('longitude', { message: 'Please enter a valid number' });
          return;
        }
      }

      await updateJobsite.mutateAsync({ id: jobsite.id, data: updateData });
      onOpenChange(false);
    } catch (error) {
      console.error('Error updating jobsite:', error);
      form.setError('root', { 
        message: error?.message || 'Failed to update jobsite. Please try again.' 
      });
    }
  };

  const handleGeocodeAddress = async () => {
    const address = form.getValues('address');
    if (!address?.trim()) {
      form.setError('address', { message: 'Please enter an address to geocode' });
      return;
    }

    try {
      setIsGeocoding(true);
      await geocodeJobsiteAddress.mutateAsync({ 
        id: jobsite.id, 
        address: address.trim() 
      });
      
      // The mutation will update the jobsite data, so we need to reset the form
      // with the new coordinates after a short delay
      setTimeout(() => {
        // Coordinates will be updated via query invalidation
        onOpenChange(false);
      }, 1000);
    } catch (error) {
      console.error('Error geocoding address:', error);
    } finally {
      setIsGeocoding(false);
    }
  };

  const hasCoordinates = jobsite.latitude !== undefined && jobsite.longitude !== undefined;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Edit Jobsite</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Jobsite Name *</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter jobsite name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Address *</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter full address" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="starting_date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Starting Date</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <FormLabel className="text-sm font-medium">GPS Coordinates</FormLabel>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleGeocodeAddress}
                  disabled={isGeocoding || geocodeJobsiteAddress.isPending}
                  className="text-xs"
                >
                  {isGeocoding || geocodeJobsiteAddress.isPending ? (
                    <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                  ) : (
                    <Globe className="h-3 w-3 mr-1" />
                  )}
                  Geocode Address
                </Button>
              </div>

              {hasCoordinates && (
                <div className="text-xs text-muted-foreground bg-muted/30 p-2 rounded">
                  Current: {formatCoordinates(jobsite.latitude!, jobsite.longitude!)}
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <FormField
                  control={form.control}
                  name="latitude"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs">Latitude</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          step="any"
                          placeholder="e.g. 43.70011" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="longitude"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs">Longitude</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          step="any"
                          placeholder="e.g. -79.4163" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <p className="text-xs text-muted-foreground">
                Leave coordinates blank to auto-geocode from address. Valid ranges: Lat (-90 to 90), Lng (-180 to 180)
              </p>
            </div>

            {form.formState.errors.root && (
              <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md">
                {form.formState.errors.root.message}
              </div>
            )}

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={updateJobsite.isPending}
              >
                {updateJobsite.isPending ? 'Updating...' : 'Update Jobsite'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default JobsiteEditModal;