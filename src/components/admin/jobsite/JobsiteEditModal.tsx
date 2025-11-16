import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { MapPin, AlertTriangle, Loader2 } from 'lucide-react';
import { useJobsiteActions } from '@/hooks/useJobsiteActions';
import { validateCoordinates, formatCoordinates } from '@/services/geocoding';
import { loadGoogleMaps } from '@/utils/loadGoogleMaps';
import JobsiteMapPreview from './JobsiteMapPreview';
import { GOOGLE_MAPS_API_KEY } from '@/config/googleMaps';
import { useGooglePlacesAutocomplete } from '@/hooks/useGooglePlacesAutocomplete';

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
  const { updateJobsite } = useJobsiteActions();
  const [useManualCoordinates, setUseManualCoordinates] = useState(false);
  const [geocodeError, setGeocodeError] = useState<string | null>(null);
  const [addressInput, setAddressInput] = useState('');
  const [googleMapsReady, setGoogleMapsReady] = useState(false);

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

  // Initialize address input when jobsite changes
  useEffect(() => {
    if (jobsite.address) {
      setAddressInput(jobsite.address);
    }
  }, [jobsite.address]);

  // Initialize Google Maps
  useEffect(() => {
    if (!open) return;
    
    loadGoogleMaps(GOOGLE_MAPS_API_KEY)
      .then(() => {
        console.log('✅ Google Maps ready for JobsiteEditModal');
        setGoogleMapsReady(true);
      })
      .catch((error) => {
        console.error('❌ Failed to load Google Maps:', error);
      });
  }, [open]);

  // Use Google Places Autocomplete hook
  const { predictions, isLoading: isPredictionsLoading, error: predictionsError, selectPlace} = 
    useGooglePlacesAutocomplete({
      input: addressInput,
      onPlaceSelect: (place) => {
        form.setValue('address', place.address);
        form.setValue('latitude', place.latitude.toString());
        form.setValue('longitude', place.longitude.toString());
        setAddressInput(place.address);
        console.log('✅ Place selected in edit modal:', place);
      }
    });

  // ✅ Reset form when jobsite changes
  React.useEffect(() => {
    form.reset({
      name: jobsite.name || '',
      address: jobsite.address || '',
      starting_date: jobsite.starting_date || '',
      latitude: jobsite.latitude ? jobsite.latitude.toString() : '',
      longitude: jobsite.longitude ? jobsite.longitude.toString() : '',
    });
    setUseManualCoordinates(false);
    setGeocodeError(null);
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

      // ✅ Handle coordinates if provided
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
        message: error?.message || 'Failed to update jobsite. Please try again.',
      });
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
            {/* ✅ JOBSITE NAME */}
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

            {/* ✅ ADDRESS FIELD WITH AUTOCOMPLETE */}
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
                        id="jobsite-edit-address"
                        placeholder="Start typing to search addresses..."
                        autoComplete="off"
                        value={addressInput}
                        onChange={(e) => {
                          const value = e.target.value;
                          setAddressInput(value);
                          field.onChange(value);
                        }}
                      />
                      
                      {/* Custom Predictions Dropdown */}
                      {googleMapsReady && predictions.length > 0 && (
                        <ul className="absolute z-50 w-full mt-1 bg-background border border-border rounded-md shadow-lg max-h-60 overflow-auto">
                          {predictions.map((prediction) => (
                            <li
                              key={prediction.place_id}
                              onClick={() => {
                                selectPlace(prediction.place_id);
                              }}
                              className="px-4 py-2 hover:bg-accent cursor-pointer text-sm transition-colors"
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
                        
                        {geocodeError && (
                          <div className="flex items-center gap-2 text-xs text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20 p-2 rounded">
                            <AlertTriangle className="h-3 w-3" />
                            {geocodeError} Enter coordinates manually below.
                          </div>
                        )}
                      </div>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* ✅ STARTING DATE */}
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

            {/* ✅ MAP PREVIEW */}
            {form.watch('latitude') && form.watch('longitude') && (
              <div className="space-y-2">
                <FormLabel className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Location Preview
                </FormLabel>
                <JobsiteMapPreview
                  latitude={parseFloat(form.watch('latitude') || '0')}
                  longitude={parseFloat(form.watch('longitude') || '0')}
                  address={form.watch('address')}
                  height="180px"
                />
              </div>
            )}

            {/* ✅ GPS COORDINATES */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <FormLabel className="text-sm font-medium flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  GPS Coordinates
                </FormLabel>
                <div className="flex items-center space-x-2">
                  <span className="text-xs text-muted-foreground">Manual Override</span>
                  <Switch checked={useManualCoordinates} onCheckedChange={setUseManualCoordinates} />
                </div>
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
                  : 'Auto mode: Coordinates are fetched automatically when you select an address above.'}
              </p>
            </div>

            {/* ✅ ERROR MESSAGES */}
            {form.formState.errors.root && (
              <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md">
                {form.formState.errors.root.message}
              </div>
            )}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={updateJobsite.isPending}>
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
