import React, { useEffect, useRef } from "react";

interface LocationMapModalProps {
  latitude: number;
  longitude: number;
  employeeName: string;
  timestamp: string;
  onClose: () => void;
}

const LocationMapModal: React.FC<LocationMapModalProps> = ({
  latitude,
  longitude,
  employeeName,
  timestamp,
  onClose,
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const retryCount = useRef(0);

  // ✅ Initialize Google Map with retry logic
  useEffect(() => {
    const loadMap = () => {
      if (!window.google || !window.google.maps) {
        console.warn("⚠️ Google Maps not ready yet...");
        if (retryCount.current < 5) {
          retryCount.current += 1;
          setTimeout(loadMap, 400); // retry in 400ms
        } else {
          if (mapRef.current) {
            mapRef.current.innerHTML =
              "<div style='padding:16px; color:red; font-weight:bold;'>Google Maps failed to load. Please refresh the page.</div>";
          }
        }
        return;
      }

      console.log("✅ Google Maps API loaded, rendering map...");

      if (mapRef.current) {
        // 🗺️ Create the map
        const map = new window.google.maps.Map(mapRef.current, {
          center: { lat: latitude, lng: longitude },
          zoom: 16,
        });

        // 📍 Add a marker
        new window.google.maps.Marker({
          position: { lat: latitude, lng: longitude },
          map,
          title: `Punch-in location for ${employeeName}`,
        });
      }
    };

    loadMap();
  }, [latitude, longitude, employeeName]);

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
        <div className="p-4 border-t text-sm">
          <p><strong>Employee:</strong> {employeeName}</p>
          <p><strong>Punch-in:</strong> {timestamp}</p>
          <p><strong>Latitude:</strong> {latitude}</p>
          <p><strong>Longitude:</strong> {longitude}</p>
        </div>
      </div>
    </div>
  );
};

export default LocationMapModal;
