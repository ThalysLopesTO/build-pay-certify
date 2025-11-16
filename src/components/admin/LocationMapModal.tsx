import React, { useEffect, useRef } from "react";

interface PunchLocation {
  id: string;
  latitude: number;
  longitude: number;
  timestamp: string;
  employeeName: string;
  photoUrl?: string;
}

interface LocationMapModalProps {
  latitude: number;
  longitude: number;
  employeeName: string;
  timestamp: string;
  onClose: () => void;
  jobsiteName?: string;
  jobsiteLatitude?: number;
  jobsiteLongitude?: number;
  employeePunches?: PunchLocation[];
  photoUrl?: string;
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
  employeePunches = [],
  photoUrl,
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const circleRef = useRef<any>(null);
  const polylineRef = useRef<any>(null);
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
      markersRef.current.forEach(marker => marker?.setMap(null));
      markersRef.current = [];
      if (circleRef.current) {
        circleRef.current.setMap(null);
        circleRef.current = null;
      }
      if (polylineRef.current) {
        polylineRef.current.setMap(null);
        polylineRef.current = null;
      }
      if (mapInstanceRef.current) {
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update markers, circle, and polyline when coordinates change
  useEffect(() => {
    if (!mapInstanceRef.current || !window.google?.maps) return;

    // Clear existing markers, circle, and polyline
    markersRef.current.forEach(marker => marker?.setMap(null));
    markersRef.current = [];
    if (circleRef.current) {
      circleRef.current.setMap(null);
      circleRef.current = null;
    }
    if (polylineRef.current) {
      polylineRef.current.setMap(null);
      polylineRef.current = null;
    }

    const bounds = new window.google.maps.LatLngBounds();
    const hasJobsite = jobsiteLatitude != null && jobsiteLongitude != null;

    // 1. Jobsite marker with radius circle
    if (hasJobsite) {
      const jobsitePosition = { lat: jobsiteLatitude, lng: jobsiteLongitude };
      
      // Jobsite marker (blue circle)
      const jobsiteMarker = new window.google.maps.Marker({
        position: jobsitePosition,
        map: mapInstanceRef.current,
        title: `Jobsite: ${jobsiteName || 'Jobsite'}`,
        icon: {
          path: window.google.maps.SymbolPath.CIRCLE,
          scale: 8,
          fillColor: "#2563eb",
          fillOpacity: 1,
          strokeColor: "#1d4ed8",
          strokeWeight: 2,
        },
        zIndex: 100,
      });
      markersRef.current.push(jobsiteMarker);
      bounds.extend(jobsitePosition);

      // Radius circle around jobsite
      circleRef.current = new window.google.maps.Circle({
        map: mapInstanceRef.current,
        center: jobsitePosition,
        radius: 150, // 150 meters
        strokeColor: "#2563eb",
        strokeOpacity: 0.7,
        strokeWeight: 1,
        fillColor: "#3b82f6",
        fillOpacity: 0.08,
      });
    }

    // 2. Employee punch markers
    const punchesToDisplay = employeePunches.length > 0 ? employeePunches : [
      { id: 'current', latitude, longitude, timestamp, employeeName, photoUrl }
    ];

    // Sort by timestamp
    const sortedPunches = [...punchesToDisplay].sort(
      (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );

    const routePath: { lat: number; lng: number }[] = [];
    const currentPunchId = employeePunches.length > 0 ? 
      punchesToDisplay.find(p => p.latitude === latitude && p.longitude === longitude)?.id : 
      'current';

    sortedPunches.forEach((punch) => {
      if (punch.latitude == null || punch.longitude == null) return;

      const pos = { lat: punch.latitude, lng: punch.longitude };
      routePath.push(pos);

      const isSelected = punch.id === currentPunchId;
      
      // Create custom marker icon with employee photo or fallback to colored circle
      let markerIcon: any;
      
      if (punch.photoUrl) {
        markerIcon = {
          url: punch.photoUrl,
          scaledSize: new window.google.maps.Size(isSelected ? 44 : 36, isSelected ? 44 : 36),
          anchor: new window.google.maps.Point(isSelected ? 22 : 18, isSelected ? 22 : 18),
        };
      } else {
        markerIcon = {
          path: window.google.maps.SymbolPath.CIRCLE,
          scale: isSelected ? 10 : 7,
          fillColor: isSelected ? "#dc2626" : "#f97316",
          fillOpacity: 1,
          strokeColor: "#ffffff",
          strokeWeight: 2,
        };
      }

      const marker = new window.google.maps.Marker({
        position: pos,
        map: mapInstanceRef.current,
        title: `${punch.employeeName} – ${new Date(punch.timestamp).toLocaleTimeString()}`,
        icon: markerIcon,
        zIndex: isSelected ? 200 : 150,
      });

      markersRef.current.push(marker);
      bounds.extend(pos);
    });

    // 3. Draw polyline connecting punches
    if (routePath.length > 1) {
      polylineRef.current = new window.google.maps.Polyline({
        path: routePath,
        geodesic: true,
        strokeColor: "#0ea5e9",
        strokeOpacity: 0.9,
        strokeWeight: 3,
        map: mapInstanceRef.current,
      });
    }

    // 4. Fit map to show all markers
    if (!bounds.isEmpty()) {
      mapInstanceRef.current.fitBounds(bounds);
    } else {
      mapInstanceRef.current.setCenter({ lat: latitude, lng: longitude });
      mapInstanceRef.current.setZoom(16);
    }
  }, [latitude, longitude, employeeName, jobsiteName, jobsiteLatitude, jobsiteLongitude, employeePunches, timestamp, photoUrl]);

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
        <div className="p-4 border-t text-sm space-y-3">
          <div>
            <p><strong>Employee:</strong> {employeeName}</p>
            <p><strong>Selected Punch:</strong> {timestamp}</p>
            {employeePunches.length > 1 && (
              <p className="text-xs text-muted-foreground mt-1">
                Showing {employeePunches.length} punch locations for this employee
              </p>
            )}
          </div>
          
          <div className="grid grid-cols-2 gap-4 pt-2 border-t">
            <div>
              <p className="font-semibold flex items-center gap-1">
                <span className="inline-block w-3 h-3 rounded-full bg-red-500"></span>
                Punch Location
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

          {/* Legend */}
          <div className="flex flex-wrap items-center gap-4 pt-2 border-t text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              <span className="inline-block h-3 w-3 rounded-full bg-blue-600" />
              <span>Jobsite (150m radius)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-block h-3 w-3 rounded-full bg-red-500" />
              <span>Punch locations</span>
            </div>
            {employeePunches.length > 1 && (
              <div className="flex items-center gap-2">
                <span className="inline-block h-0.5 w-6 bg-sky-400" />
                <span>Route</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LocationMapModal;
