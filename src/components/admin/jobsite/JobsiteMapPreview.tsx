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
  height = '240px',
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Initialize map once
  useEffect(() => {
    if (!mapRef.current) return;

    const initializeMap = async () => {
      try {
        await loadGoogleMaps(GOOGLE_MAPS_API_KEY);

        if (!mapRef.current || mapInstanceRef.current) return;

        mapInstanceRef.current = new (window as any).google.maps.Map(mapRef.current, {
          center: { lat: 43.65, lng: -79.38 }, // Default to Toronto
          zoom: 15,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false,
          zoomControl: true,
        });

        // Trigger resize to ensure tiles load properly
        if (window.google?.maps?.event) {
          setTimeout(() => {
            if (mapInstanceRef.current) {
              window.google.maps.event.trigger(mapInstanceRef.current, 'resize');
            }
          }, 100);
        }
      } catch (err) {
        console.error('Error initializing map:', err);
        setError('Failed to load map');
      }
    };

    initializeMap();

    // Cleanup only on unmount
    return () => {
      if (markerRef.current) {
        markerRef.current.setMap(null);
        markerRef.current = null;
      }
      if (mapInstanceRef.current) {
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update map position when coordinates change
  useEffect(() => {
    if (!latitude || !longitude || !mapInstanceRef.current) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    const position = { lat: latitude, lng: longitude };

    // Update map center and zoom
    mapInstanceRef.current.setCenter(position);
    mapInstanceRef.current.setZoom(16);

    // Trigger resize to ensure tiles render after position change
    if (window.google?.maps?.event) {
      window.google.maps.event.trigger(mapInstanceRef.current, 'resize');
    }

    // Update or create marker
    if (markerRef.current) {
      markerRef.current.setPosition(position);
      markerRef.current.setTitle(address || 'Jobsite Location');
    } else if (window.google?.maps?.Marker) {
      markerRef.current = new window.google.maps.Marker({
        position,
        map: mapInstanceRef.current,
        title: address || 'Jobsite Location',
        animation: window.google.maps.Animation.DROP,
      });
    }

    setIsLoading(false);
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
        className="relative w-full rounded-lg border border-border shadow-sm"
        style={{ height, minHeight: height }}
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
