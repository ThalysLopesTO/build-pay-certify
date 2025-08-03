
import React, { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { MapPin, AlertTriangle } from 'lucide-react';
import { useJobsiteActions } from '@/hooks/useJobsiteActions';
import { validateCoordinates } from '@/services/geocoding';

const formSchema = z.object({
  name: z.string().min(1, 'Jobsite name is required').min(2, 'Jobsite name must be at least 2 characters'),
  address: z.string().min(1, 'Address is required').min(5, 'Address must be at least 5 characters'),
  starting_date: z.string().min(1, 'Starting date is required'),
  latitude: z.string().optional(),
  longitude: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

interface JobsiteFormProps {
  onCancel: () => void;
}

const JobsiteForm: React.FC<JobsiteFormProps> = ({ onCancel }) => {
  const { addJobsite } = useJobsiteActions();
  const [useManualCoordinates, setUseManualCoordinates] = useState(false);
  const [geocodeError, setGeocodeError] = useState<string | null>(null);
  const addressInputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<any>(null);
  
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      address: '',
      starting_date: '',
      latitude: '',
      longitude: '',
    },
  });

  // Initialize Google Places Autocomplete
  useEffect(() => {
    if (!addressInputRef.current || !window.google?.maps?.places) {
      console.warn('Google Maps Places API not available');
      return;
    }

    // Initialize autocomplete
    autocompleteRef.current = new window.google.maps.places.Autocomplete(addressInputRef.current, {
      types: ['geocode'],
      componentRestrictions: { country: ['ca', 'us'] }
    });

    // Handle place selection
    const handlePlaceSelect = () => {
      const place = autocompleteRef.current?.getPlace();
      
      if (place?.geometry?.location) {
        const address = place.formatted_address || '';
        const lat = place.geometry.location.lat();
        const lng = place.geometry.location.lng();

        form.setValue('address', address);
        if (!useManualCoordinates) {
          form.setValue('latitude', lat.toString());
          form.setValue('longitude', lng.toString());
        }
        setGeocodeError(null);
      } else {
        setGeocodeError('Unable to find location for this address');
      }
    };

    autocompleteRef.current.addListener('place_changed', handlePlaceSelect);

    return () => {
      if (autocompleteRef.current && window.google?.maps?.event) {
        window.google.maps.event.clearInstanceListeners(autocompleteRef.current);
      }
    };
  }, [form, useManualCoordinates]);

  const onSubmit = async (data: FormData) => {
    try {
      console.log('Form data being submitted:', data);
      
      // Validate required fields client-side
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

      const jobsiteData: any = {
        name: data.name.trim(),
        address: data.address.trim(),
        starting_date: data.starting_date,
      };

      // Add coordinates if provided and manual override is enabled
      if (useManualCoordinates && data.latitude && data.longitude) {
        const lat = parseFloat(data.latitude);
        const lng = parseFloat(data.longitude);
        
        if (!isNaN(lat) && !isNaN(lng)) {
          if (validateCoordinates(lat, lng)) {
            jobsiteData.latitude = lat;
            jobsiteData.longitude = lng;
          } else {
            form.setError('latitude', { message: 'Latitude must be between -90 and 90' });
            form.setError('longitude', { message: 'Longitude must be between -180 and 180' });
            return;
          }
        }
      } else if (!useManualCoordinates && data.latitude && data.longitude) {
        // Use auto-geocoded coordinates
        const lat = parseFloat(data.latitude);
        const lng = parseFloat(data.longitude);
        
        if (!isNaN(lat) && !isNaN(lng)) {
          jobsiteData.latitude = lat;
          jobsiteData.longitude = lng;
        }
      }

      await addJobsite.mutateAsync(jobsiteData);
      
      form.reset();
      setUseManualCoordinates(false);
      setGeocodeError(null);
      onCancel();
    } catch (error) {
      console.error('Error adding jobsite:', error);
      
      // Handle specific error types
      if (error?.message?.includes('required')) {
        form.setError('root', { message: 'Missing required fields. Please check all fields are filled out.' });
      } else if (error?.message?.includes('duplicate')) {
        form.setError('name', { message: 'A jobsite with this name already exists.' });
      } else if (error?.message?.includes('permission')) {
        form.setError('root', { message: 'You do not have permission to add jobsites.' });
      } else {
        form.setError('root', { message: `Failed to add jobsite: ${error?.message || 'Unknown error'}` });
      }
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
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Jobsite Name *</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Enter jobsite name" 
                      {...field} 
                      required
                    />
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
                    <div className="space-y-2">
                      <Input 
                        id="jobsite-address"
                        ref={addressInputRef}
                        placeholder="Start typing an address..." 
                        {...field} 
                        required
                      />
                      <p className="text-xs text-muted-foreground">
                        Powered by Google
                      </p>
                      {geocodeError && (
                        <div className="flex items-center gap-2 text-xs text-yellow-600 bg-yellow-50 p-2 rounded">
                          <AlertTriangle className="h-3 w-3" />
                          {geocodeError} Enter coordinates manually below.
                        </div>
                      )}
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <FormLabel className="text-sm font-medium flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  GPS Coordinates
                </FormLabel>
                <div className="flex items-center space-x-2">
                  <span className="text-xs text-muted-foreground">Manual Override</span>
                  <Switch
                    checked={useManualCoordinates}
                    onCheckedChange={setUseManualCoordinates}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <FormField
                  control={form.control}
                  name="latitude"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs">
                        {useManualCoordinates ? 'Manual Latitude' : 'Latitude'}
                      </FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          step="any"
                          placeholder="e.g. 43.70011" 
                          {...field}
                          readOnly={!useManualCoordinates}
                          className={!useManualCoordinates ? 'bg-muted/30' : ''}
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
                      <FormLabel className="text-xs">
                        {useManualCoordinates ? 'Manual Longitude' : 'Longitude'}
                      </FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          step="any"
                          placeholder="e.g. -79.4163" 
                          {...field}
                          readOnly={!useManualCoordinates}
                          className={!useManualCoordinates ? 'bg-muted/30' : ''}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <p className="text-xs text-muted-foreground">
                {useManualCoordinates 
                  ? 'Manual mode: Enter coordinates directly. Valid ranges: Lat (-90 to 90), Lng (-180 to 180)'
                  : 'Auto mode: Coordinates are fetched automatically when you select an address above.'
                }
              </p>
            </div>

            <FormField
              control={form.control}
              name="starting_date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Starting Date *</FormLabel>
                  <FormControl>
                    <Input 
                      type="date"
                      placeholder="Select starting date" 
                      {...field} 
                      required
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {form.formState.errors.root && (
              <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md">
                {form.formState.errors.root.message}
              </div>
            )}

            <div className="flex space-x-2">
              <Button 
                type="submit" 
                disabled={addJobsite.isPending}
              >
                {addJobsite.isPending ? 'Adding...' : 'Add Jobsite'}
              </Button>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => {
                  onCancel();
                  form.reset();
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
