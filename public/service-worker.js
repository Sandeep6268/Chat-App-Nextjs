// public/service-worker.js
// Basic service worker for Pusher Beams
self.addEventListener('push', function(event) {
  console.log('Push event received:', event);
  
  if (!event.data) {
    return;
  }

  const data = event.data.json();
  console.log('Push data:', data);

  const options = {
    body: data.notification?.body || 'New notification',
    icon: data.notification?.icon || '/icons/icon-192x192.png',
    badge: '/icons/icon-72x72.png',
    vibrate: [100, 50, 100],
    data: data.data || {},
    actions: [
      {
        action: 'open',
        title: 'Open App',
      },
      {
        action: 'close',
        title: 'Close',
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification(
      data.notification?.title || 'Chat App', 
      options
    )
  );
});

self.addEventListener('notificationclick', function(event) {
  console.log('Notification clicked:', event);
  event.notification.close();

  const urlToOpen = event.notification.data?.url || self.location.origin;

  if (event.action === 'open') {
    event.waitUntil(
      clients.matchAll({type: 'window'}).then(function(windowClients) {
        // Check if app is already open
        for (let client of windowClients) {
          if (client.url === urlToOpen && 'focus' in client) {
            return client.focus();
          }
        }
        
        // Open new window if app not open
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      })
    );
  }
});

self.addEventListener('pushsubscriptionchange', function(event) {
  console.log('Subscription changed:', event);
});

// Import Pusher Beams service worker
importScripts('https://js.pusher.com/beams/service-worker.js');