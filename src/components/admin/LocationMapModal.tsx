import React, { useEffect, useRef } from "react";

interface LocationMapModalProps {
  latitude: number;
  longitude: number;
  employeeName: string;
  timestamp: string;
  onClose: () => void;
  jobsiteName?: string;
  jobsiteLatitude?: number;
  jobsiteLongitude?: number;
}

const LocationMapModal: React.FC<LocationMapModalProps> = ({
  latitude,
  longitude,
  employeeName,
  timestamp,
  onClose,
  jobsiteName,
  jobsiteLatitude,
  jobsiteLongitude,
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const punchMarkerRef = useRef<any>(null);
  const jobsiteMarkerRef = useRef<any>(null);
  const retryCount = useRef(0);

  // Initialize map once
  useEffect(() => {
    const loadMap = () => {
      if (!window.google || !window.google.maps) {
        console.warn("⚠️ Google Maps not ready yet...");
        if (retryCount.current < 5) {
          retryCount.current += 1;
          setTimeout(loadMap, 400);
        } else {
          if (mapRef.current) {
            mapRef.current.innerHTML =
              "<div style='padding:16px; color:red; font-weight:bold;'>Google Maps failed to load. Please refresh the page.</div>";
          }
        }
        return;
      }

      if (!mapRef.current || mapInstanceRef.current) return;

      // Create the map
      mapInstanceRef.current = new window.google.maps.Map(mapRef.current, {
        center: { lat: latitude, lng: longitude },
        zoom: 15,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false,
        zoomControl: true,
      });
    };

    loadMap();

    // Cleanup on unmount
    return () => {
      if (punchMarkerRef.current) {
        punchMarkerRef.current.setMap(null);
        punchMarkerRef.current = null;
      }
      if (jobsiteMarkerRef.current) {
        jobsiteMarkerRef.current.setMap(null);
        jobsiteMarkerRef.current = null;
      }
      if (mapInstanceRef.current) {
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update markers and bounds when coordinates change
  useEffect(() => {
    if (!mapInstanceRef.current || !window.google?.maps) return;

    const hasJobsite = jobsiteLatitude != null && jobsiteLongitude != null;
    const bounds = new window.google.maps.LatLngBounds();

    // Punch-in marker (red)
    const punchPosition = { lat: latitude, lng: longitude };
    if (punchMarkerRef.current) {
      punchMarkerRef.current.setPosition(punchPosition);
      punchMarkerRef.current.setTitle(`Punch-in: ${employeeName}`);
    } else {
      punchMarkerRef.current = new window.google.maps.Marker({
        position: punchPosition,
        map: mapInstanceRef.current,
        title: `Punch-in: ${employeeName}`,
        icon: {
          url: 'http://maps.google.com/mapfiles/ms/icons/red-dot.png',
        },
      });
    }
    bounds.extend(punchPosition);

    // Jobsite marker (blue)
    if (hasJobsite) {
      const jobsitePosition = { lat: jobsiteLatitude, lng: jobsiteLongitude };
      if (jobsiteMarkerRef.current) {
        jobsiteMarkerRef.current.setPosition(jobsitePosition);
        jobsiteMarkerRef.current.setTitle(`Jobsite: ${jobsiteName || 'Jobsite'}`);
      } else {
        jobsiteMarkerRef.current = new window.google.maps.Marker({
          position: jobsitePosition,
          map: mapInstanceRef.current,
          title: `Jobsite: ${jobsiteName || 'Jobsite'}`,
          icon: {
            url: 'http://maps.google.com/mapfiles/ms/icons/blue-dot.png',
          },
        });
      }
      bounds.extend(jobsitePosition);
      
      // Fit both markers
      mapInstanceRef.current.fitBounds(bounds);
    } else {
      // Remove jobsite marker if it exists
      if (jobsiteMarkerRef.current) {
        jobsiteMarkerRef.current.setMap(null);
        jobsiteMarkerRef.current = null;
      }
      // Center on punch-in only
      mapInstanceRef.current.setCenter(punchPosition);
      mapInstanceRef.current.setZoom(16);
    }
  }, [latitude, longitude, employeeName, jobsiteName, jobsiteLatitude, jobsiteLongitude]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg w-[700px] max-w-full">
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-lg font-semibold">📍 Punch-in Location</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            ✖
          </button>
        </div>

        {/* Map */}
        <div ref={mapRef} className="w-full h-[400px]" />

        {/* Footer Info */}
        <div className="p-4 border-t text-sm space-y-2">
          <div>
            <p><strong>Employee:</strong> {employeeName}</p>
            <p><strong>Punch-in:</strong> {timestamp}</p>
          </div>
          
          <div className="grid grid-cols-2 gap-4 pt-2 border-t">
            <div>
              <p className="font-semibold flex items-center gap-1">
                <span className="inline-block w-3 h-3 rounded-full bg-red-500"></span>
                Punch-in Location
              </p>
              <p className="text-xs text-muted-foreground">{latitude.toFixed(6)}, {longitude.toFixed(6)}</p>
            </div>
            {jobsiteLatitude != null && jobsiteLongitude != null && (
              <div>
                <p className="font-semibold flex items-center gap-1">
                  <span className="inline-block w-3 h-3 rounded-full bg-blue-500"></span>
                  Jobsite Location
                </p>
                <p className="text-xs text-muted-foreground">{jobsiteName || 'Jobsite'}</p>
                <p className="text-xs text-muted-foreground">{jobsiteLatitude.toFixed(6)}, {jobsiteLongitude.toFixed(6)}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LocationMapModal;
