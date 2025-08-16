import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface WeatherResponse {
  temp_c: number;
  condition: string;
  icon: string;
  humidity: number;
  wind_kmh: number;
  location: string;
  updated_at: string;
}

// Map Open-Meteo weather codes to conditions and icons
const getWeatherInfo = (code: number): { condition: string; icon: string } => {
  if (code === 0) return { condition: "Clear sky", icon: "clear" };
  if (code <= 3) return { condition: "Partly cloudy", icon: "partly-cloudy" };
  if (code <= 48) return { condition: "Foggy", icon: "fog" };
  if (code <= 67) return { condition: "Rainy", icon: "rain" };
  if (code <= 77) return { condition: "Snowy", icon: "snow" };
  if (code <= 82) return { condition: "Showers", icon: "rain" };
  if (code <= 99) return { condition: "Thunderstorm", icon: "thunderstorm" };
  return { condition: "Unknown", icon: "clear" };
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { lat, lon, unit = 'c' } = await req.json();

    if (!lat || !lon) {
      throw new Error('Latitude and longitude are required');
    }

    console.log(`Fetching weather for coordinates: ${lat}, ${lon}`);

    // Call Open-Meteo API
    const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m&temperature_unit=celsius&wind_speed_unit=kmh&timezone=auto`;
    
    const response = await fetch(weatherUrl);
    
    if (!response.ok) {
      throw new Error(`Weather API failed: ${response.status}`);
    }

    const data = await response.json();
    const current = data.current;

    const { condition, icon } = getWeatherInfo(current.weather_code);

    const weatherData: WeatherResponse = {
      temp_c: Math.round(current.temperature_2m),
      condition,
      icon,
      humidity: current.relative_humidity_2m,
      wind_kmh: Math.round(current.wind_speed_10m),
      location: `${lat.toFixed(2)}, ${lon.toFixed(2)}`, // Default location format
      updated_at: new Date().toISOString()
    };

    console.log('Weather data retrieved successfully:', weatherData);

    return new Response(JSON.stringify(weatherData), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in weather function:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      details: 'Failed to fetch weather data'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});