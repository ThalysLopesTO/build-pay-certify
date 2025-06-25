
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { MapPin } from 'lucide-react';

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
        
        <div className="w-full h-96 bg-gray-100 rounded-lg flex items-center justify-center">
          {coordinates ? (
            <div className="text-center">
              <MapPin className="h-12 w-12 text-orange-500 mx-auto mb-4" />
              <p className="text-lg font-semibold mb-2">Location Coordinates</p>
              <p className="text-gray-600">
                Latitude: {coordinates.lat.toFixed(6)}
              </p>
              <p className="text-gray-600">
                Longitude: {coordinates.lng.toFixed(6)}
              </p>
              <p className="text-sm text-muted-foreground mt-4">
                Map integration coming soon
              </p>
            </div>
          ) : (
            <div className="text-center">
              <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-lg font-semibold mb-2">No Location Data</p>
              <p className="text-gray-500">
                Location coordinates were not captured for this punch-in
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default LocationMapModal;
