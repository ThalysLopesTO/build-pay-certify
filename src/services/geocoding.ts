// Geocoding service for converting addresses to GPS coordinates

interface GeocodeResult {
  latitude: number;
  longitude: number;
  formattedAddress?: string;
}

interface GeocodeError {
  error: string;
  code?: string;
}

/**
 * Geocode an address using Google Maps Geocoding API
 * @param address - The address to geocode
 * @returns Promise with lat/lng coordinates or error
 */
export const geocodeAddress = async (address: string): Promise<GeocodeResult | GeocodeError> => {
  if (!address?.trim()) {
    return { error: 'Address is required for geocoding' };
  }

  try {
    const response = await fetch('/api/geocode', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ address: address.trim() }),
    });

    const data = await response.json();

    if (!response.ok) {
      return { 
        error: data.error || 'Failed to geocode address',
        code: data.code 
      };
    }

    return {
      latitude: data.latitude,
      longitude: data.longitude,
      formattedAddress: data.formattedAddress,
    };
  } catch (error) {
    console.error('Geocoding service error:', error);
    return { 
      error: 'Network error while geocoding address'
    };
  }
};

/**
 * Validate latitude and longitude values
 * @param lat - Latitude value
 * @param lng - Longitude value
 * @returns boolean indicating if coordinates are valid
 */
export const validateCoordinates = (lat: number, lng: number): boolean => {
  return (
    typeof lat === 'number' &&
    typeof lng === 'number' &&
    lat >= -90 &&
    lat <= 90 &&
    lng >= -180 &&
    lng <= 180 &&
    !isNaN(lat) &&
    !isNaN(lng)
  );
};

/**
 * Format coordinates for display
 * @param lat - Latitude value
 * @param lng - Longitude value
 * @returns Formatted coordinate string
 */
export const formatCoordinates = (lat: number, lng: number): string => {
  if (!validateCoordinates(lat, lng)) {
    return 'Invalid coordinates';
  }
  
  return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
};