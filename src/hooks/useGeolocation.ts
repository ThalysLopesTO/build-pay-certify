
import { useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';

export const useGeolocation = () => {
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const { toast } = useToast();

  const getCurrentLocation = useCallback((): Promise<string> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        const error = 'Geolocation is not supported by this browser';
        toast({
          title: "Location Error",
          description: error,
          variant: "destructive",
        });
        reject(new Error(error));
        return;
      }

      setIsGettingLocation(true);

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          const locationString = `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
          setIsGettingLocation(false);
          resolve(locationString);
        },
        (error) => {
          setIsGettingLocation(false);
          let errorMessage = 'Unable to retrieve location';
          
          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorMessage = 'Location access denied. Please enable location permissions.';
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage = 'Location information unavailable.';
              break;
            case error.TIMEOUT:
              errorMessage = 'Location request timed out.';
              break;
          }

          toast({
            title: "Location Error",
            description: errorMessage,
            variant: "destructive",
          });
          
          // Provide fallback location
          resolve('Location unavailable');
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000, // 5 minutes
        }
      );
    });
  }, [toast]);

  return {
    getCurrentLocation,
    isGettingLocation,
  };
};
