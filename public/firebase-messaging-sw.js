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
  console.log('📱 Received background message in SW:', payload);

  const notificationTitle = payload.notification?.title || 'New Message';
  const notificationOptions = {
    body: payload.notification?.body || 'You have a new message',
    icon: '/favicon.ico',
    badge: '/favicon.ico',
    data: payload.data || {},
    tag: payload.data?.chatId || 'chat',
    requireInteraction: true,
  };

  // Show notification
  return self.registration.showNotification(notificationTitle, notificationOptions);
});

// Notification click handler
self.addEventListener('notificationclick', (event) => {
  console.log('🔔 Notification clicked:', event.notification.data);
  
  event.notification.close();

  const chatId = event.notification.data?.chatId;
  const baseUrl = self.location.origin;
  const urlToOpen = chatId ? `${baseUrl}/chat/${chatId}` : baseUrl;
  
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then((windowClients) => {
      // Check if chat window is already open
      for (const client of windowClients) {
        if (client.url.includes(urlToOpen) && 'focus' in client) {
          return client.focus();
        }
      }
      
      // Open new window
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});