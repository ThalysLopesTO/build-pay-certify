import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Cloud, Sun, CloudRain, CloudSnow, Zap, Eye, Settings } from 'lucide-react';
import { useCompanySettings } from '@/hooks/useCompanySettings';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/SupabaseAuthContext';

interface WeatherData {
  temp_c: number;
  condition: string;
  icon: string;
  humidity: number;
  wind_kmh: number;
  location: string;
  updated_at: string;
}

const WeatherCard = () => {
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { settings } = useCompanySettings();
  const { user } = useAuth();

  const getWeatherIcon = (iconKey: string) => {
    switch (iconKey) {
      case 'clear': return <Sun className="h-6 w-6" />;
      case 'partly-cloudy': return <Cloud className="h-6 w-6" />;
      case 'rain': return <CloudRain className="h-6 w-6" />;
      case 'snow': return <CloudSnow className="h-6 w-6" />;
      case 'thunderstorm': return <Zap className="h-6 w-6" />;
      default: return <Cloud className="h-6 w-6" />;
    }
  };

  const getLocationData = async () => {
    // Priority 1: Most recent active jobsite
    try {
      const { data: jobsites } = await supabase
        .from('jobsites')
        .select('latitude, longitude, name')
        .eq('company_id', user?.companyId)
        .eq('status', 'active')
        .not('latitude', 'is', null)
        .not('longitude', 'is', null)
        .order('created_at', { ascending: false })
        .limit(1);

      if (jobsites && jobsites.length > 0) {
        const jobsite = jobsites[0];
        return {
          lat: Number(jobsite.latitude),
          lng: Number(jobsite.longitude),
          label: jobsite.name
        };
      }
    } catch (err) {
      console.error('Error fetching jobsite location:', err);
    }

    // Priority 3: Default to Toronto
    return {
      lat: 43.6532,
      lng: -79.3832,
      label: 'Toronto, ON'
    };
  };

  const fetchWeather = async () => {
    try {
      setLoading(true);
      setError(null);

      const location = await getLocationData();
      
      const { data, error: weatherError } = await supabase.functions.invoke('weather', {
        body: {
          lat: location.lat,
          lon: location.lng,
          unit: 'c'
        }
      });

      if (weatherError) {
        throw new Error(weatherError.message || 'Failed to fetch weather');
      }

      setWeatherData({
        ...data,
        location: location.label
      });
    } catch (err: any) {
      console.error('Weather fetch error:', err);
      setError(err.message || 'Failed to load weather data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWeather();
  }, [settings, user?.companyId]);

  const formatTimeAgo = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffMinutes < 1) return 'Just now';
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    return 'Today';
  };

  if (loading) {
    return (
      <div className="lg:h-full">
        <Card className="shadow-lg border-0 overflow-hidden bg-gradient-to-br from-orange-500 to-orange-600 text-white rounded-2xl h-full">
          <CardContent className="p-6 h-full flex flex-col">
            <div className="space-y-5 flex-1">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-white/20 rounded-full animate-pulse">
                  <Cloud className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-medium opacity-90">Weather Today</h3>
                </div>
              </div>
              <div className="space-y-4 flex-1">
                <div className="animate-pulse">
                  <div className="text-4xl font-bold mb-2 bg-white/20 rounded h-12 w-24"></div>
                  <div className="text-sm opacity-90 bg-white/20 rounded h-4 w-32 mb-4"></div>
                  <div className="flex items-center gap-3">
                    <div className="bg-white/20 rounded h-6 w-20"></div>
                    <div className="bg-white/20 rounded h-6 w-20"></div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="lg:h-full">
        <Card className="shadow-lg border-0 overflow-hidden bg-gradient-to-br from-orange-500 to-orange-600 text-white rounded-2xl h-full">
          <CardContent className="p-6 h-full flex flex-col justify-center items-center">
            <Eye className="h-8 w-8 opacity-50 mb-4" />
            <p className="text-sm opacity-90 mb-4 text-center">Can't load weather</p>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={fetchWeather}
              className="text-white hover:bg-white/10 border-0"
            >
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!weatherData) {
    return (
      <div className="lg:h-full">
        <Card className="shadow-lg border-0 overflow-hidden bg-gradient-to-br from-orange-500 to-orange-600 text-white rounded-2xl h-full">
          <CardContent className="p-6 h-full flex flex-col justify-center items-center">
            <Settings className="h-8 w-8 opacity-50 mb-4" />
            <p className="text-sm opacity-90 mb-4 text-center">Set a location in Company Settings</p>
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-white hover:bg-white/10 border-0"
            >
              Settings
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="lg:h-full">
      <Card className="shadow-lg border-0 overflow-hidden bg-gradient-to-br from-orange-500 to-orange-600 text-white rounded-2xl h-full">
        <CardContent className="p-6 h-full flex flex-col">
          <div className="space-y-5 flex-1">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-white/20 rounded-full">
                {getWeatherIcon(weatherData.icon)}
              </div>
              <div>
                <h3 className="text-sm font-medium opacity-90">Weather Today</h3>
              </div>
            </div>

            <div className="space-y-4 flex-1">
              <div>
                <div className="text-4xl font-bold mb-2">{weatherData.temp_c}°C</div>
                <div className="text-sm opacity-90 mb-4">{weatherData.condition}</div>
                
                <div className="flex items-center gap-3 text-xs">
                  <span className="px-2 py-1 rounded-full bg-white/15">
                    Humidity {weatherData.humidity}%
                  </span>
                  <span className="px-2 py-1 rounded-full bg-white/15">
                    Wind {weatherData.wind_kmh} km/h
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="text-xs opacity-75">
                {weatherData.location} • Updated {formatTimeAgo(weatherData.updated_at)}
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                className="w-full justify-between text-white hover:bg-white/10 border-0 text-xs"
              >
                Change Location
                <Settings className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default WeatherCard;