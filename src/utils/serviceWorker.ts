const isInIframe = (() => {
  try { return window.self !== window.top; } catch { return true; }
})();

const isPreviewHost =
  window.location.hostname.includes('id-preview--') ||
  window.location.hostname.includes('lovableproject.com');

export const registerServiceWorker = () => {
  if (!('serviceWorker' in navigator)) return;

  // In preview/iframe contexts, unregister everything and clear caches
  if (isPreviewHost || isInIframe) {
    navigator.serviceWorker.getRegistrations().then((regs) =>
      regs.forEach((r) => r.unregister())
    );
    caches.keys().then((names) => names.forEach((n) => caches.delete(n)));
    return;
  }

  // Production: register minimal SW for PWA installability
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').then((reg) => {
      console.log('SW registered:', reg);
    }).catch((err) => {
      console.log('SW registration failed:', err);
    });
  });
};

export const unregisterServiceWorker = () => {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.ready.then((reg) => reg.unregister());
  }
};
