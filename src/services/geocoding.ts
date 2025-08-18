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
    // Use the Supabase edge function instead of /api/geocode
    const response = await fetch('https://qsqjwpajvcmahoamwwww.supabase.co/functions/v1/geocode', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFzcWp3cGFqdmNtYWhvYW13d3d3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg5MDM4NDcsImV4cCI6MjA2NDQ3OTg0N30.bmtRnTF2Jf36ukaLkBnhxs2X6u5fZxqyOyqkeZYmlNA`,
      },
      body: JSON.stringify({ address: address.trim() }),
    });

    // Handle empty or invalid response
    const responseText = await response.text();
    if (!responseText || responseText.trim() === '') {
      return { 
        error: 'Empty response from geocoding service'
      };
    }

    let data;
    try {
      data = JSON.parse(responseText);
    } catch (parseError) {
      console.error('Failed to parse geocoding response:', responseText);
      return { 
        error: 'Invalid response format from geocoding service'
      };
    }

    if (!response.ok) {
      return { 
        error: data?.error || 'Failed to geocode address',
        code: data?.code 
      };
    }

    // Validate response data
    if (!data || typeof data.latitude !== 'number' || typeof data.longitude !== 'number') {
      return {
        error: 'Invalid coordinates received from geocoding service'
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