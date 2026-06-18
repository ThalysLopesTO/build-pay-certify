/* Web Push handlers — imported into the generated Workbox service worker via
   the vite-plugin-pwa `workbox.importScripts` option. Keep this dependency-free
   and side-effect-light: it only adds two event listeners. */

self.addEventListener('push', (event) => {
  let payload = {};
  try {
    payload = event.data ? event.data.json() : {};
  } catch (_e) {
    payload = { title: 'StackBuild', body: event.data ? event.data.text() : '' };
  }

  const title = payload.title || 'StackBuild';
  const options = {
    body: payload.body || '',
    icon: payload.icon || '/icons/icon-192x192.png',
    badge: payload.badge || '/favicon.ico',
    tag: payload.tag || undefined,
    renotify: !!payload.tag,
    data: { url: payload.url || '/' },
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = (event.notification.data && event.notification.data.url) || '/';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Focus an existing tab if one is already on the target path.
      for (const client of clientList) {
        if (client.url.includes(targetUrl) && 'focus' in client) return client.focus();
      }
      // Otherwise focus any open tab and navigate it, or open a new one.
      if (clientList.length > 0 && 'navigate' in clientList[0]) {
        return clientList[0].focus().then((c) => c.navigate(targetUrl));
      }
      if (self.clients.openWindow) return self.clients.openWindow(targetUrl);
    }),
  );
});
