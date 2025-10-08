// public/firebase-messaging-sw.js
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

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const messaging = firebase.messaging();

console.log('✅ [SW] Service Worker Loaded - Version 2');

// Enhanced background message handler
messaging.onBackgroundMessage((payload) => {
  console.log('📬 [SW] Background message received:', payload);
  
  const notificationTitle = payload.notification?.title || 'New Message';
  const notificationOptions = {
    body: payload.notification?.body || 'You have a new message',
    icon: '/icon-192.png',
    badge: '/badge-72x72.png',
    tag: 'chat-message',
    requireInteraction: true,
    data: payload.data || {},
    actions: [
      {
        action: 'open',
        title: 'Open Chat'
      },
      {
        action: 'close',
        title: 'Dismiss'
      }
    ]
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

// Enhanced notification click handler
self.addEventListener('notificationclick', (event) => {
  console.log('🔔 [SW] Notification clicked:', event.notification.tag);
  event.notification.close();

  const urlToOpen = new URL('/', self.location.origin).href;

  event.waitUntil(
    clients.matchAll({ 
      type: 'window',
      includeUncontrolled: true 
    }).then((clientList) => {
      // Check if there's already a window/tab open with the target URL
      for (const client of clientList) {
        if (client.url === urlToOpen && 'focus' in client) {
          return client.focus();
        }
      }
      
      // If no window exists, open a new one
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});

// Handle notification close
self.addEventListener('notificationclose', (event) => {
  console.log('🔔 [SW] Notification closed:', event.notification.tag);
});

// Enhanced push event handler (for non-FCM pushes)
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
    badge: '/badge-72x72.png',
    tag: `push-${Date.now()}`,
    requireInteraction: true,
    data: data.data || {},
  };

  event.waitUntil(
    self.registration.showNotification(
      data.notification?.title || 'New Message',
      options
    )
  );
});