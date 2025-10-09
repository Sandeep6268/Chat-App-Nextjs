// public/service-worker.js - SIMPLE VERSION
console.log('🔧 Service Worker: Loading');

self.addEventListener('install', (event) => {
  console.log('🔧 Service Worker: Installed');
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('🔧 Service Worker: Activated');
  event.waitUntil(self.clients.claim());
});

// Import Pusher Beams Service Worker
importScripts('https://js.pusher.com/beams/1.0/push-notifications-sw.js');

self.addEventListener('push', (event) => {
  console.log('🎯 Push Event Received');
  
  if (!event.data) {
    console.log('❌ No push data');
    return;
  }

  let payload;
  try {
    payload = event.data.json();
    console.log('📦 Push data:', payload);
  } catch (e) {
    console.log('❌ Invalid push data');
    return;
  }

  const title = payload.notification?.title || 'Chat App';
  const body = payload.notification?.body || 'New message';
  const data = payload.data || {};

  console.log('🔄 Showing notification:', { title, body });

  event.waitUntil(
    self.registration.showNotification(title, {
      body: body,
      icon: '/icons/icon-192x192.png',
      badge: '/icons/icon-72x72.png',
      data: data,
      tag: data.chatId || 'chat',
      requireInteraction: true,
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  console.log('🎯 Notification clicked');
  event.notification.close();

  const urlToOpen = event.notification.data?.url || self.location.origin + '/chat';

  event.waitUntil(
    clients.matchAll({ type: 'window' }).then((windowClients) => {
      for (const client of windowClients) {
        if (client.url.includes('/chat') && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});