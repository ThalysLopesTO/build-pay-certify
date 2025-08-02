import React, { useEffect, useRef, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { MapPin, AlertTriangle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

// Global Google Maps type declaration
declare global {
  interface Window {
    google: any;
  }
}

interface LocationMapModalProps {
  isOpen: boolean;
  onClose: () => void;
  location: string | null;
  employeeName: string;
  timestamp: string;
  jobsite: {
    name: string;
    latitude: number | null;
    longitude: number | null;
  } | null;
}

const LocationMapModal: React.FC<LocationMapModalProps> = ({
  isOpen,
  onClose,
  location,
  employeeName,
  timestamp,
  jobsite
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const [distance, setDistance] = useState<number | null>(null);

  const parseLocation = (locationString: string | null) => {
    if (!locationString) return null;
    
    const coordRegex = /(-?\d+\.?\d*),\s*(-?\d+\.?\d*)/;
    const match = locationString.match(coordRegex);
    
    if (match) {
      return {
        lat: parseFloat(match[1]),
        lng: parseFloat(match[2])
      };
    }
    
    return null;
  };

  const punchCoords = parseLocation(location);
  const jobsiteCoords = jobsite?.latitude && jobsite?.longitude ? {
    lat: jobsite.latitude,
    lng: jobsite.longitude
  } : null;

  const formatDistance = (meters: number) => {
    if (meters >= 1000) {
      return `${(meters / 1000).toFixed(1)}km`;
    }
    return `${Math.round(meters)}m`;
  };

  const calculateDistance = (
    punch: { lat: number; lng: number },
    jobsiteCoord: { lat: number; lng: number }
  ) => {
    if (window.google?.maps?.geometry?.spherical) {
      const punchLatLng = new window.google.maps.LatLng(punch.lat, punch.lng);
      const jobsiteLatLng = new window.google.maps.LatLng(jobsiteCoord.lat, jobsiteCoord.lng);
      return window.google.maps.geometry.spherical.computeDistanceBetween(punchLatLng, jobsiteLatLng);
    }
    return null;
  };

  useEffect(() => {
    if (!isOpen || !mapRef.current || !punchCoords || !window.google) return;

    // Initialize the map
    const map = new window.google.maps.Map(mapRef.current, {
      zoom: 15,
      center: punchCoords,
      mapTypeId: window.google.maps.MapTypeId.ROADMAP,
    });

    mapInstanceRef.current = map;

    // Add punch-in marker (red)
    const punchMarker = new window.google.maps.Marker({
      position: punchCoords,
      map: map,
      title: `Punch-in Location - ${employeeName}`,
      icon: {
        url: 'https://maps.google.com/mapfiles/ms/icons/red-dot.png',
        scaledSize: new window.google.maps.Size(32, 32),
      },
    });

    // Add jobsite marker (blue) if available
    let jobsiteMarker: any = null;
    let polyline: any = null;

    if (jobsiteCoords) {
      jobsiteMarker = new window.google.maps.Marker({
        position: jobsiteCoords,
        map: map,
        title: `Jobsite - ${jobsite?.name}`,
        icon: {
          url: 'https://maps.google.com/mapfiles/ms/icons/blue-dot.png',
          scaledSize: new window.google.maps.Size(32, 32),
        },
      });

      // Draw polyline between markers
      polyline = new window.google.maps.Polyline({
        path: [punchCoords, jobsiteCoords],
        geodesic: true,
        strokeColor: '#3B82F6',
        strokeOpacity: 0.6,
        strokeWeight: 2,
        map: map,
      });

      // Calculate distance
      const dist = calculateDistance(punchCoords, jobsiteCoords);
      if (dist !== null) {
        setDistance(dist);
      }

      // Auto-fit both markers
      const bounds = new window.google.maps.LatLngBounds();
      bounds.extend(punchCoords);
      bounds.extend(jobsiteCoords);
      map.fitBounds(bounds);
      
      // Ensure minimum zoom level
      const listener = window.google.maps.event.addListener(map, "idle", () => {
        if (map.getZoom()! > 18) {
          map.setZoom(18);
        }
        window.google.maps.event.removeListener(listener);
      });
    }

    // Cleanup function
    return () => {
      if (punchMarker) punchMarker.setMap(null);
      if (jobsiteMarker) jobsiteMarker.setMap(null);
      if (polyline) polyline.setMap(null);
      setDistance(null);
    };
  }, [isOpen, punchCoords, jobsiteCoords, employeeName, jobsite?.name]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[85vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-orange-500" />
            Punch-in Location - {employeeName}
          </DialogTitle>
          <p className="text-sm text-muted-foreground">{timestamp}</p>
        </DialogHeader>
        
        <div className="w-full space-y-4">
          {punchCoords ? (
            <>
              {/* Interactive Google Map */}
              <div 
                ref={mapRef} 
                className="w-full h-[350px] rounded-lg border shadow-sm"
                style={{ minHeight: '350px' }}
              />

              {/* Distance Information */}
              {distance !== null && jobsiteCoords && (
                <div className="bg-muted/50 p-4 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">
                        Employee punched in <span className="font-bold">{formatDistance(distance)}</span> from the jobsite
                      </span>
                      {distance > 200 && (
                        <Badge variant="secondary" className="flex items-center gap-1">
                          <AlertTriangle className="h-3 w-3" />
                          Far from jobsite
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Legend */}
              <div className="flex items-center justify-center gap-6 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                  <span>Punch-in Location</span>
                </div>
                {jobsiteCoords && (
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                    <span>Jobsite Location</span>
                  </div>
                )}
              </div>

              {/* Coordinates Display */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-muted/30 p-4 rounded-lg">
                  <p className="font-medium mb-2 text-red-600">🔴 Punch-in Coordinates</p>
                  <div className="space-y-1 text-sm">
                    <p><span className="font-medium">Latitude:</span> {punchCoords.lat.toFixed(6)}</p>
                    <p><span className="font-medium">Longitude:</span> {punchCoords.lng.toFixed(6)}</p>
                  </div>
                </div>
                
                {jobsiteCoords && (
                  <div className="bg-muted/30 p-4 rounded-lg">
                    <p className="font-medium mb-2 text-blue-600">🔵 Jobsite Coordinates</p>
                    <div className="space-y-1 text-sm">
                      <p><span className="font-medium">Name:</span> {jobsite?.name}</p>
                      <p><span className="font-medium">Latitude:</span> {jobsiteCoords.lat.toFixed(6)}</p>
                      <p><span className="font-medium">Longitude:</span> {jobsiteCoords.lng.toFixed(6)}</p>
                    </div>
                  </div>
                )}
              </div>

              {!jobsiteCoords && (
                <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
                  <div className="flex items-center gap-2 text-yellow-800">
                    <AlertTriangle className="h-4 w-4" />
                    <span className="text-sm font-medium">
                      Jobsite coordinates not available for comparison
                    </span>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="w-full h-[350px] bg-gray-100 rounded-lg flex items-center justify-center">
              <div className="text-center">
                <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-lg font-semibold mb-2">No Location Data</p>
                <p className="text-gray-500">
                  Location coordinates were not captured for this punch-in
                </p>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default LocationMapModal;
