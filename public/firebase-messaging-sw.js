// public/firebase-messaging-sw.js - UPDATED
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

// ✅ FIXED: Only use background message handler, disable push event
messaging.onBackgroundMessage((payload) => {
  console.log('📬 [SW] Background message received:', payload);
  
  const notificationTitle = payload.notification?.title || 'New Message';
  const notificationBody = payload.notification?.body || 'You have a new message';
  
  // Get target URL from payload data
  const data = payload.data || {};
  const baseUrl = self.location.origin;
  let targetUrl = `${baseUrl}/`;
  
  if (data.chatId) {
    targetUrl = `${baseUrl}/chat/${data.chatId}`;
  } else if (data.url) {
    targetUrl = data.url;
  } else if (data.click_action) {
    targetUrl = data.click_action;
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

  // Close any existing notifications with same tag
  self.registration.getNotifications({ tag: notificationOptions.tag })
    .then(notifications => {
      notifications.forEach(notification => notification.close());
      
      // Show new notification
      return self.registration.showNotification(notificationTitle, notificationOptions);
    });
});

// ✅ FIXED: Enhanced notification click handler
self.addEventListener('notificationclick', (event) => {
  console.log('🔔 [SW] Notification clicked - Action:', event.action);
  event.notification.close();

  const notificationData = event.notification.data || {};
  let targetUrl = notificationData.targetUrl || self.location.origin + '/';

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
        if (client.url.startsWith(self.location.origin) && 'focus' in client) {
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

// ✅ DISABLED: Push event handler to avoid duplicate notifications
// self.addEventListener('push', (event) => {
//   // Comment out or remove this to prevent duplicate notifications
//   console.log('🚫 Push event disabled to prevent duplicates');
// });