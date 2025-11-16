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

// Constants for marker styling
const JOBSITE_RADIUS_METERS = 40;

// Helper to create simple circular markers
const createMarker = (
  map: any,
  position: { lat: number; lng: number },
  type: "jobsite" | "punch",
  title?: string
) => {
  const isJobsite = type === "jobsite";
  
  return new window.google.maps.Marker({
    map,
    position,
    title: title || (isJobsite ? "Jobsite location" : "Punch location"),
    icon: {
      path: window.google.maps.SymbolPath.CIRCLE,
      fillColor: isJobsite ? "#2563eb" : "#ffffff",
      fillOpacity: 1,
      strokeColor: isJobsite ? "#ffffff" : "#ef4444",
      strokeOpacity: 1,
      strokeWeight: isJobsite ? 2 : 3,
      scale: isJobsite ? 9 : 6,
    },
    zIndex: isJobsite ? 100 : 200,
  });
};

interface PunchLocation {
  id: string;
  latitude: number;
  longitude: number;
  timestamp: string;
  employeeName: string;
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
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const circleRef = useRef<any>(null);
  const polylineRef = useRef<any>(null);
  const retryCount = useRef(0);

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
      const jobsiteMarker = createMarker(
        mapInstanceRef.current,
        jobsitePosition,
        "jobsite",
        `Jobsite: ${jobsiteName || 'Jobsite'}`
      );
      markersRef.current.push(jobsiteMarker);
      bounds.extend(jobsitePosition);

      // Radius circle around jobsite (40m with discrete gray styling)
      circleRef.current = new window.google.maps.Circle({
        map: mapInstanceRef.current,
        center: jobsitePosition,
        radius: JOBSITE_RADIUS_METERS,
        strokeColor: "#cbd5e1",
        strokeOpacity: 0.9,
        strokeWeight: 1,
        fillColor: "#e5f2ff",
        fillOpacity: 0.25,
        clickable: false,
      });
    }

    // 2. Selected punch marker (white with red border)
    const selectedPunchPosition = { lat: latitude, lng: longitude };
    const punchMarker = createMarker(
      mapInstanceRef.current,
      selectedPunchPosition,
      "punch",
      `${employeeName} – ${new Date(timestamp).toLocaleTimeString()}`
    );
    markersRef.current.push(punchMarker);
    bounds.extend(selectedPunchPosition);

    // 3. Draw line between jobsite and selected punch (if both exist)
    if (hasJobsite) {
      const jobsitePosition = { lat: jobsiteLatitude, lng: jobsiteLongitude };
      polylineRef.current = new window.google.maps.Polyline({
        path: [jobsitePosition, selectedPunchPosition],
        geodesic: false,
        strokeColor: "#9ca3af",
        strokeOpacity: 0.9,
        strokeWeight: 2,
        map: mapInstanceRef.current,
        clickable: false,
      });
    }

    // 4. Fit map to show all markers with padding and cap zoom
    if (!bounds.isEmpty()) {
      mapInstanceRef.current.fitBounds(bounds, { top: 60, bottom: 60, left: 40, right: 40 });
      
      // Cap zoom at 19 after fitBounds
      window.google.maps.event.addListenerOnce(mapInstanceRef.current, 'bounds_changed', () => {
        const currentZoom = mapInstanceRef.current?.getZoom();
        if (currentZoom && currentZoom > 19) {
          mapInstanceRef.current?.setZoom(19);
        }
      });
    } else {
      mapInstanceRef.current.setCenter({ lat: latitude, lng: longitude });
      mapInstanceRef.current.setZoom(19);
    }
  }, [latitude, longitude, employeeName, jobsiteName, jobsiteLatitude, jobsiteLongitude, timestamp]);

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
        mapTypeControl: true,
        mapTypeControlOptions: {
          style: window.google.maps.MapTypeControlStyle.HORIZONTAL_BAR,
          position: window.google.maps.ControlPosition.TOP_RIGHT,
          mapTypeIds: ['roadmap', 'satellite'],
        },
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
      const jobsiteMarker = createMarker(
        mapInstanceRef.current,
        jobsitePosition,
        "jobsite",
        `Jobsite: ${jobsiteName || 'Jobsite'}`
      );
      markersRef.current.push(jobsiteMarker);
      bounds.extend(jobsitePosition);

      // Radius circle around jobsite (40m with discrete gray styling)
      circleRef.current = new window.google.maps.Circle({
        map: mapInstanceRef.current,
        center: jobsitePosition,
        radius: JOBSITE_RADIUS_METERS,
        strokeColor: "#cbd5e1",
        strokeOpacity: 0.9,
        strokeWeight: 1,
        fillColor: "#e5f2ff",
        fillOpacity: 0.25,
        clickable: false,
      });
    }

    // 2. Selected punch marker (white with red border)
    const selectedPunchPosition = { lat: latitude, lng: longitude };
    const punchMarker = createMarker(
      mapInstanceRef.current,
      selectedPunchPosition,
      "punch",
      `${employeeName} – ${new Date(timestamp).toLocaleTimeString()}`
    );
    markersRef.current.push(punchMarker);
    bounds.extend(selectedPunchPosition);

    // 3. Draw line between jobsite and selected punch (if both exist)
    if (hasJobsite) {
      const jobsitePosition = { lat: jobsiteLatitude, lng: jobsiteLongitude };
      polylineRef.current = new window.google.maps.Polyline({
        path: [jobsitePosition, selectedPunchPosition],
        geodesic: false,
        strokeColor: "#9ca3af",
        strokeOpacity: 0.9,
        strokeWeight: 2,
        map: mapInstanceRef.current,
        clickable: false,
      });
    }

    // 4. Fit map to show all markers with padding and cap zoom
    if (!bounds.isEmpty()) {
      mapInstanceRef.current.fitBounds(bounds, { top: 60, bottom: 60, left: 40, right: 40 });
      
      // Cap zoom at 19 after fitBounds
      window.google.maps.event.addListenerOnce(mapInstanceRef.current, 'bounds_changed', () => {
        const currentZoom = mapInstanceRef.current?.getZoom();
        if (currentZoom && currentZoom > 19) {
          mapInstanceRef.current?.setZoom(19);
        }
      });
    } else {
      mapInstanceRef.current.setCenter({ lat: latitude, lng: longitude });
      mapInstanceRef.current.setZoom(19);
    }
  }, [latitude, longitude, employeeName, jobsiteName, jobsiteLatitude, jobsiteLongitude, timestamp]);

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
              <>
                <div className="flex items-center gap-1.5 px-2 py-1 bg-blue-50 rounded-full">
                  <span className="inline-block h-2 w-2 rounded-full bg-blue-600" />
                  <span className="text-blue-900">Jobsite (40m radius)</span>
                </div>
                <div className="flex items-center gap-1.5 px-2 py-1 bg-gray-50 rounded-full">
                  <span className="inline-block h-0.5 w-4 bg-gray-400 rounded" />
                  <span className="text-gray-700">Distance line</span>
                </div>
              </>
            )}
            <div className="flex items-center gap-1.5 px-2 py-1 bg-red-50 rounded-full">
              <span className="inline-block h-2 w-2 rounded-full bg-red-600 border border-white shadow-sm" />
              <span className="text-red-900">Punch location</span>
            </div>
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
