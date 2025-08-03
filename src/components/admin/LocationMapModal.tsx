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
  punchLocation: string | null;
  employeeName: string;
  timestamp: string;
  // TODO: Will re-add jobsite prop later for distance calculations
}

const LocationMapModal: React.FC<LocationMapModalProps> = ({
  isOpen,
  onClose,
  punchLocation,
  employeeName,
  timestamp
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  // TODO: Will re-add distance state later for jobsite comparison

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

  const punchCoords = parseLocation(punchLocation);
  // TODO: Will re-add jobsite coordinates parsing later

  // TODO: Will re-add distance calculation functions later for jobsite comparison

  useEffect(() => {
    if (!isOpen || !mapRef.current || !punchCoords || !window.google) return;

    // Initialize the map centered on punch-in location
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

    // TODO: Will re-add jobsite marker, polyline, and distance calculation later

    // Cleanup function
    return () => {
      if (punchMarker) punchMarker.setMap(null);
    };
  }, [isOpen, punchCoords, employeeName]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[85vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-orange-500" />
            Punch-in Location
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

              {/* TODO: Will re-add distance information section later */}

              {/* Legend - Simplified */}
              <div className="flex items-center justify-center gap-6 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                  <span>Punch-in Location</span>
                </div>
                {/* TODO: Will re-add jobsite legend later */}
              </div>

              {/* Coordinates Display - Simplified */}
              <div className="grid grid-cols-1 gap-4">
                <div className="bg-muted/30 p-4 rounded-lg">
                  <p className="font-medium mb-2 text-red-600">🔴 Punch-in Coordinates</p>
                  <div className="space-y-1 text-sm">
                    <p><span className="font-medium">Employee:</span> {employeeName}</p>
                    <p><span className="font-medium">Latitude:</span> {punchCoords.lat.toFixed(6)}</p>
                    <p><span className="font-medium">Longitude:</span> {punchCoords.lng.toFixed(6)}</p>
                  </div>
                </div>
                {/* TODO: Will re-add jobsite coordinates display later */}
              </div>

              {/* TODO: Will re-add jobsite availability warning later */}
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
