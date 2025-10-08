// /public/firebase-messaging-sw.js
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js');

const firebaseConfig = {
  apiKey: "AIzaSyAabTzeCwbsnkgWE7d2y4_aAvDlyXv_QUo",
  authDomain: "whatsapp-clone-69386.firebaseapp.com",
  projectId: "whatsapp-clone-69386",
  storageBucket: "whatsapp-clone-69386.firebasestorage.app",
  messagingSenderId: "580532933743",
  appId: "1:580532933743:web:d74eca375178f6a3c2699a"
};

firebase.initializeApp(firebaseConfig);
const messaging = firebase.messaging();

console.log('✅ [SW] Service Worker Loaded');

// Background message handler
messaging.onBackgroundMessage((payload) => {
  console.log('📬 [SW] Background message received:', payload);
  
  const notificationTitle = payload.notification?.title || 'New Message';
  const notificationOptions = {
    body: payload.notification?.body || 'You have a new message',
    icon: '/icon-192.png'|| null,
    badge: '/badge.png'|| null,
    tag: 'chat-message',
    data: payload.data || {},
  };

  return self.registration.showNotification(notificationTitle, notificationOptions);
});

// Push event handler
self.addEventListener('push', (event) => {
  console.log('📬 [SW] Push event received');
  
  let data = {};
  try {
    data = event.data?.json() || {};
  } catch (err) {
    data = {
      notification: {
        title: 'New Message',
        body: 'You have a new message'
      }
    };
  }

  const options = {
    body: data.notification?.body || 'You have a new message',
    icon: '/icon-192.png',
    badge: '/badge.png',
    tag: `push-${Date.now()}`,
    data: data.data || {},
  };

  event.waitUntil(
    self.registration.showNotification(
      data.notification?.title || 'New Message',
      options
    )
  );
});

// Notification click handler
self.addEventListener('notificationclick', (event) => {
  console.log('🔔 [SW] Notification clicked');
  event.notification.close();

  const urlToOpen = '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        for (const client of clientList) {
          if (client.url.includes('/') && 'focus' in client) {
            return client.focus();
          }
        }
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      })
  );
});