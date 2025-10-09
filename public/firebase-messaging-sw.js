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

console.log('✅ [SW] Service Worker Loaded - Single Notification Fix');

// ✅ FIXED: Only handle background messages, prevent duplicates
messaging.onBackgroundMessage((payload) => {
  console.log('📬 [SW] Background message received:', payload);
  
  // Extract notification data
  const notificationTitle = payload.data?.title || payload.notification?.title || 'New Message';
  const notificationBody = payload.data?.body || payload.notification?.body || 'You have a new message';
  const data = payload.data || {};
  
  // Build target URL - USE PRODUCTION URL DIRECTLY
  const baseUrl = 'https://chat-app-nextjs-gray-eta.vercel.app';
  let targetUrl = `${baseUrl}/`;
  
  if (data.chatId) {
    targetUrl = `${baseUrl}/chat/${data.chatId}`;
  }

  console.log('📍 [SW] Target URL:', targetUrl);

  const notificationOptions = {
    body: notificationBody,
    icon: '/icon-192.png',
    badge: '/badge-72x72.png',
    tag: `chat-${data.chatId || 'general'}`,
    renotify: true,
    requireInteraction: true,
    data: {
      ...data,
      targetUrl: targetUrl
    },
    actions: [
      {
        action: 'open-chat',
        title: '💬 Open Chat'
      },
      {
        action: 'dismiss',
        title: '❌ Dismiss'
      }
    ]
  };

  // Show notification
  self.registration.showNotification(notificationTitle, notificationOptions)
    .then(() => {
      console.log('✅ [SW] Notification shown successfully');
    })
    .catch(error => {
      console.error('❌ [SW] Error showing notification:', error);
    });
});

// ✅ FIXED: Enhanced notification click handler
self.addEventListener('notificationclick', (event) => {
  console.log('🔔 [SW] Notification clicked - Action:', event.action);
  event.notification.close();

  const notificationData = event.notification.data || {};
  let targetUrl = notificationData.targetUrl || 'https://chat-app-nextjs-gray-eta.vercel.app/';

  console.log('📍 [SW] Navigating to:', targetUrl);

  event.waitUntil(
    clients.matchAll({ 
      type: 'window',
      includeUncontrolled: true 
    }).then((clientList) => {
      console.log(`🔍 Found ${clientList.length} client windows`);
      
      // Check for existing tabs/windows
      for (const client of clientList) {
        // If we find a client that's on our origin, focus it
        if (client.url.includes('chat-app-nextjs-gray-eta.vercel.app') && 'focus' in client) {
          console.log('🎯 Focusing existing client:', client.url);
          
          // Navigate to target URL if different
          if (client.url !== targetUrl) {
            console.log('🔄 Navigating client to:', targetUrl);
            return client.navigate(targetUrl).then(() => client.focus());
          }
          
          return client.focus();
        }
      }
      
      // If no client found, open new window
      console.log('🆕 Opening new window:', targetUrl);
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});

// Handle action buttons
self.addEventListener('notificationclick', (event) => {
  if (event.action === 'dismiss') {
    console.log('❌ Notification dismissed');
    event.notification.close();
  }
});

// ✅ DISABLED: Push event handler to prevent duplicate notifications
self.addEventListener('push', (event) => {
  console.log('🚫 Push event disabled to prevent duplicates');
  // Do nothing - let onBackgroundMessage handle everything
});