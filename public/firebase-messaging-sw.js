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

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const messaging = firebase.messaging();

console.log('✅ [SW] Firebase Messaging Service Worker loaded');

// Background message handler - WITH DETAILED LOGGING
messaging.onBackgroundMessage((payload) => {
  console.log('📬 [SW] Push event received:', {
    messageId: payload.messageId,
    from: payload.from,
    notification: payload.notification,
    data: payload.data,
    collapseKey: payload.collapseKey,
    sentTime: payload.sentTime
  });

  const notificationTitle = payload.notification?.title || 'New Message';
  const notificationOptions = {
    body: payload.notification?.body || 'You have a new message',
    icon: '/icon-192.png',
    badge: '/badge.png',
    tag: 'chat-message',
    requireInteraction: true,
    data: payload.data || {},
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

  console.log('📱 [SW] Showing notification:', {
    title: notificationTitle,
    body: notificationOptions.body,
    data: notificationOptions.data
  });

  // Show notification
  return self.registration.showNotification(notificationTitle, notificationOptions)
    .then(() => {
      console.log('✅ [SW] Notification displayed successfully');
    })
    .catch(error => {
      console.error('❌ [SW] Error showing notification:', error);
    });
});

// Push event handler
self.addEventListener('push', (event) => {
  console.log('📬 [SW] Push event received:', event);
  
  if (!event.data) {
    console.log('ℹ️ [SW] Push event has no data');
    return;
  }

  let data = {};
  try {
    data = event.data.json();
    console.log('📄 [SW] Push data parsed successfully:', {
      notification: data.notification,
      data: data.data
    });
  } catch (err) {
    console.error('❌ [SW] Error parsing push data:', err);
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
    tag: 'chat-message',
    requireInteraction: true,
    data: data.data || {},
    actions: [
      {
        action: 'open',
        title: 'Open Chat'
      }
    ]
  };

  console.log('📱 [SW] Creating notification from push event:', {
    title: data.notification?.title || 'New Message',
    body: options.body,
    data: options.data
  });

  event.waitUntil(
    self.registration.showNotification(
      data.notification?.title || 'New Message',
      options
    ).then(() => {
      console.log('✅ [SW] Push notification displayed successfully');
    }).catch(error => {
      console.error('❌ [SW] Error displaying push notification:', error);
    })
  );
});

// Notification click handler
self.addEventListener('notificationclick', (event) => {
  console.log('🔔 [SW] Notification clicked:', {
    action: event.action,
    notification: event.notification,
    data: event.notification.data
  });
  
  event.notification.close();

  const urlToOpen = event.notification.data?.url || '/';

  if (event.action === 'open' || event.action === '') {
    event.waitUntil(
      clients.matchAll({ type: 'window', includeUncontrolled: true })
        .then((clientList) => {
          console.log(`🔍 [SW] Found ${clientList.length} clients`);
          
          // Check if app is already open
          for (const client of clientList) {
            if (client.url.includes(urlToOpen) && 'focus' in client) {
              console.log('✅ [SW] Focusing existing client');
              return client.focus();
            }
          }
          // Open new window
          if (clients.openWindow) {
            console.log('🆕 [SW] Opening new window');
            return clients.openWindow(urlToOpen);
          }
        })
    );
  }
});

// Service Worker installation
self.addEventListener('install', (event) => {
  console.log('✅ [SW] Service Worker installed');
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('✅ [SW] Service Worker activated');
  return self.clients.claim();
});