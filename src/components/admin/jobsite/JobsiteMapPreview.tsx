import React, { useEffect, useRef, useState } from 'react';
import { MapPin, Loader2 } from 'lucide-react';
import { GOOGLE_MAPS_API_KEY } from '@/config/googleMaps';
import { loadGoogleMaps } from '@/utils/loadGoogleMaps';

interface JobsiteMapPreviewProps {
  latitude?: number | null;
  longitude?: number | null;
  address?: string;
  height?: string;
}

/**
 * JobsiteMapPreview Component
 * 
 * Displays a Google Map with a marker for the jobsite location.
 * Automatically centers and zooms to the coordinates.
 * Shows loading states and gracefully handles missing coordinates.
 */
const JobsiteMapPreview: React.FC<JobsiteMapPreviewProps> = ({
  latitude,
  longitude,
  address,
  height = '200px',
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!latitude || !longitude || !mapRef.current) {
      setIsLoading(false);
      return;
    }

    const initializeMap = async () => {
      try {
        setIsLoading(true);
        setError(null);

        await loadGoogleMaps(GOOGLE_MAPS_API_KEY);

        if (!mapRef.current) return;

        const position = { lat: latitude, lng: longitude };

        // Create or update map
        if (!mapInstanceRef.current) {
          mapInstanceRef.current = new (window as any).google.maps.Map(mapRef.current, {
            center: position,
            zoom: 15,
            mapTypeControl: false,
            streetViewControl: false,
            fullscreenControl: false,
            zoomControl: true,
          });
        } else {
          mapInstanceRef.current.setCenter(position);
        }

        // Create or update marker
        if (markerRef.current) {
          markerRef.current.setPosition(position);
        } else {
          markerRef.current = new (window as any).google.maps.Marker({
            position,
            map: mapInstanceRef.current,
            title: address || 'Jobsite Location',
          });
        }

        setIsLoading(false);
      } catch (err) {
        console.error('Error initializing map:', err);
        setError('Failed to load map');
        setIsLoading(false);
      }
    };

    initializeMap();

    return () => {
      if (markerRef.current) {
        markerRef.current.setMap(null);
        markerRef.current = null;
      }
    };
  }, [latitude, longitude, address]);

  if (!latitude || !longitude) {
    return (
      <div
        className="flex flex-col items-center justify-center bg-muted/30 rounded-lg border border-dashed"
        style={{ height }}
      >
        <MapPin className="h-8 w-8 text-muted-foreground mb-2" />
        <p className="text-sm text-muted-foreground">No location set</p>
        <p className="text-xs text-muted-foreground">Select an address to see map</p>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className="flex flex-col items-center justify-center bg-destructive/10 rounded-lg border border-destructive/20"
        style={{ height }}
      >
        <MapPin className="h-8 w-8 text-destructive mb-2" />
        <p className="text-sm text-destructive">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div
        ref={mapRef}
        className="relative rounded-lg border overflow-hidden shadow-sm"
        style={{ height }}
      >
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-10">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        )}
      </div>
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <MapPin className="h-3 w-3" />
        <span>
          {latitude.toFixed(6)}, {longitude.toFixed(6)}
        </span>
      </div>
    </div>
  );
};

export default JobsiteMapPreview;
