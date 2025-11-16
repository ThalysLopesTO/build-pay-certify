import React, { useEffect, useState } from 'react';
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
import { MapPin, Loader2 } from 'lucide-react';
import { useGooglePlacesAutocomplete } from '@/hooks/useGooglePlacesAutocomplete';

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
  const [coordinates, setCoordinates] = useState<{ lat: number; lng: number } | null>(null);
  const [addressInput, setAddressInput] = useState('');
  const [googleMapsReady, setGoogleMapsReady] = useState(false);

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

  // Initialize Google Maps
  useEffect(() => {
    loadGoogleMaps(GOOGLE_MAPS_API_KEY)
      .then(() => {
        console.log('✅ Google Maps ready for JobsiteForm');
        setGoogleMapsReady(true);
      })
      .catch((error) => {
        console.error('❌ Failed to load Google Maps:', error);
      });
  }, []);

  // Use Google Places Autocomplete hook
  const { predictions, isLoading: isPredictionsLoading, error: predictionsError, selectPlace } = 
    useGooglePlacesAutocomplete({
      input: addressInput,
      onPlaceSelect: (place) => {
        form.setValue('address', place.address);
        setAddressInput(place.address);
        setCoordinates({ lat: place.latitude, lng: place.longitude });
        console.log('✅ Place selected:', place);
      }
    });

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
                    <div className="relative">
                      <Input
                        placeholder="Start typing to search addresses..."
                        autoComplete="off"
                        value={addressInput}
                        onChange={(e) => {
                          const value = e.target.value;
                          console.log('🔤 Address input changed:', value);
                          setAddressInput(value);
                          field.onChange(value);
                        }}
                        required
                      />
                      
                      {/* Debug Block - Remove after testing */}
                      <div className="mt-2 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-300 dark:border-yellow-700 rounded text-xs">
                        <div className="font-semibold mb-1">🐛 Debug Info:</div>
                        <div>Search text: "{addressInput}"</div>
                        <div>Google Maps ready: {googleMapsReady ? '✅' : '❌'}</div>
                        <div>Predictions count: {predictions.length}</div>
                        <div>Is loading: {isPredictionsLoading ? '⏳' : '✅'}</div>
                        {predictions.length > 0 && (
                          <div className="mt-2">
                            <div className="font-semibold">Predictions:</div>
                            <ul className="list-disc pl-5 mt-1">
                              {predictions.map((p) => (
                                <li key={p.place_id}>{p.description}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                      
                      {/* Custom Predictions Dropdown */}
                      {googleMapsReady && predictions.length > 0 && (
                        <ul className="absolute z-[100] w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-xl max-h-60 overflow-auto">
                          {predictions.map((prediction) => (
                            <li
                              key={prediction.place_id}
                              onClick={() => {
                                console.log('🎯 Prediction clicked:', prediction);
                                selectPlace(prediction.place_id);
                              }}
                              className="px-4 py-2 hover:bg-blue-100 dark:hover:bg-blue-900 cursor-pointer text-sm transition-colors border-b border-gray-200 dark:border-gray-700 last:border-b-0"
                            >
                              {prediction.description}
                            </li>
                          ))}
                        </ul>
                      )}

                      {isPredictionsLoading && (
                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                        </div>
                      )}

                      <div className="mt-2 space-y-2">
                        <p className="text-xs text-muted-foreground">
                          {googleMapsReady 
                            ? 'Type at least 3 characters to see address suggestions'
                            : 'Loading Google Maps...'}
                        </p>
                        
                        {predictionsError && (
                          <p className="text-xs text-destructive">{predictionsError}</p>
                        )}
                        
                        {coordinates && (
                          <div className="flex items-center gap-2 text-xs text-primary bg-primary/10 p-2 rounded">
                            <MapPin className="h-3 w-3" />
                            Location confirmed
                          </div>
                        )}
                      </div>
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