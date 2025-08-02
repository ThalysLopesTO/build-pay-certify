import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { address } = await req.json();

    if (!address) {
      return new Response(
        JSON.stringify({ error: 'Address is required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const googleMapsApiKey = Deno.env.get('GOOGLE_MAPS_API_KEY');
    if (!googleMapsApiKey) {
      console.error('GOOGLE_MAPS_API_KEY not found in environment variables');
      return new Response(
        JSON.stringify({ error: 'Geocoding service not configured' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Call Google Maps Geocoding API
    const geocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${googleMapsApiKey}`;
    
    const response = await fetch(geocodeUrl);
    const data = await response.json();

    if (data.status === 'OK' && data.results && data.results.length > 0) {
      const result = data.results[0];
      const location = result.geometry.location;
      
      return new Response(
        JSON.stringify({
          latitude: location.lat,
          longitude: location.lng,
          formattedAddress: result.formatted_address,
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    } else {
      let errorMessage = 'Address not found';
      
      switch (data.status) {
        case 'ZERO_RESULTS':
          errorMessage = 'No results found for this address';
          break;
        case 'OVER_QUERY_LIMIT':
          errorMessage = 'Geocoding quota exceeded';
          break;
        case 'REQUEST_DENIED':
          errorMessage = 'Geocoding request denied';
          break;
        case 'INVALID_REQUEST':
          errorMessage = 'Invalid geocoding request';
          break;
        default:
          errorMessage = `Geocoding failed: ${data.status}`;
      }

      return new Response(
        JSON.stringify({ 
          error: errorMessage,
          code: data.status 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }
  } catch (error) {
    console.error('Geocoding function error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error during geocoding' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});