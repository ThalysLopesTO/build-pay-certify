import { useEffect, useRef, useState } from 'react';
import { geocodeAddress } from '@/services/geocoding';

export interface PlacePrediction {
  place_id: string;
  description: string;
}

interface UseGooglePlacesAutocompleteReturn {
  predictions: PlacePrediction[];
  isLoading: boolean;
  error: string | null;
  selectPlace: (placeId: string) => Promise<void>;
}

interface UseGooglePlacesAutocompleteProps {
  input: string;
  onPlaceSelect: (place: { address: string; latitude: number; longitude: number }) => void;
}

export const useGooglePlacesAutocomplete = ({
  input,
  onPlaceSelect
}: UseGooglePlacesAutocompleteProps): UseGooglePlacesAutocompleteReturn => {
  const [predictions, setPredictions] = useState<PlacePrediction[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const autocompleteServiceRef = useRef<any>(null);
  const placesServiceRef = useRef<any>(null);

  // Initialize services
  useEffect(() => {
    if (!(window as any).google?.maps?.places) return;

    if (!autocompleteServiceRef.current) {
      autocompleteServiceRef.current = new (window as any).google.maps.places.AutocompleteService();
    }

    if (!placesServiceRef.current) {
      const dummyDiv = document.createElement('div');
      placesServiceRef.current = new (window as any).google.maps.places.PlacesService(dummyDiv);
    }
  }, []);

  // Fetch predictions when input changes
  useEffect(() => {
    if (!input || input.length < 3) {
      setPredictions([]);
      return;
    }

    if (!autocompleteServiceRef.current) {
      return;
    }

    setIsLoading(true);
    setError(null);

    const request = {
      input: input,
      types: ['address'],
      componentRestrictions: { country: ['ca', 'us'] }
    };

    autocompleteServiceRef.current.getPlacePredictions(
      request,
      (results: any, status: any) => {
        setIsLoading(false);

        if (status === (window as any).google.maps.places.PlacesServiceStatus.OK && results) {
          const formattedPredictions: PlacePrediction[] = results.map((result: any) => ({
            place_id: result.place_id,
            description: result.description
          }));
          
          setPredictions(formattedPredictions);
        } else if (status === (window as any).google.maps.places.PlacesServiceStatus.ZERO_RESULTS) {
          setPredictions([]);
        } else {
          console.error('Places API error:', status);
          setError('Unable to fetch address suggestions');
          setPredictions([]);
        }
      }
    );
  }, [input]);

  const selectPlace = async (placeId: string) => {
    if (!placesServiceRef.current) {
      console.error('PlacesService not available');
      return;
    }

    setIsLoading(true);

    const request = {
      placeId: placeId,
      fields: ['formatted_address', 'geometry.location']
    };

    placesServiceRef.current.getDetails(request, async (place: any, status: any) => {
      if (status === (window as any).google.maps.places.PlacesServiceStatus.OK && place) {
        const address = place.formatted_address || '';
        const latitude = place.geometry?.location?.lat();
        const longitude = place.geometry?.location?.lng();

        if (latitude && longitude) {
          try {
            // Try to geocode for consistent results
            const geocodeResult = await geocodeAddress(address);
            
            if ('error' in geocodeResult) {
              // Fallback to Google's coordinates
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
          }
        } else {
          setError('Unable to get coordinates for this address');
        }
      } else {
        console.error('Failed to get place details:', status);
        setError('Unable to get address details');
      }

      setIsLoading(false);
      setPredictions([]);
    });
  };

  return {
    predictions,
    isLoading,
    error,
    selectPlace
  };
};