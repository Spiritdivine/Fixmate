// ==============================================================================
// ARTIFIX PWA SERVICE WORKER — WEB PUSH & NOTIFICATION CLICK LISTENER
// ==============================================================================

self.addEventListener('push', (event) => {
  if (!event.data) return;

  try {
    const payload = event.data.json();
    const title = payload.title || 'Artifix Alert';
    const options = {
      body: payload.body || 'You have a new update regarding your escrow contract.',
      icon: payload.icon || '/brand/artifix-icon-192.png',
      badge: payload.badge || '/brand/artifix-icon-192.png',
      image: payload.image || undefined,
      vibrate: [200, 100, 200],
      tag: payload.tag || 'artifix-notification',
      renotify: true,
      data: {
        url: payload.actionUrl || payload.data?.url || '/',
        dateOfArrival: Date.now(),
        ...payload.data,
      },
      actions: [
        {
          action: 'open',
          title: 'Open Artifix',
        },
        {
          action: 'close',
          title: 'Dismiss',
        },
      ],
    };

    event.waitUntil(self.registration.showNotification(title, options));
  } catch (err) {
    console.error('[ServiceWorker] Error displaying push notification:', err);
  }
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'close') {
    return;
  }

  const targetUrl = event.notification.data?.url || '/';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      // If a window is already open, focus it and navigate
      for (const client of windowClients) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.navigate(targetUrl);
          return client.focus();
        }
      }
      // Otherwise open a new window
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
    })
  );
});
