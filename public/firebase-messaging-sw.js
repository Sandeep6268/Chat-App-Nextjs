importScripts('https://www.gstatic.com/firebasejs/9.22.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.22.0/firebase-messaging-compat.js');

// 🔥 NEW TESTING PROJECT CONFIG
firebase.initializeApp({
  apiKey: 'AIzaSyDbm_Omf6O5OVoWulA6KaJjyDBr5V2Vy6A',
  authDomain: 'chat-app-testing-234fc.firebaseapp.com',
  projectId: 'chat-app-testing-234fc',
  storageBucket: 'chat-app-testing-234fc.firebasestorage.app',
  messagingSenderId: '1024725461365',
  appId: '1:1024725461365:web:3381b37b2593781ff38b3c'
});

const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage((payload) => {
  console.log('📨 Received background message from NEW PROJECT:', payload);

  const notificationTitle = payload.notification?.title || 'New Message';
  const notificationOptions = {
    body: payload.notification?.body,
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png',
    data: payload.data,
    actions: [
      {
        action: 'open',
        title: 'Open Chat',
      },
      {
        action: 'dismiss',
        title: 'Dismiss',
      }
    ]
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

// Handle notification click
self.addEventListener('notificationclick', (event) => {
  console.log('🔔 Notification click received:', event);
  
  event.notification.close();

  const chatId = event.notification.data?.chatId;
  const url = chatId 
    ? `https://chat-app-nextjs-gray-eta.vercel.app/chat/${chatId}`
    : 'https://chat-app-nextjs-gray-eta.vercel.app/chat';

  event.waitUntil(
    clients.matchAll({ type: 'window' }).then((clientList) => {
      // Check if chat window is already open
      for (const client of clientList) {
        if (client.url.includes('/chat') && 'focus' in client) {
          return client.focus();
        }
      }
      // Open new window if none exists
      if (clients.openWindow) {
        return clients.openWindow(url);
      }
    })
  );
});