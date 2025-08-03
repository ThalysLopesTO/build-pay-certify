import { useEffect, useRef, useState } from 'react';
import { geocodeAddress } from '@/services/geocoding';

interface PlaceResult {
  address: string;
  latitude: number;
  longitude: number;
}

interface UseGooglePlacesAutocompleteProps {
  onPlaceSelect: (place: PlaceResult) => void;
  onError?: (error: string) => void;
}

export const useGooglePlacesAutocomplete = ({
  onPlaceSelect,
  onError
}: UseGooglePlacesAutocompleteProps) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!inputRef.current || !(window as any).google?.maps?.places) return;

    // Initialize autocomplete
    autocompleteRef.current = new (window as any).google.maps.places.Autocomplete(inputRef.current, {
      types: ['address'],
      componentRestrictions: { country: ['ca', 'us'] }, // Restrict to North America
      fields: ['formatted_address', 'geometry.location', 'place_id']
    });

    // Handle place selection
    const handlePlaceSelect = async () => {
      const place = autocompleteRef.current?.getPlace();
      
      if (!place?.geometry?.location) {
        onError?.('Unable to find location for this address');
        return;
      }

      const address = place.formatted_address || '';
      const latitude = place.geometry.location.lat();
      const longitude = place.geometry.location.lng();

      setIsLoading(true);
      
      try {
        // Use our geocoding service for consistent results
        const geocodeResult = await geocodeAddress(address);
        
        if ('error' in geocodeResult) {
          // Fallback to Google's coordinates if our service fails
          onPlaceSelect({ address, latitude, longitude });
        } else {
          onPlaceSelect({
            address: geocodeResult.formattedAddress || address,
            latitude: geocodeResult.latitude,
            longitude: geocodeResult.longitude
          });
        }
      } catch (error) {
        // Fallback to Google's coordinates
        onPlaceSelect({ address, latitude, longitude });
      } finally {
        setIsLoading(false);
      }
    };

    autocompleteRef.current.addListener('place_changed', handlePlaceSelect);

    return () => {
      if (autocompleteRef.current) {
        (window as any).google.maps.event.clearInstanceListeners(autocompleteRef.current);
      }
    };
  }, [onPlaceSelect, onError]);

  return {
    inputRef,
    isLoading
  };
};