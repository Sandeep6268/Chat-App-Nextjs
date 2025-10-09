// public/pusher-service-worker.js
importScripts('https://js.pusher.com/beams/service-worker.js');

// Service worker for Pusher Beams
self.addEventListener('push', function(event) {
  const data = event.data.json();
  
  const options = {
    body: data.notification.body,
    icon: data.notification.icon || '/icons/icon-192x192.png',
    badge: '/icons/icon-72x72.png',
    vibrate: [100, 50, 100],
    data: data.data,
    actions: [
      {
        action: 'open',
        title: 'Open Chat',
      },
      {
        action: 'close',
        title: 'Close',
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification(data.notification.title, options)
  );
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();

  if (event.action === 'open') {
    const urlToOpen = event.notification.data.url || self.location.origin;
    
    event.waitUntil(
      clients.matchAll({type: 'window'}).then(function(windowClients) {
        for (let client of windowClients) {
          if (client.url === urlToOpen && 'focus' in client) {
            return client.focus();
          }
        }
        
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      })
    );
  }
});