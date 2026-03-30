const clearAllCaches = async () => {
  try {
    const keys = await caches.keys();
    await Promise.all(keys.map((key) => caches.delete(key)));
  } catch (e) {
    // Caches API not available
  }
};

export const registerServiceWorker = async () => {
  if (!('serviceWorker' in navigator)) return;

  // Clear any stale caches from the old aggressive SW
  await clearAllCaches();

  // Unregister all existing service workers first
  const registrations = await navigator.serviceWorker.getRegistrations();
  for (const reg of registrations) {
    await reg.unregister();
  }

  // Register the new minimal SW
  try {
    await navigator.serviceWorker.register('/sw.js');
  } catch (e) {
    console.log('SW registration failed:', e);
  }
};

export const unregisterServiceWorker = async () => {
  if (!('serviceWorker' in navigator)) return;
  const registrations = await navigator.serviceWorker.getRegistrations();
  for (const reg of registrations) {
    await reg.unregister();
  }
  await clearAllCaches();
};
