import React, { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useJobsiteActions } from '@/hooks/useJobsiteActions';
import { useAssignForemen } from '@/hooks/useJobsiteForemen';
import ForemanAssignmentSection from './ForemanAssignmentSection';
import JobsiteMapPreview from './JobsiteMapPreview';
import { GOOGLE_MAPS_API_KEY } from '@/config/googleMaps';
import { loadGoogleMaps } from '@/utils/loadGoogleMaps';
import { MapPin } from 'lucide-react';

const formSchema = z.object({
  name: z.string().min(1, 'Jobsite name is required').min(2, 'Jobsite name must be at least 2 characters'),
  address: z.string().min(1, 'Address is required').min(5, 'Address must be at least 5 characters'),
  starting_date: z.string().min(1, 'Starting date is required'),
  assignedForemen: z.array(z.string()).optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
});

type FormData = z.infer<typeof formSchema>;

interface JobsiteFormProps {
  onCancel: () => void;
}

const JobsiteForm: React.FC<JobsiteFormProps> = ({ onCancel }) => {
  const { addJobsite } = useJobsiteActions();
  const assignForemen = useAssignForemen();
  const addressInputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<any>(null);
  const [coordinates, setCoordinates] = useState<{ lat: number; lng: number } | null>(null);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      address: '',
      starting_date: '',
      assignedForemen: [],
      latitude: undefined,
      longitude: undefined,
    },
  });

  // Initialize Google Places Autocomplete
  useEffect(() => {
    loadGoogleMaps(GOOGLE_MAPS_API_KEY)
      .then(() => {
        if (!addressInputRef.current || !window.google?.maps?.places) {
          console.warn('⚠️ Google Maps Places API not available');
          return;
        }

        console.log('✅ Initializing Google Places Autocomplete in JobsiteForm');

        autocompleteRef.current = new (window as any).google.maps.places.Autocomplete(addressInputRef.current, {
          types: ['address'],
          componentRestrictions: { country: ['ca', 'us'] },
          fields: ['formatted_address', 'geometry.location', 'place_id'],
        });

        autocompleteRef.current.addListener('place_changed', () => {
          const place = autocompleteRef.current?.getPlace();
          console.log('📍 Place selected:', place);

          if (place?.geometry?.location) {
            const address = place.formatted_address || '';
            const lat = place.geometry.location.lat();
            const lng = place.geometry.location.lng();

            form.setValue('address', address);
            setCoordinates({ lat, lng });
            console.log('✅ Coordinates set:', { lat, lng });
          } else {
            console.warn('⚠️ No geometry found for selected place');
          }
        });
      })
      .catch((error) => {
        console.error('❌ Failed to load Google Maps:', error);
      });

    return () => {
      if (autocompleteRef.current && (window as any).google?.maps?.event) {
        (window as any).google.maps.event.clearInstanceListeners(autocompleteRef.current);
      }
    };
  }, [form]);

  const onSubmit = async (data: FormData) => {
    try {
      console.log('📤 Submitting form data:', data);

      if (!data.name?.trim()) {
        form.setError('name', { message: 'Jobsite name is required' });
        return;
      }
      if (!data.address?.trim()) {
        form.setError('address', { message: 'Address is required' });
        return;
      }
      if (!data.starting_date?.trim()) {
        form.setError('starting_date', { message: 'Starting date is required' });
        return;
      }

      const jobsiteData = {
        name: data.name.trim(),
        address: data.address.trim(),
        starting_date: data.starting_date,
        latitude: coordinates?.lat,
        longitude: coordinates?.lng,
      };

      const result = await addJobsite.mutateAsync(jobsiteData);
      
      // Assign foremen if any are selected
      if (data.assignedForemen && data.assignedForemen.length > 0 && result?.[0]?.id) {
        await assignForemen.mutateAsync({
          jobsiteId: result[0].id,
          foremanIds: data.assignedForemen
        });
      }

      form.reset();
      setCoordinates(null);
      onCancel();
    } catch (error) {
      console.error('❌ Error adding jobsite:', error);
      form.setError('root', { message: `Failed to add jobsite: ${error?.message || 'Unknown error'}` });
    }
  };

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="text-lg">Add New Jobsite</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* JOBSITE NAME */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Jobsite Name *</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter jobsite name" {...field} required />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* ADDRESS FIELD WITH AUTOCOMPLETE */}
            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    Address *
                  </FormLabel>
                  <FormControl>
                    <div className="space-y-2">
                      <Input
                        ref={addressInputRef}
                        placeholder="Start typing to search addresses..."
                        {...field}
                        required
                      />
                      <p className="text-xs text-muted-foreground">
                        Select an address from the dropdown to set map location
                      </p>
                      {coordinates && (
                        <div className="flex items-center gap-2 text-xs text-primary bg-primary/10 p-2 rounded">
                          <MapPin className="h-3 w-3" />
                          Location confirmed
                        </div>
                      )}
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* MAP PREVIEW */}
            {coordinates && (
              <div className="space-y-2">
                <JobsiteMapPreview
                  latitude={coordinates.lat}
                  longitude={coordinates.lng}
                  address={form.watch('address')}
                  height="180px"
                />
              </div>
            )}

            {/* STARTING DATE */}
            <FormField
              control={form.control}
              name="starting_date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Starting Date *</FormLabel>
                  <FormControl>
                    <Input type="date" placeholder="Select starting date" {...field} required />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* FOREMAN ASSIGNMENT */}
            <ForemanAssignmentSection control={form.control} />

            {/* ERROR MESSAGES */}
            {form.formState.errors.root && (
              <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md">
                {form.formState.errors.root.message}
              </div>
            )}

            {/* BUTTONS */}
            <div className="flex space-x-2">
              <Button type="submit" disabled={addJobsite.isPending || assignForemen.isPending}>
                {addJobsite.isPending ? 'Creating jobsite...' : assignForemen.isPending ? 'Assigning foremen...' : 'Add Jobsite'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  onCancel();
                  form.reset();
                  setCoordinates(null);
                }}
              >
                Cancel
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

export default JobsiteForm;