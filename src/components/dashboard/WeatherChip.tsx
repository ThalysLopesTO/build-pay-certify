import React, { useEffect, useState } from 'react';
import { Cloud, CloudRain, CloudSnow, Sun, Zap } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useCompanySettings } from '@/hooks/useCompanySettings';

const iconFor = (key: string) => {
  switch (key) {
    case 'clear':        return Sun;
    case 'rain':         return CloudRain;
    case 'snow':         return CloudSnow;
    case 'thunderstorm': return Zap;
    default:             return Cloud;
  }
};

interface WeatherChipProps {
  className?: string;
}

/**
 * Compact inline weather pill for the dashboard top bar. Mirrors WeatherCard's
 * location strategy (company setting → active jobsite → Toronto default) but
 * renders just an icon + temperature so weather no longer dominates the page.
 */
export const WeatherChip: React.FC<WeatherChipProps> = ({ className = '' }) => {
  const { user } = useAuth();
  const { settings } = useCompanySettings();
  const [data, setData] = useState<{ temp: number; condition: string; icon: string } | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        let lat = 43.6532;
        let lng = -79.3832; // Toronto fallback
        if (settings?.weather_latitude && settings?.weather_longitude) {
          lat = settings.weather_latitude;
          lng = settings.weather_longitude;
        } else if (user?.companyId) {
          const { data: js } = await supabase
            .from('jobsites')
            .select('latitude, longitude')
            .eq('company_id', user.companyId)
            .eq('status', 'active')
            .not('latitude', 'is', null)
            .not('longitude', 'is', null)
            .order('created_at', { ascending: false })
            .limit(1);
          if (js && js.length) {
            lat = Number(js[0].latitude);
            lng = Number(js[0].longitude);
          }
        }
        const { data: w, error } = await supabase.functions.invoke('weather', {
          body: { lat, lon: lng, unit: 'c' },
        });
        if (!error && w && !cancelled) {
          setData({ temp: w.temp_c, condition: w.condition, icon: w.icon });
        }
      } catch {
        /* weather is non-critical — fail silently */
      }
    })();
    return () => { cancelled = true; };
  }, [settings?.weather_latitude, settings?.weather_longitude, user?.companyId]);

  if (!data) return null;
  const Icon = iconFor(data.icon);

  return (
    <div
      className={`inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600 ${className}`}
      title={`${data.condition} · ${data.temp}°C`}
    >
      <Icon className="h-4 w-4 text-orange-500" />
      <span className="tabular-nums">{data.temp}°C</span>
      <span className="hidden md:inline text-slate-400 font-normal">{data.condition}</span>
    </div>
  );
};

export default WeatherChip;
