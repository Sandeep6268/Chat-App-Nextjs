// public/firebase-messaging-sw.js
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js');

// Initialize Firebase App in Service Worker
firebase.initializeApp({
  apiKey: "AIzaSyDbm_Omf6O5OVoWulA6KaJjyDBr5V2Vy6A",
  authDomain: "chat-app-testing-234fc.firebaseapp.com",
  projectId: "chat-app-testing-234fc",
  storageBucket: "chat-app-testing-234fc.firebasestorage.app",
  messagingSenderId: "1024725461365",
  appId: "1:1024725461365:web:3381b37b2593781ff38b3c"
});

const messaging = firebase.messaging();

// Background message handler
messaging.onBackgroundMessage((payload) => {
  console.log('📱 Received background message:', payload);

  const notificationTitle = payload.notification?.title || 'New Message';
  const notificationOptions = {
    body: payload.notification?.body || 'You have a new message',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-72x72.png',
    image: payload.notification?.image,
    data: payload.data,
    tag: payload.data?.chatId || 'chat-notification', // Group by chat
    requireInteraction: true,
    actions: [
      {
        action: 'open',
        title: 'Open Chat'
      },
      {
        action: 'dismiss',
        title: 'Dismiss'
      }
    ]
  };

  // Show notification
  self.registration.showNotification(notificationTitle, notificationOptions);
});

// Notification click handler
self.addEventListener('notificationclick', (event) => {
  console.log('🔔 Notification clicked:', event.notification.tag);
  
  event.notification.close();

  const chatId = event.notification.data?.chatId;
  
  if (event.action === 'open' || !event.action) {
    // Open the chat when notification is clicked
    const urlToOpen = chatId ? `${self.origin}/chat/${chatId}` : self.origin;
    
    event.waitUntil(
      clients.matchAll({ type: 'window' }).then((windowClients) => {
        // Check if chat window is already open
        for (const client of windowClients) {
          if (client.url.includes(`/chat/${chatId}`) && 'focus' in client) {
            return client.focus();
          }
        }
        
        // Open new window
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      })
    );
  }
});