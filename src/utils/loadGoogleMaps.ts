export const loadGoogleMaps = (apiKey: string) => {
  return new Promise<void>((resolve, reject) => {
    if (window.google && window.google.maps) {
      resolve();
      return;
    }

    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places,geometry`;
    script.async = true;
    script.defer = true;

    script.onload = () => {
      console.log("✅ Google Maps API loaded");
      resolve();
    };

    script.onerror = () => {
      reject(new Error("❌ Failed to load Google Maps API"));
    };

    document.head.appendChild(script);
  });
};
