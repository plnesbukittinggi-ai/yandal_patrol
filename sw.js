
const APP_LOGO = "https://raw.githubusercontent.com/plnesbukittinggi-ai/yandal_patrol/main/ChatGPT%20Image%2018%20Des%202025%2C%2011.11.52.png";

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim());
});

// Menangani klik pada notifikasi
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const urlToOpen = event.notification.data?.url || '/';
  
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      // Jika tab sudah terbuka, fokuskan
      for (var i = 0; i < windowClients.length; i++) {
        var client = windowClients[i];
        if (client.url === urlToOpen && 'focus' in client) {
          return client.focus();
        }
      }
      // Jika tidak, buka tab baru
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});

// Listener untuk pesan dari App utama
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SHOW_NOTIFICATION') {
    const { title, body } = event.data.payload;
    const options = {
      body,
      icon: APP_LOGO,
      badge: APP_LOGO,
      tag: 'yandal-patrol-notif',
      renotify: true,
      vibrate: [200, 100, 200],
      data: { url: self.registration.scope }
    };
    self.registration.showNotification(title, options);
  }
});
