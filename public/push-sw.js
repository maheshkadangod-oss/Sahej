/* Custom service-worker push handlers, imported into the Workbox-generated SW via
   vite-plugin-pwa's workbox.importScripts. Kept as plain JS (no imports) so it works
   regardless of the generated SW's module setup. Handles incoming Web Push messages
   (vaccination / weight reminders) and taps on those notifications. */

self.addEventListener('push', (event) => {
  let payload = {};
  try { payload = event.data ? event.data.json() : {}; } catch (e) { payload = {}; }

  const title = payload.title || 'Sahej';
  const options = {
    body: payload.body || '',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    tag: payload.tag || 'sahej-reminder',
    renotify: true,
    data: { url: payload.url || '/' },
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = (event.notification.data && event.notification.data.url) || '/';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Focus an existing tab if one is open, else open a new one.
      for (const client of clientList) {
        if ('focus' in client) {
          if ('navigate' in client && targetUrl !== '/') {
            client.navigate(targetUrl).catch(() => {});
          }
          return client.focus();
        }
      }
      if (self.clients.openWindow) return self.clients.openWindow(targetUrl);
    })
  );
});
