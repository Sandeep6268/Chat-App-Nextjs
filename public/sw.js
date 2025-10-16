// public/sw.js
self.addEventListener('push', function(event) {
  if (!event.data) return;
  
  const data = event.data.json();
  const options = {
    body: data.body,
    icon: data.icon || '/default-avatar.png',
    badge: '/badge.png',
    tag: data.tag,
    data: data.data,
    requireInteraction: true
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  
  const chatId = event.notification.data?.chatId;
  
  if (chatId) {
    event.waitUntil(
      clients.matchAll({ type: 'window' }).then(windowClients => {
        // Check if chat window is already open
        for (let client of windowClients) {
          if (client.url.includes(`/chat/${chatId}`) && 'focus' in client) {
            return client.focus();
          }
        }
        
        // Open new chat window
        if (clients.openWindow) {
          return clients.openWindow(`/chat/${chatId}`);
        }
      })
    );
  }
});