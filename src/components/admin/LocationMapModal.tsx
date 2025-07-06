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

  const generateStaticMapUrl = (lat: number, lng: number) => {
    return `https://maps.googleapis.com/maps/api/staticmap?center=${lat},${lng}&zoom=15&size=600x300&markers=color:red%7C${lat},${lng}&key=AIzaSyBgdO3avHHtY9d0TpYkxb22mcPGIPNWJvU`;
  };

  const generateGoogleMapsLink = (lat: number, lng: number) => {
    return `https://www.google.com/maps?q=${lat},${lng}`;
  };

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
              {/* Google Static Maps Image (clickable) */}
              <div className="w-full">
                <a
                  href={generateGoogleMapsLink(coordinates.lat, coordinates.lng)}
                  target="_blank"
                  rel="noopener noreferrer"
                  title="Open in Google Maps"
                >
                  <img
                    src={generateStaticMapUrl(coordinates.lat, coordinates.lng)}
                    alt="Punch location map"
                    className="w-full rounded-lg shadow-md"
                    style={{
                      borderRadius: "8px",
                      boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                      maxHeight: "300px",
                      objectFit: "cover",
                      cursor: "pointer"
                    }}
                  />
                </a>
              </div>

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
