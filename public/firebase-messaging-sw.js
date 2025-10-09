// public/firebase-messaging-sw.js - FCM SERVICE WORKER
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js');

console.log('🔧 [FCM SW] Service Worker loading...');

// Firebase configuration
firebase.initializeApp({
  apiKey: "AIzaSyDbm_Omf6O5OVoWulA6KaJjyDBr5V2Vy6A",
  authDomain: "chat-app-testing-234fc.firebaseapp.com",
  projectId: "chat-app-testing-234fc",
  storageBucket: "chat-app-testing-234fc.firebasestorage.app",
  messagingSenderId: "1024725461365",
  appId: "1:1024725461365:web:3381b37b2593781ff38b3c"
});

const messaging = firebase.messaging();

console.log('✅ [FCM SW] Firebase Messaging initialized');

// Background message handler
messaging.onBackgroundMessage((payload) => {
  console.log('📨 [FCM SW] BACKGROUND MESSAGE RECEIVED:', payload);

  const notificationTitle = payload.notification?.title || 'New Message';
  const notificationOptions = {
    body: payload.notification?.body || 'You have a new message',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-72x72.png',
    data: payload.data || {},
    tag: payload.data?.chatId || 'general',
    requireInteraction: true,
    actions: [
      {
        action: 'open',
        title: 'Open Chat'
      },
      {
        action: 'close',
        title: 'Close'
      }
    ]
  };

  console.log('📱 [FCM SW] Showing notification:', notificationTitle);
  
  // Show notification
  self.registration.showNotification(notificationTitle, notificationOptions);
});

// Notification click handler
self.addEventListener('notificationclick', (event) => {
  console.log('📍 [FCM SW] Notification clicked:', event.notification);
  
  event.notification.close();

  const chatId = event.notification.data?.chatId;
  
  if (event.action === 'open' && chatId) {
    const url = `/chat/${chatId}`;
    
    event.waitUntil(
      clients.matchAll({ type: 'window' }).then((windowClients) => {
        // Check if chat is already open
        for (let client of windowClients) {
          if (client.url.includes(url) && 'focus' in client) {
            return client.focus();
          }
        }
        // Open new tab
        if (clients.openWindow) {
          return clients.openWindow(url);
        }
      })
    );
  }
});

console.log('✅ [FCM SW] Service Worker setup complete');