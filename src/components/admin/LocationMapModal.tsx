import React, { useEffect, useRef, useMemo } from "react";

// Calculate distance between two points using Haversine formula
const calculateDistanceMeters = (
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number => {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lng2 - lng1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Distance in meters
};

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

  // Helper to get initials from name
  const getInitials = (name: string) => {
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  // Calculate distance between punch and jobsite
  const distance = useMemo(() => {
    if (jobsiteLatitude != null && jobsiteLongitude != null && latitude != null && longitude != null) {
      return calculateDistanceMeters(latitude, longitude, jobsiteLatitude, jobsiteLongitude);
    }
    return null;
  }, [latitude, longitude, jobsiteLatitude, jobsiteLongitude]);

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

      // Radius circle around jobsite (60m with subtle styling)
      circleRef.current = new window.google.maps.Circle({
        map: mapInstanceRef.current,
        center: jobsitePosition,
        radius: 60,
        strokeColor: "#2563eb",
        strokeOpacity: 0.8,
        strokeWeight: 1.5,
        fillColor: "#2563eb",
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
      const size = isSelected ? 50 : 42;
      
      let markerIcon: any;
      
      if (punch.photoUrl) {
        // Photo-based circular marker
        markerIcon = {
          url: punch.photoUrl,
          scaledSize: new window.google.maps.Size(size, size),
          anchor: new window.google.maps.Point(size / 2, size / 2),
        };
      } else {
        // Canvas-based circular marker with initials
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        
        if (ctx) {
          // Outer white circle with shadow
          ctx.shadowColor = 'rgba(0, 0, 0, 0.2)';
          ctx.shadowBlur = isSelected ? 6 : 3;
          ctx.shadowOffsetY = 2;
          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.arc(size / 2, size / 2, size / 2 - 1, 0, Math.PI * 2);
          ctx.fill();

          // Inner colored circle
          ctx.shadowColor = 'transparent';
          ctx.fillStyle = isSelected ? '#dc2626' : '#ef4444';
          ctx.beginPath();
          ctx.arc(size / 2, size / 2, size / 2 - 3, 0, Math.PI * 2);
          ctx.fill();

          // Initials
          ctx.fillStyle = '#ffffff';
          ctx.font = `bold ${Math.floor(size / 3)}px sans-serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(getInitials(punch.employeeName), size / 2, size / 2);

          markerIcon = {
            url: canvas.toDataURL(),
            scaledSize: new window.google.maps.Size(size, size),
            anchor: new window.google.maps.Point(size / 2, size / 2),
          };
        }
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

    // 3. Draw polyline connecting punches (emerald color with rounded appearance)
    if (routePath.length > 1) {
      polylineRef.current = new window.google.maps.Polyline({
        path: routePath,
        geodesic: true,
        strokeColor: "#0f766e",
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
            <p><strong>Selected Punch:</strong> {new Date(timestamp).toLocaleString()}</p>
            {jobsiteName && (
              <p><strong>Jobsite:</strong> {jobsiteName}</p>
            )}
            {distance !== null && (
              <p><strong>Distance from jobsite:</strong> {Math.round(distance)} m</p>
            )}
            {employeePunches.length > 1 && (
              <p className="text-xs text-muted-foreground mt-1">
                Showing {employeePunches.length} punch locations for this employee
              </p>
            )}
          </div>
          
          {/* Compact modern legend with pills */}
          <div className="flex flex-wrap items-center gap-3 pt-2 border-t text-xs">
            {jobsiteLatitude != null && jobsiteLongitude != null && (
              <div className="flex items-center gap-1.5 px-2 py-1 bg-blue-50 rounded-full">
                <span className="inline-block h-2 w-2 rounded-full bg-blue-600" />
                <span className="text-blue-900">Jobsite (60m)</span>
              </div>
            )}
            <div className="flex items-center gap-1.5 px-2 py-1 bg-red-50 rounded-full">
              <span className="inline-block h-2 w-2 rounded-full bg-red-500" />
              <span className="text-red-900">Punch locations</span>
            </div>
            {employeePunches.length > 1 && (
              <div className="flex items-center gap-1.5 px-2 py-1 bg-emerald-50 rounded-full">
                <span className="inline-block h-0.5 w-4 bg-emerald-600 rounded" />
                <span className="text-emerald-900">Route</span>
              </div>
            )}
          </div>

          {/* Coordinates (smaller, less prominent) */}
          <div className="pt-2 border-t text-xs text-muted-foreground">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <span className="font-medium">Punch:</span> {latitude.toFixed(6)}, {longitude.toFixed(6)}
              </div>
              {jobsiteLatitude != null && jobsiteLongitude != null && (
                <div>
                  <span className="font-medium">Jobsite:</span> {jobsiteLatitude.toFixed(6)}, {jobsiteLongitude.toFixed(6)}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LocationMapModal;
