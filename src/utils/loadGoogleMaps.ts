export const loadGoogleMaps = (apiKey: string) => {
  return new Promise<void>((resolve, reject) => {
    if (window.google && window.google.maps && window.google.maps.places) {
      console.log("✅ Google Maps API already loaded");
      resolve();
      return;
    }

    const script = document.createElement('script');
    const scriptUrl = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places,geometry`;
    script.src = scriptUrl;
    script.async = true;
    script.defer = true;
    
    console.log("🔄 Loading Google Maps API from:", scriptUrl);

    script.onload = () => {
      console.log("✅ Google Maps API script loaded");
      // Add a small delay to ensure all libraries are fully initialized
      setTimeout(() => {
        if (window.google?.maps?.places) {
          console.log("✅ Google Places API is ready");
          resolve();
        } else {
          console.error("❌ Google Places API not available after loading");
          reject(new Error("Google Places API not available"));
        }
      }, 100);
    };

    script.onerror = () => {
      reject(new Error("❌ Failed to load Google Maps API"));
    };

    document.head.appendChild(script);
  });
};
