
import React, { useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { MapPin } from 'lucide-react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

interface LocationMapModalProps {
  isOpen: boolean;
  onClose: () => void;
  location: string | null;
  employeeName: string;
  timestamp: string;
}

const LocationMapModal: React.FC<LocationMapModalProps> = ({
  isOpen,
  onClose,
  location,
  employeeName,
  timestamp
}) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);

  const parseLocation = (locationString: string | null) => {
    if (!locationString) return null;
    
    // Try to parse coordinates from location string
    // Format could be "lat,lng" or "latitude: X, longitude: Y"
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

  const coordinates = parseLocation(location);

  useEffect(() => {
    if (!isOpen || !coordinates || !mapContainer.current) return;

    // Set Mapbox access token - using a public token placeholder
    // In a real application, this should be stored in environment variables
    mapboxgl.accessToken = 'pk.eyJ1IjoibG92YWJsZS1kZXYiLCJhIjoiY2x6eWtneDVlMGhnYzJqcHE4OTFiN2lnciJ9.rHjq3PM_87zLWJYNE8bSpQ';

    // Initialize map
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [coordinates.lng, coordinates.lat],
      zoom: 15,
    });

    // Add marker
    new mapboxgl.Marker({
      color: '#f97316', // Orange color to match the theme
      scale: 1.2
    })
      .setLngLat([coordinates.lng, coordinates.lat])
      .addTo(map.current);

    // Add navigation controls
    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

    // Cleanup function
    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, [isOpen, coordinates]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-orange-500" />
            Punch-in Location - {employeeName}
          </DialogTitle>
          <p className="text-sm text-muted-foreground">{timestamp}</p>
        </DialogHeader>
        
        <div className="w-full">
          {coordinates ? (
            <div className="space-y-4">
              {/* Map Container */}
              <div 
                ref={mapContainer} 
                className="w-full h-[300px] bg-gray-100 rounded-lg border"
                style={{ minHeight: '300px' }}
              />
              
              {/* Coordinates Display */}
              <div className="text-center bg-gray-50 p-4 rounded-lg">
                <p className="text-lg font-semibold mb-2">Location Coordinates</p>
                <div className="space-y-1">
                  <p className="text-gray-600">
                    <span className="font-medium">Latitude:</span> {coordinates.lat.toFixed(6)}
                  </p>
                  <p className="text-gray-600">
                    <span className="font-medium">Longitude:</span> {coordinates.lng.toFixed(6)}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="w-full h-[300px] bg-gray-100 rounded-lg flex items-center justify-center">
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
