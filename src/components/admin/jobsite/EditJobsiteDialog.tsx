import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useJobsiteActions } from '@/hooks/useJobsiteActions';
import { useAssignForemen, useJobsiteForemen } from '@/hooks/useJobsiteForemen';
import ForemanAssignmentSection from './ForemanAssignmentSection';
import { loadGoogleMaps } from '@/utils/loadGoogleMaps';
import { GOOGLE_MAPS_API_KEY } from '@/config/googleMaps';
import { useGooglePlacesAutocomplete } from '@/hooks/useGooglePlacesAutocomplete';
import { Loader2 } from 'lucide-react';

const formSchema = z.object({
  name: z.string().min(1, 'Jobsite name is required'),
  address: z.string().min(1, 'Address is required'),
  starting_date: z.string().optional(),
  due_date: z.string().optional(),
  status: z.enum(['active', 'completed']),
  assignedForemen: z.array(z.string()).optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
});

type FormData = z.infer<typeof formSchema>;

interface EditJobsiteDialogProps {
  isOpen: boolean;
  onClose: () => void;
  jobsite: {
    id: string;
    name: string;
    address: string;
    starting_date?: string;
    due_date?: string;
    status: string;
    latitude?: number;
    longitude?: number;
  };
}

const EditJobsiteDialog: React.FC<EditJobsiteDialogProps> = ({
  isOpen,
  onClose,
  jobsite,
}) => {
  const { updateJobsite } = useJobsiteActions();
  const assignForemen = useAssignForemen();
  const { data: assignedForemen = [] } = useJobsiteForemen(jobsite.id);
  const [addressInput, setAddressInput] = useState('');
  const [googleMapsReady, setGoogleMapsReady] = useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: jobsite.name,
      address: jobsite.address,
      starting_date: jobsite.starting_date || '',
      due_date: jobsite.due_date || '',
      status: jobsite.status as 'active' | 'completed',
      assignedForemen: assignedForemen.map(af => af.foreman_id),
      latitude: jobsite.latitude || undefined,
      longitude: jobsite.longitude || undefined,
    },
  });

  // Initialize Google Maps API
  useEffect(() => {
    if (!isOpen) return;
    
    loadGoogleMaps(GOOGLE_MAPS_API_KEY)
      .then(() => {
        console.log('✅ Google Maps ready for EditJobsiteDialog');
        setGoogleMapsReady(true);
      })
      .catch((error) => {
        console.error('❌ Failed to load Google Maps:', error);
      });
  }, [isOpen]);

  // Initialize address input
  useEffect(() => {
    if (jobsite.address) {
      setAddressInput(jobsite.address);
    }
  }, [jobsite.address]);

  // Google Places Autocomplete
  const { predictions, isLoading: isPredictionsLoading, error: predictionsError, selectPlace } = 
    useGooglePlacesAutocomplete({
      input: addressInput,
      onPlaceSelect: (place) => {
        form.setValue('address', place.address);
        setAddressInput(place.address);
        
        // Capture coordinates when place is selected
        if (place.latitude !== undefined && place.longitude !== undefined) {
          form.setValue('latitude', place.latitude);
          form.setValue('longitude', place.longitude);
          console.log('✅ Coordinates captured:', place.latitude, place.longitude);
        }
      }
    });

  // Update form when assigned foremen data loads
  React.useEffect(() => {
    if (assignedForemen.length > 0) {
      form.setValue('assignedForemen', assignedForemen.map(af => af.foreman_id));
    }
  }, [assignedForemen, form]);

  const onSubmit = async (data: FormData) => {
    try {
      const updateData: any = {
        name: data.name,
        address: data.address,
        starting_date: data.starting_date || undefined,
      };

      // Include coordinates if they exist
      if (data.latitude !== undefined && data.longitude !== undefined) {
        updateData.latitude = data.latitude;
        updateData.longitude = data.longitude;
        console.log('✅ Updating with coordinates:', data.latitude, data.longitude);
      }

      await updateJobsite.mutateAsync({
        id: jobsite.id,
        data: updateData
      });

      // Update foreman assignments
      if (data.assignedForemen !== undefined) {
        await assignForemen.mutateAsync({
          jobsiteId: jobsite.id,
          foremanIds: data.assignedForemen
        });
      }

      onClose();
    } catch (error) {
      console.error('Error updating jobsite:', error);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-h-[90vh] max-w-[95vw] sm:max-w-2xl flex flex-col">
        <DialogHeader>
          <DialogTitle>Edit Jobsite</DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col flex-1 min-h-0">
            <div className="overflow-y-auto flex-1 px-1 space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Jobsite Name</FormLabel>
                  <FormControl>
                    <Input {...field} />
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
                  <FormLabel>Address</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        {...field}
                        value={addressInput}
                        onChange={(e) => {
                          const value = e.target.value;
                          setAddressInput(value);
                          field.onChange(value);
                        }}
                        placeholder="Start typing an address..."
                      />
                      
                      {/* Autocomplete Dropdown */}
                      {googleMapsReady && predictions.length > 0 && (
                        <ul className="absolute z-50 w-full mt-1 bg-background border border-border rounded-md shadow-lg max-h-60 overflow-auto">
                          {predictions.map((prediction) => (
                            <li
                              key={prediction.place_id}
                              onClick={() => {
                                selectPlace(prediction.place_id);
                              }}
                              className="px-4 py-2 hover:bg-accent hover:text-accent-foreground cursor-pointer text-sm transition-colors"
                            >
                              {prediction.description}
                            </li>
                          ))}
                        </ul>
                      )}

                      {/* Loading Indicator */}
                      {isPredictionsLoading && (
                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                        </div>
                      )}
                    </div>
                  </FormControl>
                  
                  {/* Helper Text */}
                  <div className="mt-1 space-y-1">
                    <p className="text-xs text-muted-foreground">
                      {googleMapsReady 
                        ? 'Type at least 3 characters to see address suggestions'
                        : 'Loading Google Maps...'}
                    </p>
                    {predictionsError && (
                      <p className="text-xs text-destructive">{predictionsError}</p>
                    )}
                  </div>
                  
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
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

              <FormField
                control={form.control}
                name="due_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Due Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <ForemanAssignmentSection control={form.control} jobsiteId={jobsite.id} />
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t mt-4">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={updateJobsite.isPending || assignForemen.isPending}
              >
                {(updateJobsite.isPending || assignForemen.isPending) ? 'Updating...' : 'Update Jobsite'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default EditJobsiteDialog;