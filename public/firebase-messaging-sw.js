// public/firebase-messaging-sw.js
importScripts('https://www.gstatic.com/firebasejs/9.6.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.6.0/firebase-messaging-compat.js');

// ✅ YOUR ACTUAL FIREBASE CONFIG
firebase.initializeApp({
  apiKey: "AIzaSyAabTzeCwbsnkgWE7d2y4_aAvDlyXv_QUo",
  projectId: "whatsapp-clone-69386",
  messagingSenderId: "580532933743",
  appId: "1:580532933743:web:d74eca375178f6a3c2699a"
});

const messaging = firebase.messaging();

// Background message handler
messaging.onBackgroundMessage((payload) => {
  console.log('📱 Received background message:', payload);

  const notificationTitle = payload.notification?.title || 'New Message';
  const notificationOptions = {
    body: payload.notification?.body || 'You have a new message',
    icon: '/icon.png',
    badge: '/badge.png',
    data: payload.data || {}
  };

  console.log('🔔 Showing notification:', notificationTitle);
  
  // Show notification
  self.registration.showNotification(notificationTitle, notificationOptions);
});

// Notification click handler
self.addEventListener('notificationclick', (event) => {
  console.log('🔔 Notification clicked:', event.notification);
  
  event.notification.close();

  const chatId = event.notification.data?.chatId;
  const targetUrl = chatId ? `/chat/${chatId}` : '/';

  // Focus on the app or open it
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        console.log('🔍 Found clients:', clientList.length);
        
        // Try to focus on existing chat window
        for (const client of clientList) {
          if (client.url.includes('/chat') && 'focus' in client) {
            console.log('🎯 Focusing existing chat window');
            return client.focus();
          }
        }
        
        // Try to focus on any existing app window
        for (const client of clientList) {
          if (client.url.includes('chat-app-nextjs-gray-eta.vercel.app') && 'focus' in client) {
            console.log('🎯 Focusing existing app window');
            return client.navigate(targetUrl).then(() => client.focus());
          }
        }
        
        // Open new window
        console.log('🆕 Opening new window:', targetUrl);
        if (clients.openWindow) {
          return clients.openWindow(targetUrl);
        }
      })
  );
});

// Service worker installation
self.addEventListener('install', (event) => {
  console.log('✅ Service Worker installed');
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('✅ Service Worker activated');
  event.waitUntil(self.clients.claim());
});