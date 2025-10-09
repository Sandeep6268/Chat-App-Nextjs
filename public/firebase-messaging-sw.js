// public/firebase-messaging-sw.js - NEW FILE
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js');

// Your web app's Firebase configuration
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
  console.log('📱 FCM: Background message received:', payload);
  
  const notificationTitle = payload.notification?.title || 'New Message';
  const notificationOptions = {
    body: payload.notification?.body || 'You have a new message',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-72x72.png',
    data: payload.data || {},
    actions: [
      {
        action: 'open',
        title: 'Open Chat'
      }
    ]
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

// Notification click handler
self.addEventListener('notificationclick', (event) => {
  console.log('📍 Notification clicked:', event.notification);
  event.notification.close();
  
  const chatId = event.notification.data?.chatId;
  const url = chatId ? `/chat/${chatId}` : '/';
  
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then((windowClients) => {
      // Check if there is already a window/tab open with the target URL
      for (let client of windowClients) {
        // If so, just focus it.
        if (client.url.includes(url) && 'focus' in client) {
          return client.focus();
        }
      }
      // If not, then open the target URL in a new window/tab.
      if (clients.openWindow) {
        return clients.openWindow(url);
      }
    })
  );
});